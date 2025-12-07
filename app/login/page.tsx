"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Users, Shield } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Student login state
    const [batch, setBatch] = useState("")
    const [degree, setDegree] = useState("")
    const [indexNumber, setIndexNumber] = useState("")

    // Lecturer login state
    const [lectureCode, setLectureCode] = useState("")

    // Admin login state
    const [adminPassword, setAdminPassword] = useState("")

    // Available batches and degrees
    const [batches, setBatches] = useState<string[]>([])
    const [degrees, setDegrees] = useState<string[]>([])

    useEffect(() => {
        // Fetch available batches
        fetch('/api/auth/batches')
            .then(res => res.json())
            .then(data => setBatches(data.batches || []))
            .catch(err => console.error('Error fetching batches:', err))
    }, [])

    useEffect(() => {
        if (batch) {
            // Fetch degrees for selected batch
            fetch(`/api/auth/degrees?batch=${encodeURIComponent(batch)}`)
                .then(res => res.json())
                .then(data => setDegrees(data.degrees || []))
                .catch(err => console.error('Error fetching degrees:', err))
        } else {
            setDegrees([])
        }
    }, [batch])

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await signIn('student', {
                batch,
                degree,
                indexNumber,
                redirect: true,
                callbackUrl: `/${batch}/${degree}/students/${indexNumber}`,
            })

            console.log('Student login result:', result)

            if (result?.error) {
                setError('Invalid credentials. Please check your batch, degree, and index number.')
                setLoading(false)
            } else if (result?.ok) {
                // Successful login - wait a moment for session to be established, then redirect
                setTimeout(() => {
                    router.push(`/${batch}/${degree}/students/${indexNumber}`)
                }, 100)
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('An error occurred during login')
            setLoading(false)
        }
    }

    const handleLecturerLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await signIn('lecturer', {
                code: lectureCode,
                redirect: true,
                callbackUrl: '/',
            })

            console.log('Lecturer login result:', result)

            if (result?.error) {
                setError('Invalid lecture code')
                setLoading(false)
            } else if (result?.ok) {
                setTimeout(() => {
                    router.push('/')
                }, 100)
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('An error occurred during login')
            setLoading(false)
        }
    }

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await signIn('admin', {
                password: adminPassword,
                redirect: true,
                callbackUrl: '/admin',
            })

            console.log('Admin login result:', result)

            if (result?.error) {
                setError('Invalid admin password')
                setLoading(false)
            } else if (result?.ok) {
                setTimeout(() => {
                    router.push('/admin')
                }, 100)
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('An error occurred during login')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-2">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Grading System
                    </CardTitle>
                    <CardDescription>Sign in to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Tabs defaultValue="student" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="student" className="gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Student
                            </TabsTrigger>
                            <TabsTrigger value="lecturer" className="gap-2">
                                <Users className="h-4 w-4" />
                                Lecturer
                            </TabsTrigger>
                            <TabsTrigger value="admin" className="gap-2">
                                <Shield className="h-4 w-4" />
                                Admin
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="student">
                            <form onSubmit={handleStudentLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="batch">Batch</Label>
                                    <select
                                        id="batch"
                                        value={batch}
                                        onChange={(e) => setBatch(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    >
                                        <option value="">Select Batch</option>
                                        {batches.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="degree">Degree</Label>
                                    <select
                                        id="degree"
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                        disabled={!batch}
                                    >
                                        <option value="">Select Degree</option>
                                        {degrees.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="indexNumber">Index Number</Label>
                                    <Input
                                        id="indexNumber"
                                        type="text"
                                        placeholder="e.g., 214115C"
                                        value={indexNumber}
                                        onChange={(e) => setIndexNumber(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign in as Student'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="lecturer">
                            <form onSubmit={handleLecturerLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lectureCode">Lecture Code</Label>
                                    <Input
                                        id="lectureCode"
                                        type="text"
                                        placeholder="Enter your lecture code"
                                        value={lectureCode}
                                        onChange={(e) => setLectureCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign in as Lecturer'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="admin">
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adminPassword">Admin Password</Label>
                                    <Input
                                        id="adminPassword"
                                        type="password"
                                        placeholder="Enter admin password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign in as Admin'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
