import React, { useState } from 'react';
import { Check, Trash2, Calendar, ChevronDown, ChevronUp, Square, CheckSquare, Clock, Bell, Pencil, Repeat } from 'lucide-react';
import { Todo, Priority, ChecklistItem } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (todo: Todo) => void;
  onToggleChecklist?: (todoId: string, itemId: string) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onEdit, onToggleChecklist }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp: number, isTimeSet?: boolean) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    tomorrow.setHours(0,0,0,0);

    let datePart = '';
    if (dateOnly.getTime() === today.getTime()) datePart = 'Today';
    else if (dateOnly.getTime() === tomorrow.getTime()) datePart = 'Tomorrow';
    else datePart = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (isTimeSet) {
      const timePart = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${datePart}, ${timePart}`;
    }

    return datePart;
  };

  const hasChecklist = todo.checklist && todo.checklist.length > 0;
  const completedChecklist = todo.checklist?.filter(i => i.completed).length || 0;
  const totalChecklist = todo.checklist?.length || 0;
  const progress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div
      className={`group flex flex-col p-4 mb-3 rounded-xl transition-all duration-200 border
        ${
          todo.completed
            ? 'bg-surface-variant/30 dark:bg-surface-darkVariant/20 border-transparent'
            : 'bg-white dark:bg-surface-darkVariant/40 shadow-sm hover:shadow-md border-gray-100 dark:border-gray-700'
        }
      `}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <button
            onClick={() => onToggle(todo.id)}
            className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 
              ${
                todo.completed
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-400 dark:border-gray-500 hover:border-primary-500 dark:hover:border-primary-400'
              }
            `}
          >
            {todo.completed && <Check className="w-4 h-4" />}
          </button>
          
          <div className="flex flex-col flex-1 min-w-0 mr-2">
            <span
              className={`text-base font-normal tracking-wide transition-all duration-200 break-words truncate
                ${
                  todo.completed
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-800 dark:text-gray-100'
                }
              `}
            >
              {todo.text}
            </span>
            {!todo.completed && (
              <div className="mt-1 flex items-center space-x-2 flex-wrap gap-y-1">
                <PriorityBadge priority={todo.priority} />
                <span className={`flex items-center text-[11px] font-medium ${todo.isTimeSet ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {todo.isTimeSet ? <Clock className="w-3 h-3 mr-1" /> : <Calendar className="w-3 h-3 mr-1 opacity-70" />}
                  {formatDate(todo.dueDate, todo.isTimeSet)}
                </span>
                
                {todo.recurrence && todo.recurrence !== 'none' && (
                  <span className="flex items-center text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded font-medium ml-1">
                    <Repeat className="w-3 h-3 mr-0.5" />
                    {todo.recurrence.charAt(0).toUpperCase() + todo.recurrence.slice(1)}
                  </span>
                )}

                {todo.isTimeSet && (
                   <span title="Reminder Active" className="text-gray-400 dark:text-gray-500 animate-pulse">
                     <Bell className="w-3 h-3 fill-current opacity-70" />
                   </span>
                )}
                {hasChecklist && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-surface-darkVariant px-1.5 py-0.5 rounded font-medium ml-1">
                    {completedChecklist}/{totalChecklist}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
           {hasChecklist && !todo.completed && (
             <button 
               onClick={() => setIsExpanded(!isExpanded)}
               className="p-1 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
             >
               {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
             </button>
           )}
           {onEdit && !todo.completed && (
               <button 
               onClick={() => onEdit(todo)}
               className="p-2 text-gray-400 hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400 transition-colors"
               title="Edit Task"
             >
               <Pencil className="w-4 h-4" />
             </button>
           )}
          <button
            onClick={() => onDelete(todo.id)}
            className="ml-1 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 shrink-0"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Checklist Section */}
      {hasChecklist && isExpanded && !todo.completed && (
        <div className="mt-3 pl-10 pr-2 animate-fadeIn">
          <div className="mb-2 flex items-center justify-between">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preparation Checklist</span>
             <span className="text-xs text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full mb-3 overflow-hidden">
             <div className="bg-primary-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="space-y-2">
            {todo.checklist!.map(item => (
              <div 
                key={item.id} 
                onClick={() => onToggleChecklist?.(todo.id, item.id)}
                className="flex items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-1 rounded transition-colors"
              >
                <div className={`mt-0.5 mr-2 ${item.completed ? 'text-primary-600' : 'text-gray-300 dark:text-gray-600'}`}>
                  {item.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </div>
                <span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoItem;