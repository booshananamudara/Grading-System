import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
    try {
        const { batch, degree, yearName } = await request.json()

        if (!batch || !degree || !yearName) {
            return NextResponse.json(
                { success: false, error: 'Batch, degree, and year name are required' },
                { status: 400 }
            )
        }

        const inputDir = path.join(process.cwd(), 'data', 'input')
        const yearPath = path.join(inputDir, batch, degree, yearName)

        // Check if year already exists
        try {
            await fs.access(yearPath)
            return NextResponse.json(
                { success: false, error: 'Year already exists' },
                { status: 400 }
            )
        } catch {
            // Year doesn't exist, continue
        }

        // Create year directory
        await fs.mkdir(yearPath, { recursive: true })

        return NextResponse.json({
            success: true,
            message: 'Year created successfully'
        })
    } catch (error) {
        console.error('Error creating year:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
