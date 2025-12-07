import { NextRequest, NextResponse } from 'next/server';
import { updateModuleMetadata } from '@/lib/metadata-store';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pdfPath, moduleCode, moduleName, credits } = body;

        if (!pdfPath) {
            return NextResponse.json(
                { success: false, error: 'Missing pdfPath parameter' },
                { status: 400 }
            );
        }

        // Build metadata update object (only include provided fields)
        const metadata: any = {};
        if (moduleCode !== undefined) metadata.moduleCode = moduleCode;
        if (moduleName !== undefined) metadata.moduleName = moduleName;
        if (credits !== undefined) metadata.credits = credits;

        // Update metadata
        updateModuleMetadata(pdfPath, metadata);

        console.log(`✅ Updated metadata for ${pdfPath}`);

        return NextResponse.json({
            success: true,
            message: 'Metadata updated successfully',
        });
    } catch (error) {
        console.error('❌ Error updating metadata:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
