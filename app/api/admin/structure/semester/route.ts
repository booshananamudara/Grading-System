import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
    try {
        const { batch, degree, year, semesterName } = await request.json()

        if (!batch || !degree || !year || !semesterName) {
            return NextResponse.json(
                { success: false, error: 'Batch, degree, year, and semester name are required' },
                { status: 400 }
            )
        }

        const inputDir = path.join(process.cwd(), 'data', 'input')
        const semesterPath = path.join(inputDir, batch, degree, year, semesterName)

        // Check if semester already exists
        try {
            await fs.access(semesterPath)
            return NextResponse.json(
                { success: false, error: 'Semester already exists' },
                { status: 400 }
            )
        } catch {
            // Semester doesn't exist, continue
        }

        // Create semester directory
        await fs.mkdir(semesterPath, { recursive: true })

        // Also create corresponding output directory
        const outputDir = path.join(process.cwd(), 'data', 'output', batch, degree, year, semesterName)
        await fs.mkdir(outputDir, { recursive: true })

        return NextResponse.json({
            success: true,
            message: 'Semester created successfully'
        })
    } catch (error) {
        console.error('Error creating semester:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
