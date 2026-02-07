import React from 'react';
import { Calendar, CheckSquare, BarChart2 } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-around items-center z-30 md:absolute md:rounded-b-[32px]">
      <button
        onClick={() => setView('today')}
        className={`flex flex-col items-center p-2 transition-colors ${
          currentView === 'today' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <CheckSquare className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Today</span>
      </button>
      
      <button
        onClick={() => setView('calendar')}
        className={`flex flex-col items-center p-2 transition-colors ${
          currentView === 'calendar' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <Calendar className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">All Days</span>
      </button>

      <button
        onClick={() => setView('insights')}
        className={`flex flex-col items-center p-2 transition-colors ${
          currentView === 'insights' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <BarChart2 className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Insights</span>
      </button>
    </div>
  );
};

export default BottomNav;