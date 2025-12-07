"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
    id: string
    type: 'new_result'
    title: string
    message: string
    timestamp: string
    read: boolean
    metadata?: {
        batch?: string
        degree?: string
        moduleCode?: string
        moduleName?: string
        studentCount?: number
    }
}

export function NotificationBell() {
    const { data: session, status } = useSession()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [readIds, setReadIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        // Only fetch notifications if user is authenticated
        if (status !== 'authenticated') {
            return
        }

        // Load read IDs from localStorage
        const stored = localStorage.getItem('readNotifications')
        if (stored) {
            setReadIds(new Set(JSON.parse(stored)))
        }

        fetchNotifications()

        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [status])

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications')
            const data = await response.json()

            if (data.success) {
                setNotifications(data.notifications)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const markAsRead = (id: string) => {
        const newReadIds = new Set(readIds)
        newReadIds.add(id)
        setReadIds(newReadIds)
        localStorage.setItem('readNotifications', JSON.stringify(Array.from(newReadIds)))
    }

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read when user clicks
        markAsRead(notification.id)
        // Could navigate to specific student/batch page if needed
    }

    // Filter to show only unread notifications
    const unreadNotifications = notifications.filter(n => !readIds.has(n.id))
    const unreadCount = unreadNotifications.length

    // Don't render if not authenticated
    if (status !== 'authenticated') {
        return null
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            {unreadCount} new
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {unreadNotifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {unreadNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start p-3 cursor-pointer"
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-2 w-full">
                                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        {notification.metadata?.studentCount && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {notification.metadata.studentCount} student(s)
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(notification.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
