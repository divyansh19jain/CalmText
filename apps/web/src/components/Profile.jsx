import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const Profile = ({ onClose }) => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
      } catch {
        setError('Could not load profile.');
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const { data } = await axios.put(`${API_BASE_URL}/profile`,
        { name, username, mobile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(data);
      setEditing(false);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen w-full flex flex-col bg-app-bg">

      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-pax-blue-secondary" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">My Profile</h2>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-lg mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-pax-blue-secondary flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {initials}
          </div>
          <p className="text-sm text-gray-500">{profile?.email}</p>
        </div>

        {/* Fields */}
        {profile && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="paws-input h-auto py-3 text-sm mt-1"
                    placeholder="Full name"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-800">{profile.name || '—'}</p>
                )}
              </div>

              <div className="border-t border-gray-50" />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Username</label>
                {editing ? (
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="paws-input h-auto py-3 text-sm mt-1"
                    placeholder="Username"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-800">{profile.username || '—'}</p>
                )}
              </div>

              <div className="border-t border-gray-50" />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Mobile</label>
                {editing ? (
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="paws-input h-auto py-3 text-sm mt-1"
                    placeholder="Mobile number"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-800">{profile.mobile || '—'}</p>
                )}
              </div>

              <div className="border-t border-gray-50" />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email</label>
                <p className="text-base font-medium text-gray-400">{profile.email}</p>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center">{success}</p>}

            {/* Action buttons */}
            {editing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => { setEditing(false); setError(''); setSuccess(''); }}
                  className="flex-1 py-4 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-pax-blue-secondary text-white text-sm font-semibold hover:bg-pax-blue-primary transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditing(true); setSuccess(''); }}
                className="w-full py-4 rounded-2xl bg-pax-blue-secondary text-white text-sm font-semibold hover:bg-pax-blue-primary transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
