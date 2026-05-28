import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { getTasks, deleteTask, updateTaskStatus } from '../services/api';

export default function TasksScreen({ navigation }: any) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await getTasks();
            setTasks(res.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchTasks);
        return unsubscribe;
    }, [navigation]);

    const handleDelete = (id: number) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteTask(id);
                    fetchTasks();
                }
            },
        ]);
    };

    const getPriorityBadge = (priority: string) => {
        const colors: any = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
        return { backgroundColor: colors[priority] + '20', color: colors[priority] };
    };

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }: any) => (
                    <View style={styles.taskCard}>
                        <View style={styles.taskHeader}>
                            <Text style={styles.taskTitle}>{item.title}</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityBadge(item.priority).backgroundColor }]}>
                                <Text style={[styles.priorityText, { color: getPriorityBadge(item.priority).color }]}>{item.priority}</Text>
                            </View>
                        </View>
                        <Text style={styles.taskMeta}>Project: {item.project}</Text>
                        <Text style={styles.taskMeta}>Deadline: {item.deadline}</Text>
                        <Text style={styles.taskMeta}>Status: {item.status}</Text>
                        {item.is_overdue && <Text style={styles.overdue}>Overdue</Text>}
                        <View style={styles.taskActions}>
                            <TouchableOpacity onPress={() => updateTaskStatus(item.id, item.status === 'TODO' ? 'IN_PROGRESS' : item.status === 'IN_PROGRESS' ? 'DONE' : 'TODO')} style={styles.statusButton}>
                                <Text style={styles.buttonText}>Change Status</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('TaskForm', { task: item })} style={styles.editButton}>
                                <Text style={styles.buttonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                                <Text style={styles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('TaskForm')}>
                <Text style={styles.addButtonText}>+ Add Task</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 16 },
    loader: { flex: 1, justifyContent: 'center' },
    taskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
    taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    taskTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    priorityText: { fontSize: 12, fontWeight: '500' },
    taskMeta: { fontSize: 14, color: '#64748b', marginTop: 4 },
    overdue: { fontSize: 12, fontWeight: '600', color: '#dc2626', marginTop: 6 },
    taskActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    statusButton: { backgroundColor: '#f59e0b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    editButton: { backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    deleteButton: { backgroundColor: '#dc2626', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    addButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
});