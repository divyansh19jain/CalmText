import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LuArrowLeft, LuClock, LuRotateCcw } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const History = ({ onClose, onReplay }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(data.items);
      } catch {
        setError('Could not load history.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col">

      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 py-4 sticky top-0 z-10 nav-glass">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(219,234,254,0.80)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <LuClock className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-blue-900 tracking-tight">Search History</h2>
        </div>
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-blue-400 font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all">
          <LuArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col px-4 py-4 gap-2">

        {loading && (
          <p className="text-center text-blue-300 py-20 text-sm">Loading...</p>
        )}
        {error && (
          <p className="text-center text-red-400/70 py-20 text-sm">{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24">
            <LuClock className="w-10 h-10 text-white/10" />
            <p className="text-center text-blue-300 text-sm">No searches yet.<br />Analyze a message to get started.</p>
          </div>
        )}

        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onReplay(item)}
            className="history-item text-left w-full group"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">
                  {item.mode === 'input' ? 'I Received This' : 'Reply'}
                </span>
                <p className="text-sm font-semibold text-gray-900 truncate">{item.text}</p>
                <p className="text-xs text-gray-500 line-clamp-1 font-serif">{item.pax}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-[10px] text-blue-300 whitespace-nowrap">{formatDate(item.created_at)}</span>
                <LuRotateCcw className="w-3.5 h-3.5 text-blue-200 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default History;
