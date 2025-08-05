import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { DataAnalysis, UploadedFile, SelectedElement } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private reasoningModel: GenerativeModel;
  private codingModel: GenerativeModel;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || !apiKey.startsWith('AIza')) {
      throw new Error('VITE_GEMINI_API_KEY is not defined or is invalid. Please check your .env file.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.reasoningModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    this.codingModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  private async callWithRetry<T>(apiCall: () => Promise<T>, maxRetries: number = 3, initialDelayMs: number = 1000): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        lastError = error;
        const is503Error = error.message && error.message.includes('[503]');
        if (is503Error && attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt);
          console.log(`API overloaded, retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  private extractJsonObject(text: string): string {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("Raw AI response:", text);
      throw new Error("No valid JSON object found in the AI response.");
    }
    return match[0];
  }

  async analyzeData(files: UploadedFile[]): Promise<DataAnalysis> {
    const fileContents = files.map(file => ({
      name: file.name,
      type: file.type,
      preview: typeof file.content === 'string' ? file.content.split('\n').slice(0, 10).join('\n') : 'Binary content'
    }));

    const prompt = `
      You are a data analyst. Analyze the following file(s):
      ${JSON.stringify(fileContents, null, 2)}
      Provide a detailed analysis in this exact JSON format:
      {
        "summary": "Detailed summary of the data.",
        "columns": ["actual", "column", "names"],
        "rowCount": estimated_row_count,
        "suggestions": ["visualization suggestions"],
        "keyInsights": ["specific insights from the data"]
      }
      Return only valid JSON.
    `;
    const result = await this.callWithRetry(() => this.reasoningModel.generateContent(prompt));
    const jsonString = this.extractJsonObject(result.response.text());
    return JSON.parse(jsonString);
  }

  async generateDashboard(analysis: DataAnalysis, useAllData: boolean, designDescription: string, data: any[]): Promise<{ title: string; description: string; html: string; }> {
    const fullDataString = JSON.stringify(data);
    const prompt = `
      You are an expert web developer. Create a complete, functional HTML dashboard.

      **Data Context:**
      - Analysis: ${analysis.summary}
      - Columns: ${analysis.columns.join(', ')}
      - Data Scope: ${useAllData ? 'Use ALL data.' : 'Focus on key insights.'}

      **User's Data (MANDATORY):**
      - Embed this data into a <script> tag: \`const data = ${fullDataString};\`
      - All charts and KPIs MUST be powered by this \`data\` variable.

      **User Design Preferences:**
      - "${designDescription}"

      **Mandatory Requirements:**
      - Use ApexCharts for all charts.
      - Include interactive filters and a search bar.
      - Use a professional, clean design.
      - Include the element selection script provided below at the end of the <body>.

      **Element Selection Script (MANDATORY):**
      <script id="agent-dash-selection-script">
        document.addEventListener('DOMContentLoaded', () => {
          let currentlySelected = null;
          document.body.addEventListener('click', (e) => {
            if (e.target === document.body) return;
            e.preventDefault();
            e.stopPropagation();
            if (currentlySelected) { currentlySelected.style.outline = ''; }
            e.target.style.outline = '2px solid #3b82f6';
            currentlySelected = e.target;
            const getSelector = (el) => {
              if (!el) return '';
              if (el.id) return \`#\${el.id}\`;
              let selector = el.tagName.toLowerCase();
              if (el.className) {
                const stableClasses = Array.from(el.classList).filter(c => !c.includes(':') && !c.includes('hover'));
                if(stableClasses.length > 0) { selector += '.' + stableClasses.join('.'); }
              }
              return selector;
            };
            const payload = {
              selector: getSelector(e.target),
              tagName: e.target.tagName,
              id: e.target.id,
              className: e.target.className,
              innerText: e.target.innerText.substring(0, 200)
            };
            window.parent.postMessage({ type: 'element-selected', payload }, '*');
          });
        });
      </script>

      **Output Format (CRITICAL):**
      - Your entire response must be ONLY the complete HTML code for the dashboard.
      - Do NOT include any markdown formatting (like \`\`\`html) or explanations.
      - Start the response with \`<!DOCTYPE html>\`.
      - Inside the \`<head>\` section, include the title and description as meta tags with these exact names:
        <meta name="agent-dash-title" content="A creative and descriptive title for the dashboard">
        <meta name="agent-dash-description" content="A concise, one-line summary of the dashboard's purpose.">
    `;
    const result = await this.callWithRetry(() => this.codingModel.generateContent(prompt));
    const html = result.response.text().replace(/```html/g, '').replace(/```/g, '').trim();

    const titleMatch = html.match(/<meta\s+name="agent-dash-title"\s+content="([^"]*)"\s*\/?>/);
    const descriptionMatch = html.match(/<meta\s+name="agent-dash-description"\s+content="([^"]*)"\s*\/?>/);

    const title = titleMatch ? titleMatch[1] : 'Untitled Dashboard';
    const description = descriptionMatch ? descriptionMatch[1] : 'No description provided.';

    return { title, description, html };
  }

  async modifyDashboardElement(currentCode: string, element: SelectedElement, modificationRequest: string): Promise<string> {
    const prompt = `
      You are an expert web developer. Modify a specific element in this HTML dashboard.
      Current Code: \`\`\`html\n${currentCode}\n\`\`\`
      Selected Element: \`${element.selector}\`
      User Request: "${modificationRequest}"
      Instructions: Modify the element as requested. Return the complete, updated HTML code.
      Output Format: Return ONLY the complete HTML code. Do not include markdown.
    `;
    const result = await this.callWithRetry(() => this.codingModel.generateContent(prompt));
    const text = result.response.text().replace(/```html/g, '').replace(/```/g, '').trim();
    return text;
  }
}