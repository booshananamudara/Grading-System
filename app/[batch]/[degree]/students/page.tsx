"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { StudentTable } from "@/components/StudentTable"
import { Breadcrumb } from "@/components/Breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Users } from "lucide-react"

interface StudentSummary {
    indexNumber: string
    name: string | null
    photoUrl: string | null
    cgpa: number
    totalCredits: number
    moduleCount: number
}

export default function StudentsPage() {
    const params = useParams()
    const batch = decodeURIComponent(params.batch as string)
    const degree = decodeURIComponent(params.degree as string)

    const [students, setStudents] = useState<StudentSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStudents()
    }, [batch, degree])

    const fetchStudents = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/students?batch=${encodeURIComponent(batch)}&degree=${encodeURIComponent(degree)}`)
            const data = await response.json()

            if (data.success) {
                setStudents(data.students)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Failed to fetch students')
            console.error('Fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const batchNumber = batch.replace(/\D/g, '')

    const avgCGPA = students.length > 0
        ? students.reduce((sum, s) => sum + s.cgpa, 0) / students.length
        : 0

    const totalCredits = students.length > 0
        ? Math.max(...students.map(s => s.totalCredits))
        : 0

    const totalModules = students.length > 0
        ? Math.max(...students.map(s => s.moduleCount))
        : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: "Home", href: "/" },
                        { label: `Batch ${batchNumber}`, href: `/${batch}` },
                        { label: degree },
                        { label: "Students" }
                    ]}
                />

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight">Students</h1>
                                <p className="text-muted-foreground mt-1">
                                    Batch {batchNumber} • {degree} • View academic performance
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="mb-8" />

                {/* Statistics Cards */}
                {!isLoading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Students
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{students.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Average CGPA
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">
                                    {avgCGPA.toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Top CGPA
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {students.length > 0 ? students[0].cgpa.toFixed(2) : '-'}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total GPA Credits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-600">
                                    {totalCredits} / 135
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Modules
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-600">
                                    {totalModules}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content */}
                <Card className="shadow-xl border-2">
                    <CardHeader>
                        <CardTitle>Student List</CardTitle>
                        <CardDescription>
                            Browse all students, view their CGPA, and access detailed academic records
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Spinner size="lg" />
                                <p className="mt-4 text-muted-foreground">Loading students...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-destructive font-medium">Error: {error}</p>
                                <button
                                    onClick={fetchStudents}
                                    className="mt-4 text-sm text-primary hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <StudentTable students={students} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
