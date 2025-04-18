import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
}

export function DashboardCard({ title, value, subtitle, icon, onClick }: DashboardCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="text-indigo-600">{icon}</div>
        <div className="ml-5">
          <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
          <div className="text-xl font-medium text-gray-500">{title}</div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export type { DashboardCardProps };