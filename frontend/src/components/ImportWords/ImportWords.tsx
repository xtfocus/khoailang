import { useState, useEffect } from 'react';
import axios from 'axios';
import ImportOptions from './ImportOptions';
import TextFileUpload from './TextFileUpload';
import { useAuth } from '../../contexts/AuthContext';
import { HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2';

interface Word {
  front: string;
  isDuplicate: boolean;
  selected?: boolean;
}

interface Catalog {
  id: number;
  name: string;
  user_id: number;
}

export function ImportWords() {
  const { userProfile } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStep, setImportStep] = useState<'select-method' | 'upload' | 'preview'>('select-method');

  // Fetch user's catalogs
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const response = await axios.get('/api/catalogs/owned', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setCatalogs(response.data);
      } catch (err) {
        setError('Failed to load your catalogs');
      }
    };
    fetchCatalogs();
  }, []);

  const handleWordsExtracted = (extractedWords: Word[]) => {
    setWords(extractedWords.map(w => ({ ...w, selected: true })));
    setImportStep('preview');
  };

  const toggleWordSelection = (index: number) => {
    setWords(words.map((word, i) => 
      i === index ? { ...word, selected: !word.selected } : word
    ));
  };

  const handleImport = async () => {
    const selectedWords = words.filter(w => w.selected);
    if (selectedWords.length === 0) {
      setError('Please select at least one word to import');
      return;
    }
    
    setImporting(true);
    setError(null);
    
    try {
      // Check for duplicates first
      const duplicatesResponse = await axios.post('/api/words/check-duplicates', 
        selectedWords.map(w => w.front),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Import the words
      await axios.post('/api/words/import', {
        words: selectedWords.map(w => w.front),
        catalog_ids: selectedCatalogs
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Reset state and show success message
      setWords([]);
      setSelectedCatalogs([]);
      setImportStep('select-method');
    } catch (err) {
      setError('Failed to import words');
    } finally {
      setImporting(false);
    }
  };

  const handleMethodSelect = (method: 'txt' | 'url' | 'pdf') => {
    if (method === 'txt') {
      setImportStep('upload');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Import Words</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        {importStep === 'select-method' && (
          <ImportOptions onSelect={handleMethodSelect} />
        )}

        {importStep === 'upload' && (
          <TextFileUpload onWordsExtracted={handleWordsExtracted} />
        )}

        {importStep === 'preview' && words.length > 0 && (
          <div className="preview-section">
            <h3 className="text-lg font-semibold mb-4">Review Words</h3>
            
            {/* Words preview */}
            <div className="mb-6 max-h-60 overflow-y-auto">
              {words.map((word, index) => (
                <div 
                  key={index}
                  className={`p-2 ${word.isDuplicate ? 'bg-yellow-50' : 'bg-gray-50'} mb-2 rounded flex items-center gap-3`}
                >
                  <input
                    type="checkbox"
                    checked={word.selected}
                    onChange={() => toggleWordSelection(index)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="flex-grow">{word.front}</span>
                  {word.isDuplicate ? (
                    <div className="flex items-center text-yellow-600">
                      <HiExclamationTriangle className="w-5 h-5 mr-1" />
                      <span className="text-sm">Duplicate</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <HiCheckCircle className="w-5 h-5 mr-1" />
                      <span className="text-sm">New word</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Catalog selection */}
            <div className="mb-6">
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                <h4 className="text-md font-medium mb-3">Add to catalogs (optional):</h4>
                <div className="space-y-2">
                  {catalogs.map(catalog => (
                    <label key={catalog.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCatalogs.includes(catalog.id)}
                        onChange={(e) => {
                          setSelectedCatalogs(
                            e.target.checked
                              ? [...selectedCatalogs, catalog.id]
                              : selectedCatalogs.filter(id => id !== catalog.id)
                          );
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>{catalog.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Import button */}
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {importing ? 'Importing...' : 'Import Words'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportWords;