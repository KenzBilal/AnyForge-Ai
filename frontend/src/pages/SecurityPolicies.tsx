import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Cpu, Server, Key, KeyRound, ArrowRight, Zap, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccordionItem = ({ title, children, isOpen, onToggle }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) => {
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
      <button 
        onClick={onToggle}
        className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
      >
        <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 pb-6 pt-2 text-gray-400 leading-relaxed text-sm border-t border-white/5 mx-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SecurityPolicies() {
  const [openPolicy, setOpenPolicy] = useState<number | null>(0);

  const pillars = [
    {
      title: "Stateless Processing (Zero Retention)",
      description: "Your data lives in memory for milliseconds. Once the JSON is extracted via our Groq/Llama 3.3 pipeline, the raw input is instantly vaporized. Optional zero-retention logging available for Enterprise.",
      icon: Zap,
      color: "from-emerald-400/20 to-teal-500/20",
      accent: "text-emerald-400"
    },
    {
      title: "End-to-End Encryption",
      description: "Data in transit is secured via TLS 1.3. Data at rest (metadata and API keys) is encrypted using AES-256 within our Supabase Postgres infrastructure.",
      icon: Lock,
      color: "from-purple-500/20 to-pink-500/20",
      accent: "text-purple-400"
    },
    {
      title: "AI Model Privacy",
      description: "We do not use your proprietary emails, receipts, or text to train our LLMs. Inference is strictly isolated.",
      icon: Cpu,
      color: "from-blue-500/20 to-cyan-400/20",
      accent: "text-blue-400"
    },
    {
      title: "Automated Key Rotation & Auth",
      description: "Cryptographically secure `af-` prefix API keys. Map specific inbound email webhooks to isolated project keys to prevent cross-contamination.",
      icon: KeyRound,
      color: "from-orange-400/20 to-red-500/20",
      accent: "text-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-gray-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-24 customized-scrollbar overflow-x-hidden relative">
      <style>{`
        .customized-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .customized-scrollbar::-webkit-scrollbar-track {
          background: #09090B;
        }
        .customized-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        .customized-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Subtle Glow Overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none opacity-40" />

      <div className="max-w-6xl mx-auto px-6 pt-32 relative z-10 flex flex-col gap-32">
        
        {/* 1. HERO SECTION */}
        <section className="flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 relative"
          >
             <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
             <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border ring-1 ring-white/10 border-emerald-500/30 bg-black/40 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-xs text-emerald-400 font-medium tracking-wide">
                  System Status: Secure & Encrypted
                </span>
             </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 mb-6 drop-shadow-sm max-w-4xl"
            style={{ lineHeight: 1.1 }}
          >
            Zero-Trust Architecture. <br/> Enterprise-Grade Security.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed mb-16"
          >
            AnyForge-AI is engineered to process your most sensitive unstructured data without ever compromising it. We don't read it, we don't train on it, and we don't keep it.
          </motion.p>
        </section>

        {/* 2. CORE SECURITY PILLARS (BENTO GRID) */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Four Pillars of Trust</h2>
            <p className="text-gray-400">Architected for compliance from day one.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-[#09090B] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.02] transition-all duration-300 overflow-hidden ring-1 ring-white/5 hover:ring-primary/30 hover:-translate-y-1 shadow-2xl"
              >
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${pillar.color} rounded-full blur-[60px] group-hover:blur-[80px] transition-all duration-500`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-white/20 transition-colors">
                    <pillar.icon className={`w-6 h-6 ${pillar.accent}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{pillar.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed overflow-hidden">
                     {pillar.description.split(/(`[^`]+`)/).map((part, i) => 
                        part.startsWith('`') && part.endsWith('`') 
                          ? <code key={i} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-gray-300">{part.slice(1, -1)}</code>
                          : <React.Fragment key={i}>{part}</React.Fragment>
                      )}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. DATA FLOW VISUALIZER */}
        <section className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Lifespan of a Data Pipeline</h2>
            <p className="text-gray-400">Watch exactly what happens to your payload.</p>
          </motion.div>

          <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
            <div className="min-w-[800px] glass-panel border border-white/10 rounded-3xl p-10 relative flex items-center justify-between">
              
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-20 right-20 h-[2px] bg-white/5 -translate-y-1/2 z-0 overflow-hidden">
                 <motion.div 
                   initial={{ x: "-10%" }}
                   animate={{ x: "110%" }}
                   transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                   className="w-[100px] h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-[2px]"
                 />
              </div>

              {/* Nodes */}
              <div className="relative z-10 flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-[#09090B] border-2 border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <Server className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center font-mono">
                  <p className="text-white text-sm font-bold">Your App</p>
                  <p className="text-[10px] text-emerald-400 mt-1">TLS 1.3</p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#09090B] border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-center font-mono">
                  <p className="text-white text-sm font-bold">AnyForge API</p>
                  <p className="text-[10px] text-gray-500 mt-1">In-Memory Base64 Processing</p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#09090B] border-2 border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-center font-mono">
                  <p className="text-white text-sm font-bold">LLM Inference</p>
                  <p className="text-[10px] text-gray-500 mt-1">Llama 3.3 (Vaporized post-run)</p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#09090B] border-2 border-blue-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <CheckCircle2 className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center font-mono">
                  <p className="text-white text-sm font-bold">JSON Returned</p>
                  <p className="text-[10px] text-emerald-400 mt-1">Latency {"<"} 1s</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. POLICY DETAILS (ACCORDION) */}
        <section className="max-w-4xl mx-auto w-full">
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">Legal & Compliance</h2>
            <p className="text-gray-400">The explicit terms of our architecture.</p>
          </motion.div>

          <div className="flex flex-col gap-4">
             <AccordionItem 
                title="Data Processing Agreement (DPA)" 
                isOpen={openPolicy === 0} 
                onToggle={() => setOpenPolicy(openPolicy === 0 ? null : 0)}
              >
                <p>Our standard Data Processing Agreement is available for all Enterprise customers. It explicitly outlines our obligations as a data processor, ensuring that any sensitive PII entering the AnyForge network is handled in strict accordance with industry regulations.</p>
                <p className="mt-2">Core tenets include immediate purging of temporary data buffers, non-usage of customer metadata for algorithmic training, and strict notification protocols in the highly unlikely event of a breach.</p>
             </AccordionItem>

             <AccordionItem 
                title="GDPR & CCPA Compliance" 
                isOpen={openPolicy === 1} 
                onToggle={() => setOpenPolicy(openPolicy === 1 ? null : 1)}
              >
                <p>Because AnyForge is essentially a stateless extraction engine, we do not build profiles on your users or retain long-term persistent data unless explicitly requested via logging tools. This inherently limits our attack surface and compliance burden.</p>
                <p className="mt-2">You retain the absolute right to delete your account, which securely drops all associated API credentials and metadata from our Supabase Postgres schema instantly.</p>
             </AccordionItem>

             <AccordionItem 
                title="Vulnerability Reporting (Bug Bounty)" 
                isOpen={openPolicy === 2} 
                onToggle={() => setOpenPolicy(openPolicy === 2 ? null : 2)}
              >
                <p>We believe in the power of the security community. If you have discovered a security vulnerability in the AnyForge API, dashboard, or underlying infrastructure, we appreciate your help in disclosing it directly to <span className="font-mono text-white text-xs bg-white/10 px-1 py-0.5 rounded">security@anyforge.ai</span>.</p>
                <p className="mt-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mt-4">Safe Harbor Applies to Responsible Disclosure.</p>
             </AccordionItem>
             
             <AccordionItem 
                title="Incident Response Plan" 
                isOpen={openPolicy === 3} 
                onToggle={() => setOpenPolicy(openPolicy === 3 ? null : 3)}
              >
                <p>Our infrastructure is constantly monitored using advanced automated observability tools. In the event of an anomalous event, our 24/7 on-call engineers are rotated into a dedicated war room. All incidents are remediated and communicated transparently to affected stakeholders within 24 hours.</p>
             </AccordionItem>
          </div>
        </section>

        {/* 5. FOOTER CTA */}
        <section className="pb-32">
           <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full glass-panel border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden ring-1 ring-white/10"
           >
              <div className="absolute inset-0 bg-gradient-to-t from-[#8B5CF6]/10 to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-4">Ready to build securely?</h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">Generate a cryptographically secure API key and start extracting deterministic JSON from your unstructured payloads immediately.</p>
                <Link to="/dashboard" className="group relative inline-flex items-stretch mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative px-8 py-4 bg-[#09090B] border border-white/10 rounded-xl flex items-center gap-3 active:scale-95 transition-transform group-hover:border-white/20">
                     <Key className="w-5 h-5 text-purple-400" />
                     <span className="font-bold text-white uppercase tracking-wider text-sm">Generate Your Secure API Key</span>
                     <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
           </motion.div>
        </section>

      </div>
    </div>
  );
}
