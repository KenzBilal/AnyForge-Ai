import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileInput, Braces, Zap, Globe, Image as ImageIcon, Webhook, Box, FastForward, Activity } from 'lucide-react';

export default function Landing() {
  const [typedText, setTypedText] = useState('');
  const fullText = `Hey team, just a heads up about the upcoming Web3 Hackathon. It's happening this weekend, starting on October 25th at 9 AM. We can only fit about 150 hackers in the venue, so make sure to get there early. Let's build something awesome!`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  const fadeInUp: any = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="bg-[#09090B] min-h-screen text-gray-200 font-sans selection:bg-[#8B5CF6]/30 selection:text-white">
      {/* Background Animated Grid & Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 animate-pulse-slow" />
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#8B5CF6]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-[#4338CA]/20 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pb-40">
        
        {/* 1. HERO SECTION */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col items-center text-center mt-12 mb-32"
        >
          <motion.div variants={fadeInUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[10px] md:text-xs font-mono text-[#8B5CF6] tracking-wide shadow-[0_0_15px_rgba(139,92,246,0.15)] text-center break-words max-w-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]"></span>
              </span>
              Powered by Groq & Llama 3.3 — Blistering Fast Inference ⚡
            </span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 mb-6 drop-shadow-sm max-w-4xl"
            style={{ lineHeight: 1.1 }}
          >
            Extract Anything into <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]">Perfect JSON.</span> Instantly.
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-base md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed px-2"
          >
            Stop writing brittle Regex and manual parsers. Feed AnyForge-AI any unstructured text, email, PDF, or image, and get deterministic, perfectly structured data back in milliseconds.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 mb-24 w-full sm:w-auto px-4 sm:px-0">
            <Link to="/playground" className="group relative w-full sm:w-auto px-8 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-bold transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_45px_rgba(139,92,246,0.5)] active:scale-95 text-base md:text-lg flex items-center justify-center">
              Try the Playground
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/docs" className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 border border-white/10 rounded-xl font-bold transition-all active:scale-95 text-base md:text-lg flex items-center justify-center">
              Read the Docs
            </Link>
          </motion.div>

          {/* Code Editor Interactive Preview */}
          <motion.div variants={fadeInUp} className="w-full max-w-5xl glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] to-transparent opacity-20 pointer-events-none" />
            <div className="bg-[#1A1A1A] px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="mx-auto text-xs font-mono text-gray-500 tracking-wider">extraction_pipeline.py</div>
            </div>
            <div className="grid md:grid-cols-2 text-left font-mono text-[13px] md:text-sm">
              <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 min-h-[200px] md:min-h-[250px] relative">
                <div className="text-gray-500 mb-4 select-none"># 1. Messy Input Data</div>
                <div className="text-gray-300 leading-relaxed text-xs md:text-sm">
                  {typedText}
                  <span className="inline-block w-2 h-4 bg-[#8B5CF6] animate-pulse ml-1 align-middle" />
                </div>
              </div>
              <div className="p-6 bg-[#09090B] min-h-[250px] relative">
                <div className="text-gray-500 mb-4 select-none"># 2. Perfect JSON Output</div>
                <AnimatePresence>
                  {typedText === fullText && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-gray-300 whitespace-pre-wrap"
                    >
                      <span className="text-[#8B5CF6]">{`{`}</span>{`\n`}
                      {`  `}<span className="text-[#6366F1]">"title"</span>{`: `}<span className="text-emerald-400">"Web3 Hackathon"</span>{`,\n`}
                      {`  `}<span className="text-[#6366F1]">"start_date"</span>{`: `}<span className="text-emerald-400">"2025-10-25T09:00:00Z"</span>{`,\n`}
                      {`  `}<span className="text-[#6366F1]">"max_attendees"</span>{`: `}<span className="text-amber-400">150</span>{`\n`}
                      <span className="text-[#8B5CF6]">{`}`}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* 2. HOW IT WORKS */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          className="mb-32 max-w-5xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">The Magic Behind It</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Three simple steps to transform chaos into structured certainty.</p>
          </motion.div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
            {/* Dashed line connecting steps (desktop) */}
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-white/10 z-0" />
            
            <StepCard 
              icon={<FileInput className="w-8 h-8 text-[#8B5CF6]" />}
              step="Step 1: Ingest"
              description="Send us raw text, forward an email, or upload a photo."
              delay={0}
            />
            <StepCard 
              icon={<Braces className="w-8 h-8 text-indigo-400" />}
              step="Step 2: Define Schema"
              description="Pass a plain-text schema or JSON structure. You define the rules, we enforce them."
              delay={0.2}
            />
            <StepCard 
              icon={<Zap className="w-8 h-8 text-emerald-400" />}
              step="Step 3: Extract"
              description="Our stateless inference engine returns 100% valid JSON, every single time."
              delay={0.4}
            />
          </div>
        </motion.section>

        {/* 3. CAPABILITIES BENTO BOX */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-32"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Unrivaled Flexibility</h2>
            <p className="text-gray-400 max-w-xl mx-auto">One API to handle every data extraction edge case imaginable.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Card A (Large) */}
            <motion.div variants={fadeInUp} className="md:col-span-2 glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-[#8B5CF6]/30 transition-all duration-300">
              <div className="absolute right-0 bottom-0 w-[300px] h-[300px] bg-[#8B5CF6]/10 blur-[80px] group-hover:bg-[#8B5CF6]/20 transition-all duration-500 rounded-full" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                  <FileInput className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Universal Text Extraction</h3>
                  <p className="text-gray-400 max-w-md">From Chinese shipping manifests to messy Reddit posts about new referral earning apps—extract the exact data you need (like app names and sign-up bonuses) without breaking a sweat.</p>
                </div>
              </div>
            </motion.div>

            {/* Card B (Medium) */}
            <motion.div variants={fadeInUp} className="md:col-span-1 glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-[#6366F1]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#6366F1]/10 blur-[60px] group-hover:bg-[#6366F1]/20 transition-all duration-500 rounded-full" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                  <ImageIcon className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Vision & Image Parsing</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Powered by Llama 4 Scout. Snap a photo of a budget receipt or a handwritten note, and get structured line items back.</p>
                </div>
              </div>
            </motion.div>

            {/* Card C (Medium) */}
            <motion.div variants={fadeInUp} className="md:col-span-1 glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-emerald-500/10 blur-[60px] group-hover:bg-emerald-500/20 transition-all duration-500 rounded-full" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Web Grounding</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Live internet access. Ask for the sentiment of today's live crypto news, and the AI will search the web to score the market impact before returning your JSON.</p>
                </div>
              </div>
            </motion.div>

            {/* Card D (Small-ish relative to grid) */}
            <motion.div variants={fadeInUp} className="md:col-span-2 glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-[#EC4899]/30 transition-all duration-300">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-[#EC4899]/10 blur-[60px] group-hover:bg-[#EC4899]/20 transition-all duration-500 rounded-full" />
              <div className="relative z-10 flex flex-col h-full justify-between md:flex-row md:items-end">
                <div className="mb-6 md:mb-0 max-w-sm">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                    <Webhook className="w-6 h-6 text-[#EC4899]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Webhook Native</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Map inbound email addresses directly to your API keys for asynchronous processing.</p>
                </div>
                {/* Visual snippet for async */}
                <div className="bg-[#09090B] border border-white/10 rounded-xl p-4 font-mono text-[10px] sm:text-xs text-gray-400 shadow-xl self-start md:self-auto w-full md:w-auto overflow-x-auto">
                  <span className="text-[#8B5CF6]">POST</span> /api/v1/generate/async <br/>
                  <span className="text-white">{"{"}</span> <br/>
                  &nbsp;&nbsp;<span className="text-[#6366F1]">"webhook_url"</span>: <span className="text-emerald-400">"https://..."</span><br/>
                  <span className="text-white">{"}"}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* 4. BUILT FOR SCALE */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-32 max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built for Scale</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Enterprise-grade architecture that plays nice with your pipelines.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp} className="text-center sm:text-left flex flex-col items-center sm:items-start group">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-[#8B5CF6]/40 transition-colors">
                <Box className="w-7 h-7 text-[#8B5CF6]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Stateless & Scalable</h3>
              <p className="text-gray-400 leading-relaxed">Zero memory bloat. Deploy horizontally across thousands of containers.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="text-center sm:text-left flex flex-col items-center sm:items-start group">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-[#6366F1]/40 transition-colors">
                <FastForward className="w-7 h-7 text-[#6366F1]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sub-Second Latency</h3>
              <p className="text-gray-400 leading-relaxed">Routing through LPUs ensures your data pipelines never bottleneck.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="text-center sm:text-left flex flex-col items-center sm:items-start group sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-emerald-400/40 transition-colors">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Complete Audit Trail</h3>
              <p className="text-gray-400 leading-relaxed">Every extraction is logged with input, output, and latency metrics for total observability.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* 5. FOOTER CTA */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="w-full relative overflow-hidden rounded-3xl"
        >
          {/* Cosmic CTA background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#09090B] via-[#1A103C] to-[#09090B] z-0" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-screen pointer-events-none" />
          <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[200%] bg-[#8B5CF6]/20 blur-[100px] pointer-events-none rounded-full transform rotate-12" />
          
          <div className="relative z-10 p-12 md:p-20 flex flex-col items-center text-center border border-white/10 rounded-3xl shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-md">
              Ready to retire your parsers?
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-light">
              Get your API key in seconds and build robust pipelines that scale.
            </p>
            <Link to="/dashboard" className="group relative w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-white text-[#09090B] rounded-xl font-bold transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] active:scale-95 text-base sm:text-lg flex items-center justify-center hover:bg-gray-100 uppercase tracking-widest text-center">
              Start Extracting Free
              <svg className="w-5 h-5 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

// Subcomponent for Step 2 "How It Works"
function StepCard({ icon, step, description, delay }: { icon: React.ReactNode, step: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center text-center z-10 w-full max-w-xs group"
    >
      <div className="w-20 h-20 rounded-2xl glass-panel bg-black/60 flex items-center justify-center border border-white/10 shadow-xl mb-6 relative group-hover:-translate-y-2 transition-transform duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{step}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
