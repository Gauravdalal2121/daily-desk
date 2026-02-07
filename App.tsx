import React, { useState, useEffect, useMemo } from 'react';
import { Todo, Theme, Priority, View, ChecklistItem, AICommandResult, Recurrence } from './types';
import TodoItem from './components/TodoItem';
import AddTodo from './components/AddTodo';
import ThemeToggle from './components/ThemeToggle';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ImportSchedule from './components/ImportSchedule';
import ReminderModal from './components/ReminderModal';
import EditTodoModal from './components/EditTodoModal';
import { generateDailyBriefing } from './services/geminiService';
import { CheckSquare, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'dailydesk_tasks';
const THEME_KEY = 'dailydesk_theme';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
          ...t,
          priority: t.priority || 'medium',
          dueDate: t.dueDate || Date.now(),
          checklist: t.checklist || [],
          isTimeSet: t.isTimeSet || false,
          recurrence: t.recurrence || 'none'
        }));
      }
      return [];
    } catch (e) {
      console.error("Failed to load tasks", e);
      return [];
    }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [currentView, setCurrentView] = useState<View>('today');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  
  // Modals & Popups
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<Todo | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  
  // Conflict State
  const [conflictTask, setConflictTask] = useState<{newItem: AICommandResult, existingItem: Todo} | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // --- Alarm System ---
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      todos.forEach(todo => {
        if (!todo.completed && todo.isTimeSet) {
          // Check if due within the last minute (to avoid spamming but catch it)
          const due = new Date(todo.dueDate);
          const current = new Date(now);
          
          if (
            due.getFullYear() === current.getFullYear() &&
            due.getMonth() === current.getMonth() &&
            due.getDate() === current.getDate() &&
            due.getHours() === current.getHours() &&
            due.getMinutes() === current.getMinutes() &&
            current.getSeconds() < 10 // Only trigger in first 10s of minute
          ) {
            // Avoid duplicate alerts for the same minute interaction usually handled by checking a 'lastAlerted' timestamp
            // For simplicity here we just check if it's already active.
            if (!activeReminder || activeReminder.id !== todo.id) {
                setActiveReminder(todo);
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, [todos, activeReminder]);


  // --- Logic ---

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addTodo = (text: string, priority: Priority = 'medium', dueDate: number = Date.now(), checklist: ChecklistItem[] = [], isTimeSet: boolean = false, recurrence: Recurrence = 'none') => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
      dueDate,
      priority,
      checklist,
      isTimeSet,
      recurrence
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleAIResults = (results: AICommandResult[]) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    // Process results sequentially to handle conflicts
    results.forEach(item => {
      if (item.action === 'update' && item.originalId) {
        // Handle Update
        const target = todos.find(t => t.id === item.originalId);
        if (target) {
           let newDueDate = target.dueDate;
           let newIsTimeSet = target.isTimeSet;

           if (item.suggestedTime) {
              const d = new Date(target.dueDate); // Use existing date
              const [h, m] = item.suggestedTime.split(':');
              d.setHours(parseInt(h), parseInt(m));
              newDueDate = d.getTime();
              newIsTimeSet = true;
           }

           // Check conflict for Update (simplified)
           const conflict = todos.find(t => t.id !== target.id && t.isTimeSet && Math.abs(t.dueDate - newDueDate) < 30 * 60 * 1000);
           
           if (conflict && newIsTimeSet) {
             // For simplicity in update, force update 
           }

           updateTodo(target.id, {
             text: item.text || target.text, 
             dueDate: newDueDate,
             isTimeSet: newIsTimeSet,
             priority: item.priority
             // We generally preserve existing checklist on update unless explicitly requested to change, 
             // but AI updates usually don't send checklist for simple rescheduling.
           });
        }
      } else {
        // Handle Create
        const d = new Date(today);
        d.setDate(d.getDate() + (item.dueDateOffset || 0));
        let isTimeSet = false;
        
        if (item.suggestedTime) {
          const [hours, minutes] = item.suggestedTime.split(':');
          d.setHours(parseInt(hours), parseInt(minutes));
          isTimeSet = true;
        } else {
          d.setHours(23, 59, 0, 0); 
        }

        // Check Conflict
        const conflict = todos.find(t => !t.completed && t.isTimeSet && Math.abs(t.dueDate - d.getTime()) < 30 * 60 * 1000);

        if (conflict && isTimeSet) {
            setConflictTask({ newItem: item, existingItem: conflict });
            return; // Halt logic for this item
        }

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text: item.text,
            completed: false,
            createdAt: Date.now(),
            dueDate: d.getTime(),
            priority: item.priority,
            checklist: item.checklist.map(c => ({ id: crypto.randomUUID(), text: c, completed: false })),
            isTimeSet,
            recurrence: 'none' // AI imports usually don't set recurrence automatically, default to none
        };
        setTodos(prev => [newTodo, ...prev]);
      }
    });
  };

  const resolveConflict = (resolution: 'replace' | 'keep' | 'auto') => {
    if (!conflictTask) return;
    
    if (resolution === 'replace') {
        // 1. Shift old task
        const oldTime = new Date(conflictTask.existingItem.dueDate);
        oldTime.setHours(oldTime.getHours() + 1); // Bump 1 hour
        updateTodo(conflictTask.existingItem.id, { dueDate: oldTime.getTime() });

        // 2. Add new task
        const d = new Date(conflictTask.existingItem.dueDate); // Original collision time
        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text: conflictTask.newItem.text,
            completed: false,
            createdAt: Date.now(),
            dueDate: d.getTime(),
            priority: conflictTask.newItem.priority,
            checklist: conflictTask.newItem.checklist.map(c => ({ id: crypto.randomUUID(), text: c, completed: false })),
            isTimeSet: true,
            recurrence: 'none'
        };
        setTodos(prev => [newTodo, ...prev]);

    } else if (resolution === 'auto') {
        // Find next free slot (simple logic: +2 hours from collision)
        const d = new Date(conflictTask.existingItem.dueDate);
        d.setHours(d.getHours() + 2);
        
        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text: conflictTask.newItem.text,
            completed: false,
            createdAt: Date.now(),
            dueDate: d.getTime(),
            priority: conflictTask.newItem.priority,
            checklist: conflictTask.newItem.checklist.map(c => ({ id: crypto.randomUUID(), text: c, completed: false })),
            isTimeSet: true,
            recurrence: 'none'
        };
        setTodos(prev => [newTodo, ...prev]);
    }

    setConflictTask(null);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => {
        const todo = prev.find(t => t.id === id);
        if (!todo) return prev;
        
        const isCompleting = !todo.completed;
        const updatedTodos = prev.map(t => t.id === id ? { ...t, completed: isCompleting } : t);
        
        // Handle Recurrence spawning
        if (isCompleting && todo.recurrence && todo.recurrence !== 'none') {
            const nextDate = new Date(todo.dueDate);
            if (todo.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            if (todo.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            if (todo.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            
            // Generate fresh checklist items
            const freshChecklist = todo.checklist?.map(item => ({
                ...item,
                id: crypto.randomUUID(),
                completed: false
            })) || [];

            const nextTodo: Todo = {
                ...todo,
                id: crypto.randomUUID(),
                completed: false,
                createdAt: Date.now(),
                dueDate: nextDate.getTime(),
                checklist: freshChecklist
                // Recurrence preserves
            };
            
            return [nextTodo, ...updatedTodos];
        }
        
        return updatedTodos;
    });
  };

  const toggleChecklistItem = (todoId: string, itemId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id !== todoId || !todo.checklist) return todo;
      return {
        ...todo,
        checklist: todo.checklist.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      };
    }));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleGetBriefing = async () => {
    setLoadingBriefing(true);
    const advice = await generateDailyBriefing(todos.filter(t => !t.completed));
    setBriefing(advice);
    setLoadingBriefing(false);
  };

  // --- Filtering Logic ---
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = (dateNum: number) => {
    const d = new Date(dateNum);
    d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  };
  const isOverdue = (dateNum: number) => {
    const d = new Date(dateNum);
    d.setHours(0,0,0,0);
    return d.getTime() < today.getTime();
  };

  const todayTodos = useMemo(() => {
    return todos.filter(t => (isToday(t.dueDate) || isOverdue(t.dueDate)) && !t.completed)
                .sort((a, b) => {
                   const pW = { high: 3, medium: 2, low: 1 };
                   if (pW[a.priority] !== pW[b.priority]) return pW[b.priority] - pW[a.priority];
                   if (a.isTimeSet && b.isTimeSet) return a.dueDate - b.dueDate;
                   return 0;
                });
  }, [todos]);
  
  const criticalTodos = useMemo(() => todayTodos.filter(t => t.priority === 'high'), [todayTodos]);
  const normalTodos = useMemo(() => todayTodos.filter(t => t.priority !== 'high'), [todayTodos]);

  const calendarGroups = useMemo(() => {
    const overdue = todos.filter(t => isOverdue(t.dueDate) && !t.completed);
    const todayList = todos.filter(t => isToday(t.dueDate)).sort((a,b) => a.dueDate - b.dueDate);
    const tomorrowList = todos.filter(t => {
      const d = new Date(t.dueDate);
      d.setHours(0,0,0,0);
      return d.getTime() === tomorrow.getTime();
    }).sort((a,b) => a.dueDate - b.dueDate);
    const upcoming = todos.filter(t => {
      const d = new Date(t.dueDate);
      d.setHours(0,0,0,0);
      return d.getTime() > tomorrow.getTime();
    }).sort((a,b) => a.dueDate - b.dueDate);
    const completedList = todos.filter(t => t.completed);

    return { overdue, todayList, tomorrowList, upcoming, completedList };
  }, [todos]);

  // --- Render Views ---
  const renderTodoList = (list: Todo[]) => (
    list.map(todo => (
        <TodoItem 
            key={todo.id} 
            todo={todo} 
            onToggle={toggleTodo} 
            onDelete={deleteTodo} 
            onEdit={setEditingTodo}
            onToggleChecklist={toggleChecklistItem} 
        />
    ))
  );

  const renderTodayView = () => (
    <div className="animate-fadeIn">
      {/* AI Briefing Card */}
      <div className="mb-6 bg-gradient-to-r from-teal-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Strategic Briefing
            </h2>
            <button 
               onClick={handleGetBriefing}
               disabled={loadingBriefing}
               className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition backdrop-blur-sm"
            >
              {loadingBriefing ? <Loader2 className="w-3 h-3 animate-spin" /> : (briefing ? "Refresh" : "Generate")}
            </button>
          </div>
          <p className="text-sm text-teal-50 leading-relaxed">
            {briefing || "Tap 'Generate' to get an AI analysis of your day based on your current task load."}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      <AddTodo onAdd={addTodo} onOpenImport={() => setIsImportOpen(true)} />

      {criticalTodos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 px-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
            Critical Focus ({criticalTodos.length})
          </h3>
          <div className="space-y-1">
            {renderTodoList(criticalTodos)}
          </div>
        </div>
      )}

      <div>
         {criticalTodos.length > 0 && normalTodos.length > 0 && (
             <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Routine Tasks</h3>
         )}
        <div className="space-y-1">
          {normalTodos.length === 0 && criticalTodos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No active tasks for today.</p>
              <button onClick={() => setCurrentView('calendar')} className="text-primary-600 text-sm font-medium mt-2">View Calendar</button>
            </div>
          ) : (
            renderTodoList(normalTodos)
          )}
        </div>
      </div>
    </div>
  );

  const renderCalendarView = () => (
    <div className="space-y-6 pb-20 animate-fadeIn">
      <AddTodo onAdd={addTodo} onOpenImport={() => setIsImportOpen(true)} />
      
      {calendarGroups.overdue.length > 0 && (
        <section>
           <h3 className="text-sm font-bold text-red-500 mb-2 px-1">Overdue</h3>
           {renderTodoList(calendarGroups.overdue)}
        </section>
      )}

      <section>
         <h3 className="text-sm font-bold text-primary-600 mb-2 px-1">Today</h3>
         {calendarGroups.todayList.length === 0 ? (
           <p className="text-xs text-gray-400 italic px-2 mb-2">Nothing scheduled.</p>
         ) : (
           renderTodoList(calendarGroups.todayList)
         )}
      </section>

      <section>
         <h3 className="text-sm font-bold text-gray-500 mb-2 px-1">Tomorrow</h3>
         {calendarGroups.tomorrowList.length === 0 ? (
           <p className="text-xs text-gray-400 italic px-2 mb-2">Nothing scheduled.</p>
         ) : (
           renderTodoList(calendarGroups.tomorrowList)
         )}
      </section>

      {calendarGroups.upcoming.length > 0 && (
        <section>
           <h3 className="text-sm font-bold text-gray-500 mb-2 px-1">Upcoming</h3>
           {renderTodoList(calendarGroups.upcoming)}
        </section>
      )}

      {calendarGroups.completedList.length > 0 && (
        <section className="opacity-60">
           <h3 className="text-sm font-bold text-gray-400 mb-2 px-1">Completed History</h3>
           {renderTodoList(calendarGroups.completedList)}
        </section>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark min-h-screen sm:shadow-xl sm:my-8 sm:min-h-[850px] sm:rounded-[32px] overflow-hidden flex flex-col relative transition-colors duration-300 border border-gray-100 dark:border-gray-800">
        
        {/* AppBar */}
        <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 z-20 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm transition-colors duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                Daily Desk
              </h1>
              <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest">
                {currentView === 'today' ? "Today's Plan" : currentView === 'calendar' ? 'Master Schedule' : 'Business Insights'}
              </span>
            </div>
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pb-28 overflow-y-auto no-scrollbar">
          {currentView === 'today' && renderTodayView()}
          {currentView === 'calendar' && renderCalendarView()}
          {currentView === 'insights' && <Dashboard todos={todos} />}
        </main>

        <ImportSchedule 
          isOpen={isImportOpen} 
          onClose={() => setIsImportOpen(false)} 
          onImport={handleAIResults} 
          currentTodos={todos}
        />

        <BottomNav currentView={currentView} setView={setCurrentView} />

        {/* --- GLOBAL MODALS --- */}
        
        {/* 1. Alarm/Reminder Popup */}
        <ReminderModal 
            todo={activeReminder} 
            onDismiss={() => setActiveReminder(null)} 
            onComplete={toggleTodo} 
        />

        {/* 2. Manual Edit Modal */}
        <EditTodoModal 
            todo={editingTodo}
            isOpen={!!editingTodo}
            onClose={() => setEditingTodo(null)}
            onSave={updateTodo}
            onDelete={deleteTodo}
        />

        {/* 3. Conflict Resolution Modal */}
        {conflictTask && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl border-2 border-orange-500">
                    <div className="flex items-center text-orange-600 mb-4">
                        <AlertTriangle className="w-6 h-6 mr-2" />
                        <h3 className="font-bold text-lg">Schedule Conflict</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        This time slot is already allocated to: <br/>
                        <span className="font-bold">"{conflictTask.existingItem.text}"</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        You are trying to add: <br/>
                        <span className="font-bold">"{conflictTask.newItem.text}"</span>
                    </p>

                    <div className="space-y-2">
                        <button 
                            onClick={() => resolveConflict('replace')}
                            className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold rounded-xl hover:bg-red-200 transition"
                        >
                            Prioritize New Task (Shift Old +1hr)
                        </button>
                        <button 
                            onClick={() => resolveConflict('auto')}
                            className="w-full py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-xl hover:bg-blue-200 transition"
                        >
                            Find Next Free Slot for New Task
                        </button>
                        <button 
                            onClick={() => setConflictTask(null)}
                            className="w-full py-2 text-gray-500 font-medium hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;