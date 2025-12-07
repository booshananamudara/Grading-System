import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { getActivityLogs } from '@/lib/activity-logger'

interface SystemHealth {
    diskSpace: {
        total: number
        used: number
        free: number
        percentage: number
    }
    files: {
        totalPDFs: number
        totalJSON: number
        totalSize: number
    }
    parsing: {
        totalParsed: number
        totalFailed: number
        successRate: number
    }
    recentErrors: Array<{
        timestamp: string
        action: string
        error: string
    }>
    recentActivity: Array<{
        timestamp: string
        action: string
        details: any
    }>
}

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'data')

        // Count files and calculate sizes
        let totalPDFs = 0
        let totalJSON = 0
        let totalSize = 0
        let totalParsed = 0
        let totalFailed = 0

        const countFiles = (dir: string) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true })

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name)

                    if (entry.isDirectory()) {
                        countFiles(fullPath)
                    } else if (entry.isFile()) {
                        const stats = fs.statSync(fullPath)
                        totalSize += stats.size

                        if (entry.name.toLowerCase().endsWith('.pdf')) {
                            totalPDFs++

                            // Check if corresponding JSON exists
                            const jsonPath = fullPath.replace(/\.pdf$/i, '.json').replace('/input/', '/output/')
                            if (fs.existsSync(jsonPath)) {
                                totalParsed++
                            } else {
                                totalFailed++
                            }
                        } else if (entry.name.toLowerCase().endsWith('.json') && !entry.name.includes('metadata') && !entry.name.includes('profiles')) {
                            totalJSON++
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }

        countFiles(dataDir)

        // Get disk space (approximate - based on data directory)
        const diskSpace = {
            total: 100 * 1024 * 1024 * 1024, // 100GB (placeholder)
            used: totalSize,
            free: 100 * 1024 * 1024 * 1024 - totalSize,
            percentage: (totalSize / (100 * 1024 * 1024 * 1024)) * 100
        }

        // Calculate parse success rate
        const successRate = totalPDFs > 0 ? (totalParsed / totalPDFs) * 100 : 0

        // Get recent activity logs
        const logs = getActivityLogs(20)

        // Extract recent errors
        const recentErrors = logs
            .filter(log => !log.success)
            .slice(0, 10)
            .map(log => ({
                timestamp: log.timestamp,
                action: log.action,
                error: log.details?.error || 'Unknown error'
            }))

        // Recent successful activity
        const recentActivity = logs
            .filter(log => log.success)
            .slice(0, 10)
            .map(log => ({
                timestamp: log.timestamp,
                action: log.action,
                details: log.details
            }))

        const health: SystemHealth = {
            diskSpace,
            files: {
                totalPDFs,
                totalJSON,
                totalSize
            },
            parsing: {
                totalParsed,
                totalFailed,
                successRate
            },
            recentErrors,
            recentActivity
        }

        return NextResponse.json({
            success: true,
            health
        })
    } catch (error) {
        console.error('Error fetching system health:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
