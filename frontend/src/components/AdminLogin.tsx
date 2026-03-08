import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onLogin(key.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 mt-20">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 w-full max-w-md text-center">
        <div className="bg-[#8B5CF6]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-[#8B5CF6]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-400 mb-8">Please enter your master API key to view this restricted area.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter Admin Key..."
            className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#8B5CF6] text-center font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg font-bold transition-colors"
          >
            Unlock Area
          </button>
        </form>
      </div>
    </div>
  );
}
