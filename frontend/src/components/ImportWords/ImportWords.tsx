import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TextFileUpload from './TextFileUpload';
import { BiCheck, BiError } from 'react-icons/bi';
import axios from '../../config/axios';
import type { AxiosError } from '../../config/axios';
import { Flashcard, Language } from '../../types';

interface Word {
  front: string;
  back?: string;
  isDuplicate: boolean;
  selected?: boolean;
}

interface Catalog {
  id: number;
  name: string;
  user_id: number;
}

interface ApiError {
  detail: string;
}

export function ImportWords(): JSX.Element {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'language' | 'upload' | 'preview'>('language');

  // Initial fetch of languages
  useEffect(() => {
    const fetchLanguages = async (): Promise<void> => {
      try {
        const languagesRes = await axios.get('/api/words/languages');
        setLanguages(languagesRes.data.languages);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load languages';
        setError(errorMessage);
      }
    };
    fetchLanguages();
  }, []);

  // Fetch catalogs whenever language changes
  useEffect(() => {
    const fetchCatalogs = async (): Promise<void> => {
      if (!selectedLanguage) {
        setCatalogs([]);
        return;
      }

      try {
        const catalogsRes = await axios.get(`/api/catalogs/accessible-by-language/${selectedLanguage}`);
        setCatalogs(catalogsRes.data);
        setSelectedCatalogs([]);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load catalogs';
        setError(errorMessage);
      }
    };
    fetchCatalogs();
  }, [selectedLanguage]);

  const handleLanguageSelect = () => {
    if (!selectedLanguage) {
      setError('Please select a language first');
      return;
    }
    setError(null);
    setStep('upload');
  };

  const handleWordsExtracted = async (extractedWords: Word[]): Promise<void> => {
    setStep('preview');
    
    const nonDuplicateWords = extractedWords.filter(w => !w.isDuplicate);
    if (nonDuplicateWords.length > 0) {
      try {
        const generateResponse = await axios.post(
          '/api/words/generate-flashcards',
          nonDuplicateWords.map(w => w.front)
        );
        
        const flashcardsWithDefinitions = generateResponse.data.flashcards as Flashcard[];
        extractedWords = extractedWords.map(word => ({
          ...word,
          selected: true,
          back: word.isDuplicate ? '(duplicate - will show existing definition)' : 
                flashcardsWithDefinitions.find(f => f.front === word.front)?.back || ''
        }));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate definitions';
        setError(errorMessage);
      }
    }
    
    setWords(extractedWords);
  };

  const handleImport = async (): Promise<void> => {
    const selectedWords = words.filter(w => w.selected && w.front.trim());
    if (selectedWords.length === 0) {
      setError('Please select at least one word to import');
      return;
    }
    
    setImporting(true);
    setError(null);

    try {
      await axios.post(
        `/api/words/import?language_id=${selectedLanguage}`, 
        {
          words: selectedWords.map(w => ({
            front: w.front,
            back: w.back
          })),
          catalog_ids: selectedCatalogs
        }
      );

      const event = new CustomEvent('wordImportSuccess', {
        detail: { count: selectedWords.length }
      });
      window.dispatchEvent(event);
      
      // Navigate to dashboard instead of resetting to language selection
      navigate('/dashboard');
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.detail || 'Failed to import words');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Import Words</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        {/* Step 1: Language Selection */}
        {step === 'language' && (
          <div className="language-selection space-y-6">
            <h2 className="text-xl font-semibold">Select Language</h2>
            <p className="text-gray-600">Choose the language for the words you want to import</p>
            <div className="max-w-xs">
              <div className="relative">
                <select
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-8 leading-tight focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={selectedLanguage || ''}
                  onChange={(e) => setSelectedLanguage(Number(e.target.value))}
                >
                  <option value="">Select language...</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleLanguageSelect}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: File Upload */}
        {step === 'upload' && (
          <>
            <TextFileUpload onWordsExtracted={handleWordsExtracted} />
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setStep('language')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
            </div>
          </>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && words.length > 0 && (
          <div className="preview-section space-y-8">
            {/* Words Table */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Words to Import</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          checked={words.length > 0 && words.every(w => w.selected)}
                          onChange={(e) => {
                            setWords(words.map(word => ({
                              ...word,
                              selected: e.target.checked
                            })));
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meaning</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {words.map((word, index) => (
                      <tr key={index} className={word.isDuplicate ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            checked={!!word.selected}
                            onChange={(e) => {
                              const newWords = [...words];
                              newWords[index] = {
                                ...word,
                                selected: e.target.checked
                              };
                              setWords(newWords);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="block w-full px-2 py-1">
                            {word.front}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={word.back || ''}
                            onChange={(e) => {
                              const newWords = [...words];
                              newWords[index] = {
                                ...word,
                                back: e.target.value,
                                selected: word.front.trim() !== '' && e.target.value.trim() !== ''
                              };
                              setWords(newWords);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter meaning..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          {word.isDuplicate ? (
                            <div className="flex items-center">
                              <BiError className="text-yellow-500 h-5 w-5 mr-2" />
                              <span className="text-sm text-yellow-600">Already exists</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <BiCheck className="text-green-500 h-5 w-5 mr-2" />
                              <span className="text-sm text-green-600">New word</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add to Catalogs section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Catalogs (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {catalogs.length > 0 ? (
                  catalogs.map((catalog) => (
                    <label key={catalog.id} className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCatalogs.includes(catalog.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCatalogs([...selectedCatalogs, catalog.id]);
                          } else {
                            setSelectedCatalogs(selectedCatalogs.filter(id => id !== catalog.id));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{catalog.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-3">No catalogs found for the selected language. Create a catalog first to add words to it.</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : 'Import Words'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportWords;