"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"

interface Triplet {
  subject: string
  predicate: string
  object: string
  dataType?: string
}

interface FilterPanelProps {
  triplets: Triplet[]
  onFilterChange: (filtered: Triplet[]) => void
}

export default function FilterPanel({ triplets, onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    subject: "",
    predicate: "",
    object: "",
    dataType: "",
    subjectContains: "",
    objectContains: "",
  })

  const [uniqueValues, setUniqueValues] = useState({
    subjects: [] as string[],
    predicates: [] as string[],
    dataTypes: [] as string[],
  })

  useEffect(() => {
    // Extraer valores únicos para los filtros
    const subjects = [...new Set(triplets.map((t) => t.subject))].sort()
    const predicates = [...new Set(triplets.map((t) => t.predicate))].sort()
    const dataTypes = [...new Set(triplets.map((t) => t.dataType).filter(Boolean))].sort()

    setUniqueValues({ subjects, predicates, dataTypes })
  }, [triplets])

  useEffect(() => {
    // Aplicar filtros
    let filtered = triplets

    if (filters.subject) {
      filtered = filtered.filter((t) => t.subject === filters.subject)
    }

    if (filters.predicate) {
      filtered = filtered.filter((t) => t.predicate === filters.predicate)
    }

    if (filters.dataType) {
      filtered = filtered.filter((t) => t.dataType === filters.dataType)
    }

    if (filters.subjectContains) {
      filtered = filtered.filter((t) => t.subject.toLowerCase().includes(filters.subjectContains.toLowerCase()))
    }

    if (filters.objectContains) {
      filtered = filtered.filter((t) => t.object.toLowerCase().includes(filters.objectContains.toLowerCase()))
    }

    onFilterChange(filtered)
  }, [filters, triplets, onFilterChange])

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      subject: "",
      predicate: "",
      object: "",
      dataType: "",
      subjectContains: "",
      objectContains: "",
    })
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "")

  const shortenUri = (uri: string) => {
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const parts = uri.split("/")
      return parts[parts.length - 1] || uri
    }
    return uri
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="subject-filter">Sujeto Específico</Label>
          <Select value={filters.subject} onValueChange={(value) => updateFilter("subject", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los sujetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los sujetos</SelectItem>
              {uniqueValues.subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {shortenUri(subject)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="predicate-filter">Predicado Específico</Label>
          <Select value={filters.predicate} onValueChange={(value) => updateFilter("predicate", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los predicados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los predicados</SelectItem>
              {uniqueValues.predicates.map((predicate) => (
                <SelectItem key={predicate} value={predicate}>
                  {shortenUri(predicate)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="datatype-filter">Tipo de Dato</Label>
          <Select value={filters.dataType} onValueChange={(value) => updateFilter("dataType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {uniqueValues.dataTypes.map((dataType) => (
                <SelectItem key={dataType} value={dataType}>
                  {shortenUri(dataType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject-contains">Sujeto Contiene</Label>
          <Input
            id="subject-contains"
            placeholder="Buscar en sujetos..."
            value={filters.subjectContains}
            onChange={(e) => updateFilter("subjectContains", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="object-contains">Objeto Contiene</Label>
          <Input
            id="object-contains"
            placeholder="Buscar en objetos..."
            value={filters.objectContains}
            onChange={(e) => updateFilter("objectContains", e.target.value)}
          />
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-slate-600">
            <div>Total de tripletas: {triplets.length}</div>
            <div>
              Filtradas:{" "}
              {triplets.length -
                (triplets.length - Object.keys(filters).filter((k) => filters[k as keyof typeof filters]).length)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
