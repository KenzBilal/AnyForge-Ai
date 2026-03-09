import React, { useState, useEffect } from 'react';
import { UploadCloud, X, KeySquare, Sparkles, CheckCircle2, AlertCircle, Play, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function Playground() {
  const [activeTab, setActiveTab] = useState<'text' | 'vision' | 'async'>('text');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('af_api_key') || '');
  
  // Save API key
  useEffect(() => {
    localStorage.setItem('af_api_key', apiKey);
  }, [apiKey]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Playground
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
            V4.0
          </span>
        </h1>
        <p className="text-gray-400">Design schemas, test models, and extract structured JSON instantly.</p>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="flex items-center w-full sm:w-auto">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 shrink-0">
            <KeySquare className="text-gray-400 h-5 w-5" />
          </div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block sm:hidden ml-3">API Authentication</label>
        </div>
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">API Authentication</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="af-..."
            className="w-full max-w-sm bg-black/50 border border-white/10 rounded-md px-3 py-2 sm:py-1.5 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-4 md:mb-6 flex-shrink-0 overflow-x-auto whitespace-nowrap custom-scrollbar">
        {(['text', 'vision', 'async'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative pb-3 px-4 md:px-6 font-medium text-sm transition-colors capitalize shrink-0 ${
              activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab} Extraction
            {activeTab === tab && (
              <motion.div 
                layoutId="playground-tab"
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* LEFT PANEL: Inputs */}
        <div className="flex flex-col lg:h-full lg:overflow-y-auto pr-0 lg:pr-2 space-y-4 md:space-y-6 lg:custom-scrollbar">
          {activeTab === 'text' ? (
            <TextInputs apiKey={apiKey} />
          ) : activeTab === 'vision' ? (
            <VisionInputs apiKey={apiKey} />
          ) : (
            <AsyncInputs apiKey={apiKey} />
          )}
        </div>
        
        {/* Output rendered in children to avoid prop drilling complex state, but we really want a unified Output panel. 
            So we let child handle its own state and render OutputPanel component. */}
      </div>
    </div>
  );
}

// ==== SKELETON LOADER ==== //
function JsonSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-8 h-8 rounded-lg bg-primary/20 mb-4"
      />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }} 
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
            className={`h-4 bg-primary/20 rounded ${i % 2 === 0 ? 'w-24' : 'w-32'}`}
          />
          <motion.div 
            animate={{ opacity: [0.2, 0.4, 0.2] }} 
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
            className={`h-4 bg-white/10 rounded ${i % 3 === 0 ? 'w-1/2' : 'w-full'}`}
          />
        </div>
      ))}
    </div>
  );
}

