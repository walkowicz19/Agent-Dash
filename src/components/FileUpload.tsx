import React, { useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { UploadedFile } from '../types';
import * as d3 from 'd3';

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  files, 
  onFilesChange, 
  maxFiles = 3 
}) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadedFile[] = [...files];

    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        let parsedData: any[] = [];

        try {
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            parsedData = d3.csvParse(content);
          } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
            parsedData = JSON.parse(content);
          }
        } catch (err) {
          console.error(`Error parsing file ${file.name}:`, err);
          alert(`Could not parse the file: ${file.name}. Please ensure it is a valid format.`);
        }

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          content: content,
          data: parsedData,
        });

        // Update state after each file is processed
        if (newFiles.length === files.length + selectedFiles.length) {
          onFilesChange(newFiles);
        }
      };
      reader.readAsText(file);
    });
  }, [files, onFilesChange, maxFiles]);

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">Upload your data files</p>
          <p className="text-sm text-gray-500">
            Support for CSV, JSON, Excel, PowerPoint, and SQL files (max {maxFiles} files)
          </p>
        </div>
        <input
          type="file"
          multiple
          accept=".csv,.json,.xlsx,.xls,.pptx,.ppt,.sql"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Uploaded Files ({files.length}/{maxFiles})</h3>
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};