import { NextResponse } from 'next/server'
import { scrapeStudentProfiles } from '@/lib/student-scraper'

export async function POST(request: Request) {
    try {
        const { degree, batchNumber } = await request.json()

        if (!degree || !batchNumber) {
            return NextResponse.json(
                { success: false, error: 'Degree and batch number are required' },
                { status: 400 }
            )
        }

        // Validate degree
        const validDegrees = ['it', 'itm', 'ai']
        if (!validDegrees.includes(degree.toLowerCase())) {
            return NextResponse.json(
                { success: false, error: 'Invalid degree. Must be IT, ITM, or AI' },
                { status: 400 }
            )
        }

        // Scrape student profiles
        const result = await scrapeStudentProfiles(degree.toLowerCase(), batchNumber)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Successfully scraped ${result.count} students`,
                count: result.count,
                students: result.students
            })
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to scrape student profiles'
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Error in scrape-students API:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
