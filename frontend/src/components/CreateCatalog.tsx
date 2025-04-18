import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiExclamationTriangle } from 'react-icons/hi2';
import axios from '../config/axios';
import type { AxiosError } from '../config/axios';
import { Language, Flashcard } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface ApiError {
  detail: string;
}

export function CreateCatalog(): JSX.Element {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<number | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [availableFlashcards, setAvailableFlashcards] = useState<Flashcard[]>([]);
  const [selectedFlashcards, setSelectedFlashcards] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const fetchLanguages = async (): Promise<void> => {
      try {
        const response = await axios.get('/api/words/languages');
        setLanguages(response.data.languages);
        setError(null);
      } catch (err) {
        setError('Failed to load languages');
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (!targetLanguage) {
      setAvailableFlashcards([]);
      return;
    }
    const fetchFlashcards = async (): Promise<void> => {
      try {
        const response = await axios.get(`/api/catalogs/accessible-flashcards/${targetLanguage}`);
        setAvailableFlashcards(response.data);
        setSelectedFlashcards([]);
        setError(null);
      } catch (err) {
        setError('Failed to load flashcards');
      }
    };
    fetchFlashcards();
  }, [targetLanguage]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a catalog name');
      return;
    }
    if (!targetLanguage) {
      setError('Please select a target language');
      return;
    }
    if (selectedFlashcards.length === 0) {
      setError('Please select at least one flashcard');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/catalogs/create', {
        name: name.trim(),
        description: description.trim(),
        target_language_id: targetLanguage,
        flashcard_ids: selectedFlashcards,
        visibility: isPublic ? 'public' : 'private'
      });

      if (response.data.notification) {
        const event = new CustomEvent('catalogCreated', {
          detail: { message: response.data.notification.message }
        });
        window.dispatchEvent(event);
      }

      navigate('/catalogs');
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (typeof errorDetail === 'string' && errorDetail.includes('Duplicate words found:')) {
          setError('Duplicate words detected. Please deselect one of the duplicates: ' + errorDetail);
        } else {
          setError(String(errorDetail));
        }
      } else {
        setError('Failed to create catalog');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlashcardSelect = (flashcardId: string) => {
    setSelectedFlashcards(prev => {
      const isSelected = prev.includes(flashcardId);
      if (isSelected) {
        return prev.filter(id => id !== flashcardId);
      } else {
        return [...prev, flashcardId];
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create New Catalog</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Catalog Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter catalog name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter catalog description"
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Target Language
              </label>
              <select
                id="language"
                value={targetLanguage || ''}
                onChange={(e) => setTargetLanguage(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isPublic 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isPublic ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Public
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Private
              </>
            )}
          </button>
          <span className="text-sm text-gray-600">
            {isPublic 
              ? 'Anyone can view this catalog'
              : 'Only you and people you share with can view this catalog'
            }
          </span>
        </div>

        {targetLanguage && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select Flashcards</h2>
            </div>

            <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableFlashcards.map((flashcard) => (
                    <tr key={flashcard.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFlashcards.includes(flashcard.id)}
                          onChange={() => handleFlashcardSelect(flashcard.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{flashcard.front}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{flashcard.back}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Selected: {selectedFlashcards.length} flashcards
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <HiExclamationTriangle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/catalogs')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Catalog'}
          </button>
        </div>
      </form>
    </div>
  );
}
