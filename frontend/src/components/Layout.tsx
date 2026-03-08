import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, PlayCircle, Settings, History, BookOpen, Menu, Search, ChevronRight, LogOut } from 'lucide-react';
import CmdK from './CmdK';
import { Toaster } from 'sonner';

export default function Layout() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  const links = [
    { name: 'Playground', path: '/playground', icon: PlayCircle },
    { name: 'Dashboard', path: '/dashboard', icon: Settings },
    { name: 'History', path: '/history', icon: History },
    { name: 'Docs', path: '/docs', icon: BookOpen },
  ];

  // Dynamic Breadcrumbs based on location
  const pathParts = location.pathname.split('/').filter(Boolean);
  const routeName = pathParts.length > 0 
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) 
    : 'Home';

  return (
    <div className="flex h-screen w-full bg-[#09090B] text-gray-200 overflow-hidden font-sans">
      <Toaster theme="dark" position="bottom-right" className="!bg-[#09090B] !border-white/10" toastOptions={{
        style: {
          background: '#09090B',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ededed',
        }
      }} />
      <CmdK isOpen={isCmdOpen} setIsOpen={setIsCmdOpen} />

      {/* Animated Collapsible Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 260 }}
        className="flex flex-col h-full bg-[#09090B] border-r border-white/5 relative z-20"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 bg-primary/10 p-2 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-bold tracking-wide text-white whitespace-nowrap"
                >
                  AnyForge
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className="relative group flex items-center"
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center px-3 py-2.5 w-full rounded-lg transition-colors ${
                  !isActive && 'hover:bg-white/5 text-gray-400 hover:text-white'
                } ${isActive ? 'text-white' : ''}`}>
                  <link.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  
                  <AnimatePresence>
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="ml-3 font-medium whitespace-nowrap overflow-hidden text-sm"
                      >
                        {link.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5 flex flex-col items-center">
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-5 w-5" />
            {!isSidebarCollapsed && <span className="ml-2 text-sm">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090B]">
        {/* Floating Top Nav (Vercel Style) */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center text-sm">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">kenzbilal</Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-600" />
            <span className="text-gray-100 font-medium">{routeName}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsCmdOpen(true)}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 rounded-md transition-all glow-hover"
            >
              <Search className="w-3.5 h-3.5 mr-2" />
              Search...
              <span className="ml-4 font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
            </button>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-400 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 rounded-md transition-all group"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" />
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute top-[-250px] left-[50%] translate-x-[-50%] w-[600px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
