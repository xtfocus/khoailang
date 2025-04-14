import React from 'react';
import { FileText, Link, FileType } from 'lucide-react';

interface ImportOptionsProps {
  onSelect: (method: 'txt' | 'url' | 'pdf') => void;
}

const ImportOptions: React.FC<ImportOptionsProps> = ({ onSelect }) => {
  return (
    <div className="import-options">
      <h2 className="text-xl font-semibold mb-6">Choose Import Method</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onSelect('txt')}
          className="p-6 border-2 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
        >
          <FileText className="w-12 h-12 text-blue-600 mb-4" />
          <span className="text-lg font-medium">Text File</span>
          <span className="text-sm text-gray-500 mt-2">One word per line</span>
        </button>

        <button
          disabled
          className="p-6 border-2 rounded-lg opacity-50 cursor-not-allowed flex flex-col items-center"
        >
          <Link className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-lg font-medium">URL</span>
          <span className="text-sm text-gray-500 mt-2">Coming soon</span>
        </button>

        <button
          disabled
          className="p-6 border-2 rounded-lg opacity-50 cursor-not-allowed flex flex-col items-center"
        >
          <FileType className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-lg font-medium">PDF</span>
          <span className="text-sm text-gray-500 mt-2">Coming soon</span>
        </button>
      </div>
    </div>
  );
};

export default ImportOptions;