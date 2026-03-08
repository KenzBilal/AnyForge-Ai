import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Plus, Activity, StopCircle, RefreshCw, Trash2, CheckCircle2, Play } from 'lucide-react';
import { toast } from 'sonner';
import AdminLogin from '../components/AdminLogin';
import { api } from '../lib/api';

// Types mimicking the backend response structure
type Client = {
  id: string;
  project_name: string;
  api_key: string;
  is_active: boolean;
  rate_limit_per_min: number;
  daily_limit: number;
  created_at: string;
  total_extractions: number;
  extractions_today: number;
  last_used_at: string | null;
};

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Fetch clients if adminKey is set
  const fetchClients = async (key: string) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/clients', {
        headers: { 'x-admin-key': key }
      });
      setClients(res.data.clients);
      setAdminKey(key);
      toast.success("Authentication successful");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid Admin Key");
      setAdminKey(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchClients(adminKey);
    }
  }, [adminKey]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey || !newProjectName) return;
    try {
      const res = await api.post('/admin/clients', {
        project_name: newProjectName,
        rate_limit_per_min: 20,
        daily_limit: 500
      }, {
        headers: { 'x-admin-key': adminKey }
      });
      setClients([res.data.client, ...clients]);
      setNewProjectName('');
      setIsCreating(false);
      toast.success("New Project API Key Generated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create client");
    }
  };

  const handleToggleActive = async (clientId: string, currentStatus: boolean) => {
    if (!adminKey) return;
    try {
      await api.patch(`/admin/clients/${clientId}`, {
        is_active: !currentStatus
      }, {
        headers: { 'x-admin-key': adminKey }
      });
      setClients(clients.map(c => c.id === clientId ? { ...c, is_active: !currentStatus} : c));
      toast.success(`Client ${!currentStatus ? 'Activated' : 'Suspended'}`);
    } catch (err: any) {
      toast.error("Failed to toggle status");
    }
  };

  const handleRotateKey = async (clientId: string) => {
    if (!adminKey) return;
    if (!window.confirm("Are you sure you want to rotate this key? The old key will stop working immediately.")) return;
    try {
      const res = await api.post(`/admin/clients/${clientId}/rotate-key`, {}, {
        headers: { 'x-admin-key': adminKey }
      });
      setClients(clients.map(c => c.id === clientId ? { ...c, api_key: res.data.new_api_key} : c));
      toast.success("API Key rotated successfully");
    } catch (err: any) {
      toast.error("Failed to rotate key");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!adminKey) return;
    if (!window.confirm("Irreversible action: Delete this client completely?")) return;
    try {
      await api.delete(`/admin/clients/${clientId}`, {
        headers: { 'x-admin-key': adminKey }
      });
      setClients(clients.filter(c => c.id !== clientId));
      toast.success("Client deleted");
    } catch (err: any) {
      toast.error("Failed to delete client");
    }
  };

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <AdminLogin onLogin={fetchClients} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-gray-200 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#8B5CF6]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#10B981]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-[#8B5CF6]" />
              <h1 className="text-3xl font-bold text-white tracking-tight">System Control Panel</h1>
            </div>
            <p className="text-gray-400">Master view. Manage all client API keys, quotas, and global usage telemetry.</p>
          </div>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New API Key
          </button>
        </div>

        {/* Global Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 bg-black/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#8B5CF6]/5 blur-3xl rounded-full" />
            <div className="text-gray-400 font-medium text-sm mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#8B5CF6]" /> Total Active Keys
            </div>
            <div className="text-4xl font-extrabold text-white">
              {clients.filter(c => c.is_active).length}
            </div>
          </div>
          <div className="glass-panel border border-white/10 rounded-2xl p-6 bg-black/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#10B981]/5 blur-3xl rounded-full" />
            <div className="text-gray-400 font-medium text-sm mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#10B981]" /> Extractions Today
            </div>
            <div className="text-4xl font-extrabold text-white">
              {clients.reduce((acc, c) => acc + (c.extractions_today || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="glass-panel border border-white/10 rounded-2xl p-6 bg-black/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
            <div className="text-gray-400 font-medium text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" /> Platform Total
            </div>
            <div className="text-4xl font-extrabold text-white">
              {clients.reduce((acc, c) => acc + (c.total_extractions || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Create Client Modal */}
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-[#121214] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]" />
                <h2 className="text-2xl font-bold text-white mb-2">Generate API Key</h2>
                <p className="text-gray-400 text-sm mb-6">Create a new dedicated project token.</p>
                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                    <input 
                      type="text" required autoFocus
                      value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors"
                      placeholder="e.g. Acme Corp internal"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium transition-colors">Generate</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clients Table */}
        <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  <th className="py-4 px-6 font-medium text-gray-400 text-sm uppercase tracking-wider">Project / API Key</th>
                  <th className="py-4 px-6 font-medium text-gray-400 text-sm uppercase tracking-wider">Usage & Quotas</th>
                  <th className="py-4 px-6 font-medium text-gray-400 text-sm uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-medium text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && clients.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-500">Loading telemetrics...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-500">No projects found. Create one.</td></tr>
                ) : (
                  clients.map(client => (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white mb-1">{client.project_name}</div>
                        <div className="font-mono text-xs text-gray-500 flex items-center gap-2 group cursor-pointer"
                             onClick={() => {
                               navigator.clipboard.writeText(client.api_key);
                               toast.success("API Key copied manually");
                             }}
                        >
                          <span className="blur-[4px] group-hover:blur-none transition-all duration-300 selection:bg-[#8B5CF6]/30">
                            {client.api_key}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                          <span className="font-medium">{client.extractions_today || 0}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-gray-500">{client.daily_limit} today</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.rate_limit_per_min} req/min limit
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {client.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <button 
                            onClick={() => handleToggleActive(client.id, client.is_active)}
                            className="p-2 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title={client.is_active ? "Suspend Key" : "Activate Key"}
                          >
                            {client.is_active ? <StopCircle className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />}
                          </button>
                          <button 
                            onClick={() => handleRotateKey(client.id)}
                            className="p-2 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-colors"
                            title="Rotate API Key"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
