import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
    try {
        const { batch, degreeName } = await request.json()

        if (!batch || !degreeName) {
            return NextResponse.json(
                { success: false, error: 'Batch and degree name are required' },
                { status: 400 }
            )
        }

        const inputDir = path.join(process.cwd(), 'data', 'input')
        const degreePath = path.join(inputDir, batch, degreeName)

        // Check if degree already exists
        try {
            await fs.access(degreePath)
            return NextResponse.json(
                { success: false, error: 'Degree already exists' },
                { status: 400 }
            )
        } catch {
            // Degree doesn't exist, continue
        }

        // Create degree directory
        await fs.mkdir(degreePath, { recursive: true })

        return NextResponse.json({
            success: true,
            message: 'Degree created successfully'
        })
    } catch (error) {
        console.error('Error creating degree:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
