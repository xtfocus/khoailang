import { useState } from 'react';
import axios from '../../config/axios';

interface Word {
  front: string;
  isDuplicate: boolean;
}

interface TextFileUploadProps {
  onWordsExtracted: (words: Word[]) => void;
}

const TextFileUpload: React.FC<TextFileUploadProps> = ({ onWordsExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = async (file: File): Promise<string[] | null> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check number of lines
    if (lines.length > 1000) {
      throw new Error('File is too large. Maximum allowed is 1000 lines.');
    }

    // Check line lengths
    const longLines = lines.filter(line => line.trim().length > 30);
    if (longLines.length > 0) {
      throw new Error(`Some lines are too long (over 30 characters). Please shorten them:\n${longLines.slice(0, 3).join('\n')}${longLines.length > 3 ? '\n...' : ''}`);
    }

    return lines;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Please select a .txt file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First validate the file
      const lines = await validateFile(file);
      if (!lines) return;

      // Then proceed with extraction
      const formData = new FormData();
      formData.append('file', file);
      const extractResponse = await axios.post('/api/words/txt/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const extractedWords = extractResponse.data.words;
      const duplicateResponse = await axios.post('/api/words/check-duplicates', extractedWords);
      const duplicates = new Set(duplicateResponse.data.duplicates);
      
      // Combine the results
      const wordsWithDuplicateStatus = extractedWords.map((front: string) => ({
        front,
        isDuplicate: duplicates.has(front)
      }));

      onWordsExtracted(wordsWithDuplicateStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
      if (event.target.value) {
        event.target.value = ''; // Reset the input to allow selecting the same file again
      }
    }
  };

  return (
    <div className="text-file-upload">
      <h2 className="text-xl font-semibold mb-4">Upload Text File</h2>
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isLoading}
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p>Processing file...</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold">Drop your text file here</p>
                <p className="text-sm text-gray-500">or click to select</p>
                <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">File Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Text file format (.txt)</li>
                    <li>One word/phrase per line</li>
                    <li>Maximum 1000 lines</li>
                    <li>Maximum 30 characters per line</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </label>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default TextFileUpload;