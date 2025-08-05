import React from 'react';
import { Bot, User, Loader2, CheckCircle } from 'lucide-react';
import { Message } from '../types';

const formatMessage = (content: string) => {
  // Convert **text** to <strong>text</strong>
  let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *text* to <em>text</em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet points • to proper list items
  formatted = formatted.replace(/^• (.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items in <ul> tags
  formatted = formatted.replace(/(<li>.*<\/li>\s*)+/gs, '<ul class="list-disc list-inside space-y-1 ml-4">$&</ul>');
  
  // Convert line breaks to <br> tags
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
};

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAgent = message.type === 'agent';
  const isSuccess = message.type === 'success';

  return (
    <div className={`flex ${isAgent || isSuccess ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex max-w-3xl ${isAgent || isSuccess ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 ${isAgent || isSuccess ? 'mr-3' : 'ml-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isSuccess
              ? 'bg-green-600 text-white'
              : isAgent 
                ? 'bg-black text-white' 
                : 'bg-gray-200 text-gray-600'
          }`}>
            {isSuccess ? <CheckCircle className="w-4 h-4" /> : isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
        </div>
        <div className={`rounded-lg px-4 py-2 ${
          isSuccess
            ? 'bg-green-100 text-green-900'
            : isAgent 
              ? 'bg-gray-100 text-gray-900' 
              : 'bg-black text-white'
        }`}>
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="whitespace-pre-wrap">{message.content}</span>
            </div>
          ) : (
            <div 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};