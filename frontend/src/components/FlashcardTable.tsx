import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { Flashcard } from '../types';

export function FlashcardTable(): JSX.Element {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/flashcards/all');
      if (Array.isArray(response.data)) {
        setFlashcards(response.data);
      } else if (Array.isArray(response.data.flashcards)) {
        setFlashcards(response.data.flashcards);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flashcards';
      setError(errorMessage);
      console.error('Error fetching flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete the selected flashcards?')) return;

    try {
      await axios.post('/api/flashcards/delete', {
        flashcardIds: Array.from(selectedCards)
      });
      
      await fetchFlashcards();
      setSelectedCards(new Set());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete flashcards';
      setError(errorMessage);
    }
  };

  const toggleCardSelection = (id: string) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCards(newSelection);
  };

  const displayedFlashcards = flashcards ? (showOnlyOwned 
    ? flashcards.filter(card => card.isOwner)
    : flashcards) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowOnlyOwned(!showOnlyOwned)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showOnlyOwned 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showOnlyOwned ? 'Show All Cards' : 'Show My Cards Only'}
          </button>
          {selectedCards.size > 0 && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Front</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Back</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedFlashcards.map((card) => (
              <tr key={card.id} className={selectedCards.has(card.id) ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={() => toggleCardSelection(card.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{card.front}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{card.back}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{card.authorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{card.language?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
}
