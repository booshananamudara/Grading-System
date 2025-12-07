import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { logActivity } from '@/lib/activity-logger'

interface DeleteRequest {
    files: Array<{
        batch: string
        degree: string
        year: string
        semester: string
        filename: string
    }>
}

interface DeleteResult {
    filename: string
    success: boolean
    error?: string
}

export async function POST(request: NextRequest) {
    try {
        const body: DeleteRequest = await request.json()

        if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No files specified' },
                { status: 400 }
            )
        }

        const results: DeleteResult[] = []
        let deletedCount = 0
        let failedCount = 0

        for (const file of body.files) {
            try {
                // Validate required fields
                if (!file.batch || !file.degree || !file.year || !file.semester || !file.filename) {
                    results.push({
                        filename: file.filename || 'unknown',
                        success: false,
                        error: 'Missing required fields'
                    })
                    failedCount++
                    continue
                }

                // Validate filename (prevent directory traversal)
                if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
                    results.push({
                        filename: file.filename,
                        success: false,
                        error: 'Invalid filename'
                    })
                    failedCount++
                    continue
                }

                const inputPath = path.join(
                    process.cwd(),
                    'data',
                    'input',
                    file.batch,
                    file.degree,
                    file.year,
                    file.semester,
                    file.filename
                )

                const outputPath = path.join(
                    process.cwd(),
                    'data',
                    'output',
                    file.batch,
                    file.degree,
                    file.year,
                    file.semester,
                    file.filename.replace('.pdf', '.json')
                )

                // Delete PDF file
                try {
                    await fs.unlink(inputPath)
                } catch (error) {
                    // File might not exist, continue
                }

                // Delete JSON file
                try {
                    await fs.unlink(outputPath)
                } catch (error) {
                    // File might not exist, continue
                }

                // Log activity
                await logActivity('PDF_DELETED', {
                    filename: file.filename,
                    batch: file.batch,
                    degree: file.degree,
                    year: file.year,
                    semester: file.semester
                }, true)

                results.push({
                    filename: file.filename,
                    success: true
                })
                deletedCount++
            } catch (error) {
                console.error(`Error deleting ${file.filename}:`, error)
                results.push({
                    filename: file.filename,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
                failedCount++

                // Log failed deletion
                await logActivity('PDF_DELETE_FAILED', {
                    filename: file.filename,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }, false)
            }
        }

        return NextResponse.json({
            success: true,
            deleted: deletedCount,
            failed: failedCount,
            results
        })
    } catch (error) {
        console.error('Delete API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
