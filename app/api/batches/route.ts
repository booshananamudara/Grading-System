import { NextRequest, NextResponse } from 'next/server';
import { scanAvailableBatches, countStudentsInContext, scanAvailableDegrees } from '@/lib/batch-utils';

export async function GET(req: NextRequest) {
    try {
        console.log('📦 Fetching available batches...');

        const batches = scanAvailableBatches();

        // Enrich with student counts and degree information
        const enrichedBatches = batches.map(batch => {
            const degrees = scanAvailableDegrees(batch);
            const totalStudents = degrees.reduce((sum, degree) => {
                return sum + countStudentsInContext(batch, degree);
            }, 0);

            return {
                name: batch,
                degrees: degrees.length,
                students: totalStudents,
            };
        });

        console.log(`✅ Found ${batches.length} batches`);

        return NextResponse.json({
            success: true,
            count: batches.length,
            batches: enrichedBatches,
        });
    } catch (error) {
        console.error('❌ Error fetching batches:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
