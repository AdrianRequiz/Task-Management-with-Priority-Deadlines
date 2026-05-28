import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { getProjects, deleteProject } from '../services/api';

export default function ProjectsScreen({ navigation }: any) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(res.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchProjects);
        return unsubscribe;
    }, [navigation]);

    const handleDelete = (id: number) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteProject(id);
                    fetchProjects();
                }
            },
        ]);
    };

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={projects}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }: any) => (
                    <View style={styles.projectCard}>
                        <TouchableOpacity onPress={() => navigation.navigate('ProjectForm', { project: item })} style={{ flex: 1 }}>
                            <Text style={styles.projectName}>{item.name}</Text>
                            <Text style={styles.projectDesc}>{item.description || 'No description'}</Text>
                            <Text style={styles.projectOwner}>Owner: {item.owner_email || 'Unknown'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ProjectForm')}>
                <Text style={styles.addButtonText}>+ Add Project</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
    loader: { flex: 1, justifyContent: 'center' },
    projectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
    projectName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    projectDesc: { fontSize: 14, color: '#64748b', marginTop: 4 },
    projectOwner: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    deleteButton: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    deleteButtonText: { color: '#fff', fontWeight: '500' },
    addButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
});