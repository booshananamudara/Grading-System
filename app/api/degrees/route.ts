import { NextRequest, NextResponse } from 'next/server';
import { scanAvailableDegrees, countStudentsInContext, getDegreeInfo } from '@/lib/batch-utils';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const batch = searchParams.get('batch');

        if (!batch) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Batch parameter is required',
                },
                { status: 400 }
            );
        }

        console.log(`🎓 Fetching available degrees for ${batch}...`);

        const degrees = scanAvailableDegrees(batch);

        // Enrich with student counts and data availability
        const enrichedDegrees = degrees.map(degree => {
            const studentCount = countStudentsInContext(batch, degree);
            const degreeInfo = getDegreeInfo(batch, degree);

            return {
                name: degree,
                students: studentCount,
                hasData: degreeInfo?.hasData || false,
            };
        });

        console.log(`✅ Found ${degrees.length} degrees in ${batch}`);

        return NextResponse.json({
            success: true,
            batch,
            count: degrees.length,
            degrees: enrichedDegrees,
        });
    } catch (error) {
        console.error('❌ Error fetching degrees:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
