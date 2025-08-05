import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message, ChatState, UploadedFile, DataAnalysis, SelectedElement } from '../types';
import { GeminiService } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

export const useAgentDash = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: `Hello! I'm Agent Dash. Let's start by uploading your data files. What kind of dashboard are you looking to create today?`,
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
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

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

  useEffect(() => {
    try {
      setGeminiService(new GeminiService());
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        addMessage(
          `**API Key Error:** I'm still unable to connect to the AI service. Let's double-check the setup.

**Troubleshooting Checklist:**
*   **File Name:** Is the file in the root directory named exactly \`.env\`? (with the dot)
*   **Variable Name:** Inside \`.env\`, is the variable name exactly \`VITE_GEMINI_API_KEY\`?
*   **File Content:** Does the file contain this exact line?
    \`VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"\`
*   **Rebuild:** Did you click the **Rebuild** button after saving the \`.env\` file?

A full rebuild is required for the app to see the new API key. If you've checked all these steps, please try clicking **Rebuild** one more time.`,
          'agent'
        );
      }, 100);
    }
  }, [addMessage]);

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
  }, [loadingMessageIId, updateMessage]);

  const handleFileUpload = useCallback(async (files: UploadedFile[]) => {
    setChatState(prev => ({ ...prev, uploadedFiles: files }));
    if (files.length > 0) {
      if (!geminiService) {
        addMessage('AI service is not configured. Please check your API key and rebuild the app.', 'agent');
        return;
      }
      setIsLoading(true);
      const loadingId = addMessage('Analyzing your data files...', 'agent', true);
      try {
        const analysis = await geminiService.analyzeData(files);
        setDataAnalysis(analysis);
        updateMessage(loadingId, {
          content: `Great! I've analyzed your file(s). Here's what I found:\n\n**Summary**: ${analysis.summary}\n\nNow, would you like to use all your data or focus on the key insights?`,
          isLoading: false,
        });
        setChatState(prev => ({ ...prev, step: 'data-selection' }));
      } catch (error: any) {
        console.error(error);
        updateMessage(loadingId, { content: `Sorry, I encountered an error analyzing your data. The AI service might be unavailable or the API key is invalid. (Error: ${error.message})`, isLoading: false });
      } finally {
        setIsLoading(false);
      }
    }
  }, [addMessage, updateMessage, geminiService]);

  const handleDataSelection = useCallback((useAllData: boolean) => {
    setChatState(prev => ({ ...prev, selectedData: useAllData ? 'all' : 'insights' }));
    addMessage(useAllData ? 'Using all data.' : 'Focusing on key insights.', 'agent');
    setTimeout(() => {
      addMessage(`Now, please describe the dashboard you'd like to create.`, 'agent');
      setChatState(prev => ({ ...prev, step: 'design' }));
    }, 500);
  }, [addMessage]);

  const handleDesignDescription = useCallback(async (description: string) => {
    if (!geminiService) {
      addMessage('AI service is not configured. Please check your API key and rebuild the app.', 'agent');
      return;
    }
    setChatState(prev => ({ ...prev, designDescription: description, step: 'generation' }));
    const loadingId = addMessage('Perfect! Let me create your custom dashboard...', 'agent', true);
    setIsLoading(true);
    setLoadingMessageId(loadingId);
    try {
      if (!dataAnalysis) throw new Error('No data analysis available');
      const allData = chatState.uploadedFiles.flatMap(file => file.data || []);
      const { title, description: desc, html } = await geminiService.generateDashboard(dataAnalysis, chatState.selectedData === 'all', description, allData);
      setChatState(prev => ({ ...prev, generatedCode: html, dashboardTitle: title, dashboardDescription: desc, step: 'preview' }));
    } catch (error: any) {
      console.error(error);
      updateMessage(loadingId, { content: `I encountered an error generating your dashboard. (Error: ${error.message})`, isLoading: false });
      setLoadingMessageId(null);
      setIsLoading(false);
      setChatState(prev => ({ ...prev, step: 'design' }));
    }
  }, [addMessage, updateMessage, geminiService, dataAnalysis, chatState.selectedData, chatState.uploadedFiles]);

  const handleElementModification = useCallback(async (modificationRequest: string, element: SelectedElement) => {
    if (!geminiService) {
      addMessage('AI service is not configured. Please check your API key and rebuild the app.', 'agent');
      return;
    }
    const loadingId = addMessage(`Modifying the selected element...`, 'agent', true);
    setIsLoading(true);
    setLoadingMessageId(loadingId);
    try {
      if (!chatState.generatedCode) throw new Error('No dashboard code to modify');
      const modifiedCode = await geminiService.modifyDashboardElement(chatState.generatedCode, element, modificationRequest);
      setChatState(prev => ({ ...prev, generatedCode: modifiedCode, selectedElement: null }));
    } catch (error: any) {
      console.error(error);
      updateMessage(loadingId, { content: `I encountered an error modifying the element. (Error: ${error.message})`, isLoading: false });
      setLoadingMessageId(null);
      setIsLoading(false);
      setChatState(prev => ({ ...prev, selectedElement: null }));
    }
  }, [addMessage, updateMessage, geminiService, chatState.generatedCode]);

  const handleUserMessage = useCallback((content: string) => {
    addMessage(content, 'user');
    if (chatState.selectedElement) {
      handleElementModification(content, chatState.selectedElement);
      return;
    }
    if (chatState.step === 'design') {
      handleDesignDescription(content);
    } else if (chatState.step === 'preview') {
      addMessage('Modification of the entire dashboard is not yet supported. Please select a specific element to change.', 'agent');
    }
  }, [addMessage, chatState, handleElementModification, handleDesignDescription]);

  const downloadDashboard = useCallback(() => {
    if (chatState.generatedCode) {
      const blob = new Blob([chatState.generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dashboard.html';
      a.click();
      URL.revokeObjectURL(url);
      addMessage('Dashboard downloaded successfully!', 'agent');
    }
  }, [chatState.generatedCode, addMessage]);

  const saveDashboard = useCallback(async () => {
    if (chatState.generatedCode && chatState.dashboardTitle) {
      setIsLoading(true);
      const loadingId = addMessage('Saving your dashboard...', 'agent', true);
      try {
        const { data, error } = await supabase
          .from('dashboards')
          .insert([{ title: chatState.dashboardTitle, description: chatState.dashboardDescription, html_code: chatState.generatedCode }])
          .select()
          .single();
        if (error) throw error;
        updateMessage(loadingId, { content: '✅ Dashboard saved successfully!', isLoading: false, type: 'success' });
        if (data?.id) {
          navigate(`/dashboard/${data.id}`, { replace: true });
        }
      } catch (error) {
        console.error('Error saving dashboard:', error);
        updateMessage(loadingId, { content: 'Sorry, I could not save your dashboard.', isLoading: false });
      } finally {
        setIsLoading(false);
      }
    }
  }, [chatState, addMessage, updateMessage, navigate]);

  const loadDashboard = useCallback(async (id: string) => {
    setIsLoading(true);
    setMessages([]);
    const loadingId = addMessage('Loading your dashboard...', 'agent', true);
    try {
      const { data, error } = await supabase.from('dashboards').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setChatState({
          step: 'preview',
          uploadedFiles: [],
          generatedCode: data.html_code,
          dashboardTitle: data.title,
          dashboardDescription: data.description,
          selectedElement: null,
        });
        updateMessage(loadingId, { content: `Loaded dashboard: "${data.title}". You can now select an element to modify.`, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      updateMessage(loadingId, { content: 'Sorry, I could not load that dashboard.', isLoading: false });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateMessage]);

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
    saveDashboard,
    loadDashboard,
  };
};