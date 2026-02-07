import React, { useState } from 'react';
import { Upload, X, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { processNaturalLanguageCommand } from '../services/geminiService';
import { AICommandResult, Todo } from '../types';

interface ImportScheduleProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (results: AICommandResult[]) => void;
  currentTodos: Todo[];
}

const ImportSchedule: React.FC<ImportScheduleProps> = ({ isOpen, onClose, onImport, currentTodos }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    // Pass current tasks context to AI
    const results = await processNaturalLanguageCommand(text, currentTodos);
    onImport(results);
    setIsAnalyzing(false);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-surface-light dark:bg-surface-dark">
          <h2 className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
            <MessageSquare className="w-5 h-5 mr-2 text-primary-600" />
            AI Command & Schedule
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You can paste a new schedule, OR ask for changes to your existing one.
            <br/><br/>
            <i>"Import these tasks..."</i><br/>
            <i>"Reschedule the 10am meeting to 2pm..."</i><br/>
            <i>"I have an urgent task for tax filing..."</i>
          </p>
          
          <div className="relative">
            <textarea
              className="w-full h-48 p-4 rounded-xl bg-gray-50 dark:bg-surface-darkVariant/30 border-2 border-dashed border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-0 resize-none text-sm transition-all"
              placeholder="Type your command or schedule here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAnalyzing}
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/60 flex flex-col items-center justify-center rounded-xl backdrop-blur-[2px]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
                <span className="text-sm font-bold text-primary-700 dark:text-primary-300">AI is thinking...</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>
              We check for conflicts automatically. If you reschedule a task to a busy slot, we'll ask you what to do.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-surface-darkVariant/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg mr-3 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleProcess}
            disabled={!text.trim() || isAnalyzing}
            className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isAnalyzing ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSchedule;