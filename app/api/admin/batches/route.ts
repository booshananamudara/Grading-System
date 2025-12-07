import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET() {
    try {
        const inputDir = path.join(process.cwd(), 'data', 'input')

        // Ensure directory exists
        try {
            await fs.access(inputDir)
        } catch {
            return NextResponse.json({
                success: true,
                batches: []
            })
        }

        const entries = await fs.readdir(inputDir, { withFileTypes: true })
        const batches = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)

        // Get statistics for each batch
        const batchesWithStats = await Promise.all(
            batches.map(async (batchName) => {
                const batchPath = path.join(inputDir, batchName)

                // Count degrees
                const degreeEntries = await fs.readdir(batchPath, { withFileTypes: true })
                const degrees = degreeEntries.filter(e => e.isDirectory()).length

                // Get student count and stats - scan output directory for this batch
                const outputDir = path.join(process.cwd(), 'data', 'output', batchName)
                let studentCount = 0
                let topGPA = 0
                let top3Students: Array<{ indexNumber: string; name: string; cgpa: number }> = []

                try {
                    await fs.access(outputDir)

                    // Use the existing API to get students for this batch
                    try {
                        const { getAllStudents } = await import('@/lib/student-aggregator')
                        const students = await getAllStudents(batchName)

                        studentCount = students.length

                        if (studentCount > 0) {
                            // Sort by CGPA descending
                            const sortedStudents = students.sort((a, b) => b.cgpa - a.cgpa)
                            topGPA = sortedStudents[0].cgpa
                            top3Students = sortedStudents.slice(0, 3).map(s => ({
                                indexNumber: s.indexNumber,
                                name: s.name || s.indexNumber,
                                cgpa: s.cgpa
                            }))
                        }
                    } catch (error) {
                        console.error(`Error getting students for ${batchName}:`, error)
                    }
                } catch {
                    // Output directory doesn't exist for this batch
                }

                return {
                    name: batchName,
                    degrees,
                    studentCount,
                    topGPA,
                    top3Students
                }
            })
        )

        return NextResponse.json({
            success: true,
            batches: batchesWithStats
        })
    } catch (error) {
        console.error('Error fetching batches:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const { batchName } = await request.json()

        if (!batchName || typeof batchName !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Invalid batch name' },
                { status: 400 }
            )
        }

        const inputDir = path.join(process.cwd(), 'data', 'input')
        const batchPath = path.join(inputDir, batchName)

        // Check if batch already exists
        try {
            await fs.access(batchPath)
            return NextResponse.json(
                { success: false, error: 'Batch already exists' },
                { status: 400 }
            )
        } catch {
            // Batch doesn't exist, continue
        }

        // Create batch directory
        await fs.mkdir(batchPath, { recursive: true })

        return NextResponse.json({
            success: true,
            message: 'Batch created successfully'
        })
    } catch (error) {
        console.error('Error creating batch:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
