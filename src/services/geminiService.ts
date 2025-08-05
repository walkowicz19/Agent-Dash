import { GoogleGenerativeAI } from '@google/generative-ai';
import { DataAnalysis, UploadedFile } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private reasoningModel: any;
  private codingModel: any;

  constructor(apiKey: string = 'AIzaSyBRexGFUmrJwfSs5mMYE4k4QlSsriizfZ8') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini 2.0 Flash for reasoning tasks
    this.reasoningModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // Using Gemini 2.5 Pro for coding tasks
    this.codingModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  private async callWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a 503 error (service overloaded) and we haven't exceeded max retries
        const is503Error = error.message && error.message.includes('[503]');
        if (is503Error && attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt);
          console.log(`API overloaded, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        
        // If it's not a 503 error or we've exceeded max retries, throw the error
        throw error;
      }
    }
    
    throw lastError;
  }

  async analyzeData(files: UploadedFile[]): Promise<DataAnalysis> {
    try {
      // Prepare file data for analysis
      const fileContents = files.map((file, index) => ({
        index: index + 1,
        name: file.name,
        type: file.type,
        content: typeof file.content === 'string' ? file.content.substring(0, 8000) : 'Binary file',
        size: file.size,
        preview: typeof file.content === 'string' ? file.content.split('\n').slice(0, 10).join('\n') : 'Binary content'
      }));

      const prompt = `
        You are a data analyst expert. Analyze the following ${files.length} data file(s) in detail:
        
        ${fileContents.map(file => `
        FILE ${file.index}: ${file.name} (${file.type}, ${file.size} bytes)
        Content Preview:
        ${file.preview}
        `).join('\n')}
        
        Based on the actual file content above, provide a detailed analysis in this exact JSON format:
        {
          "summary": "Detailed summary describing what this specific data contains",
          "columns": ["actual", "column", "names", "from", "the", "data"],
          "rowCount": actual_estimated_row_count,
          "suggestions": ["specific visualization suggestions based on this data", "relevant chart types", "meaningful analysis approaches"],
          "keyInsights": ["specific insights from this actual data", "patterns found", "trends identified", "business implications"]
        }
        
        IMPORTANT: 
        - Extract actual column names from the data preview
        - Provide insights specific to this data, not generic ones
        - Estimate row count based on file size and content
        - Suggest visualizations that make sense for this specific dataset
        
        Return only valid JSON without any markdown formatting.
      `;

      const result = await this.callWithRetry(() => this.reasoningModel.generateContent(prompt));
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.createFallbackAnalysis(files);
      }
    } catch (error) {
      console.error('Error analyzing data:', error);
      return this.createFallbackAnalysis(files);
    }
  }

  async generateDashboard(
    analysis: DataAnalysis, 
    useAllData: boolean, 
    designDescription: string
  ): Promise<string> {
    try {
      // Create unique identifier for this dashboard
      const dashboardId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      const prompt = `
        You are an expert web developer. Create a UNIQUE, complete, functional HTML dashboard with the following SPECIFIC requirements:
        
        UNIQUE DASHBOARD ID: ${dashboardId}
        
        SPECIFIC DATA ANALYSIS:
        - Summary: ${analysis.summary}
        - Columns: ${analysis.columns.join(', ')}
        - Row Count: ${analysis.rowCount}
        - Key Insights: ${analysis.keyInsights.join(' | ')}
        
        DATA SCOPE: ${useAllData ? 'Use ALL available data columns and create comprehensive visualizations' : 'Focus ONLY on key insights and create streamlined visualizations'}
        
        USER DESIGN REQUIREMENTS: "${designDescription}"
        
        MANDATORY REQUIREMENTS:
        1. Create a UNIQUE dashboard that reflects the SPECIFIC data analysis above
        2. Use the EXACT column names from the analysis: [${analysis.columns.join(', ')}]
        3. Generate realistic sample data that matches the data structure
        4. Create charts that make sense for THIS specific dataset
        5. Include KPIs relevant to THIS data (not generic ones)
        6. Use ApexCharts for all visualizations
        7. Make it fully responsive and interactive
        8. Include search and filter functionality
        9. Use professional styling with clean layout
        10. Add the dashboard ID "${dashboardId}" in the title
        
        SPECIFIC FEATURES TO INCLUDE:
        - Header with title: "${designDescription || 'Custom Dashboard'} - ID: ${dashboardId}"
        - ${useAllData ? '4-6 KPI cards based on ALL data columns' : '3-4 KPI cards based on key insights'}
        - ${useAllData ? '3-4 different chart types' : '2-3 focused charts'} using ApexCharts
        - Data table with the EXACT columns: [${analysis.columns.slice(0, 8).join(', ')}]
        - Interactive filters and search
        - Sample data that reflects the analysis summary: "${analysis.summary}"
        
        STYLING REQUIREMENTS:
        - Color scheme: White background, black primary, gray secondary
        - Modern, clean design
        - Responsive grid layout
        - Professional typography
        - Smooth animations and hover effects
        
        IMPORTANT: 
        - This must be a UNIQUE dashboard, not a template
        - Generate realistic sample data that matches the column structure
        - Charts should visualize data that makes sense for this specific dataset
        - Include the dashboard ID in multiple places for uniqueness
        
        Return only the complete HTML code without any markdown formatting or explanations.
      `;

      const result = await this.callWithRetry(() => this.codingModel.generateContent(prompt));
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating dashboard:', error);
      return this.createFallbackDashboard(analysis, designDescription);
    }
  }

  private createFallbackAnalysis(files: UploadedFile[]): DataAnalysis {
    // Try to extract actual information from file content
    let detectedColumns: string[] = [];
    let estimatedRows = 0;
    
    files.forEach(file => {
      if (typeof file.content === 'string') {
        const lines = file.content.split('\n');
        if (lines.length > 0) {
          // Try to detect CSV headers
          const firstLine = lines[0];
          if (firstLine.includes(',')) {
            detectedColumns = firstLine.split(',').map(col => col.trim().replace(/"/g, ''));
          }
          estimatedRows += Math.max(lines.length - 1, 0);
        }
      }
    });

    // Fallback columns if none detected
    if (detectedColumns.length === 0) {
      detectedColumns = files[0]?.name.toLowerCase().includes('customer') 
        ? ['Customer ID', 'First Name', 'Last Name', 'Email', 'Company', 'Country', 'Subscription Date']
        : ['ID', 'Name', 'Category', 'Value', 'Date', 'Status'];
    }

    const totalRows = estimatedRows || files.reduce((acc, file) => acc + Math.floor(file.size / 50), 0);

    return {
      summary: `Analyzed ${files.length} file(s) containing ${detectedColumns.length > 0 ? detectedColumns[0].toLowerCase().includes('customer') ? 'customer and business' : 'business' : 'structured'} data with approximately ${totalRows} records across ${detectedColumns.length} columns.`,
      columns: detectedColumns,
      rowCount: totalRows,
      suggestions: [
        `Create visualizations for ${detectedColumns.slice(0, 3).join(', ')} analysis`,
        `Build distribution charts for categorical data`,
        `Add trend analysis for time-based columns`,
        `Include filtering and search capabilities`
      ],
      keyInsights: [
        `Dataset contains ${totalRows} records with ${detectedColumns.length} data points each`,
        `Primary data categories include: ${detectedColumns.slice(0, 4).join(', ')}`,
        `Data structure suggests ${detectedColumns.some(col => col.toLowerCase().includes('date')) ? 'time-series' : 'categorical'} analysis opportunities`,
        `File size indicates ${totalRows > 1000 ? 'large-scale' : 'medium-scale'} dataset suitable for comprehensive analysis`
      ]
    };
  }

  private createFallbackDashboard(analysis: DataAnalysis, designDescription: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Dashboard - Agent Dash</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .kpi-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .kpi-value { font-size: 2rem; font-weight: bold; color: #1f2937; }
        .kpi-label { color: #6b7280; font-size: 0.875rem; margin-top: 4px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .chart-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 16px; color: #1f2937; }
        .table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .controls { display: flex; gap: 12px; margin-bottom: 20px; }
        .control-group { display: flex; flex-direction: column; }
        .control-group label { font-size: 0.875rem; color: #374151; margin-bottom: 4px; }
        .control-group input, .control-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="font-size: 1.875rem; font-weight: bold; color: #1f2937;">${designDescription || 'Custom Business Dashboard'}</h1>
            <p style="color: #6b7280; margin-top: 8px;">Generated by Agent Dash - Real-time analytics and insights</p>
        </div>

        <div class="controls">
            <div class="control-group">
                <label>Search</label>
                <input type="text" id="searchInput" placeholder="Search data...">
            </div>
            <div class="control-group">
                <label>Filter by Country</label>
                <select id="countryFilter">
                    <option value="all">All Countries</option>
                </select>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${analysis.rowCount.toLocaleString()}</div>
                <div class="kpi-label">Total Records</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${analysis.columns.length}</div>
                <div class="kpi-label">Data Columns</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">24.5</div>
                <div class="kpi-label">Avg. Daily Growth</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">$2.4M</div>
                <div class="kpi-label">Total Value</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div class="chart-container">
                <div class="chart-title">Trends Over Time</div>
                <div id="trends-chart"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">Distribution Analysis</div>
                <div id="distribution-chart"></div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${analysis.columns.slice(0, 5).map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody id="data-table-body">
                    ${this.generateSampleTableRows(20, analysis.columns.slice(0, 5))}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Initialize charts
        const trendsChart = new ApexCharts(document.querySelector("#trends-chart"), {
            chart: { type: 'area', height: 300, fontFamily: 'Inter, sans-serif' },
            series: [{
                name: 'Growth',
                data: [
                    [new Date('2024-01').getTime(), 45],
                    [new Date('2024-02').getTime(), 52],
                    [new Date('2024-03').getTime(), 48],
                    [new Date('2024-04').getTime(), 61],
                    [new Date('2024-05').getTime(), 55],
                    [new Date('2024-06').getTime(), 67],
                    [new Date('2024-07').getTime(), 73],
                    [new Date('2024-08').getTime(), 81],
                    [new Date('2024-09').getTime(), 78],
                    [new Date('2024-10').getTime(), 92],
                    [new Date('2024-11').getTime(), 88],
                    [new Date('2024-12').getTime(), 95]
                ]
            }],
            colors: ['#000000'],
            stroke: { curve: 'smooth', width: 2 },
            xaxis: { type: 'datetime' },
            yaxis: { title: { text: 'Value' } },
            tooltip: { x: { format: 'MMM yyyy' } }
        });

        const distributionChart = new ApexCharts(document.querySelector("#distribution-chart"), {
            chart: { type: 'bar', height: 300, fontFamily: 'Inter, sans-serif' },
            series: [{
                name: 'Count',
                data: [245, 189, 156, 134, 98, 87, 76, 65]
            }],
            colors: ['#000000'],
            plotOptions: { bar: { horizontal: true, barHeight: '70%' } },
            xaxis: { 
                categories: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E', 'Category F', 'Category G', 'Category H']
            }
        });

        trendsChart.render();
        distributionChart.render();

        // Add search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#data-table-body tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    </script>
</body>
</html>`;
  }

  private generateSampleTableRows(count: number, columns: string[]): string {
    const sampleData = [
      ['CUST-001', 'John Smith', 'TechCorp', 'USA', '2024-01-15'],
      ['CUST-002', 'Jane Doe', 'DataSys', 'Canada', '2024-01-20'],
      ['CUST-003', 'Mike Johnson', 'CloudInc', 'UK', '2024-02-01'],
      ['CUST-004', 'Sarah Wilson', 'WebSolutions', 'Germany', '2024-02-10'],
      ['CUST-005', 'David Brown', 'DigitalPro', 'France', '2024-02-15']
    ];

    let rows = '';
    for (let i = 0; i < Math.min(count, 20); i++) {
      const rowData = sampleData[i % sampleData.length];
      rows += `<tr>${rowData.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }
    return rows;
  }
}