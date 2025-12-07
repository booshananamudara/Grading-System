import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents } from '@/lib/student-aggregator';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const batch = searchParams.get('batch');
        const degree = searchParams.get('degree');

        console.log(`👥 Fetching students... (batch: ${batch || 'legacy'}, degree: ${degree || 'legacy'})`);

        const students = getAllStudents(batch || undefined, degree || undefined);

        console.log(`✅ Found ${students.length} students`);

        return NextResponse.json({
            success: true,
            count: students.length,
            students,
            context: batch && degree ? { batch, degree } : null,
        });
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
