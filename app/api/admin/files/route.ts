import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const batch = searchParams.get('batch')
        const degree = searchParams.get('degree')
        const year = searchParams.get('year')
        const semester = searchParams.get('semester')

        if (!batch || !degree || !year || !semester) {
            return NextResponse.json(
                { success: false, error: 'All parameters required' },
                { status: 400 }
            )
        }

        const inputDir = path.join(process.cwd(), 'data', 'input', batch, degree, year, semester)
        const outputDir = path.join(process.cwd(), 'data', 'output', batch, degree, year, semester)

        // Check if input directory exists
        try {
            await fs.access(inputDir)
        } catch {
            return NextResponse.json({
                success: true,
                files: []
            })
        }

        // Read PDF files
        const entries = await fs.readdir(inputDir, { withFileTypes: true })
        const pdfFiles = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))

        const files = await Promise.all(
            pdfFiles.map(async (file) => {
                const filePath = path.join(inputDir, file.name)
                const stats = await fs.stat(filePath)

                // Check if parsed JSON exists
                const jsonPath = path.join(outputDir, file.name.replace('.pdf', '.json'))
                let parsed = false
                let studentCount: number | undefined
                let error: string | undefined

                try {
                    await fs.access(jsonPath)
                    parsed = true

                    // Try to read student count
                    try {
                        const content = await fs.readFile(jsonPath, 'utf-8')
                        const data = JSON.parse(content)
                        if (Array.isArray(data)) {
                            studentCount = data.length
                        } else if (data.students && Array.isArray(data.students)) {
                            studentCount = data.students.length
                        }
                    } catch {
                        // Can't read student count
                    }
                } catch {
                    // JSON doesn't exist - parse failed or not parsed yet
                    error = 'Not parsed'
                }

                return {
                    filename: file.name,
                    size: stats.size,
                    uploadDate: stats.mtime.toISOString(),
                    parsed,
                    studentCount,
                    error
                }
            })
        )

        return NextResponse.json({
            success: true,
            files
        })
    } catch (error) {
        console.error('Error listing files:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
