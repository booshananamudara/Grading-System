import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

interface Semester {
    name: string
}

interface Year {
    name: string
    semesters: Semester[]
}

interface Degree {
    name: string
    years: Year[]
}

interface BatchStructure {
    batch: string
    degrees: Degree[]
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const batchName = searchParams.get('batch')

        if (!batchName) {
            return NextResponse.json(
                { success: false, error: 'Batch name is required' },
                { status: 400 }
            )
        }

        const inputDir = path.join(process.cwd(), 'data', 'input')
        const batchPath = path.join(inputDir, batchName)

        // Check if batch exists
        try {
            await fs.access(batchPath)
        } catch {
            return NextResponse.json(
                { success: false, error: 'Batch not found' },
                { status: 404 }
            )
        }

        const structure: BatchStructure = {
            batch: batchName,
            degrees: []
        }

        // Read degrees
        const degreeEntries = await fs.readdir(batchPath, { withFileTypes: true })

        for (const degreeEntry of degreeEntries) {
            if (!degreeEntry.isDirectory()) continue

            const degreeName = degreeEntry.name
            const degreePath = path.join(batchPath, degreeName)
            const degree: Degree = {
                name: degreeName,
                years: []
            }

            // Read years
            try {
                const yearEntries = await fs.readdir(degreePath, { withFileTypes: true })

                for (const yearEntry of yearEntries) {
                    if (!yearEntry.isDirectory()) continue

                    const yearName = yearEntry.name
                    const yearPath = path.join(degreePath, yearName)
                    const year: Year = {
                        name: yearName,
                        semesters: []
                    }

                    // Read semesters
                    try {
                        const semesterEntries = await fs.readdir(yearPath, { withFileTypes: true })

                        for (const semesterEntry of semesterEntries) {
                            if (!semesterEntry.isDirectory()) continue

                            year.semesters.push({
                                name: semesterEntry.name
                            })
                        }
                    } catch {
                        // No semesters yet
                    }

                    degree.years.push(year)
                }
            } catch {
                // No years yet
            }

            structure.degrees.push(degree)
        }

        return NextResponse.json({
            success: true,
            structure
        })
    } catch (error) {
        console.error('Error fetching structure:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
