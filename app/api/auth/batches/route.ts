import { NextResponse } from 'next/server';
import { getAvailableBatches } from '@/lib/auth';

export async function GET() {
    try {
        const batches = getAvailableBatches();
        return NextResponse.json({ batches });
    } catch (error) {
        return NextResponse.json({ batches: [] }, { status: 500 });
    }
}
