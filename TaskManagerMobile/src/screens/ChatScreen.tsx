import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { sendChatMessage } from '../services/api';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);
        try {
            const res = await sendChatMessage(userMsg);
            const reply = res.data.assistant?.message || res.data.message || 'No response';
            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Server error' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}>
                        <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                            <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>{item.text}</Text>
                        </View>
                    </View>
                )}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />
            {loading && <ActivityIndicator style={{ margin: 10 }} />}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type a message..."
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={{ color: 'white' }}>Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    messageRow: { flexDirection: 'row', marginVertical: 5 },
    userRow: { justifyContent: 'flex-end' },
    assistantRow: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
    userBubble: { backgroundColor: '#2563eb' },
    assistantBubble: { backgroundColor: '#e5e7eb' },
    userText: { color: 'white' },
    assistantText: { color: 'black' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 10, marginRight: 10 },
    sendButton: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
});