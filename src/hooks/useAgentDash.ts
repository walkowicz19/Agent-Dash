import { useState, useCallback } from 'react';
import { Message, ChatState, UploadedFile, DataAnalysis } from '../types';
import { GeminiService } from '../services/geminiService';

export const useAgentDash = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: `Hello! I'm Agent Dash, your AI assistant for creating interactive dashboards. 

I'll help you transform your data into beautiful, functional dashboards in just a few steps:

1. **Upload your data files** (CSV, JSON, Excel, PowerPoint, or SQL - max 3 files)
2. **Choose your data approach** (all data or key insights only)  
3. **Describe your desired design** (layout, style, features)
4. **Get your custom dashboard** with real-time preview

Let's start by uploading your data files. What kind of dashboard are you looking to create today?`,
      timestamp: new Date(),
    }
  ]);

  const [chatState, setChatState] = useState<ChatState>({
    step: 'upload',
    uploadedFiles: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataAnalysis, setDataAnalysis] = useState<DataAnalysis | null>(null);
  const geminiService = new GeminiService('AIzaSyBRexGFUmrJwfSs5mMYE4k4QlSsriizfZ8');

  const addMessage = useCallback((content: string, type: 'user' | 'agent', isLoading = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isLoading,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, content: string, isLoading = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content, isLoading } : msg
    ));
  }, []);

  const handleFileUpload = useCallback(async (files: UploadedFile[]) => {
    setChatState(prev => ({ ...prev, uploadedFiles: files }));

    if (files.length > 0) {
      const loadingId = addMessage('Analyzing your data files...', 'agent', true);
      setIsLoading(true);

      try {
        const analysis = await geminiService.analyzeData(files);
        setDataAnalysis(analysis);
        
        updateMessage(loadingId, `Great! I've analyzed your ${files.length} file(s). Here's what I found:

📊 **Data Summary**: ${analysis.summary}
📈 **Key Insights**: 
${analysis.keyInsights.map(insight => `• ${insight}`).join('\n')}

Now, would you like to use all your data or focus on the most important insights I've identified?`);

        setChatState(prev => ({ ...prev, step: 'data-selection' }));
      } catch (error) {
        updateMessage(loadingId, 'Sorry, I encountered an error analyzing your data. Please try uploading your files again.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [addMessage, updateMessage, geminiService]);

  const handleDataSelection = useCallback((useAllData: boolean) => {
    setChatState(prev => ({ ...prev, selectedData: useAllData ? 'all' : 'insights' }));
    
    addMessage(
      useAllData 
        ? 'Perfect! I\'ll use all your data to create a comprehensive dashboard.'
        : 'Excellent choice! I\'ll focus on the key insights for a streamlined dashboard.',
      'agent'
    );

    setTimeout(() => {
      addMessage(
        `Now, let's design your dashboard! Please describe how you'd like it to look and what features you want:

• **Layout**: Do you prefer a single page or multiple sections?
• **Style**: Modern, minimal, colorful, professional?
• **Key features**: Charts, tables, filters, KPIs?
• **Focus areas**: What's most important to highlight?

For example: "Create a modern, professional dashboard with revenue charts, customer analytics, and interactive filters in a clean layout."`,
        'agent'
      );
      setChatState(prev => ({ ...prev, step: 'design' }));
    }, 1000);
  }, [addMessage]);

  const handleDesignDescription = useCallback(async (description: string) => {
    setChatState(prev => ({ ...prev, designDescription: description, step: 'generation' }));
    
    const loadingId = addMessage('Perfect! Let me create your custom dashboard...', 'agent', true);
    setIsLoading(true);

    try {
      if (!dataAnalysis) throw new Error('No data analysis available');
      
      const generatedCode = await geminiService.generateDashboard(
        dataAnalysis,
        chatState.selectedData === 'all',
        description
      );

      setChatState(prev => ({ ...prev, generatedCode, step: 'preview' }));
      
      updateMessage(loadingId, `🎉 Your dashboard is ready! I've created a beautiful, interactive dashboard based on your requirements.

**Features included:**
• Real-time data visualization
• Interactive charts and graphs  
• Filterable data tables
• Key performance indicators
• Responsive design
• Professional styling

You can see the live preview on the right. Feel free to download the files or ask me to make any adjustments!`);

    } catch (error) {
      updateMessage(loadingId, 'I encountered an error generating your dashboard. Please try describing your design requirements again.');
      setChatState(prev => ({ ...prev, step: 'design' }));
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateMessage, geminiService, dataAnalysis, chatState.selectedData]);

  const handleDashboardModification = useCallback(async (modificationRequest: string) => {
    const loadingId = addMessage('Let me modify your dashboard...', 'agent', true);
    setIsLoading(true);

    try {
      if (!dataAnalysis || !chatState.generatedCode) {
        throw new Error('No dashboard to modify');
      }

      // Create a modification prompt for the AI
      const modificationPrompt = `
        The user wants to modify their existing dashboard. Here's their request:
        "${modificationRequest}"

        Current dashboard analysis: ${JSON.stringify(dataAnalysis, null, 2)}
        
        Please modify the existing dashboard code to incorporate the user's requested changes.
        The current dashboard includes:
        - Interactive charts using ApexCharts
        - Data tables with filtering
        - KPI cards
        - Professional styling
        
        User's modification request: ${modificationRequest}
        
        Please generate the complete modified HTML dashboard code that incorporates these changes.
        Maintain all existing functionality while adding the requested modifications.
        
        Return only the complete HTML code without any markdown formatting or explanations.
      `;

      const modifiedCode = await geminiService.generateDashboard(
        dataAnalysis,
        chatState.selectedData === 'all',
        modificationPrompt
      );

      setChatState(prev => ({ ...prev, generatedCode: modifiedCode }));
      
      updateMessage(loadingId, `✅ Dashboard updated successfully! I've made the following changes based on your request:

${modificationRequest}

The updated dashboard is now visible in the preview panel. You can continue to ask for more modifications or download the updated version!`);

    } catch (error) {
      updateMessage(loadingId, 'I encountered an error modifying your dashboard. Please try describing your changes differently or be more specific about what you\'d like to modify.');
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateMessage, geminiService, dataAnalysis, chatState.selectedData, chatState.generatedCode]);

  const handleUserMessage = useCallback((content: string) => {
    addMessage(content, 'user');

    // Check if user wants to modify existing dashboard
    if (chatState.step === 'preview' && chatState.generatedCode) {
      handleDashboardModification(content);
      return;
    }

    switch (chatState.step) {
      case 'upload':
        addMessage('Please upload your data files using the upload area above, then I can help you create your dashboard!', 'agent');
        break;
      case 'design':
        handleDesignDescription(content);
        break;
      case 'preview':
        addMessage('I can help you modify your dashboard! Try asking me to:\n\n• Change colors or styling\n• Add new chart types\n• Modify the layout\n• Add or remove features\n• Update data filters\n\nWhat would you like to change?', 'agent');
        break;
      default:
        addMessage('I\'m here to help! What would you like to know about your dashboard?', 'agent');
    }
  }, [addMessage, chatState, handleDashboardModification, handleDesignDescription]);

  const downloadDashboard = useCallback(() => {
    if (chatState.generatedCode) {
      const blob = new Blob([chatState.generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dashboard.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addMessage('Dashboard downloaded successfully! You can now use it in any web browser or integrate it into your projects.', 'agent');
    }
  }, [chatState.generatedCode, addMessage]);

  return {
    messages,
    chatState,
    isLoading,
    dataAnalysis,
    handleFileUpload,
    handleDataSelection,
    handleUserMessage,
    downloadDashboard,
  };
};