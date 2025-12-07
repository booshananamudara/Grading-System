"use client"

import { useState, useEffect } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface HierarchicalSelectorProps {
    onSelectionChange: (selection: {
        batch: string
        degree: string
        year: string
        semester: string
    }) => void
}

interface Structure {
    batch: string
    degrees: Array<{
        name: string
        years: Array<{
            name: string
            semesters: Array<{ name: string }>
        }>
    }>
}

export function HierarchicalSelector({ onSelectionChange }: HierarchicalSelectorProps) {
    const [batches, setBatches] = useState<string[]>([])
    const [structure, setStructure] = useState<Structure | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [selectedBatch, setSelectedBatch] = useState("")
    const [selectedDegree, setSelectedDegree] = useState("")
    const [selectedYear, setSelectedYear] = useState("")
    const [selectedSemester, setSelectedSemester] = useState("")

    // Fetch batches on mount
    useEffect(() => {
        fetchBatches()
    }, [])

    // Fetch structure when batch changes
    useEffect(() => {
        if (selectedBatch) {
            fetchStructure(selectedBatch)
        } else {
            setStructure(null)
        }
        setSelectedDegree("")
        setSelectedYear("")
        setSelectedSemester("")
    }, [selectedBatch])

    // Reset downstream selections
    useEffect(() => {
        setSelectedYear("")
        setSelectedSemester("")
    }, [selectedDegree])

    useEffect(() => {
        setSelectedSemester("")
    }, [selectedYear])

    // Notify parent of selection changes
    useEffect(() => {
        if (selectedBatch && selectedDegree && selectedYear && selectedSemester) {
            onSelectionChange({
                batch: selectedBatch,
                degree: selectedDegree,
                year: selectedYear,
                semester: selectedSemester
            })
        }
    }, [selectedBatch, selectedDegree, selectedYear, selectedSemester, onSelectionChange])

    const fetchBatches = async () => {
        try {
            const response = await fetch('/api/admin/batches')
            const data = await response.json()
            if (data.success) {
                setBatches(data.batches.map((b: any) => b.name))
            }
        } catch (error) {
            console.error('Error fetching batches:', error)
        }
    }

    const fetchStructure = async (batch: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/structure?batch=${encodeURIComponent(batch)}`)
            const data = await response.json()
            if (data.success) {
                setStructure(data.structure)
            }
        } catch (error) {
            console.error('Error fetching structure:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const degrees = structure?.degrees || []
    const years = degrees.find(d => d.name === selectedDegree)?.years || []
    const semesters = years.find(y => y.name === selectedYear)?.semesters || []

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Batch Selector */}
            <div className="space-y-2">
                <Label htmlFor="batch">Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger id="batch">
                        <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                        {batches.map((batch) => (
                            <SelectItem key={batch} value={batch}>
                                {batch}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Degree Selector */}
            <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Select
                    value={selectedDegree}
                    onValueChange={setSelectedDegree}
                    disabled={!selectedBatch || isLoading}
                >
                    <SelectTrigger id="degree">
                        <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : (
                            degrees.map((degree) => (
                                <SelectItem key={degree.name} value={degree.name}>
                                    {degree.name}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Year Selector */}
            <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                    disabled={!selectedDegree}
                >
                    <SelectTrigger id="year">
                        <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year.name} value={year.name}>
                                {year.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Semester Selector */}
            <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                    value={selectedSemester}
                    onValueChange={setSelectedSemester}
                    disabled={!selectedYear}
                >
                    <SelectTrigger id="semester">
                        <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                        {semesters.map((semester) => (
                            <SelectItem key={semester.name} value={semester.name}>
                                {semester.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
