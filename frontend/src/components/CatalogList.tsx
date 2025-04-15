import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, Plus } from 'lucide-react';
import axios from '../config/axios';

interface Catalog {
  id: number;
  name: string;
  description?: string;
  visibility: string;
  created_at: string;
}

export function CatalogList() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const response = await axios.get('/api/catalogs/owned');
        setCatalogs(response.data);
      } catch (err) {
        setError('Failed to load catalogs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
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
                <div className="flex items-center text-sm text-gray-500">
                  <Book className="w-4 h-4 mr-1" />
                  <span>{catalog.visibility}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                to={`/catalogs/${catalog.id}`}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}

        {catalogs.length === 0 && !error && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Book className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No catalogs</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new catalog.</p>
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
    </div>
  );
}