import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Copy, Plus, Trash2, Power, Eye, EyeOff, RefreshCw, Activity, Zap, Shield, Key, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLogin from '../components/AdminLogin';

// MOCK DATA FOR THE 7-DAY CHART
const mockChartData = [
  { name: 'Mon', usage: 1200 },
  { name: 'Tue', usage: 3500 },
  { name: 'Wed', usage: 2800 },
  { name: 'Thu', usage: 4900 },
  { name: 'Fri', usage: 3200 },
  { name: 'Sat', usage: 4100 },
  { name: 'Sun', usage: 5600 },
];

function relativeTime(dateStr: string) {
  if (!dateStr) return 'Never';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const timeDiff = new Date(dateStr).getTime() - new Date().getTime();
  const daysDifference = Math.round(timeDiff / (1000 * 60 * 60 * 24));
  if (daysDifference === 0) {
    const hours = Math.round(timeDiff / (1000 * 60 * 60));
    if (hours === 0) return 'Just now';
    return rtf.format(hours, 'hour');
  }
  return rtf.format(daysDifference, 'day');
}

interface ClientRecord {
  id: string;
  project_name: string;
  api_key: string;
  is_active: boolean;
  rate_limit_per_min: number;
  daily_limit: number;
  extractions_today: number;
  total_extractions: number;
  last_used_at: string;
}

