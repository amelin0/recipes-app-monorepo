---
name: Real-time Features for Mobile
description: Build real-time mobile features with WebSockets, Firebase Realtime Database, Firestore live updates, and live collaboration patterns
tags: [real-time, websockets, firebase, firestore, live-updates, collaboration, synchronization]
version: 1.0
---

# Real-time Features for Mobile

## When Claude Should Use This Skill

- Implementing live chat/messaging
- Building real-time notifications
- Creating live collaboration (Figma-style)
- Building multiplayer games
- Live data synchronization
- Activity feeds with live updates
- Real-time dashboards

## Architecture Patterns

```
┌─────────────────────────────────┐
│   Mobile Client (React Native)  │
│   (App State + UI)              │
└────────────┬────────────────────┘
             │
      ┌──────▼──────┐
      │  Connection │ (WebSocket or HTTP)
      │   Handler   │
      └──────┬──────┘
             │
   ┌─────────┴─────────┐
   │                   │
┌──▼───┐          ┌──▼──────┐
│ Real │          │ Firebase │
│ Time │     OR   │ Firestore│
│  DB  │          │          │
└───┬──┘          └────┬─────┘
    │                  │
    └────────┬─────────┘
             │
    ┌────────▼────────┐
    │ Persistence     │
    │ (Cloud Storage) │
    └─────────────────┘
```

## Real-time Technologies

### WebSockets (For Custom Servers)

**Pros**:
- Full control
- Efficient (persistent connection)
- Bi-directional communication
- Low latency

**Cons**:
- Need to build server
- Scaling complexity
- Connection management

**Use**: Chat apps, gaming, custom real-time systems

### Firebase Realtime Database

**Pros**:
- Managed service (no server needed)
- Easy setup
- Auto-sync
- Offline support

**Cons**:
- Limited query capabilities
- Less flexible
- Pricing can be high

**Use**: Simple real-time data, notifications

### Firestore (Cloud Firestore)

**Pros**:
- Better queries than RTDB
- Document-oriented
- Offline support
- More scalable

**Cons**:
- Slightly more complex
- Pricing based on reads/writes

**Use**: Apps with complex data, large scale

## Core Concepts

### 1. Real-time Sync

**Problem**: Two users editing same document simultaneously

**Solution**:
```
User A edits → Send to server
→ Server applies change
→ Broadcast to all users
→ User B receives update → UI updates
```

### 2. Conflict Resolution

**Scenario**: User A + B edit same field simultaneously

**Strategies**:
- **Last-write-wins**: Later change wins
- **Operational Transform**: Merge both changes
- **CRDT**: Data structure that auto-merges
- **Lock-based**: One editor at a time

### 3. Offline Support

**Pattern**:
```
1. User works offline
2. Changes stored locally
3. Reconnect
4. Sync changes → server
5. Merge with server changes
6. Update UI
```

## Implementation Patterns

### Pattern 1: WebSocket Chat

**JavaScript (React Native)**:
```typescript
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export function useRealTimeChat(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const socket = io('https://api.example.com')

    // Join room
    socket.emit('join', { roomId })

    // Listen for messages
    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => socket.disconnect()
  }, [roomId])

  const sendMessage = (text: string) => {
    socket.emit('sendMessage', { roomId, text, timestamp: Date.now() })
  }

  return { messages, sendMessage }
}
```

### Pattern 2: Firebase Realtime

```typescript
import database from '@react-native-firebase/database'

export function useFirebaseRealtime(path: string) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const ref = database().ref(path)

    // Subscribe to updates
    const listener = ref.on('value', (snapshot) => {
      setData(snapshot.val())
    })

    return () => ref.off('value', listener)
  }, [path])

  const updateData = (newData: any) => {
    database().ref(path).update(newData)
  }

  return { data, updateData }
}
```

### Pattern 3: Firestore Live Query

```typescript
import firestore from '@react-native-firebase/firestore'

export function useFirestoreLive(collection: string, query?: any) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = firestore().collection(collection)

    // Apply filters
    if (query?.where) {
      query = query.where(query.where.field, query.where.op, query.where.value)
    }

    // Real-time listener
    const unsubscribe = query.onSnapshot((snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setDocs(data)
      setLoading(false)
    })

    return unsubscribe
  }, [collection, query])

  return { docs, loading }
}
```

## Live Collaboration

### Example: Shared Document

```typescript
interface DocumentChange {
  user: string
  timestamp: number
  operation: 'insert' | 'delete' | 'update'
  path: string
  value: any
  clientId: string
}

class CollaborativeDocument {
  private changes: DocumentChange[] = []
  private version = 0

  // Send change to server
  applyChange(change: DocumentChange) {
    // Add client version
    change.clientId = this.clientId
    change.timestamp = Date.now()

    // Send to server
    this.socket.emit('documentChange', change)

    // Apply locally optimistically
    this.applyChangeLocally(change)
  }

  // Receive changes from other users
  onRemoteChange(change: DocumentChange) {
    if (change.clientId === this.clientId) {
      return // Ignore our own changes (already applied)
    }

    // Transform if needed (operational transform)
    const transformedChange = this.transformChange(change)

    // Apply to document
    this.applyChangeLocally(transformedChange)

    // Notify UI
    this.notifyListeners()
  }
}
```

## Offline Support

```typescript
class OfflineSync {
  private pendingChanges: Change[] = []
  private isOnline = true

  constructor() {
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected
      if (this.isOnline && this.pendingChanges.length > 0) {
        this.syncPendingChanges()
      }
    })
  }

  async applyChange(change: Change) {
    this.pendingChanges.push(change)

    if (this.isOnline) {
      try {
        await this.sendToServer(change)
        this.pendingChanges = this.pendingChanges.filter((c) => c !== change)
      } catch {
        // Will retry when back online
      }
    }
  }

  private async syncPendingChanges() {
    for (const change of this.pendingChanges) {
      try {
        await this.sendToServer(change)
      } catch {
        break // Stop if one fails
      }
    }
  }
}
```

## Best Practices

✅ **Use managed services** (Firebase) for most apps
✅ **Implement offline support** (users expect it)
✅ **Conflict resolution** (handle simultaneous edits)
✅ **Pagination for live data** (don't load everything)
✅ **Debounce updates** (batch frequent changes)
✅ **Error handling** (network is unreliable)
✅ **Optimize message size** (reduce bandwidth)
✅ **Rate limiting** (prevent abuse)
✅ **Test offline scenarios** (common on mobile)

❌ **No offline support** (bad UX)
❌ **Assuming connectivity** (mobile is spotty)
❌ **No conflict resolution** (data corruption)
❌ **Unbounded queries** (performance issues)
❌ **Ignoring battery impact** (real-time drains battery)

## Trade-offs

| Approach | Latency | Cost | Complexity | Scale |
|----------|---------|------|-----------|-------|
| **WebSocket** | Very Low | High | High | Medium |
| **Firebase RT** | Low | Medium | Low | Medium |
| **Firestore** | Medium | Low | Medium | High |
| **Polling** | High | Low | Low | Medium |

---

**Version**: 1.0 | **Last Updated**: 2025-10-18
