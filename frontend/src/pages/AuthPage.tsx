import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, Github } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Handle form submission (Email/Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Successfully logged in");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.", { duration: 6000 });
      }
      
      if (isLogin) {
        navigate('/playground');
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/playground`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || `Failed to authenticate with ${provider}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090B] text-gray-200 font-sans selection:bg-[#8B5CF6]/30 selection:text-white overflow-hidden">
      
      {/* 1. LEFT PANEL: The Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-16 lg:px-24 xl:px-32 relative z-10 py-12 lg:py-0">
        
        {/* Ambient Glows for Left Panel */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#8B5CF6]/5 to-transparent pointer-events-none" />
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#8B5CF6]/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative z-10">
          
          {/* Logo & Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >
            <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
              <div className="flex-shrink-0 bg-[#8B5CF6]/10 p-2.5 rounded-xl border border-[#8B5CF6]/20 shadow-[0_0_20px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all">
                <Zap className="h-6 w-6 text-[#8B5CF6]" />
              </div>
              <span className="font-bold tracking-wide text-white text-xl">AnyForge</span>
            </Link>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-header" : "signup-header"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                  {isLogin ? "Welcome back to the Engine." : "Start Extracting."}
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">
                  {isLogin 
                    ? "Sign in to access your keys and manage extractions." 
                    : "Create an account to get your API keys in seconds."}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* OAuth Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="flex flex-col gap-3 mb-8"
          >
            <button 
              onClick={() => handleOAuth('github')}
              className="relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all active:scale-[0.98] group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
            <button 
              onClick={() => handleOAuth('google')}
              className="relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all active:scale-[0.98] group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {/* Custom Google SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </motion.div>

          {/* The Magic Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-form" : "signup-form"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5"
              >
                {/* Email Input */}
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pt-6 text-white text-sm focus:outline-none focus:border-[#8B5CF6]/50 focus:bg-white/[0.07] transition-all ring-1 ring-transparent focus:ring-[#8B5CF6]/20 shadow-inner"
                    placeholder=" "
                  />
                  <label 
                    htmlFor="email" 
                    className={`absolute left-4 text-gray-400 text-sm transition-all duration-200 pointer-events-none
                      ${email ? 'top-2 text-[10px] text-[#8B5CF6] font-semibold tracking-wide uppercase' : 'top-3.5 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#8B5CF6] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:uppercase'}`}
                  >
                    Email Address
                  </label>
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="peer w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pt-6 text-white text-sm focus:outline-none focus:border-[#8B5CF6]/50 focus:bg-white/[0.07] transition-all ring-1 ring-transparent focus:ring-[#8B5CF6]/20 shadow-inner font-mono"
                    placeholder=" "
                  />
                  <label 
                    htmlFor="password" 
                    className={`absolute left-4 text-gray-400 text-sm transition-all duration-200 pointer-events-none
                      ${password ? 'top-2 text-[10px] text-[#8B5CF6] font-semibold tracking-wide uppercase' : 'top-3.5 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#8B5CF6] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:uppercase'}`}
                  >
                    Password
                  </label>
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="mt-2 w-full flex items-center justify-center py-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </motion.button>
          </form>

          {/* Toggle Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isLogin ? "to-signup" : "to-login"}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {isLogin 
                    ? "Don't have an API key? Create an account." 
                    : "Already have an account? Sign in."}
                </motion.span>
              </AnimatePresence>
            </button>
          </motion.div>

        </div>
      </div>

      {/* 2. RIGHT PANEL: The Technical Visualizer (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-[#050508] border-l border-white/5 overflow-hidden">
        
        {/* Deep Indigo Gradient Backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-[#4338CA]/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-[#8B5CF6]/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        {/* Visualizer Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-2xl z-10"
        >
          {/* Glass Terminal Overlay */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6]/30 to-[#4338CA]/30 rounded-2xl blur opacity-30 animate-pulse-slow" />
          
          <div className="relative glass-panel rounded-2xl border border-white/10 shadow-2xl bg-[#09090B]/80 backdrop-blur-xl overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Extraction Feed
              </div>
            </div>

            {/* Terminal Body (Typing Animation) */}
            <TerminalAnimation />
          </div>

          {/* Testimonial / System Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-4"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#10B981]" />
              System Status: All Systems Operational
            </div>
            <div className="text-gray-500 text-sm font-medium">
              Processing <span className="text-white">1.2M</span> extractions today.
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}

// ==== EXTRACTED TERMINAL ANIMATION COMPONENT ==== //
function TerminalAnimation() {
  const [step, setStep] = useState(0); // 0: clear, 1: typing input, 2: processing, 3: rendering json
  const [typedInput, setTypedInput] = useState('');
  
  const rawInput = "Client requested cancellation for subscription sub_12345x. Effective immediately. Reason: budget constraints. - Support Agent John";
  
  // Looping animation logic
  useEffect(() => {
    let timeout: number;
    
    const runCycle = async () => {
      // Step 0: Reset
      setStep(0);
      setTypedInput('');
      
      // Step 1: Type Input Text
      await new Promise(r => setTimeout(r, 500));
      setStep(1);
      for (let i = 0; i <= rawInput.length; i++) {
        setTypedInput(rawInput.substring(0, i));
        await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
      }
      
      // Step 2: Processing state
      await new Promise(r => setTimeout(r, 400));
      setStep(2);
      await new Promise(r => setTimeout(r, 800));
      
      // Step 3: Reveal JSON
      setStep(3);
      await new Promise(r => setTimeout(r, 3000));
      
      // Restart loop
      timeout = setTimeout(runCycle, 500);
    };
    
    runCycle();
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="grid grid-cols-2 min-h-[300px] text-xs sm:text-sm font-mono p-4 gap-4">
      {/* Input Side */}
      <div className="flex flex-col h-full bg-black/30 rounded-lg border border-white/5 p-4 relative">
        <span className="text-gray-500 mb-2">// Raw Data Ingestion</span>
        <div className="text-gray-300">
          {typedInput}
          {step === 1 && <span className="inline-block w-2 h-4 bg-[#8B5CF6] animate-pulse align-middle ml-1" />}
        </div>
        
        {/* Processing Overlay */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center flex-col gap-2 border border-[#8B5CF6]/30"
            >
              <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin" />
              <span className="text-[#8B5CF6] text-xs">Parsing Entities...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Output Side */}
      <div className="flex flex-col h-full bg-[#09090B] rounded-lg border border-white/5 p-4 relative overflow-hidden">
        <span className="text-gray-500 mb-2">// Structured JSON Return</span>
        
        {/* Ambient glow behind JSON */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />

        <AnimatePresence>
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-gray-300 relative z-10 whitespace-pre"
            >
              <span className="text-[#8B5CF6]">{"{"}</span><br/>
              {"  "}<span className="text-[#6366F1]">"action"</span>{": "}<span className="text-emerald-400">"cancellation"</span>{","}<br/>
              {"  "}<span className="text-[#6366F1]">"subscription_id"</span>{": "}<span className="text-emerald-400">"sub_12345x"</span>{","}<br/>
              {"  "}<span className="text-[#6366F1]">"timing"</span>{": "}<span className="text-emerald-400">"immediately"</span>{","}<br/>
              {"  "}<span className="text-[#6366F1]">"reason"</span>{": "}<span className="text-amber-400">"budget constraints"</span>{","}<br/>
              {"  "}<span className="text-[#6366F1]">"agent"</span>{": "}<span className="text-emerald-400">"John"</span><br/>
              <span className="text-[#8B5CF6]">{"}"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
