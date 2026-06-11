# Firebase Realtime Implementation Guide

## Setup

### Install Firebase

```bash
# npm
npm install @react-native-firebase/app @react-native-firebase/database

# or expo
expo install @react-native-firebase/app @react-native-firebase/database
```

### Initialize

```typescript
import database from '@react-native-firebase/database'

// Already connected after app initialization
const ref = database().ref('path/to/data')
```

---

## Real-time Chat Example

### Database Structure

```json
{
  "chats": {
    "chatId1": {
      "messages": {
        "msgId1": {
          "user": "alice",
          "text": "Hello",
          "timestamp": 1633024800000
        },
        "msgId2": {
          "user": "bob",
          "text": "Hi there!",
          "timestamp": 1633024810000
        }
      },
      "participants": ["alice", "bob"],
      "lastMessage": "Hi there!",
      "updatedAt": 1633024810000
    }
  }
}
```

### React Component

```typescript
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native'
import database from '@react-native-firebase/database'

export function ChatScreen({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  // Subscribe to messages
  useEffect(() => {
    const messagesRef = database().ref(`chats/${chatId}/messages`)

    const listener = messagesRef.on(
      'value',
      (snapshot) => {
        if (snapshot.exists()) {
          const msgs = Object.values(snapshot.val() as any)
            .sort((a: any, b: any) => a.timestamp - b.timestamp)
          setMessages(msgs)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Failed to load messages:', error)
        setLoading(false)
      }
    )

    // Cleanup
    return () => messagesRef.off('value', listener)
  }, [chatId])

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return

    try {
      const messageRef = database().ref(`chats/${chatId}/messages`).push()
      await messageRef.set({
        user: 'current_user', // In real app, get from auth
        text: input,
        timestamp: Date.now(),
      })

      // Update last message
      await database().ref(`chats/${chatId}`).update({
        lastMessage: input,
        updatedAt: Date.now(),
      })

      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (loading) {
    return <Text>Loading...</Text>
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.user}</Text>
            <Text>{item.text}</Text>
            <Text style={{ fontSize: 12, color: '#999' }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.timestamp.toString()}
      />

      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, paddingHorizontal: 10, borderRadius: 4 }}
          placeholder="Type message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={{ paddingLeft: 10, justifyContent: 'center' }}
        >
          <Text style={{ color: 'blue' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
```

---

## Presence & Activity

### Track User Online Status

```typescript
class PresenceManager {
  private userId: string
  private isOnline = true

  constructor(userId: string) {
    this.userId = userId
  }

  async init() {
    const presenceRef = database().ref(`presence/${this.userId}`)

    // Set offline on disconnect
    presenceRef.onDisconnect().remove()

    // Set online when app loads
    await presenceRef.set({
      online: true,
      lastSeen: Date.now(),
    })

    // Update every 30 seconds
    this.heartbeat()
  }

  private heartbeat() {
    setInterval(() => {
      database().ref(`presence/${this.userId}`).update({
        lastSeen: Date.now(),
      })
    }, 30000)
  }
}

// Usage
export function usePresence(userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    const presenceRef = database().ref('presence')

    const listener = presenceRef.on('value', (snapshot) => {
      const users = Object.entries(snapshot.val() || {})
        .filter(([_, data]: any) => data.online)
        .map(([userId]) => userId)

      setOnlineUsers(users)
    })

    return () => presenceRef.off('value', listener)
  }, [])

  return onlineUsers
}
```

---

## Offline Support

### Sync Queue

```typescript
class OfflineQueue {
  private queue: PendingAction[] = []
  private isOnline = true
  private db = database()

  constructor() {
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false
      if (this.isOnline) {
        this.flushQueue()
      }
    })
  }

  async addAction(action: PendingAction) {
    this.queue.push(action)
    await AsyncStorage.setItem('pendingActions', JSON.stringify(this.queue))

    if (this.isOnline) {
      this.flushQueue()
    }
  }

  private async flushQueue() {
    while (this.queue.length > 0 && this.isOnline) {
      const action = this.queue[0]

      try {
        await this.executeAction(action)
        this.queue.shift()
        await AsyncStorage.setItem('pendingActions', JSON.stringify(this.queue))
      } catch (error) {
        console.error('Failed to execute action, will retry later:', error)
        break
      }
    }
  }

  private async executeAction(action: PendingAction) {
    switch (action.type) {
      case 'sendMessage':
        await this.db.ref(`chats/${action.chatId}/messages`).push(action.data)
        break
      case 'updateProfile':
        await this.db.ref(`users/${action.userId}`).update(action.data)
        break
      // ...
    }
  }
}
```

---

## Query Optimization

### Limiting Data

```typescript
// ❌ Bad: Load all messages
const allMessages = await database()
  .ref('messages')
  .once('value')
  .then((s) => s.val())

// ✅ Good: Paginate recent messages
const recentMessages = await database()
  .ref('messages')
  .orderByChild('timestamp')
  .limitToLast(50) // Last 50 messages
  .once('value')
  .then((s) => s.val())
```

### Filtering

```typescript
// Find messages from specific user
const userMessages = await database()
  .ref('messages')
  .orderByChild('userId')
  .equalTo('alice')
  .once('value')
  .then((s) => s.val())

// Messages in date range (requires client-side filtering)
const startOfDay = new Date().setHours(0, 0, 0, 0)
const messagesRef = database()
  .ref('messages')
  .orderByChild('timestamp')
  .startAt(startOfDay)
  .endAt(startOfDay + 24 * 60 * 60 * 1000)
```

---

## Conflict Resolution

### Last-Write-Wins (Simplest)

```typescript
// When user edits, send with timestamp
await database().ref(`docs/${docId}`).set({
  content: newContent,
  editedAt: Date.now(),
  editedBy: currentUser,
})

// Listener automatically gets latest version
database()
  .ref(`docs/${docId}`)
  .on('value', (snapshot) => {
    const doc = snapshot.val()
    // Always have latest (last write wins)
    updateUI(doc.content)
  })
```

### Operational Transform (Advanced)

```typescript
class Document {
  private version = 0
  private pending: Operation[] = []

  async applyEdit(operation: Operation) {
    operation.version = this.version

    // Send to server
    const result = await api.applyEdit(operation)

    if (result.accepted) {
      this.version++
    } else {
      // Transform operation and retry
      const transformed = this.transform(operation, result.conflicting)
      this.applyEdit(transformed)
    }
  }

  private transform(a: Operation, b: Operation): Operation {
    // Implement operational transform logic
    // Merge two concurrent edits
    return a // simplified
  }
}
```

