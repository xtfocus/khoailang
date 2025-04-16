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
      // Step 1: Extract words from file
      const formData = new FormData();
      formData.append('file', file);
      const extractResponse = await axios.post('/api/words/txt/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const extractedWords = extractResponse.data.words;

      // Step 2: Validate words
      const validateResponse = await axios.post('/api/words/validate', extractedWords);
      const validWords = validateResponse.data.valid_words;

      // Step 3: Check for duplicates
      const duplicateResponse = await axios.post('/api/words/check-duplicates', validWords);
      const duplicates = new Set(duplicateResponse.data.duplicates);
      
      // Combine the results
      const wordsWithDuplicateStatus = validWords.map((front: string) => ({
        front,
        isDuplicate: duplicates.has(front)
      }));

      onWordsExtracted(wordsWithDuplicateStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-file-upload">
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
              <p>Processing file...</p>
            ) : (
              <>
                <p className="text-lg font-semibold">Drop your text file here</p>
                <p className="text-sm text-gray-500">or click to select</p>
                <p className="text-xs text-gray-400 mt-2">Only .txt files with one word per line</p>
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