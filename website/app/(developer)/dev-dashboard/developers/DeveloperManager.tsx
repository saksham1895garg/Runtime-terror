'use client';

import { useState } from 'react';
import { grantProfileToDeveloper, revokeProfile } from './actions';

type Developer = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Profile = {
  id: string;
  name: string;
  description: string;
};

type Grant = {
  id: string;
  user_id: string;
  profile_id: string;
  granted_at: string;
  revoked_at: string | null;
  reason: string;
  profile_name?: string; // Mapped for UI
};

export default function DeveloperManager({
  developers,
  profiles,
  grants
}: {
  developers: Developer[];
  profiles: Profile[];
  grants: Grant[];
}) {
  const [selectedDev, setSelectedDev] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDev || !selectedProfile || !reason) return;
    
    setLoading(true);
    setError('');
    
    try {
      await grantProfileToDeveloper(selectedDev, selectedProfile, reason);
      setReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (grantId: string) => {
    const revokeReason = prompt("Enter reason for revocation:");
    if (!revokeReason) return;

    try {
      await revokeProfile(grantId, revokeReason);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Grant Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Grant Permission Profile
        </h2>

        {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 text-red-400 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Developer</label>
            <select 
              value={selectedDev} 
              onChange={e => setSelectedDev(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select Developer...</option>
              {developers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Profile</label>
            <select 
              value={selectedProfile} 
              onChange={e => setSelectedProfile(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select Profile...</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Audit Reason</label>
            <input 
              type="text" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Assigned to Risk Team"
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              disabled={loading || !selectedDev || !selectedProfile || !reason}
              className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Authorizing...' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Grants List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">Active Developer Grants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 font-medium">Developer</th>
                <th className="p-4 font-medium">Profile</th>
                <th className="p-4 font-medium">Granted At</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {grants.filter(g => !g.revoked_at).map(grant => {
                const dev = developers.find(d => d.id === grant.user_id);
                return (
                  <tr key={grant.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{dev?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{dev?.email}</div>
                    </td>
                    <td className="p-4 text-emerald-400 font-mono text-xs bg-emerald-400/5 inline-block mt-4 px-2 py-1 rounded border border-emerald-400/20">
                      {grant.profile_name}
                    </td>
                    <td className="p-4 text-slate-400">{new Date(grant.granted_at).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-400">{grant.reason}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleRevoke(grant.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-3 py-1 bg-red-950/30 hover:bg-red-900/50 rounded transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
              {grants.filter(g => !g.revoked_at).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No active grants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
