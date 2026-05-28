import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { createProject, updateProject } from '../services/api';

export default function ProjectFormScreen({ route, navigation }: any) {
    const project = route.params?.project;
    const [name, setName] = useState(project?.name || '');
    const [description, setDescription] = useState(project?.description || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return Alert.alert('Error', 'Name is required');
        setLoading(true);
        try {
            if (project) await updateProject(project.id, { name, description });
            else await createProject({ name, description });
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput placeholder="Project Name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} multiline style={[styles.input, { height: 80 }]} />
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Project'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 16 },
    button: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' },
});