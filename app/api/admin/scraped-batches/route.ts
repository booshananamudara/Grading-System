import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET() {
    try {
        const studentsDir = path.join(process.cwd(), 'data', 'Students')

        // Check if Students directory exists
        try {
            await fs.access(studentsDir)
        } catch {
            return NextResponse.json({
                success: true,
                scraped: []
            })
        }

        const scrapedBatches: Array<{
            batch: string
            degree: string
            studentCount: number
            scrapedAt: string
        }> = []

        // Scan all batches
        const batchEntries = await fs.readdir(studentsDir, { withFileTypes: true })

        for (const batchEntry of batchEntries) {
            if (!batchEntry.isDirectory()) continue

            const batchName = batchEntry.name
            const batchPath = path.join(studentsDir, batchName)

            // Scan all degrees in this batch
            const degreeEntries = await fs.readdir(batchPath, { withFileTypes: true })

            for (const degreeEntry of degreeEntries) {
                if (!degreeEntry.isDirectory()) continue

                const degreeName = degreeEntry.name
                const profilePath = path.join(batchPath, degreeName, 'student-profiles.json')

                // Check if profile file exists
                try {
                    await fs.access(profilePath)

                    // Read profile to get student count
                    const content = await fs.readFile(profilePath, 'utf-8')
                    const profiles = JSON.parse(content)
                    const studentCount = Object.keys(profiles).length

                    // Get file modification time
                    const stats = await fs.stat(profilePath)

                    scrapedBatches.push({
                        batch: batchName,
                        degree: degreeName,
                        studentCount,
                        scrapedAt: stats.mtime.toISOString()
                    })
                } catch {
                    // Profile doesn't exist, skip
                }
            }
        }

        return NextResponse.json({
            success: true,
            scraped: scrapedBatches
        })
    } catch (error) {
        console.error('Error fetching scraped batches:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
