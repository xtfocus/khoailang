import { useState, useEffect } from 'react';
import { Library, Book, Share2, CircleEllipsis, Plus } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';

interface UserStats {
  totalCards: number;
  ownedCards: number;
  sharedCards: number;
  cardsToReview: number;
  averageLevel: number;
  streak: number;
  totalCatalogs: number;
  ownedCatalogs: number;
  sharedCatalogs: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [collectionCount, setCollectionCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchCollectionCount();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/flashcards/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCollectionCount = async () => {
    try {
      const response = await axios.get('/api/flashcards/collection/count');
      setCollectionCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch collection count:', error);
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-4">
          <Link
            to="/import"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Flashcards
          </Link>
          <Link
            to="/catalogs/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Catalog
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Cards"
          value={collectionCount}
          subtitle="Cards in your collection"
          icon={<Library className="w-8 h-8" />}
          onClick={() => navigate('/flashcards/collection')}
        />
        <DashboardCard
          title="Due for Review"
          value={stats.cardsToReview}
          subtitle="Cards to review today"
          icon={<CircleEllipsis className="w-8 h-8" />}
        />
        <DashboardCard
          title="Average Level"
          value={Math.round(stats.averageLevel)}
          subtitle="Memory strength"
          icon={<Book className="w-8 h-8" />}
        />
        <DashboardCard
          title="Catalogs"
          value={stats.ownedCatalogs}
          subtitle="Created by you"
          icon={<Book className="w-8 h-8" />}
          onClick={() => navigate('/catalogs')}
        />
        <DashboardCard
          title="Shared Catalogs"
          value={stats.sharedCatalogs}
          subtitle="Shared with you"
          icon={<Share2 className="w-8 h-8" />}
          onClick={() => navigate('/catalogs')}
        />
      </div>
    </div>
  );
}
