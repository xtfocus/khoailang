import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Share2, ArrowLeft } from 'lucide-react';
import axios from '../config/axios';

interface CatalogFlashcard {
  id: string;
  front: string;
  back: string;
  language: string;
}

interface Catalog {
  id: number;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  created_at: string;
  flashcards: CatalogFlashcard[];
  is_owner: boolean;
  owner: {
    username: string;
    email: string;
  };
  target_language: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (emails: string[]) => void;
  catalogName: string;
}

const ShareModal = ({ isOpen, onClose, onShare, catalogName }: ShareModalProps) => {
  const [emails, setEmails] = useState('');
  const [error, setError] = useState('');

  const handleShare = () => {
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
        <h3 className="text-lg font-semibold mb-4">Share "{catalogName}"</h3>
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

export function CatalogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await axios.get(`/api/catalogs/${id}`);
        setCatalog(response.data);
      } catch (err) {
        setError('Failed to load catalog');
      }
    };
    fetchCatalog();
  }, [id]);

  const toggleVisibility = async () => {
    if (!catalog) return;
    
    try {
      setIsLoading(true);
      const newVisibility = catalog.visibility === 'public' ? 'private' : 'public';
      
      await axios.patch(`/api/catalogs/${catalog.id}/visibility`, {
        visibility: newVisibility
      });

      setCatalog({
        ...catalog,
        visibility: newVisibility
      });

      // Trigger notification
      const event = new CustomEvent('catalogVisibilityChanged', {
        detail: { message: `Catalog visibility changed to ${newVisibility}` }
      });
      window.dispatchEvent(event);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update visibility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (emails: string[]) => {
    if (!catalog) return;

    try {
      await axios.post('/api/catalogs/share', {
        catalogId: catalog.id,
        emails
      });

      // Trigger notification
      const event = new CustomEvent('catalogShared', {
        detail: { message: `Catalog "${catalog.name}" shared successfully` }
      });
      window.dispatchEvent(event);

      setShareModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to share catalog');
    }
  };

  if (!catalog && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/catalogs')}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Catalogs
      </button>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : catalog && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{catalog.name}</h1>
                {catalog.description && (
                  <p className="text-gray-600 mb-2">{catalog.description}</p>
                )}
                <p className="text-gray-600 mb-2">Language: {catalog.target_language}</p>
                <div className="flex items-center space-x-4 mb-2">
                  <div className={`flex items-center px-2 py-1 rounded text-sm ${
                    catalog.visibility === 'public'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {catalog.visibility === 'public' ? (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Private
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Created by {catalog.owner.username || catalog.owner.email.split('@')[0]}
                  </div>
                </div>
              </div>
              {catalog.is_owner && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleVisibility}
                    disabled={isLoading}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      catalog.visibility === 'public'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {catalog.visibility === 'public' ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Make Public
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center px-4 py-2 text-indigo-600 hover:text-indigo-800"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Flashcards</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Translation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {catalog.flashcards.map((flashcard) => (
                    <tr key={flashcard.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{flashcard.front}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{flashcard.back}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {catalog?.is_owner && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onShare={handleShare}
          catalogName={catalog.name}
        />
      )}
    </div>
  );
}