import { NextRequest, NextResponse } from 'next/server';
import { getAvailableDegrees } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const batch = searchParams.get('batch');

        if (!batch) {
            return NextResponse.json({ degrees: [] }, { status: 400 });
        }

        const degrees = getAvailableDegrees(batch);
        return NextResponse.json({ degrees });
    } catch (error) {
        return NextResponse.json({ degrees: [] }, { status: 500 });
    }
}