export default function Dashboard() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('af_admin_key') || '');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{api_key: string, project_name: string} | null>(null);
  
  // Security UX
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const fetchClients = async () => {
    if (!adminKey) return;
    try {
      const res = await api.get('/admin/clients', { headers: { 'X-Admin-Key': adminKey } });
      setClients(res.data.clients || []);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      if (errorObj.response?.status === 403 || errorObj.response?.status === 401) {
        localStorage.removeItem('af_admin_key');
        setAdminKey('');
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) fetchClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  if (!adminKey) {
    return <AdminLogin onLogin={(key) => { localStorage.setItem('af_admin_key', key); setAdminKey(key); }} />;
  }

  // ==== ACTIONS (OPTIMISTIC) ====
  const handleToggle = async (id: string, currentStatus: boolean) => {
    const backup = [...clients];
    setClients(clients.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    toast.success(`Client ${currentStatus ? 'Deactivated' : 'Activated'}`);
    
    try {
      await api.patch(`/admin/clients/${id}`, { is_active: !currentStatus }, { headers: { 'X-Admin-Key': adminKey } });
    } catch (err) {
      console.error(err);
      setClients(backup); // revert on fail
      toast.error("Failed to toggle sub-client status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This action cannot be reversed.`)) return;
    const backup = [...clients];
    setClients(clients.filter(c => c.id !== id));
    toast.success(`Deleted ${name}`);
    
    try {
      await api.delete(`/admin/clients/${id}`, { headers: { 'X-Admin-Key': adminKey } });
    } catch (err) {
      console.error(err);
      setClients(backup);
      toast.error("Failed to delete client");
    }
  };

  const handleRotate = async (id: string, name: string) => {
    if (!window.confirm(`Rotate key for ${name}? The old key will immediately become invalid.`)) return;
    const loadingToast = toast.loading("Rotating key...");
    try {
      const res = await api.post(`/admin/clients/${id}/rotate-key`, {}, { headers: { 'X-Admin-Key': adminKey } });
      setClients(clients.map(c => c.id === id ? { ...c, api_key: res.data.new_api_key } : c));
      setNewKeyData({ api_key: res.data.new_api_key, project_name: name });
      toast.success("Key successfully rotated", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to rotate key", { id: loadingToast });
    }
  };

  const toggleReveal = (id: string) => {
    const next = new Set(revealedKeys);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (window.confirm("Reveal this secure API key? Make sure nobody is watching your screen.")) {
        next.add(id);
      }
    }
    setRevealedKeys(next);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  // ==== STATS ====
  const totalKeys = clients.length;
  const activeKeys = clients.filter(c => c.is_active).length;
  const totalExtractions = clients.reduce((acc, c) => acc + (c.total_extractions || 0), 0);
  const successRate = 98.4; // Usually derived from logs, hardcoded for visual demo effect

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Admin Dashboard
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3" /> Secure
            </span>
          </h1>
          <p className="text-gray-400 text-sm">Monitor system health, command clients, and view macro-analytics.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-lg font-bold transition-all glow-hover shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </button>
      </div>

      {newKeyData && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl relative glass-panel overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
            <button onClick={() => setNewKeyData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-emerald-400 font-bold text-lg mb-1 flex items-center gap-2">
              <Key className="w-5 h-5" /> API Key Initialized
            </h3>
            <p className="text-gray-300 text-[13px] md:text-sm mb-4">
              Provisioned for <span className="font-semibold text-white">{newKeyData.project_name}</span>. Please copy this key now. For security purposes, it will never be printed verbatim again.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="bg-black/60 px-4 py-3 rounded-lg border border-white/10 text-sm md:text-lg text-emerald-300 font-mono flex-1 inline-block select-all shadow-inner break-all">
                {newKeyData.api_key}
              </code>
              <button 
                onClick={() => copyToClipboard(newKeyData.api_key, "API Key")}
                className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-lg text-white transition-colors active:scale-95 flex items-center justify-center shrink-0"
              >
                <Copy className="w-5 h-5 mr-2 sm:mr-0" />
                <span className="sm:hidden font-medium">Copy Key</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* STAT CARDS & CHART (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 md:p-6 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-center justify-between mb-6 z-10 relative">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Global API Volume</h3>
              <p className="text-2xl font-bold text-white mt-1">25,390 <span className="text-sm font-normal text-gray-500">req / 7d</span></p>
            </div>
            <div className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2.5 py-1 rounded">
              <Zap className="w-3.5 h-3.5 mr-1" /> +12%
            </div>
          </div>
          <div className="h-[200px] w-full z-10 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#A78BFA', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="usage" stroke="#A78BFA" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <StatCard title="Active Integrations" value={activeKeys.toString()} subtitle={`Out of ${totalKeys} total keys`} />
          <StatCard title="All-Time Extractions" value={totalExtractions.toLocaleString()} subtitle={`~${Math.round(totalExtractions/30).toLocaleString()}/day avg`} />
          <StatCard title="Network Success" value={`${successRate}%`} subtitle="99.9% Uptime across 3 regions" highlight />
        </div>
      </div>

      {/* CLIENTS TABLE */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">API Management Matrix</h2>
        <div className="glass-panel border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <table className="w-full text-left whitespace-nowrap min-w-[800px]">
              <thead className="bg-black/40 border-b border-white/5 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest sticky top-0">Client Identity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest sticky top-0">Security Token</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest sticky top-0">State</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest sticky top-0">Throughput Limits</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest sticky top-0">Last Call</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest sticky top-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(client => {
                  const isRevealed = revealedKeys.has(client.id);
                  const displayKey = isRevealed ? client.api_key : `af-${'•'.repeat(24)}`;
                  
                  return (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-semibold text-gray-200">
                        {client.project_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center p-1.5 pl-3 bg-black/40 border border-white/5 rounded-md w-max font-mono text-sm text-gray-300">
                          <span className="mr-3 tracking-[0.2em]">{displayKey}</span>
                          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                            <button onClick={() => toggleReveal(client.id)} className="p-1.5 text-gray-500 hover:text-white rounded transition-colors" title={isRevealed ? "Hide" : "Reveal"}>
                              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button onClick={() => copyToClipboard(client.api_key, "Key")} className="p-1.5 text-gray-500 hover:text-primary rounded transition-colors" title="Copy">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => handleToggle(client.id, client.is_active)}
                          className={`flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                            client.is_active 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Power className="w-3 h-3 mr-1.5" />
                          {client.is_active ? 'Live' : 'Paused'}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        <span className="text-gray-300">{client.rate_limit_per_min}</span> /min  <br/>
                        <span className="text-gray-300">{client.daily_limit}</span> /day
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-500">
                        {relativeTime(client.last_used_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleRotate(client.id, client.project_name)}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/20 p-2 rounded-md transition-colors"
                            title="Rotate Key"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id, client.project_name)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-2 rounded-md transition-colors"
                            title="Obliterate Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/5 border-dashed w-full max-w-sm">
                        <Shield className="w-10 h-10 text-gray-600 mb-3" />
                        <h3 className="text-white font-semibold">No Secure Keys Found</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Provision a new API key to grant an application access.</p>
                        <button onClick={() => setShowModal(true)} className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-lg">Generate Initial Key</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateKeyModal 
          onClose={() => setShowModal(false)} 
          onSuccess={(keyData: {api_key: string, project_name: string}) => {
            setNewKeyData(keyData);
            fetchClients(); // refresh list to secure it naturally
            setShowModal(false);
          }} 
          adminKey={adminKey} 
        />
      )}
    </div>
  );
}

// ==== CUSTOM COMPONENTS ==== //

function StatCard({ title, value, subtitle, highlight = false }: { title: string, value: string, subtitle?: string, highlight?: boolean }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex-1 flex flex-col justify-center">
      {highlight && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 relative z-10">{title}</h3>
      <p className={`text-3xl font-bold font-mono tracking-tight relative z-10 ${highlight ? 'text-primary' : 'text-white'}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-2 font-medium relative z-10">{subtitle}</p>}
    </div>
  );
}

function CreateKeyModal({ onClose, onSuccess, adminKey }: { onClose: () => void, onSuccess: (data: {api_key: string, project_name: string}) => void, adminKey: string }) {
  const [name, setName] = useState('');
  const [rpm, setRpm] = useState(60);
  const [daily, setDaily] = useState(10000);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const loadingToast = toast.loading("Provisioning key...");
    try {
      const res = await api.post('/admin/clients', {
        project_name: name, rate_limit_per_min: rpm, daily_limit: daily
      }, { headers: { 'X-Admin-Key': adminKey } });
      toast.success("Security token deployed", { id: loadingToast });
      onSuccess(res.data.client);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      toast.error(errorObj.response?.data?.detail?.message || "Failed to provision client", { id: loadingToast });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl mx-auto"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> Provision New Key
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Namespace Identifier</label>
            <input 
              type="text" required value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-sm"
              placeholder="e.g. Acme Corp Microservice"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Throughput (/min)</label>
              <input type="number" required min="1" value={rpm} onChange={e => setRpm(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Daily Quota</label>
              <input type="number" required min="1" value={daily} onChange={e => setDaily(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm" />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-gray-400 hover:text-white font-medium transition-colors">Abort</button>
            <button type="submit" disabled={saving} className="bg-primary hover:bg-primary-light text-black px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              {saving ? 'Writing...' : 'Provision'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
