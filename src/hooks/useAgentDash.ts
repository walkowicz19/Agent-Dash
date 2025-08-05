import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState, UploadedFile, DataAnalysis, SelectedElement } from '../types';
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
    selectedElement: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataAnalysis, setDataAnalysis] = useState<DataAnalysis | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const geminiService = new GeminiService('AIzaSyBRexGFUmrJwfSs5mMYE4k4QlSsriizfZ8');

  const addMessage = useCallback((content: string, type: Message['type'], isLoading = false) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
      isLoading,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, props: Partial<Omit<Message, 'id'>>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...props, timestamp: new Date() } : msg
    ));
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'element-selected' && chatState.step === 'preview') {
        setChatState(prev => ({ ...prev, selectedElement: payload }));
        addMessage(`Element selected: \`${payload.selector}\`. How would you like to change it?`, 'agent');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [chatState.step, addMessage]);

  const handlePreviewLoad = useCallback(() => {
    if (loadingMessageId) {
      updateMessage(loadingMessageId, {
        content: `✅ Success! Your changes have been applied and the preview is updated.`,
        isLoading: false,
        type: 'success',
      });
      setLoadingMessageId(null);
      setIsLoading(false);
    }
  }, [loadingMessageId, updateMessage]);

  const handleFileUpload = useCallback(async (files: UploadedFile[]) => {
    setChatState(prev => ({ ...prev, uploadedFiles: files }));

    if (files.length > 0) {
      const loadingId = addMessage('Analyzing your data files...', 'agent', true);
      setIsLoading(true);

      try {
        const analysis = await geminiService.analyzeData(files);
        setDataAnalysis(analysis);
        
        updateMessage(loadingId, {
          content: `Great! I've analyzed your ${files.length} file(s). Here's what I found:

📊 **Data Summary**: ${analysis.summary}
📈 **Key Insights**: 
${analysis.keyInsights.map(insight => `• ${insight}`).join('\n')}

Now, would you like to use all your data or focus on the most important insights I've identified?`,
          isLoading: false,
        });

        setChatState(prev => ({ ...prev, step: 'data-selection' }));
      } catch (error) {
        updateMessage(loadingId, {
          content: 'Sorry, I encountered an error analyzing your data. Please try uploading your files again.',
          isLoading: false,
        });
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
    setLoadingMessageId(loadingId);

    try {
      if (!dataAnalysis) throw new Error('No data analysis available');
      
      const allData = chatState.uploadedFiles.flatMap(file => file.data || []);

      const generatedCode = await geminiService.generateDashboard(
        dataAnalysis,
        chatState.selectedData === 'all',
        description,
        allData
      );

      setChatState(prev => ({ ...prev, generatedCode, step: 'preview' }));
    } catch (error) {
      updateMessage(loadingId, {
        content: 'I encountered an error generating your dashboard. Please try describing your design requirements again.',
        isLoading: false,
      });
      setLoadingMessageId(null);
      setIsLoading(false);
      setChatState(prev => ({ ...prev, step: 'design' }));
    }
  }, [addMessage, updateMessage, geminiService, dataAnalysis, chatState.selectedData, chatState.uploadedFiles]);

  const handleElementModification = useCallback(async (modificationRequest: string, element: SelectedElement) => {
    const loadingId = addMessage(`Modifying the selected element: \`${element.selector}\`...`, 'agent', true);
    setIsLoading(true);
    setLoadingMessageId(loadingId);

    try {
      if (!chatState.generatedCode) {
        throw new Error('No dashboard code to modify');
      }

      const modifiedCode = await geminiService.modifyDashboardElement(
        chatState.generatedCode,
        element,
        modificationRequest
      );

      setChatState(prev => ({ ...prev, generatedCode: modifiedCode, selectedElement: null }));
    } catch (error) {
      updateMessage(loadingId, {
        content: 'I encountered an error modifying the element. Please try describing your changes differently.',
        isLoading: false,
      });
      setLoadingMessageId(null);
      setIsLoading(false);
      setChatState(prev => ({ ...prev, selectedElement: null }));
    }
  }, [addMessage, updateMessage, geminiService, chatState.generatedCode]);

  const handleGenericModification = useCallback(async (modificationRequest: string) => {
    const loadingId = addMessage('Let me modify your dashboard...', 'agent', true);
    setIsLoading(true);
    setLoadingMessageId(loadingId);

    try {
      if (!dataAnalysis || !chatState.generatedCode) {
        throw new Error('No dashboard to modify');
      }

      const modificationPrompt = `
        The user wants to modify their existing dashboard. Here's their request:
        "${modificationRequest}"
        
        Please modify the existing dashboard code to incorporate the user's requested changes.
        Return only the complete modified HTML code.
      `;
      
      const allData = chatState.uploadedFiles.flatMap(file => file.data || []);

      const modifiedCode = await geminiService.generateDashboard(
        dataAnalysis,
        chatState.selectedData === 'all',
        modificationPrompt,
        allData
      );

      setChatState(prev => ({ ...prev, generatedCode: modifiedCode }));
    } catch (error) {
      updateMessage(loadingId, {
        content: 'I encountered an error modifying your dashboard. Please try describing your changes differently.',
        isLoading: false,
      });
      setLoadingMessageId(null);
      setIsLoading(false);
    }
  }, [addMessage, updateMessage, geminiService, dataAnalysis, chatState.selectedData, chatState.generatedCode, chatState.uploadedFiles]);

  const handleUserMessage = useCallback((content: string) => {
    addMessage(content, 'user');

    if (chatState.selectedElement) {
      handleElementModification(content, chatState.selectedElement);
      return;
    }

    if (chatState.step === 'preview' && chatState.generatedCode) {
      handleGenericModification(content);
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
        addMessage('I can help you modify your dashboard! Try asking me to:\n\n• Change colors or styling\n• Add new chart types\n• Modify the layout\n• Add or remove features\n\nWhat would you like to change?', 'agent');
        break;
      default:
        addMessage('I\'m here to help! What would you like to know about your dashboard?', 'agent');
    }
  }, [addMessage, chatState, handleElementModification, handleGenericModification, handleDesignDescription]);

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
    handlePreviewLoad,
  };
};