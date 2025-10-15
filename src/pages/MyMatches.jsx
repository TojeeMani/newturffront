import React, { useEffect, useState } from 'react';
import matchService from '../services/matchService';
import { useAuth } from '../context/AuthContext';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const MyMatches = () => {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const load = async () => {
    if (!isAuthenticated || !user) return;
    try {
      setLoading(true);
      const [liveRes, upResToday, compRes] = await Promise.all([
        matchService.getMatches({ window: 'live', customerId: user._id || user.id }),
        matchService.getMatches({ window: 'upcoming', day: 'today', customerId: user._id || user.id }),
        matchService.getMatches({ status: 'completed', customerId: user._id || user.id, limit: 50 })
      ]);
      const ld = liveRes?.data || liveRes || [];
      let ud = upResToday?.data || upResToday || [];
      // Fallback: if no upcoming today, fetch upcoming in future (no day constraint)
      if (!Array.isArray(ud) || ud.length === 0) {
        try {
          const upResAll = await matchService.getMatches({ window: 'upcoming', customerId: user._id || user.id, limit: 50 });
          ud = upResAll?.data || upResAll || [];
        } catch (_) {
          // ignore fallback errors, keep empty
        }
      }
      const cd = compRes?.data || compRes || [];
      setLive(Array.isArray(ld) ? ld : []);
      setUpcoming(Array.isArray(ud) ? ud : []);
      setCompleted(Array.isArray(cd) ? cd : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated, user]);

  const Section = ({ title, items }) => (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title} ({items.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full text-center text-gray-600">No matches.</div>
        ) : items.map((m, i) => (
          <div key={m._id || i} className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${m.status==='live'?'text-red-600':m.status==='scheduled'?'text-yellow-600':'text-green-600'}`}>{m.status.toUpperCase()}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{m.matchType}</span>
            </div>
            <div className="font-bold text-gray-900">{m.matchName}</div>
            <div className="text-xs text-gray-500 mb-3">{new Date(m.startTime).toLocaleString()}</div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-center"><div className="font-medium">{m.teams?.[0]?.name}</div><div className="text-2xl font-bold text-primary-600">{m.teams?.[0]?.score ?? 0}</div></div>
              <div className="text-gray-500">vs</div>
              <div className="text-center"><div className="font-medium">{m.teams?.[1]?.name}</div><div className="text-2xl font-bold text-primary-600">{m.teams?.[1]?.score ?? 0}</div></div>
            </div>
            <button onClick={()=>setDetail(m)} className="w-full border rounded-lg px-3 py-2 text-sm">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );

  const DetailModal = ({ m, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{m.matchName}</h3>
          <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 mb-1">Teams</div>
            <div className="text-sm"><span className="font-medium">{m.teams?.[0]?.name}</span> vs <span className="font-medium">{m.teams?.[1]?.name}</span></div>
            <div className="text-sm mt-2"><span className="font-medium">Players A:</span> {(m.teams?.[0]?.players || []).join(', ') || '—'}</div>
            <div className="text-sm"><span className="font-medium">Players B:</span> {(m.teams?.[1]?.players || []).join(', ') || '—'}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 mb-1">Schedule</div>
            <div className="text-sm">Start: {new Date(m.startTime).toLocaleString()}</div>
            <div className="text-sm">End: {new Date(m.endTime).toLocaleString()}</div>
            <div className="text-sm">Turf: {m.turfId?.name}</div>
          </div>
        </div>
        {m.matchType === 'football' && (
          <div className="p-3 bg-gray-50 rounded mb-3">
            <div className="font-medium mb-2">Football Analytics</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-500">Possession</div>
                <div>{m.statistics?.possession?.team1 || 0}% - {m.statistics?.possession?.team2 || 0}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Shots</div>
                <div>{m.statistics?.shots?.team1 || 0} - {m.statistics?.shots?.team2 || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Fouls</div>
                <div>{m.statistics?.fouls?.team1 || 0} - {m.statistics?.fouls?.team2 || 0}</div>
              </div>
            </div>
          </div>
        )}
        {m.matchType === 'cricket' && (
          <div className="p-3 bg-gray-50 rounded mb-3">
            <div className="font-medium mb-2">Cricket Analytics</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-500">Overs</div>
                <div>{m.statistics?.overs || 0}</div>
              </div>
            </div>
          </div>
        )}
        {m.liveUpdates && m.liveUpdates.length > 0 && (
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium mb-2">Live Updates</div>
            <div className="space-y-1 max-h-60 overflow-auto">
              {m.liveUpdates.map((u, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-xs text-gray-500 mr-2">{u.time}</span>
                  <span className="font-medium mr-2">{m.teams[u.team]?.name || 'Team'}</span>
                  {u.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <div className="text-gray-600">Loading your matches...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Section title="Live" items={live} />
      <Section title="Upcoming Today" items={upcoming} />
      <Section title="Completed" items={completed} />
      {detail && <DetailModal m={detail} onClose={() => setDetail(null)} />}
    </div>
  );
};

export default MyMatches;


