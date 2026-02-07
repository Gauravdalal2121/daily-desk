import React from 'react';
import { Todo } from '../types';
import { PieChart, Activity, AlertCircle } from 'lucide-react';

interface DashboardProps {
  todos: Todo[];
}

const Dashboard: React.FC<DashboardProps> = ({ todos }) => {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const highPriority = todos.filter(t => t.priority === 'high' && !t.completed).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-surface-darkVariant/30 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-4">
          <Activity className="w-5 h-5 mr-2 text-primary-600" />
          Productivity Pulse
        </h2>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 dark:text-gray-400">Completion Rate</span>
          <span className="text-2xl font-bold text-primary-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-1000" 
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">{completed} / {total} Tasks Done</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800/30">
          <div className="flex flex-col">
             <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
             <span className="text-3xl font-bold text-red-700 dark:text-red-300">{highPriority}</span>
             <span className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">Critical Pending</span>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex flex-col">
             <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
             <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{total - completed}</span>
             <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">Total Active</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-variant/30 dark:bg-surface-darkVariant/20 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center italic">
          "Efficiency is doing things right; effectiveness is doing the right things."
        </p>
      </div>
    </div>
  );
};

export default Dashboard;