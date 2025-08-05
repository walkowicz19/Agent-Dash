import React from 'react';
import { Download, Code, Maximize2 } from 'lucide-react';

interface PreviewPanelProps {
  generatedCode?: string;
  onDownload: () => void;
  onPreviewLoad: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  generatedCode, 
  onDownload,
  onPreviewLoad
}) => {
  const openFullscreen = () => {
    if (generatedCode) {
      // Remove the selection script for the fullscreen view to disable editing
      const codeForFullscreen = generatedCode.replace(
        /<script id="agent-dash-selection-script">[\s\S]*?<\/script>/,
        ''
      );

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(codeForFullscreen);
        newWindow.document.close();
      }
    }
  };

  if (!generatedCode) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Dashboard preview will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Dashboard Preview</h3>
        <div className="flex space-x-2">
          <button
            onClick={onDownload}
            className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <button
            onClick={openFullscreen}
            className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <iframe
          srcDoc={generatedCode}
          className="w-full h-full border border-gray-200 rounded-lg"
          title="Dashboard Preview"
          onLoad={onPreviewLoad}
        />
      </div>
    </div>
  );
};