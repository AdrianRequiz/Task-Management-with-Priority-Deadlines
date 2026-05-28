import React, { useEffect, useState } from 'react';
import { authFetch } from '../auth';

export default function Profile() {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        avatar_url: null as string | null,
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
    const [error, setError] = useState('');

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
                setAvatarPreview(data.avatar_url);
            } catch (err) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setMessage('');
        setError('');
        const form = new FormData();
        if (formData.first_name) form.append('first_name', formData.first_name);
        if (formData.last_name) form.append('last_name', formData.last_name);
        if (formData.bio) form.append('bio', formData.bio);
        if (avatarFile) form.append('avatar', avatarFile);
        // Do NOT send 'avatar' field if no file selected

        try {
            const res = await authFetch('/profile/', {
                method: 'PUT',
                body: form,
                headers: {},
            });
            if (!res.ok) {
                const errData = await res.json();
                console.error('Profile update error:', errData);
                throw new Error('Update failed');
            }
            const data = await res.json();
            setProfile(data);
            setAvatarPreview(data.avatar_url);
            setEditing(false);
            setMessage('Profile updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Update failed');
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading profile...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

            {message && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {message}
                </div>
            )}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {!editing ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center space-x-4">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-semibold">
                                    {profile.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-xl font-semibold text-gray-900">{profile.username}</p>
                                <p className="text-gray-500">{profile.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                                <p className="text-gray-800">{profile.email}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Joined</label>
                                <p className="text-gray-800">{new Date(profile.date_joined).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">First Name</label>
                                <p className="text-gray-800">{profile.first_name || '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Last Name</label>
                                <p className="text-gray-800">{profile.last_name || '—'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Bio</label>
                            <p className="text-gray-800 mt-1">{profile.bio || 'No bio yet'}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-sm"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-5">
                        <div className="flex items-center space-x-4">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                            ) : profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-semibold">
                                    {profile.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex space-x-3">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition shadow-sm"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}