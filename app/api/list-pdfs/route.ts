import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { scanPDFDirectory } from '@/lib/fs-utils';
import { loadModuleMetadata } from '@/lib/metadata-store';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const batch = searchParams.get('batch');
        const degree = searchParams.get('degree');

        console.log(`🔍 Scanning for PDF files... (batch: ${batch || 'legacy'}, degree: ${degree || 'legacy'})`);

        let pdfList;
        if (batch && degree) {
            // New context-aware scanning
            pdfList = scanPDFDirectory(undefined, '', batch, degree);
        } else {
            // Legacy scanning for backward compatibility
            const dataDir = path.join(process.cwd(), 'data');
            pdfList = scanPDFDirectory(dataDir);
        }

        // Load metadata
        const metadata = loadModuleMetadata();

        // Merge metadata with PDF list
        const enrichedPdfList = pdfList.map(pdf => {
            const pdfMeta = metadata[pdf.pdfPath];
            return {
                ...pdf,
                moduleCode: pdfMeta?.moduleCode || pdf.moduleCode,
                moduleName: pdfMeta?.moduleName || pdf.moduleName,
                credits: pdfMeta?.credits || null,
            };
        });

        console.log(`✅ Found ${enrichedPdfList.length} PDF files`);

        return NextResponse.json({
            success: true,
            count: enrichedPdfList.length,
            pdfs: enrichedPdfList,
            context: batch && degree ? { batch, degree } : null,
        });
    } catch (error) {
        console.error('❌ Error listing PDFs:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
