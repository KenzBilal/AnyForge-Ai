import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Settings, History, BookOpen } from 'lucide-react';

interface CmdKProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function CmdK({ isOpen, setIsOpen }: CmdKProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  const actions = [
    { id: 'playground', name: 'Go to Playground', icon: PlayCircle, path: '/playground' },
    { id: 'dashboard', name: 'Go to Dashboard', icon: Settings, path: '/dashboard' },
    { id: 'history', name: 'View History', icon: History, path: '/history' },
    { id: 'docs', name: 'Documentation', icon: BookOpen, path: '/docs' },
  ];

  const filtered = actions.filter((action) =>
    action.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] cmdk-backdrop"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#09090B] border border-white/10 rounded-xl overflow-hidden shadow-2xl glass-panel"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                autoFocus
                placeholder="Type a command or search..."
                className="w-full bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 font-sans text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="text-xs text-gray-500 border border-white/10 px-1.5 py-0.5 rounded ml-3">ESC</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No results found.</div>
              ) : (
                filtered.map((action) => (
                  <button
                    key={action.id}
                    className={`w-full flex items-center px-4 py-3 mt-1 rounded-lg transition-colors text-left hover:bg-white/5 group`}
                    onClick={() => handleSelect(action.path)}
                  >
                    <action.icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-primary transition-colors" />
                    <span className="text-gray-300 group-hover:text-white transition-colors">{action.name}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
