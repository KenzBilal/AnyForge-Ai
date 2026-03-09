import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Server, Key, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export default function SecurityPolicies() {
  const policies = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data ingested by AnyForge is encrypted in transit using TLS 1.3 and at rest using AES-256.",
      color: "from-blue-500 to-cyan-400"
    },
    {
      icon: Eye,
      title: "Zero-Knowledge Architecture",
      description: "We cannot read your raw document data. Once extraction is complete, data is instantly purged unless you explicitly opt-in to logging.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Database,
      title: "Data Residency & Compliance",
      description: "Our infrastructure is SOC2 Type II, GDPR, and HIPAA compliant. Data is securely processed in regional AWS data centers.",
      color: "from-emerald-400 to-teal-500"
    },
    {
      icon: Key,
      title: "Granular Access Control",
      description: "Manage extraction APIs with strict Rate Limits and IP restrictions. Keys can be instantly rotated or revoked.",
      color: "from-orange-400 to-red-500"
    }
  ];

  const details = [
    "Strict Role-Based Access Control (RBAC) enforced at the database level.",
    "Automated vulnerability scanning across all dependencies and Docker images.",
    "Regular penetration testing conducted by independent third-party firms.",
    "Comprehensive audit logging for all administrative actions and API access.",
    "Mandatory Multi-Factor Authentication (MFA) for all internal employees.",
    "Incident response team on standby 24/7/365."
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#09090B] relative overflow-hidden flex flex-col items-center">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[60%] h-[40%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto px-6 py-16 relative z-10 flex flex-col gap-12">
        {/* Header Section */}
        <div className="text-center flex flex-col items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.2)] backdrop-blur-md relative"
          >
            <Shield className="w-10 h-10 text-white" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-2xl opacity-50 mix-blend-overlay" />
          </motion.div>
          
          <div className="space-y-4 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-white"
            >
              Enterprise-Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Security</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-400 leading-relaxed"
            >
              At AnyForge, we treat your unstructured data with the highest level of confidentiality and integrity. Our platform is built from the ground up to exceed enterprise security standards.
            </motion.p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {policies.map((policy, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
              className="group relative bg-[#09090B] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.02] transition-colors overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${policy.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-2xl rounded-bl-full`} />
              
              <div className="flex items-start gap-5 relative z-10">
                <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${policy.color} p-[1px]`}>
                  <div className="w-full h-full bg-[#09090B] rounded-[11px] flex items-center justify-center">
                    <policy.icon className="w-5 h-5 text-white opacity-80" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white tracking-tight">{policy.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {policy.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed List & Certification */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-1 lg:p-1 overflow-hidden"
        >
          <div className="bg-[#121214] rounded-[22px] p-8 md:p-12 w-full h-full flex flex-col md:flex-row gap-12 items-center">
            
            <div className="flex-1 space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                  <Server className="w-3.5 h-3.5" /> Core Infrastructure
                </div>
                <h2 className="text-2xl font-bold text-white">Under the Hood</h2>
                <p className="text-gray-400 text-sm">Rigorous technical controls implemented across our entire stack to ensure continuous safety.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300 leading-relaxed">{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <FileText className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Download ISO/SOC2 Report</h4>
                  <p className="text-xs text-gray-500">Available under NDA for Enterprise clients.</p>
                </div>
                <button className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 group/btn">
                  Request Copy <ChevronRight className="w-4 h-4 text-gray-400 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center pb-8 border-t border-white/5 pt-8"
        >
          <p className="text-sm text-gray-500">
            Have a specific security question or found a vulnerability? Please contact our security team at <a href="mailto:security@anyforge.ai" className="text-primary hover:underline">security@anyforge.ai</a>.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
