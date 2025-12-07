import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { parseResultPDF } from '@/lib/parser'
import { logActivity } from '@/lib/activity-logger'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 10

interface UploadResult {
    filename: string
    success: boolean
    error?: string
    parsed?: boolean
    studentCount?: number
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        const batch = formData.get('batch') as string
        const degree = formData.get('degree') as string
        const year = formData.get('year') as string
        const semester = formData.get('semester') as string
        const files = formData.getAll('files') as File[]

        // Validation
        if (!batch || !degree || !year || !semester) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            )
        }

        if (files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No files provided' },
                { status: 400 }
            )
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json(
                { success: false, error: `Maximum ${MAX_FILES} files allowed` },
                { status: 400 }
            )
        }

        // Validate file types and sizes
        for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                return NextResponse.json(
                    { success: false, error: `${file.name} is not a PDF file` },
                    { status: 400 }
                )
            }

            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
                    },
                    { status: 400 }
                )
            }
        }

        // Prepare directories
        const inputDir = path.join(process.cwd(), 'data', 'input', batch, degree, year, semester)
        const outputDir = path.join(process.cwd(), 'data', 'output', batch, degree, year, semester)

        await fs.mkdir(inputDir, { recursive: true })
        await fs.mkdir(outputDir, { recursive: true })

        const results: UploadResult[] = []
        let successCount = 0
        let failedCount = 0

        // Process each file
        for (const file of files) {
            try {
                // Save file
                const buffer = Buffer.from(await file.arrayBuffer())
                const filePath = path.join(inputDir, file.name)
                await fs.writeFile(filePath, buffer)

                // Parse PDF
                let parsed = false
                let studentCount = 0

                try {
                    const students = await parseResultPDF(buffer)

                    if (students && students.length > 0) {
                        // Save parsed data
                        const outputPath = path.join(
                            outputDir,
                            file.name.replace('.pdf', '.json')
                        )

                        await fs.writeFile(
                            outputPath,
                            JSON.stringify(students, null, 2),
                            'utf-8'
                        )

                        parsed = true
                        studentCount = students.length
                    }
                } catch (parseError) {
                    console.error(`Parse error for ${file.name}:`, parseError)
                    // File uploaded but parsing failed
                }

                results.push({
                    filename: file.name,
                    success: true,
                    parsed,
                    studentCount
                })
                successCount++

                // Log activity
                await logActivity('PDF_UPLOADED', {
                    filename: file.name,
                    batch,
                    degree,
                    year,
                    semester,
                    parsed,
                    studentCount
                }, true)
            } catch (error) {
                console.error(`Upload error for ${file.name}:`, error)
                results.push({
                    filename: file.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Upload failed'
                })
                failedCount++
            }
        }

        return NextResponse.json({
            success: true,
            uploaded: successCount,
            failed: failedCount,
            results
        })
    } catch (error) {
        console.error('Upload API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
