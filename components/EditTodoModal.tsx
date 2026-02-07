import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Todo, Priority, Recurrence } from '../types';

interface EditTodoModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

const EditTodoModal: React.FC<EditTodoModalProps> = ({ todo, isOpen, onClose, onSave, onDelete }) => {
  const [text, setText] = useState(todo?.text || '');
  const [priority, setPriority] = useState<Priority>(todo?.priority || 'medium');
  const [recurrence, setRecurrence] = useState<Recurrence>(todo?.recurrence || 'none');
  
  // Format existing date/time for inputs
  const d = todo ? new Date(todo.dueDate) : new Date();
  const [dateStr, setDateStr] = useState(d.toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState(todo?.isTimeSet ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '');

  React.useEffect(() => {
    if (todo) {
        setText(todo.text);
        setPriority(todo.priority);
        setRecurrence(todo.recurrence || 'none');
        const dt = new Date(todo.dueDate);
        setDateStr(dt.toISOString().split('T')[0]);
        setTimeStr(todo.isTimeSet ? dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '');
    }
  }, [todo]);

  if (!isOpen || !todo) return null;

  const handleSave = () => {
    const newDate = new Date(dateStr);
    let isTimeSet = false;
    
    if (timeStr) {
        const [h, m] = timeStr.split(':');
        newDate.setHours(parseInt(h), parseInt(m));
        isTimeSet = true;
    } else {
        newDate.setHours(23, 59, 0, 0);
    }

    onSave(todo.id, {
        text,
        priority,
        dueDate: newDate.getTime(),
        isTimeSet,
        recurrence
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white">Edit Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-4 space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Task Name</label>
                <input 
                    type="text" 
                    value={text} 
                    onChange={e => setText(e.target.value)}
                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                <div className="flex gap-2 mt-1">
                    {(['high', 'medium', 'low'] as Priority[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPriority(p)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${
                                priority === p 
                                ? 'bg-primary-600 text-white shadow-md' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                    <input 
                        type="date" 
                        value={dateStr}
                        onChange={e => setDateStr(e.target.value)}
                        className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Time (Optional)</label>
                    <input 
                        type="time" 
                        value={timeStr}
                        onChange={e => setTimeStr(e.target.value)}
                        className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Recurrence</label>
                <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-surface-darkVariant/20 flex justify-between rounded-b-2xl">
            <button 
                onClick={() => { onDelete(todo.id); onClose(); }}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <button 
                onClick={handleSave}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary-500/30 flex items-center"
            >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditTodoModal;