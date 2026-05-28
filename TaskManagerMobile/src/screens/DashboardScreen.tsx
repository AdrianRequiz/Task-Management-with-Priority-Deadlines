import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { getDashboardStats } from '../services/api';

export default function DashboardScreen() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>

            <View style={styles.cardGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>To Do</Text>
                    <Text style={styles.statValue}>{stats.todo}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>In Progress</Text>
                    <Text style={styles.statValue}>{stats.in_progress}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Done</Text>
                    <Text style={styles.statValue}>{stats.done}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Overdue</Text>
                    <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.overdue}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Projects</Text>
                <Text style={styles.statValue}>{stats.project_count}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Tasks</Text>
                {stats.recent_tasks.length === 0 ? (
                    <Text style={styles.emptyText}>No tasks yet.</Text>
                ) : (
                    stats.recent_tasks.map((task: any) => (
                        <View key={task.id} style={styles.taskItem}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <Text style={styles.taskMeta}>Status: {task.status} | Deadline: {task.deadline}</Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 24 },
    loader: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 24 },
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3, minWidth: '45%' },
    statLabel: { fontSize: 14, color: '#64748b' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 8 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
    taskItem: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 12 },
    taskTitle: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
    taskMeta: { fontSize: 14, color: '#64748b', marginTop: 4 },
    emptyText: { fontSize: 14, color: '#64748b' },
});