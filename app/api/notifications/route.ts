import { NextResponse } from 'next/server'
import { findNewResults, getLastCheck } from '@/lib/notifications'

export async function GET() {
    try {
        const lastCheck = getLastCheck('user')
        const notifications = findNewResults(lastCheck)

        // Don't update last check here - only when user clicks notification

        return NextResponse.json({
            success: true,
            notifications,
            count: notifications.length
        })
    } catch (error) {
        console.error('Error fetching user notifications:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
