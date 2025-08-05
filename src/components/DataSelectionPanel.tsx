import React from 'react';
import { CheckCircle, Circle, Database, TrendingUp } from 'lucide-react';
import { DataAnalysis } from '../types';

interface DataSelectionPanelProps {
  analysis: DataAnalysis;
  onSelectionChange: (useAllData: boolean) => void;
  selectedOption?: boolean;
}

export const DataSelectionPanel: React.FC<DataSelectionPanelProps> = ({
  analysis,
  onSelectionChange,
  selectedOption
}) => {
  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Analysis Complete</h3>
        <p className="text-sm text-gray-600">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Database className="w-4 h-4 text-gray-600" />
            <span className="font-medium">Columns</span>
          </div>
          <p className="text-gray-600">{analysis.columns.length} columns detected</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="font-medium">Records</span>
          </div>
          <p className="text-gray-600">{analysis.rowCount.toLocaleString()} rows</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Key Insights:</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          {analysis.keyInsights.map((insight, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0"></span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Choose your data approach:</h4>
        
        <div className="space-y-2">
          <button
            onClick={() => onSelectionChange(true)}
            className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
              selectedOption === true
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedOption === true ? (
                  <CheckCircle className="w-5 h-5 text-black" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Use All Data</p>
                  <p className="text-sm text-gray-600">Include all columns and records in the dashboard</p>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectionChange(false)}
            className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
              selectedOption === false
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedOption === false ? (
                  <CheckCircle className="w-5 h-5 text-black" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Use Key Insights Only</p>
                  <p className="text-sm text-gray-600">Focus on the most important data points identified by AI</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};