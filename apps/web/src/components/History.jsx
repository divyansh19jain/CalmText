import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Clock } from 'lucide-react';
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
      <div className="w-full flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-pax-blue-secondary" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Search History</h2>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col divide-y divide-gray-100 px-4 py-2">
        {loading && (
          <p className="text-center text-gray-400 py-20 text-sm">Loading...</p>
        )}
        {error && (
          <p className="text-center text-red-400 py-20 text-sm">{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="text-center text-gray-400 py-20 text-sm">No searches yet. Analyze a message to get started.</p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onReplay(item)}
            className="text-left w-full px-4 py-5 hover:bg-gray-50 transition-colors cursor-pointer rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  {item.mode === 'input' ? 'I Received This' : 'I Want To Say This'}
                </span>
                <p className="text-base font-semibold text-gray-800 truncate">{item.text}</p>
                <p className="text-sm text-gray-500 line-clamp-1 font-serif">{item.pax}</p>
              </div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap pt-1">{formatDate(item.created_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default History;
