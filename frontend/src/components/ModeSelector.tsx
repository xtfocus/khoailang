import React from 'react';
import { Brain, BarChart2 } from 'lucide-react';

interface ModeSelectorProps {
  onModeSelect: (mode: 'review' | 'dashboard') => void;
}

export function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto p-6">
      <button
        onClick={() => onModeSelect('review')}
        className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
      >
        <div className="flex flex-col items-center space-y-4">
          <Brain className="w-16 h-16 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Review Cards</h2>
          <p className="text-gray-500 text-center">
            Start a review session to strengthen your memory
          </p>
        </div>
      </button>

      <button
        onClick={() => onModeSelect('dashboard')}
        className="group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
      >
        <div className="flex flex-col items-center space-y-4">
          <BarChart2 className="w-16 h-16 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-center">
            View your progress and manage your cards
          </p>
        </div>
      </button>
    </div>
  );
}