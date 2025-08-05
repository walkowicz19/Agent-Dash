export interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  data?: any[];
}

export interface ChatState {
  step: 'upload' | 'data-selection' | 'design' | 'generation' | 'preview';
  uploadedFiles: UploadedFile[];
  selectedData?: 'all' | 'insights';
  designDescription?: string;
  generatedCode?: string;
}

export interface DataAnalysis {
  summary: string;
  columns: string[];
  rowCount: number;
  suggestions: string[];
  keyInsights: string[];
}