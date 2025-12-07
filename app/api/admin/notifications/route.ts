import { NextResponse } from 'next/server'
import { findUnparsedPDFs } from '@/lib/notifications'

export async function GET() {
    try {
        const notifications = findUnparsedPDFs()

        return NextResponse.json({
            success: true,
            notifications,
            count: notifications.length
        })
    } catch (error) {
        console.error('Error fetching admin notifications:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
