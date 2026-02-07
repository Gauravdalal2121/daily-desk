import React, { useState, useCallback } from 'react';
import { Plus, Wand2, Loader2, Calendar, FileInput, Clock, Repeat } from 'lucide-react';
import { analyzeTaskWithAI } from '../services/geminiService';
import { Priority, ChecklistItem, Recurrence } from '../types';

interface AddTodoProps {
  onAdd: (text: string, priority: Priority, dueDate: number, checklist?: ChecklistItem[], isTimeSet?: boolean, recurrence?: Recurrence) => void;
  onOpenImport: () => void;
}

const AddTodo: React.FC<AddTodoProps> = ({ onAdd, onOpenImport }) => {
  const [text, setText] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      let dueDate = new Date(dateStr);
      let isTimeSet = false;

      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        dueDate.setHours(parseInt(hours), parseInt(minutes));
        isTimeSet = true;
      } else {
        dueDate.setHours(23, 59, 0, 0); 
      }

      onAdd(text.trim(), 'medium', dueDate.getTime(), [], isTimeSet, recurrence); 
      setText('');
      setTimeStr('');
      setRecurrence('none');
    }
  };

  const cycleRecurrence = () => {
    const modes: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];
    const idx = modes.indexOf(recurrence);
    setRecurrence(modes[(idx + 1) % modes.length]);
  };

  const getRecurrenceLabel = () => {
    switch (recurrence) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return '';
    }
  };

  const handleMagicAdd = useCallback(async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    
    // Get analysis from Gemini
    const { checklist, priority, suggestedTime } = await analyzeTaskWithAI(text.trim());
    
    let finalTimeStr = timeStr;
    if (suggestedTime && !timeStr) {
        finalTimeStr = suggestedTime;
        setTimeStr(suggestedTime); // visual feedback
    }

    let dueDate = new Date(dateStr);
    let isTimeSet = false;
    
    if (finalTimeStr) {
        const [hours, minutes] = finalTimeStr.split(':');
        dueDate.setHours(parseInt(hours), parseInt(minutes));
        isTimeSet = true;
    } else {
        dueDate.setHours(23, 59, 0, 0);
    }
    
    // Create ChecklistItems
    const checklistItems: ChecklistItem[] = checklist.map(item => ({
      id: crypto.randomUUID(),
      text: item,
      completed: false
    }));

    // Add the main task with checklist
    onAdd(text.trim(), priority, dueDate.getTime(), checklistItems, isTimeSet, recurrence);
    
    setText('');
    setTimeStr('');
    setRecurrence('none');
    setIsGenerating(false);
  }, [text, dateStr, timeStr, recurrence, onAdd]);

  return (
    <div className="mb-6 relative z-10">
      <form onSubmit={handleSubmit} className="relative">
        <div 
          className={`
            relative flex items-center bg-surface-variant/50 dark:bg-surface-darkVariant/50 
            rounded-t-xl border-b-2 transition-colors duration-200
            ${isFocused ? 'border-primary-600 bg-surface-variant dark:bg-surface-darkVariant' : 'border-gray-400 dark:border-gray-600'}
          `}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add task..."
            className="w-full pl-4 pr-32 py-4 text-base bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none"
            disabled={isGenerating}
          />
          
          <div className="absolute right-2 flex items-center space-x-1">
             {/* Import Button (Visible when empty) */}
             {!text.trim() && (
               <button
               type="button"
               onClick={onOpenImport}
               className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
               title="Import Schedule"
             >
               <FileInput className="w-5 h-5" />
             </button>
             )}

             {/* Recurrence Button */}
             <div className="relative">
               <button
                 type="button"
                 onClick={cycleRecurrence}
                 className={`p-2 rounded-full transition-colors flex items-center ${
                   recurrence !== 'none' 
                     ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                     : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                 }`}
                 title={`Repeat: ${recurrence}`}
               >
                 <Repeat className="w-5 h-5" />
               </button>
               {recurrence !== 'none' && (
                 <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-blue-600 text-white px-1 rounded-full uppercase">
                   {getRecurrenceLabel().charAt(0)}
                 </span>
               )}
             </div>

            {/* Time Picker */}
            <div className="relative group">
              <input 
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                title="Set time"
              />
              <button 
                type="button" 
                className={`p-2 rounded-full transition-colors ${timeStr ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>

            {/* Date Picker */}
            <div className="relative group">
              <input 
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                title="Set due date"
              />
              <button 
                type="button" 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>

            {/* AI Magic Button */}
            {text.trim().length > 3 && (
               <button
               type="button"
               onClick={handleMagicAdd}
               disabled={isGenerating}
               className="p-2 rounded-full text-purple-600 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
               title="AI Analyze & Prioritize"
             >
               {isGenerating ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <Wand2 className="w-5 h-5" />
               )}
             </button>
            )}

            {/* Add Button */}
            <button
              type="submit"
              disabled={!text.trim() || isGenerating}
              className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </form>
      {isGenerating && (
        <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium animate-pulse">
            Analyzing requirements...
          </span>
        </div>
      )}
    </div>
  );
};

export default AddTodo;