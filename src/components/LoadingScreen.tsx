import React from 'react';
import { Loader2, Brain, BarChart3, Code } from 'lucide-react';

interface LoadingScreenProps {
  stage: 'analyzing' | 'reasoning' | 'generating';
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, message }) => {
  const getIcon = () => {
    switch (stage) {
      case 'analyzing':
        return <BarChart3 className="w-8 h-8 text-black" />;
      case 'reasoning':
        return <Brain className="w-8 h-8 text-black" />;
      case 'generating':
        return <Code className="w-8 h-8 text-black" />;
      default:
        return <Loader2 className="w-8 h-8 text-black animate-spin" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
      <div className="mb-4">
        {getIcon()}
      </div>
      <div className="flex items-center space-x-2 mb-2">
        <Loader2 className="w-4 h-4 animate-spin text-black" />
        <span className="font-medium text-gray-900">Agent Dash is working...</span>
      </div>
      <p className="text-sm text-gray-600 text-center max-w-md">{message}</p>
    </div>
  );
};