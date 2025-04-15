import { useState, useEffect } from 'react';
import axios from 'axios';
import ImportOptions from './ImportOptions';
import TextFileUpload from './TextFileUpload';
import { useAuth } from '../../contexts/AuthContext';
import { HiCheckCircle, HiExclamationTriangle, HiPlusCircle } from 'react-icons/hi2';

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

interface Language {
  id: number;
  name: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export function ImportWords() {
  const { } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStep, setImportStep] = useState<'select-method' | 'upload' | 'preview'>('select-method');
  const [areDuplicatesSelected, setAreDuplicatesSelected] = useState(true);

  // Fetch user's catalogs and languages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catalogsRes, languagesRes] = await Promise.all([
          axios.get('/api/catalogs/owned', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }),
          axios.get('/api/words/languages', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);
        setCatalogs(catalogsRes.data);
        setLanguages(languagesRes.data.languages);
      } catch (err) {
        setError('Failed to load catalogs or languages');
      }
    };
    fetchData();
  }, []);

  const handleWordsExtracted = async (extractedWords: Word[]) => {
    // Generate flashcards for non-duplicate words immediately after extraction
    const nonDuplicateWords = extractedWords.filter(w => !w.isDuplicate);
    if (nonDuplicateWords.length > 0) {
      try {
        const generateResponse = await axios.post(
          '/api/words/generate-flashcards',
          nonDuplicateWords.map(w => w.front),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const flashcardsWithDefinitions = generateResponse.data.flashcards as Flashcard[];
        extractedWords = extractedWords.map(word => ({
          ...word,
          selected: true,
          back: word.isDuplicate ? '(duplicate - will show existing definition)' : 
                flashcardsWithDefinitions.find((f: Flashcard) => f.front === word.front)?.back || ''
        }));
      } catch (err) {
        setError('Failed to generate definitions');
      }
    }
    
    setWords(extractedWords);
    setImportStep('preview');
  };

  const handleDuplicatesSelection = () => {
    const newSelectionState = !areDuplicatesSelected;
    setAreDuplicatesSelected(newSelectionState);
    setWords(words.map(word => ({
      ...word,
      selected: word.isDuplicate ? newSelectionState : word.selected
    })));
  };

  const toggleWordSelection = (index: number) => {
    setWords(words.map((word, i) => 
      i === index ? { ...word, selected: !word.selected } : word
    ));
  };

  const addNewWord = () => {
    setWords([...words, { front: '', back: '', isDuplicate: false, selected: true }]);
  };

  const updateWord = (index: number, field: 'front' | 'back', value: string) => {
    setWords(words.map((word, i) => 
      i === index ? { ...word, [field]: value } : word
    ));
  };

  const handleImport = async () => {
    if (!selectedLanguage) {
      setError('Please select a target language');
      return;
    }

    const selectedWords = words.filter(w => w.selected && w.front.trim());
    if (selectedWords.length === 0) {
      setError('Please select at least one word to import');
      return;
    }
    
    setImporting(true);
    setError(null);
    
    try {
      // Import the words directly since definitions are already generated
      const importResponse = await axios.post(
        `/api/words/import?language_id=${selectedLanguage}`, 
        {
          words: selectedWords.map(w => ({
            front: w.front,
            back: w.back
          })),
          catalog_ids: selectedCatalogs
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const event = new CustomEvent('wordImportSuccess', {
        detail: { count: selectedWords.length }
      });
      window.dispatchEvent(event);
      
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
          <div className="preview-section space-y-8">
            {/* Section 1: Language Selection */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                1. Select Learning Language
              </h3>
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Review Words */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  2. Review Words
                </h3>
                {words.some(w => w.isDuplicate) && (
                  <button
                    onClick={handleDuplicatesSelection}
                    className="px-4 py-2 text-sm text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    {areDuplicatesSelected ? 'Deselect' : 'Select'} All Duplicates
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Front</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Back</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {words.map((word, index) => (
                      <tr key={index} className={word.isDuplicate ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={word.selected}
                            onChange={() => toggleWordSelection(index)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={word.front}
                            onChange={(e) => updateWord(index, 'front', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={word.back || ''}
                            onChange={(e) => updateWord(index, 'back', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Will be generated if left empty"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {word.isDuplicate ? (
                            <HiExclamationTriangle className="text-yellow-500 h-5 w-5" />
                          ) : (
                            <HiCheckCircle className="text-green-500 h-5 w-5" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addNewWord}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <HiPlusCircle className="mr-2 h-5 w-5" />
                Add Word
              </button>
            </div>

            {/* Section 3: Select Categories */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                3. Select Categories (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {catalogs.map((catalog) => (
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
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => setImportStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : 'Import Selected Words'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportWords;