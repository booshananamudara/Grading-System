import fs from 'fs';
import path from 'path';

/**
 * Validate student credentials
 * @param batch - Batch name (e.g., "batch 21")
 * @param degree - Degree name (e.g., "IT")
 * @param indexNumber - Student index number
 * @returns Student data if valid, null otherwise
 */
export async function validateStudent(batch: string, degree: string, indexNumber: string) {
    try {
        console.log('Validating student:', { batch, degree, indexNumber });

        const profilePath = path.join(
            process.cwd(),
            'data',
            'Students',
            batch,
            degree,
            'student-profiles.json'
        );

        console.log('Profile path:', profilePath);
        console.log('File exists:', fs.existsSync(profilePath));

        if (!fs.existsSync(profilePath)) {
            console.log('Profile file not found');
            return null;
        }

        const content = fs.readFileSync(profilePath, 'utf-8');
        const profiles = JSON.parse(content);

        console.log('Looking for index:', indexNumber);
        console.log('Available indexes:', Object.keys(profiles).slice(0, 5));

        const student = profiles[indexNumber];

        console.log('Student found:', student);

        if (student) {
            return {
                indexNumber,
                name: student.name,
                batch,
                degree,
            };
        }

        return null;
    } catch (error) {
        console.error('Error validating student:', error);
        return null;
    }
}

/**
 * Validate lecturer credentials
 * @param code - Lecture code
 * @returns True if valid, false otherwise
 */
export function validateLecturer(code: string): boolean {
    const validCodes = [
        process.env.LECTURE_CODE1,
        process.env.LECTURE_CODE2,
        process.env.LECTURE_CODE3,
    ];

    return validCodes.includes(code);
}

/**
 * Validate admin credentials
 * @param password - Admin password
 * @returns True if valid, false otherwise
 */
export function validateAdmin(password: string): boolean {
    return password === process.env.ADMIN_PASSWORD;
}

/**
 * Get available batches from file system
 */
export function getAvailableBatches(): string[] {
    try {
        const studentsDir = path.join(process.cwd(), 'data', 'Students');

        if (!fs.existsSync(studentsDir)) {
            return [];
        }

        const entries = fs.readdirSync(studentsDir, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort();
    } catch (error) {
        console.error('Error getting batches:', error);
        return [];
    }
}

/**
 * Get available degrees for a batch
 */
export function getAvailableDegrees(batch: string): string[] {
    try {
        const batchDir = path.join(process.cwd(), 'data', 'Students', batch);

        if (!fs.existsSync(batchDir)) {
            return [];
        }

        const entries = fs.readdirSync(batchDir, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort();
    } catch (error) {
        console.error('Error getting degrees:', error);
        return [];
    }
}
