import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LuX, LuCircleUserRound, LuPencil, LuCheck } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const Profile = ({ onClose, isModal }) => {
  const { token } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(data);
        setName(data.name || '');
        setUsername(data.username || '');
        setMobile(data.mobile || '');
      } catch { setError('Could not load profile.'); }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const { data } = await axios.put(`${API_BASE_URL}/profile`,
        { name, username, mobile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(data); setEditing(false); setSuccess('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally { setLoading(false); }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || '?';

  const fields = [
    { label: 'Full Name', key: 'name',     value: name,     setter: setName,     type: 'text', placeholder: 'Full name' },
    { label: 'Username',  key: 'username', value: username, setter: setUsername, type: 'text', placeholder: 'Username' },
    { label: 'Mobile',    key: 'mobile',   value: mobile,   setter: setMobile,   type: 'tel',  placeholder: 'Mobile number' },
  ];

  const content = (
    <div className="flex flex-col gap-6 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(219,234,254,0.80)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <LuCircleUserRound className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-base font-bold text-gray-800 tracking-tight">My Profile</h2>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
          <LuX className="w-4 h-4" />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
          style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)', boxShadow: '0 6px 24px rgba(37,99,235,0.30)' }}>
          {initials}
        </div>
        <p className="text-xs text-blue-400">{profile?.email}</p>
      </div>

      {/* Fields */}
      {profile && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0"
            style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(37,99,235,0.06)' }}>
            {fields.map(({ label, key, value, setter, type, placeholder }, i) => (
              <React.Fragment key={key}>
                {i > 0 && <div style={{ borderTop: '1px solid rgba(37,99,235,0.07)' }} />}
                <div className="flex flex-col gap-1 px-5 py-3.5">
                  <label className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">{label}</label>
                  {editing ? (
                    <input type={type} value={value} onChange={e => setter(e.target.value)}
                      placeholder={placeholder}
                      className="paws-input h-auto py-2.5 text-sm" />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{profile[key] || '—'}</p>
                  )}
                </div>
              </React.Fragment>
            ))}
            <div style={{ borderTop: '1px solid rgba(37,99,235,0.07)' }} />
            <div className="flex flex-col gap-1 px-5 py-3.5">
              <label className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Email</label>
              <p className="text-sm font-medium text-blue-300">{profile.email}</p>
            </div>
          </div>

          {error   && <p className="text-red-500 text-xs text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-green-600 text-xs text-center bg-green-50 border border-green-100 rounded-xl px-3 py-2">{success}</p>}

          {editing ? (
            <div className="flex gap-2.5">
              <button onClick={() => { setEditing(false); setError(''); setSuccess(''); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(37,99,235,0.12)' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)', boxShadow: '0 3px 14px rgba(37,99,235,0.28)' }}>
                <LuCheck className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setSuccess(''); }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)', boxShadow: '0 3px 14px rgba(37,99,235,0.28)' }}>
              <LuPencil className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(200,220,255,0.40)', backdropFilter: 'blur(10px)' }}>
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-8"
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(255,255,255,0.92)',
            borderRadius: '24px',
            backdropFilter: 'blur(28px)',
            boxShadow: '0 24px 64px rgba(37,99,235,0.14), 0 1px 0 rgba(255,255,255,0.9) inset',
          }}>
          {content}
        </div>
      </div>
    );
  }

  // Fallback: full-page (legacy)
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-6">
      {content}
    </div>
  );
};

export default Profile;
