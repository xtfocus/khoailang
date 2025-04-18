import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Book, Eye, EyeOff, Share2, GraduationCap, Compass, BookmarkPlus, BookmarkMinus, Library } from 'lucide-react';
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
  is_in_collection?: boolean;
}

type ViewType = 'owned' | 'shared' | 'discover' | 'collection';

export function CatalogList() {
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('owned');

  useEffect(() => {
    fetchCatalogs();
  }, [currentView]);

  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      let endpoint;
      switch (currentView) {
        case 'owned':
          endpoint = '/api/catalogs/owned';
          break;
        case 'shared':
          endpoint = '/api/catalogs/shared';
          break;
        case 'discover':
          endpoint = '/api/catalogs/public';
          break;
        case 'collection':
          endpoint = '/api/catalogs/collection';
          break;
        default:
          endpoint = '/api/catalogs/owned';
      }
      const response = await axios.get(endpoint);
      setCatalogs(response.data);
    } catch (err) {
      setError('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (catalogId: number) => {
    try {
      await axios.post(`/api/catalogs/${catalogId}/add-to-collection`);
      // Refresh the list to update the is_in_collection status
      fetchCatalogs();
    } catch (err) {
      setError('Failed to add catalog to collection');
    }
  };

  const handleRemoveFromCollection = async (catalogId: number) => {
    try {
      await axios.delete(`/api/catalogs/${catalogId}/remove-from-collection`);
      // Refresh the list to update the is_in_collection status
      fetchCatalogs();
    } catch (err) {
      setError('Failed to remove catalog from collection');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catalogs</h1>
        <Link
          to="/catalogs/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setCurrentView('owned')}
          className={`p-6 rounded-lg shadow-md ${
            currentView === 'owned'
              ? 'bg-indigo-50 border-2 border-indigo-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <Book className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="text-lg font-semibold">My Catalogs</h3>
            <p className="text-sm text-gray-600 text-center">View catalogs you've created</p>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('collection')}
          className={`p-6 rounded-lg shadow-md ${
            currentView === 'collection'
              ? 'bg-indigo-50 border-2 border-indigo-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <Library className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="text-lg font-semibold">My Collection</h3>
            <p className="text-sm text-gray-600 text-center">View your catalog collection</p>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('shared')}
          className={`p-6 rounded-lg shadow-md ${
            currentView === 'shared'
              ? 'bg-indigo-50 border-2 border-indigo-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <Share2 className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="text-lg font-semibold">Shared With Me</h3>
            <p className="text-sm text-gray-600 text-center">View catalogs shared by others</p>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('discover')}
          className={`p-6 rounded-lg shadow-md ${
            currentView === 'discover'
              ? 'bg-indigo-50 border-2 border-indigo-500'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center">
            <Compass className="w-8 h-8 text-indigo-600 mb-2" />
            <h3 className="text-lg font-semibold">Discover</h3>
            <p className="text-sm text-gray-600 text-center">Explore public catalogs</p>
          </div>
        </button>
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
                  </div>
                </div>
                {!catalog.is_owner && (currentView === 'discover' || currentView === 'collection') && (
                  <button
                    onClick={() => 
                      currentView === 'discover'
                        ? catalog.is_in_collection 
                          ? handleRemoveFromCollection(catalog.id)
                          : handleAddToCollection(catalog.id)
                        : handleRemoveFromCollection(catalog.id)
                    }
                    className={`ml-4 p-2 rounded-full ${
                      catalog.is_in_collection || currentView === 'collection'
                        ? 'text-indigo-600 hover:text-indigo-800'
                        : 'text-gray-400 hover:text-indigo-600'
                    }`}
                    title={catalog.is_in_collection || currentView === 'collection' ? 'Remove from collection' : 'Add to collection'}
                  >
                    {catalog.is_in_collection || currentView === 'collection' ? (
                      <BookmarkMinus className="w-5 h-5" />
                    ) : (
                      <BookmarkPlus className="w-5 h-5" />
                    )}
                  </button>
                )}
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
                {currentView === 'owned' && 'Get started by creating a new catalog'}
                {currentView === 'shared' && 'No catalogs have been shared with you yet'}
                {currentView === 'discover' && 'No public catalogs available to discover'}
                {currentView === 'collection' && 'Your collection is empty'}
              </p>
              {currentView === 'owned' && (
                <div className="mt-6">
                  <Link
                    to="/catalogs/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Catalog
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
