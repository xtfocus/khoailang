import { useState, useEffect } from 'react';
import { Brain, Target, Zap, Calendar, Plus, Book } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import type { UserStats } from '../types';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const displayName = userProfile?.username || userProfile?.email.split('@')[0] || 'User';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/flashcards/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
          <p className="mt-2 text-gray-600">Here's your learning progress today</p>
        </div>
        <div className="flex gap-4">
          <Link 
            to="/catalogs/create"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Book className="w-5 h-5 mr-2" />
            Create Catalog
          </Link>
          <Link 
            to="/import"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Import Words
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Cards"
          value={stats?.totalCards ?? '-'}
          icon={<Brain className="w-6 h-6" />}
          onClick={() => navigate('/flashcards')}
        />
        <DashboardCard
          title="Due for Review"
          value={stats?.cardsToReview ?? '-'}
          icon={<Calendar className="w-6 h-6" />}
        />
        <DashboardCard
          title="Average Level"
          value={stats?.averageLevel?.toFixed(1) ?? '-'}
          icon={<Target className="w-6 h-6" />}
        />
        <DashboardCard
          title="Day Streak"
          value={stats?.streak ?? '-'}
          icon={<Zap className="w-6 h-6" />}
        />
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Activity chart will be implemented here
        </div>
      </div>
    </div>
  );
}