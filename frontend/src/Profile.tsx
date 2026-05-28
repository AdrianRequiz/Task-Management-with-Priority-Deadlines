import React, { useEffect, useState } from 'react';
import { authFetch } from '../auth';

export default function Profile() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    avatar: null as string | null,
    email: '',
    username: '',
    role: '',
    date_joined: '',
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authFetch('/profile/');
        const data = await res.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
        });
        setAvatarPreview(data.avatar);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setMessage('');
    const form = new FormData();
    form.append('first_name', formData.first_name);
    form.append('last_name', formData.last_name);
    form.append('bio', formData.bio);
    if (avatarFile) form.append('avatar', avatarFile);

    try {
      const res = await authFetch('/profile/', {
        method: 'PUT',
        body: form,
        headers: {}, // important: let browser set Content-Type for FormData
      });
      const data = await res.json();
      setProfile(data);
      setAvatarPreview(data.avatar);
      setEditing(false);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage('Update failed');
    }
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Profile</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 rounded">{message}</div>}

      {!editing ? (
        <div className="bg-white rounded shadow p-6 space-y-4">
          {profile.avatar && (
            <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
          )}
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>First Name:</strong> {profile.first_name || '—'}</p>
          <p><strong>Last Name:</strong> {profile.last_name || '—'}</p>
          <p><strong>Bio:</strong> {profile.bio || '—'}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          <p><strong>Joined:</strong> {new Date(profile.date_joined).toLocaleDateString()}</p>
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="bg-white rounded shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Avatar</label>
            {avatarPreview && <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full mb-2" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setAvatarFile(e.target.files[0]);
                  setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            <button onClick={() => setEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}