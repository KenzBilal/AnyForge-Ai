import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import AdminLogin from '../components/AdminLogin';

function formatDistanceToNow(dateStr: string) {
  if (!dateStr) return 'Never';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const timeDiff = new Date(dateStr).getTime() - new Date().getTime();
  const daysDifference = Math.round(timeDiff / (1000 * 60 * 60 * 24));
  if (daysDifference === 0) {
    const hours = Math.round(timeDiff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.round(timeDiff / (1000 * 60));
      if (minutes === 0) return 'Just now';
      return rtf.format(minutes, 'minute');
    }
    return rtf.format(hours, 'hour');
  }
  return rtf.format(daysDifference, 'day');
}

interface LogRecord {
  id: string;
  endpoint_used: string;
  success: boolean;
  error_message: string;
  target_schema: string;
  input_snippet: string;
  output_json: Record<string, unknown>;
  created_at: string;
  clients?: { project_name: string };
}

export default function HistoryPage() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('af_admin_key') || '');
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogRecord | null>(null);

  const handleLogin = (key: string) => {
    localStorage.setItem('af_admin_key', key);
    setAdminKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('af_admin_key');
    setAdminKey('');
  };

  useEffect(() => {
    if (!adminKey) return;
    async function fetchHistory() {
      // Note: Ideally, if this uses Supabase RLS, you'd set the Auth context via supabase.auth.
      // For this isolated admin view, we just rely on Supabase permissions.
      const { data, error } = await supabase
        .from('extraction_logs')
        .select('*, clients!inner(project_name)')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    }
    fetchHistory();
  }, [adminKey]);

  if (!adminKey) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Extraction History</h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-400">View recent requests across all API keys directly from the database.</p>
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 underline">Lock Session</button>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading history...</div>
        ) : (
          <table className="w-full text-left relative text-sm">
            <thead className="bg-[#0F0F0F] border-b border-[#2A2A2A] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-300">Project</th>
                <th className="px-6 py-4 font-semibold text-gray-300">Endpoint</th>
                <th className="px-6 py-4 font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-300">Schema Preview</th>
                <th className="px-6 py-4 font-semibold text-gray-300">Time</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-[#2A2A2A]/40 transition-colors">
                  <td className="px-6 py-3 font-medium text-white">
                    {log.clients?.project_name || 'Unknown Project'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-[#2A2A2A] text-gray-300 px-2 py-1 rounded text-xs font-mono">
                      {log.endpoint_used}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {log.success ? (
                      <div className="flex items-center text-[#10B981]">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Success
                      </div>
                    ) : (
                      <div className="flex items-center text-[#EF4444]" title={log.error_message}>
                        <XCircle className="w-4 h-4 mr-1" /> Failed
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-400 font-mono text-xs truncate max-w-[200px]">
                    {log.target_schema?.substring(0, 50)}...
                  </td>
                  <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 opacity-50" />
                      {formatDistanceToNow(log.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="text-[#8B5CF6] hover:text-[#C4B5FD] font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No history logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm shadow-xl flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#0F0F0F]">
              <h2 className="text-lg font-bold text-white flex items-center">
                Log Details <span className="text-gray-500 text-sm ml-4 font-normal">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </h2>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">Close X</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Endpoint</h3>
                  <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3 font-mono text-sm text-[#8B5CF6]">
                    {selectedLog.endpoint_used}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
                  <div className={`border rounded-lg p-3 text-sm font-medium ${selectedLog.success ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'}`}>
                    {selectedLog.success ? 'Success' : `Failed: ${selectedLog.error_message || 'Unknown Error'}`}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Target Schema</h3>
                <pre className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                  {selectedLog.target_schema}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Input Snippet</h3>
                <pre className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.input_snippet || '(None)'}
                </pre>
              </div>

              {selectedLog.success && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">JSON Output</h3>
                  <pre className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/30 rounded-lg p-4 font-mono text-sm text-gray-200 overflow-x-auto shadow-inner">
                    {JSON.stringify(selectedLog.output_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
