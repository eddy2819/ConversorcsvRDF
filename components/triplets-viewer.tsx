"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Copy } from "lucide-react"

interface Triplet {
  subject: string
  predicate: string
  object: string
  dataType?: string
}

interface TripletsViewerProps {
  triplets: Triplet[]
}

export default function TripletsViewer({ triplets }: TripletsViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const filteredTriplets = triplets.filter(
    (triplet) =>
      triplet.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      triplet.predicate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      triplet.object.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredTriplets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTriplets = filteredTriplets.slice(startIndex, startIndex + itemsPerPage)

  const exportTriplets = () => {
    const rdfContent = triplets
      .map((t) => `<${t.subject}> <${t.predicate}> "${t.object}"${t.dataType ? `^^<${t.dataType}>` : ""} .`)
      .join("\n")

    const blob = new Blob([rdfContent], { type: "text/turtle" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "triplets.ttl"
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

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
          <span>Tripletas RDF Generadas ({filteredTriplets.length})</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportTriplets}>
              <Download className="w-4 h-4 mr-2" />
              Exportar TTL
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar en tripletas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          {paginatedTriplets.map((triplet, index) => (
            <div key={index} className="border rounded-lg p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sujeto</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {shortenUri(triplet.subject)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(triplet.subject)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Predicado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {shortenUri(triplet.predicate)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(triplet.predicate)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Objeto</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">{triplet.object}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(triplet.object)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  {triplet.dataType && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {shortenUri(triplet.dataType)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
