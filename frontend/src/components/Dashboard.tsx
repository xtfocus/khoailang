import React from 'react';
import { Brain, Target, Zap, Calendar } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { useAuth } from '../contexts/AuthContext';
import type { UserStats } from '../types';

const mockStats: UserStats = {
  totalCards: 120,
  cardsToReview: 15,
  averageLevel: 3.5,
  streak: 7
};

export function Dashboard() {
  const { userProfile } = useAuth();
  const displayName = userProfile?.username || userProfile?.email.split('@')[0] || 'User';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {displayName}!</h1>
        <p className="mt-2 text-gray-600">Here's your learning progress today</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Cards"
          value={mockStats.totalCards}
          icon={<Brain className="w-6 h-6" />}
        />
        <DashboardCard
          title="Due for Review"
          value={mockStats.cardsToReview}
          icon={<Calendar className="w-6 h-6" />}
        />
        <DashboardCard
          title="Average Level"
          value={mockStats.averageLevel.toFixed(1)}
          icon={<Target className="w-6 h-6" />}
        />
        <DashboardCard
          title="Day Streak"
          value={mockStats.streak}
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