// ==== EXTRACT BUTTON ==== //
function RunButton({ onClick, loading, disabled }: { onClick: () => void, loading: boolean, disabled: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-full py-3 rounded-lg font-bold transition-all overflow-hidden group ${
        disabled || loading ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
      }`}
    >
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
        <div className="relative h-full w-8 bg-white/20" />
      </div>
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            Extracting...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" fill="currentColor" />
            Run Extraction
          </>
        )}
      </span>
    </button>
  );
}

// ==== TEXT INPUTS ==== //
function TextInputs({ apiKey }: { apiKey: string }) {
  const [prompt, setPrompt] = useState('John Doe recently bought 3 laptops for $1500 each on March 15th from BestBuy.');
  const [schema, setSchema] = useState('{\n  "buyer_name": "string",\n  "item": "string",\n  "quantity": "number",\n  "total_price": "number",\n  "vendor": "string"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<{ code: string, message: string } | null>(null);

  const handleExtract = async () => {
    if (!apiKey) return toast.error("Missing API Key", { description: "Please enter your API key at the top." });
    if (!prompt || !schema) return toast.error("Validation Error", { description: "Prompt and schema are required." });
    
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post('/api/v1/generate', {
        prompt,
        target_schema: schema
      }, {
        headers: { 'X-API-Key': apiKey }
      });
      setResult(res.data.result);
      toast.success("Extraction Complete", { description: "Data successfully converted to JSON." });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      const detail = errorObj.response?.data?.detail;
      if (detail && detail.error) {
        setError({ code: detail.error, message: detail.message });
        toast.error(`Extract Failed: ${detail.error}`);
      } else {
        setError({ code: 'unknown_error', message: errorObj.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Target Schema Editor */}
        <div>
          <label className="flex items-center text-sm font-semibold text-gray-300 mb-2 gap-2">
            Target Schema <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded font-mono">JSON</span>
          </label>
          <div className="h-48 rounded-lg overflow-hidden border border-white/10 glass-panel relative group">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={schema}
              onChange={(val) => setSchema(val || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: 'off',
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: 'none',
              }}
            />
          </div>
        </div>

        {/* Input Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Input Context</label>
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full h-32 glass-panel rounded-lg p-4 text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-sm resize-none"
            placeholder="Paste raw unstructured text here..."
          />
        </div>

        <RunButton onClick={handleExtract} loading={loading} disabled={false} />
      </div>

      {/* RENDER IN RIGHT COLUMN */}
      <div className="min-h-[400px] lg:min-h-0 lg:h-full">
        <OutputPanel loading={loading} result={result} error={error} />
      </div>
    </>
  );
}

// ==== VISION INPUTS ==== //
function VisionInputs({ apiKey }: { apiKey: string }) {
  const [base64, setBase64] = useState('');
  const [schema, setSchema] = useState('{\n  "vendor": "string",\n  "total": "number",\n  "date": "string"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<{ code: string, message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ... (Vision Logic is same as before, simplified for brevity)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setBase64(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!apiKey) return toast.error("Missing API Key");
    if (!base64 || !schema) return toast.error("Validation Error", { description: "Image and schema required" });
    setLoading(true); setResult(null); setError(null);
    const mime = base64.split(';')[0].split(':')[1];
    const b64Data = base64.split(',')[1];
    
    try {
      const res = await api.post('/api/v1/extract-vision', {
        image_base64: b64Data, mime_type: mime, target_schema: schema
      }, { headers: { 'X-API-Key': apiKey }});
      setResult(res.data.result);
      toast.success("Vision Extraction Complete");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      const detail = errorObj.response?.data?.detail;
      setError({ code: detail?.error || 'error', message: detail?.message || errorObj.message });
      toast.error(`Extract Failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 flex flex-col h-full">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Target Schema</label>
          <div className="h-40 rounded-lg overflow-hidden border border-white/10 glass-panel">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={schema}
              onChange={(val) => setSchema(val || '')}
              options={{ minimap: { enabled: false }, fontFamily: "'JetBrains Mono', monospace", lineNumbers: 'off' }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[200px]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Image Payload</label>
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex-1 min-h-0 border-2 border-dashed rounded-xl flex items-center justify-center transition-all bg-black/20 ${
              isDragging ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(139,92,246,0.2)]' : 'border-white/10 hover:border-white/20'
            }`}
          >
            {base64 ? (
              <div className="relative h-full w-full p-2 flex items-center justify-center">
                <img src={base64} alt="preview" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-white/10" />
                <button onClick={() => setBase64('')} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg glow-hover">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center p-6 pointer-events-none">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <UploadCloud className="w-12 h-12 mx-auto text-primary/50 mb-3" />
                </motion.div>
                <p className="text-gray-300 font-medium">Drag & Drop visual data</p>
                <p className="text-gray-500 text-sm mt-1">or click anywhere to browse</p>
              </div>
            )}
            {!base64 && <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />}
          </div>
        </div>

        <RunButton onClick={handleExtract} loading={loading} disabled={!base64} />
      </div>
      <div className="min-h-[400px] lg:min-h-0 lg:h-full">
        <OutputPanel loading={loading} result={result} error={error} />
      </div>
    </>
  );
}

// ==== ASYNC INPUTS ==== //
function AsyncInputs({ apiKey }: { apiKey: string }) {
  const [prompt, setPrompt] = useState('Large document content goes here...');
  const [schema, setSchema] = useState('{\n  "summary": "string",\n  "key_points": ["string"]\n}');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<{ code: string, message: string } | null>(null);

  const pollJobStatus = async (jobId: string) => {
    try {
      const res = await api.get(`/api/v1/jobs/${jobId}`, {
        headers: { 'X-API-Key': apiKey }
      });
      const data = res.data;
      if (data.status === 'completed') {
        setResult(data.result);
        setLoading(false);
        toast.success("Async Extraction Complete");
      } else if (data.status === 'failed') {
        setError({ code: 'job_failed', message: data.error || 'Unknown error' });
        setLoading(false);
        toast.error("Async Extract Failed");
      } else {
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      setError({ code: 'polling_error', message: errorObj.message });
      setLoading(false);
      toast.error("Failed to poll job status");
    }
  };

  const handleExtract = async () => {
    if (!apiKey) return toast.error("Missing API Key");
    if (!prompt || !schema) return toast.error("Validation Error", { description: "Prompt and schema required." });
    
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post('/api/v1/generate/async', {
        prompt,
        target_schema: schema,
        ...(webhookUrl ? { webhook_url: webhookUrl } : {})
      }, {
        headers: { 'X-API-Key': apiKey }
      });
      
      const jobId = res.data.job_id;
      toast.info(`Job queued: ${jobId}. Polling...`);
      setTimeout(() => pollJobStatus(jobId), 2000);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any;
      const detail = errorObj.response?.data?.detail;
      setError({ code: detail?.error || 'error', message: detail?.message || errorObj.message });
      toast.error(`Extract Failed`);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 flex flex-col h-full">
        <div>
          <label className="flex items-center text-sm font-semibold text-gray-300 mb-2 gap-2">
            Target Schema <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded font-mono">JSON</span>
          </label>
          <div className="h-40 rounded-lg overflow-hidden border border-white/10 glass-panel">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={schema}
              onChange={(val) => setSchema(val || '')}
              options={{ minimap: { enabled: false }, fontFamily: "'JetBrains Mono', monospace", lineNumbers: 'off' }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-[150px]">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Input Context (Large Document)</label>
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full flex-1 glass-panel rounded-lg p-4 text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-sm resize-none min-h-[100px]"
            placeholder="Paste massive raw unstructured text here..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Webhook URL (Optional)</label>
          <input 
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            className="w-full glass-panel border border-white/10 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-sm bg-black/50"
            placeholder="https://your-server.com/webhook"
          />
        </div>
        <RunButton onClick={handleExtract} loading={loading} disabled={false} />
      </div>
      <div className="min-h-[400px] lg:min-h-0 lg:h-full">
        <OutputPanel loading={loading} result={result} error={error} />
      </div>
    </>
  );
}

// ==== OUTPUT PANEL ==== //
function OutputPanel({ loading, result, error }: { loading: boolean, result: Record<string, unknown> | null, error: Record<string, string> | null }) {
  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden border border-white/10 relative">
      <div className="bg-black/40 px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white font-mono tracking-wide">Output.json</h3>
        </div>
        {result && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
          </div>
        )}
      </div>

      <div className="flex-1 relative bg-[#09090B] overflow-auto custom-scrollbar">
        {loading ? (
          <JsonSkeleton />
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-mono text-sm font-semibold text-red-400">{error.code}</span>
              </div>
              <p className="text-gray-400 text-sm">{error.message}</p>
            </div>
          </div>
        ) : result ? (
          <div className="absolute inset-0">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={JSON.stringify(result, null, 2)}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <Code2 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-mono">Awaiting execution...</p>
          </div>
        )}
      </div>
    </div>
  );
}

