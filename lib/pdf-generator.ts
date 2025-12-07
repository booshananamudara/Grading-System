import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ModuleGrade {
    moduleCode: string
    moduleName: string
    credits: number
    grade: string
    year: string
    semester: string
}

interface SemesterData {
    year: string
    semester: string
    sgpa: number
    credits: number
    modules: ModuleGrade[]
}

interface StudentDetails {
    indexNumber: string
    name: string | null
    photoUrl: string | null
    cgpa: number
    totalCredits: number
    semesters: SemesterData[]
    modules: ModuleGrade[]
}

export function generateStudentPDF(student: StudentDetails) {
    const doc = new jsPDF()

    // Set up colors
    const primaryColor: [number, number, number] = [59, 130, 246] // Blue
    const headerBg: [number, number, number] = [241, 245, 249] // Light gray

    // Title
    doc.setFontSize(20)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Academic Performance Report', 105, 20, { align: 'center' })

    // Student Info Section
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    let yPos = 35

    doc.setFont('helvetica', 'bold')
    doc.text('Student Information', 14, yPos)
    yPos += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Index Number: ${student.indexNumber}`, 14, yPos)
    yPos += 5

    if (student.name && student.name !== "Top Links") {
        doc.text(`Name: ${student.name}`, 14, yPos)
        yPos += 5
    }

    doc.text(`CGPA: ${student.cgpa.toFixed(4)}`, 14, yPos)
    yPos += 5
    doc.text(`Total Credits: ${student.totalCredits}`, 14, yPos)
    yPos += 5
    doc.text(`Total Modules: ${student.modules.length}`, 14, yPos)
    yPos += 10

    // Performance Summary
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Performance Summary', 14, yPos)
    yPos += 7

    // Grade distribution
    const gradeDistribution = student.modules.reduce((acc, module) => {
        acc[module.grade] = (acc[module.grade] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E']
    let gradeText = 'Grade Distribution: '
    grades.forEach(grade => {
        if (gradeDistribution[grade]) {
            gradeText += `${grade}: ${gradeDistribution[grade]}  `
        }
    })

    const splitGradeText = doc.splitTextToSize(gradeText, 180)
    doc.text(splitGradeText, 14, yPos)
    yPos += splitGradeText.length * 5 + 5

    // Semester-wise Performance Table
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Semester-wise Performance', 14, yPos)
    yPos += 5

    const semesterTableData = student.semesters.map(sem => [
        sem.year,
        sem.semester,
        sem.sgpa.toFixed(4),
        sem.credits.toString(),
        sem.modules.length.toString()
    ])

    autoTable(doc, {
        startY: yPos,
        head: [['Year', 'Semester', 'SGPA', 'Credits', 'Modules']],
        body: semesterTableData,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // Get the Y position after the table
    yPos = (doc as any).lastAutoTable.finalY + 10

    // Module Details - New Page
    doc.addPage()
    yPos = 20

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Detailed Module Grades', 14, yPos)
    yPos += 10

    // Group modules by semester
    const modulesBySemester: Record<string, ModuleGrade[]> = {}
    student.modules.forEach(module => {
        const key = `${module.year} - Semester ${module.semester}`
        if (!modulesBySemester[key]) {
            modulesBySemester[key] = []
        }
        modulesBySemester[key].push(module)
    })

    // Print modules by semester
    Object.entries(modulesBySemester).forEach(([semesterKey, modules]) => {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage()
            yPos = 20
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(semesterKey, 14, yPos)
        yPos += 5

        const moduleTableData = modules.map(mod => [
            mod.moduleCode,
            mod.moduleName,
            mod.credits.toString(),
            mod.grade
        ])

        autoTable(doc, {
            startY: yPos,
            head: [['Code', 'Module Name', 'Credits', 'Grade']],
            body: moduleTableData,
            theme: 'striped',
            headStyles: {
                fillColor: headerBg,
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            styles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 100 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 }
            }
        })

        yPos = (doc as any).lastAutoTable.finalY + 8
    })

    // Footer on last page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
            `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
            105,
            285,
            { align: 'center' }
        )
    }

    // Save the PDF
    const fileName = student.name && student.name !== "Top Links"
        ? `${student.name.replace(/\s+/g, '_')}_${student.indexNumber}_Report.pdf`
        : `${student.indexNumber}_Report.pdf`

    doc.save(fileName)
}
