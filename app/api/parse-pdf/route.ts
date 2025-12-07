import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseResultPDF } from '@/lib/parser';
import { ensureOutputDirectory, getOutputPath, extractMetadata } from '@/lib/fs-utils';
import { updateModuleMetadata } from '@/lib/metadata-store';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { pdfPath, credits, moduleCode, moduleName, batch, degree } = body;

        if (!pdfPath) {
            return NextResponse.json(
                { success: false, error: 'Missing pdfPath parameter' },
                { status: 400 }
            );
        }

        if (credits === undefined || credits === null) {
            return NextResponse.json(
                { success: false, error: 'Missing credits parameter' },
                { status: 400 }
            );
        }

        console.log(`📄 Parsing PDF: ${pdfPath} (batch: ${batch || 'legacy'}, degree: ${degree || 'legacy'})`);

        const dataDir = path.join(process.cwd(), 'data');
        let fullPdfPath: string;

        // Construct the correct path based on batch/degree context
        if (batch && degree) {
            // New structure: data/input/[batch]/[degree]/[pdfPath]
            fullPdfPath = path.join(dataDir, 'input', batch, degree, pdfPath);
            console.log(`📂 Full PDF path: ${fullPdfPath}`);
        } else {
            // Legacy structure: data/[pdfPath]
            fullPdfPath = path.join(dataDir, pdfPath);
        }

        // Check if PDF exists
        if (!fs.existsSync(fullPdfPath)) {
            console.error(`❌ PDF not found at: ${fullPdfPath}`);
            return NextResponse.json(
                { success: false, error: `PDF file not found at: ${fullPdfPath}` },
                { status: 404 }
            );
        }

        // Read PDF
        const pdfBuffer = fs.readFileSync(fullPdfPath);

        // Parse PDF to extract student records
        const records = await parseResultPDF(pdfBuffer);

        // Get metadata (year and semester from path)
        const { year, semester } = extractMetadata(pdfPath);

        // Save module metadata
        updateModuleMetadata(pdfPath, {
            moduleCode: moduleCode || 'Unknown',
            moduleName: moduleName || 'Unknown',
            credits,
            year,
            semester,
        });

        // Create enhanced JSON output
        const enhancedOutput = {
            moduleCode: moduleCode || 'Unknown',
            moduleName: moduleName || 'Unknown',
            credits,
            year,
            semester,
            students: records,
        };

        // Get output path with batch/degree context
        const outputPath = getOutputPath(pdfPath, batch, degree);

        // Ensure output directory exists
        ensureOutputDirectory(outputPath);

        // Save JSON
        fs.writeFileSync(outputPath, JSON.stringify(enhancedOutput, null, 2));

        console.log(`✅ Saved ${records.length} records to ${outputPath}`);

        return NextResponse.json({
            success: true,
            recordCount: records.length,
            outputPath: outputPath.replace(/\\/g, '/'),
            moduleCode,
            moduleName,
            credits,
        });
    } catch (error) {
        console.error('❌ Error parsing PDF:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
