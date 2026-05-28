import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createTask, updateTask, getProjects } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TaskFormScreen({ route, navigation }: any) {
    const task = route.params?.task;
    const [projects, setProjects] = useState([]);
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [deadline, setDeadline] = useState(task?.deadline || '');
    const [priority, setPriority] = useState(task?.priority || 'MEDIUM');
    const [projectId, setProjectId] = useState(task?.project?.toString() || '');
    const [attachment, setAttachment] = useState<string | null>(task?.attachment || null);
    const [image, setImage] = useState<string | null>(task?.image || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = await AsyncStorage.getItem('access_token');
                const res = await getProjects();
                setProjects(res.data);
            } catch (err) {
                Alert.alert('Error', 'Could not load projects');
            }
        };
        fetchProjects();
    }, []);

    const pickImage = async (type: 'image' | 'attachment') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.All,
            allowsEditing: type === 'image',
            quality: 1,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            // Upload to your backend (use the same FileUpload API or convert to base64)
            // For simplicity, store the local URI for now – but in production you should upload.
            if (type === 'image') setImage(uri);
            else setAttachment(uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return Alert.alert('Error', 'Title is required');
        if (!projectId) return Alert.alert('Error', 'Select a project');
        setLoading(true);
        const data = { title, description, deadline, priority, project: parseInt(projectId), attachment, image };
        try {
            if (task) await updateTask(task.id, data);
            else await createTask(data);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} multiline style={[styles.input, { height: 80 }]} />
            <TextInput placeholder="Deadline (YYYY-MM-DD)" value={deadline} onChangeText={setDeadline} style={styles.input} />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                    <TouchableOpacity key={p} onPress={() => setPriority(p)} style={[styles.priorityButton, priority === p && styles.priorityActive]}>
                        <Text>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={{ marginBottom: 16 }}>
                <Text>Project:</Text>
                {projects.map((p: any) => (
                    <TouchableOpacity key={p.id} onPress={() => setProjectId(p.id.toString())} style={[styles.projectOption, projectId === p.id.toString() && styles.projectActive]}>
                        <Text>{p.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity onPress={() => pickImage('image')} style={styles.uploadButton}>
                <Text>Pick Image</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={{ width: 100, height: 100, marginTop: 8 }} />}
            <TouchableOpacity onPress={() => pickImage('attachment')} style={styles.uploadButton}>
                <Text>Pick Attachment</Text>
            </TouchableOpacity>
            {attachment && <Text style={{ marginTop: 8 }}>Attachment selected</Text>}
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={loading}>
                <Text style={{ color: 'white' }}>{loading ? 'Saving...' : 'Save Task'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 16 },
    priorityButton: { padding: 10, borderRadius: 20, backgroundColor: '#e5e7eb' },
    priorityActive: { backgroundColor: '#3b82f6' },
    projectOption: { padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8, marginTop: 4 },
    projectActive: { backgroundColor: '#dbeafe' },
    uploadButton: { backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
    saveButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 16 },
});