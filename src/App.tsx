import { Bot, BarChart3 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { FileUpload } from './components/FileUpload';
import { DataSelectionPanel } from './components/DataSelectionPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { useAgentDash } from './hooks/useAgentDash';

function App() {
  const {
    messages,
    chatState,
    isLoading,
    dataAnalysis,
    handleFileUpload,
    handleDataSelection,
    handleUserMessage,
    downloadDashboard,
  } = useAgentDash();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agent Dash</h1>
                <p className="text-xs text-gray-500">AI Dashboard Creator</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BarChart3 className="w-4 h-4" />
              <span>Step {chatState.step === 'upload' ? '1' : chatState.step === 'data-selection' ? '2' : chatState.step === 'design' ? '3' : '4'} of 4</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - Chat Interface */}
          <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>

              {/* File Upload Section */}
              {chatState.step === 'upload' && (
                <div className="mt-6">
                  <FileUpload
                    files={chatState.uploadedFiles}
                    onFilesChange={handleFileUpload}
                    maxFiles={3}
                  />
                </div>
              )}

              {/* Data Selection Panel */}
              {chatState.step === 'data-selection' && dataAnalysis && (
                <div className="mt-6">
                  <DataSelectionPanel
                    analysis={dataAnalysis}
                    onSelectionChange={handleDataSelection}
                    selectedOption={chatState.selectedData === 'all' ? true : chatState.selectedData === 'insights' ? false : undefined}
                  />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <ChatInput
                onSendMessage={handleUserMessage}
                disabled={isLoading || chatState.step === 'upload' || chatState.step === 'data-selection'}
                placeholder={
                  chatState.step === 'upload' 
                    ? "Upload your files first..."
                    : chatState.step === 'data-selection'
                    ? "Please select your data approach above..."
                    : chatState.step === 'design'
                    ? "Describe your dashboard design..."
                    : "Ask me anything about your dashboard..."
                }
              />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <PreviewPanel
              generatedCode={chatState.generatedCode}
              onDownload={downloadDashboard}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;