import React from 'react';
import { Car as Card } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}

export function DashboardCard({ title, value, icon }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
      {icon && <div className="text-indigo-600">{icon}</div>}
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}