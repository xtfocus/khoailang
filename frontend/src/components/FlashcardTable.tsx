import { useState, useEffect } from 'react';
import axios from '../config/axios';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  authorName: string;
  language: string;
  isOwner: boolean;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (emails: string[]) => void;
  selectedCards: Flashcard[];
}

const ShareModal = ({ isOpen, onClose, onShare, selectedCards }: ShareModalProps) => {
  const [emails, setEmails] = useState('');
  const [error, setError] = useState('');

  const handleShare = async () => {
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) {
      setError('Please enter at least one email');
      return;
    }
    onShare(emailList);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Share Flashcards</h3>
        <p className="text-sm text-gray-600 mb-4">
          Sharing {selectedCards.length} flashcard(s)
        </p>
        <textarea
          className="w-full p-2 border rounded mb-4"
          placeholder="Enter email addresses (comma-separated)"
          value={emails}
          onChange={(e) => {
            setEmails(e.target.value);
            setError('');
          }}
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export function FlashcardTable() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get('/api/flashcards/all');
      setFlashcards(response.data.flashcards);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (emails: string[]) => {
    try {
      const response = await axios.post('/api/flashcards/share', {
        flashcardIds: Array.from(selectedCards),
        emails
      });

      const { newlyShared, alreadyShared } = response.data.details;

      // Display feedback to the user
      let message = '';
      if (newlyShared.length > 0) {
        message += `Successfully shared ${newlyShared.length} flashcard(s):\n`;
        newlyShared.forEach(item => {
          message += `- Flashcard ID: ${item.flashcardId}, Email: ${item.email}\n`;
        });
      }
      if (alreadyShared.length > 0) {
        message += `\nThe following flashcard(s) were already shared:\n`;
        alreadyShared.forEach(item => {
          message += `- Flashcard ID: ${item.flashcardId}, Email: ${item.email}\n`;
        });
      }

      alert(message);

      // Dispatch notification event
      const event = new CustomEvent('flashcardShareSuccess', {
        detail: { count: newlyShared.length }
      });
      window.dispatchEvent(event);

      setIsShareModalOpen(false);
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Error sharing flashcards:', error);
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the selected flashcards?')) return;

    try {
      await axios.post('/api/flashcards/delete', {
        flashcardIds: Array.from(selectedCards)
      });
      
      await fetchFlashcards(); // Refresh the list
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Error deleting flashcards:', error);
      alert('Failed to delete flashcards');
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

  const displayedFlashcards = showOnlyOwned 
    ? flashcards.filter(card => card.isOwner)
    : flashcards;

  const canShare = Array.from(selectedCards).every(
    id => flashcards.find(card => card.id === id)?.isOwner
  );

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
            <div className="flex space-x-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                disabled={!canShare}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  canShare
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Share
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
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
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{card.language}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShare}
        selectedCards={Array.from(selectedCards).map(id => 
          flashcards.find(card => card.id === id)!
        )}
      />
    </div>
  );
}
