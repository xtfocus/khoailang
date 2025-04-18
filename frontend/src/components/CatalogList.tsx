import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Book, Eye, EyeOff, Share2, GraduationCap } from 'lucide-react';
import axios from '../config/axios';

interface Catalog {
  id: number;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  created_at: string;
  owner: {
    username: string;
    email: string;
  };
  is_owner: boolean;
  target_language?: string;
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

export function CatalogList() {
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/catalogs/accessible');
      setCatalogs(response.data);
    } catch (err) {
      setError('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (catalogId: number, catalogName: string) => {
    setSelectedCatalog({ id: catalogId, name: catalogName } as Catalog);
    setShareModalOpen(true);
  };

  const handleShareSubmit = async (emails: string[]) => {
    if (!selectedCatalog) return;

    try {
      await axios.post('/api/catalogs/share', {
        catalogId: selectedCatalog.id,
        emails
      });

      // Trigger notification
      const event = new CustomEvent('catalogShared', {
        detail: { message: `Catalog "${selectedCatalog.name}" shared successfully` }
      });
      window.dispatchEvent(event);

      setShareModalOpen(false);
      setSelectedCatalog(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to share catalog');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Catalogs</h1>
        <Link
          to="/catalogs/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Catalog
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogs.map((catalog) => (
            <div
              key={catalog.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{catalog.name}</h2>
                  {catalog.description && (
                    <p className="text-gray-600 mb-4">{catalog.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      {catalog.visibility === 'public' ? (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          <span>Private</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span>Created by {catalog.owner.username || catalog.owner.email.split('@')[0]}</span>
                    </div>
                    <div className="flex items-center">
                      <span>Language: {catalog.target_language}</span>
                    </div>
                    {!catalog.is_owner && (
                      <button
                        onClick={() => handleShare(catalog.id, catalog.name)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        <span>Share</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <Link
                  to={`/catalogs/${catalog.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View Details →
                </Link>
                <button
                  onClick={() => navigate(`/catalog/study/${catalog.id}`)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Study Now
                </button>
              </div>
            </div>
          ))}

          {catalogs.length === 0 && !error && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <Book className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No catalogs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new catalog
              </p>
              <div className="mt-6">
                <Link
                  to="/catalogs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Catalog
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedCatalog(null);
        }}
        onShare={handleShareSubmit}
        catalogName={selectedCatalog?.name || ''}
      />
    </div>
  );
}
