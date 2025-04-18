import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Book, Trash2 } from 'lucide-react';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  isOwner: boolean;
  language?: {
    id: number;
    name: string;
  };
  authorName: string;
}

export function CollectionFlashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get('/api/flashcards/collection');
      setFlashcards(response.data);
    } catch (err) {
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const handleToggleCard = (flashcardId: number) => {
    const newSelection = new Set(selectedCards);
    if (selectedCards.has(flashcardId)) {
      newSelection.delete(flashcardId);
    } else {
      newSelection.add(flashcardId);
    }
    setSelectedCards(newSelection);
  };

  const handleDelete = async () => {
    try {
      await axios.post('/api/flashcards/delete', {
        flashcardIds: Array.from(selectedCards)
      });
      await fetchFlashcards();
      setSelectedCards(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete flashcards');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Flashcards</h1>
          {selectedCards.size > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Delete Flashcards</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete these flashcards? This action cannot be undone.
                Note: You can only delete flashcards that you own.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {flashcards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Book className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No flashcards found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't created any flashcards yet. Create some flashcards to see them here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Translation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flashcards.map((flashcard) => (
                  <tr 
                    key={flashcard.id}
                    className={selectedCards.has(flashcard.id) ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4">
                      {flashcard.isOwner && (
                        <input
                          type="checkbox"
                          checked={selectedCards.has(flashcard.id)}
                          onChange={() => handleToggleCard(flashcard.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{flashcard.front}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{flashcard.back}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {flashcard.language?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {flashcard.authorName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}