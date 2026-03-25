'use client'

import { useNotificationsPage } from './useNotificationsPage'
import { Button } from '@/shared/ui/components/button'
import { Badge } from '@/shared/ui/components/badge'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, MessageSquare, UserPlus, Info } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  SUPPORT_MESSAGE: { icon: <MessageSquare size={16} />, color: 'text-warning-default' },
  NEW_USER: { icon: <UserPlus size={16} />, color: 'text-primary-default' },
  SYSTEM: { icon: <Info size={16} />, color: 'text-text-tertiary' },
}

export function NotificationsPage() {
  const {
    notifications, total, unreadCount, page, totalPages, isLoading,
    isMarking, setPage, handleMarkAllRead,
  } = useNotificationsPage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary">
            Notifications
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {total} total · {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isMarking}>
            <CheckCheck size={16} className="mr-1.5" />
            {isMarking ? 'Marking...' : 'Read All'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-text-tertiary text-sm py-12 text-center">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-text-tertiary">
          <Bell size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  n.is_read
                    ? 'border-border-default bg-bg-canvas'
                    : 'border-primary-default/20 bg-primary-subtle/30'
                }`}
              >
                <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${n.is_read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-default shrink-0" />
                    )}
                  </div>
                  {n.body && <p className="text-xs text-text-tertiary mt-0.5">{n.body}</p>}
                  <p className="text-xs text-text-tertiary mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{n.type.replace('_', ' ')}</Badge>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
