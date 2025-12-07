import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { getAllStudents } from '@/lib/student-aggregator'

interface GradeDistribution {
    [grade: string]: number
}

interface BatchStats {
    name: string
    studentCount: number
    averageCGPA: number
    topGPA: number
    degrees: number
    topStudents: Array<{
        indexNumber: string
        name: string | null
        cgpa: number
    }>
    gradeDistribution: GradeDistribution
}

export async function GET() {
    try {
        const inputDir = path.join(process.cwd(), 'data', 'input')

        if (!fs.existsSync(inputDir)) {
            return NextResponse.json({
                success: true,
                overall: {
                    totalBatches: 0,
                    totalStudents: 0,
                    averageCGPA: 0,
                    totalPDFs: 0
                },
                batches: [],
                topStudentsGlobal: []
            })
        }

        // Get all batches
        const batchNames = fs.readdirSync(inputDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        // Count total PDFs
        let totalPDFs = 0
        const countPDFs = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name)
                if (entry.isDirectory()) {
                    countPDFs(fullPath)
                } else if (entry.name.toLowerCase().endsWith('.pdf')) {
                    totalPDFs++
                }
            }
        }
        countPDFs(inputDir)

        // Get global students
        const allStudents = getAllStudents()
        const totalStudents = allStudents.length
        const averageCGPA = totalStudents > 0
            ? allStudents.reduce((sum, s) => sum + s.cgpa, 0) / totalStudents
            : 0

        // Get top 10 students globally
        const topStudentsGlobal = allStudents.slice(0, 10).map(s => ({
            indexNumber: s.indexNumber,
            name: s.name,
            cgpa: s.cgpa,
            totalCredits: s.totalCredits,
            moduleCount: s.moduleCount
        }))

        // Get stats for each batch
        const batchStats: BatchStats[] = []

        for (const batchName of batchNames) {
            const batchPath = path.join(inputDir, batchName)

            // Count degrees
            const degreeCount = fs.readdirSync(batchPath, { withFileTypes: true })
                .filter(d => d.isDirectory()).length

            // Get students for this batch
            const batchStudents = getAllStudents(batchName)

            if (batchStudents.length === 0) {
                batchStats.push({
                    name: batchName,
                    studentCount: 0,
                    averageCGPA: 0,
                    topGPA: 0,
                    degrees: degreeCount,
                    topStudents: [],
                    gradeDistribution: {}
                })
                continue
            }

            const batchAvgCGPA = batchStudents.reduce((sum, s) => sum + s.cgpa, 0) / batchStudents.length
            const topGPA = batchStudents[0]?.cgpa || 0

            // Get top 3 students for this batch
            const topStudents = batchStudents.slice(0, 3).map(s => ({
                indexNumber: s.indexNumber,
                name: s.name,
                cgpa: s.cgpa
            }))

            // Calculate grade distribution (from all modules)
            const gradeDistribution: GradeDistribution = {}

            // Read all JSON files for this batch to get grade data
            const outputDir = path.join(process.cwd(), 'data', 'output', batchName)
            if (fs.existsSync(outputDir)) {
                const findJSONFiles = (dir: string): string[] => {
                    const results: string[] = []
                    const entries = fs.readdirSync(dir, { withFileTypes: true })
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name)
                        if (entry.isDirectory()) {
                            results.push(...findJSONFiles(fullPath))
                        } else if (entry.name.endsWith('.json') && !entry.name.includes('metadata')) {
                            results.push(fullPath)
                        }
                    }
                    return results
                }

                const jsonFiles = findJSONFiles(outputDir)
                for (const filePath of jsonFiles) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8')
                        const data = JSON.parse(content)
                        if (data.students && Array.isArray(data.students)) {
                            for (const student of data.students) {
                                const grade = student.grade
                                if (grade) {
                                    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1
                                }
                            }
                        }
                    } catch (error) {
                        // Skip invalid files
                    }
                }
            }

            batchStats.push({
                name: batchName,
                studentCount: batchStudents.length,
                averageCGPA: batchAvgCGPA,
                topGPA,
                degrees: degreeCount,
                topStudents,
                gradeDistribution
            })
        }

        return NextResponse.json({
            success: true,
            overall: {
                totalBatches: batchNames.length,
                totalStudents,
                averageCGPA,
                totalPDFs
            },
            batches: batchStats,
            topStudentsGlobal
        })
    } catch (error) {
        console.error('Error fetching admin statistics:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
