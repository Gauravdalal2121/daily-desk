import React, { useEffect, useRef } from 'react';
import { BellRing, Check, Clock, X } from 'lucide-react';
import { Todo } from '../types';

interface ReminderModalProps {
  todo: Todo | null;
  onDismiss: () => void;
  onComplete: (id: string) => void;
}

// Simple base64 chime sound to avoid external dependencies
const ALARM_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, real implementation uses HTML Audio

const ReminderModal: React.FC<ReminderModalProps> = ({ todo, onDismiss, onComplete }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (todo) {
      // Create a simple oscillator beep since we can't reliably load external mp3s in this environment without user interaction policy issues sometimes
      // But for this request, we'll try to use a standard HTML5 audio approach if user interaction has happened, 
      // or fallback to visual only if blocked. 
      // For the sake of the code snippet, we'll simulate the "Ringtone" setup.
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play failed (user gesture needed):", e));
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [todo]);

  if (!todo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl shadow-2xl border-4 border-red-500 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 animate-pulse-fast"></div>
        
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <BellRing className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
            Task Due Now!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            {todo.text}
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onDismiss}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 transition flex items-center justify-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Snooze
            </button>
            <button 
              onClick={() => {
                onComplete(todo.id);
                onDismiss();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition flex items-center justify-center shadow-lg shadow-primary-500/30"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ReminderModal;