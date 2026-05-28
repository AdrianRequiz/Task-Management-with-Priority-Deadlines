import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import { getProfile, updateProfile, logout } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }: any) {
    const [profile, setProfile] = useState<any>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', bio: '' });
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        getProfile().then(res => {
            setProfile(res.data);
            setForm({
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                bio: res.data.bio || '',
            });
            setAvatarPreview(res.data.avatar);
            setLoading(false);
        }).catch(console.error);
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setAvatarPreview(uri);
            // For actual upload, you'd send the file to your backend.
            // For now, store local URI (will not persist across app restarts).
        }
    };

    const handleSave = async () => {
        setMessage('');
        const formData = new FormData();
        formData.append('first_name', form.first_name);
        formData.append('last_name', form.last_name);
        formData.append('bio', form.bio);
        // If we had a file upload endpoint, we'd append avatarFile here.
        try {
            await updateProfile(formData);
            setProfile({ ...profile, ...form });
            setEditing(false);
            setMessage('Profile updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Update failed');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>User Profile</Text>
            {message !== '' && <View style={styles.successMessage}><Text style={styles.successText}>{message}</Text></View>}
            {!editing ? (
                <View style={styles.card}>
                    {profile.avatar && <Image source={{ uri: profile.avatar }} style={styles.avatar} />}
                    <Text style={styles.detail}><Text style={styles.bold}>Username:</Text> {profile.username}</Text>
                    <Text style={styles.detail}><Text style={styles.bold}>Email:</Text> {profile.email}</Text>
                    <Text style={styles.detail}><Text style={styles.bold}>First Name:</Text> {profile.first_name || '—'}</Text>
                    <Text style={styles.detail}><Text style={styles.bold}>Last Name:</Text> {profile.last_name || '—'}</Text>
                    <Text style={styles.detail}><Text style={styles.bold}>Bio:</Text> {profile.bio || '—'}</Text>
                    <Text style={styles.detail}><Text style={styles.bold}>Role:</Text> {profile.role}</Text>
                    <Text style={styles.detail}><Text style={styles.bold}>Joined:</Text> {new Date(profile.date_joined).toLocaleDateString()}</Text>
                    <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                        <Text style={styles.buttonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.card}>
                    <TextInput style={styles.input} placeholder="First Name" value={form.first_name} onChangeText={t => setForm({ ...form, first_name: t })} />
                    <TextInput style={styles.input} placeholder="Last Name" value={form.last_name} onChangeText={t => setForm({ ...form, last_name: t })} />
                    <TextInput style={[styles.input, { height: 80 }]} placeholder="Bio" value={form.bio} onChangeText={t => setForm({ ...form, bio: t })} multiline />
                    <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
                        <Text>Change Avatar</Text>
                    </TouchableOpacity>
                    {avatarPreview && <Image source={{ uri: avatarPreview }} style={styles.avatarPreview} />}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
    loader: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    successMessage: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 8, marginBottom: 16 },
    successText: { color: '#065f46' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
    detail: { fontSize: 16, marginBottom: 12, color: '#1e293b' },
    bold: { fontWeight: 'bold' },
    editButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
    avatarButton: { backgroundColor: '#e2e8f0', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    avatarPreview: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 12 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    saveButton: { flex: 1, backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: { flex: 1, backgroundColor: '#6b7280', padding: 12, borderRadius: 8, alignItems: 'center' },
    logoutButton: { backgroundColor: '#dc2626', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
});