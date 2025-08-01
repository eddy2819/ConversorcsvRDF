"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, Check, AlertCircle } from "lucide-react"

interface JsonEditorProps {
  initialJson: any
}

export default function JsonEditor({ initialJson }: JsonEditorProps) {
  const [jsonContent, setJsonContent] = useState(JSON.stringify(initialJson, null, 2))
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const validateJson = (content: string) => {
    try {
      JSON.parse(content)
      setIsValid(true)
      setError(null)
    } catch (err) {
      setIsValid(false)
      setError(err instanceof Error ? err.message : "JSON inválido")
    }
  }

  const handleContentChange = (content: string) => {
    setJsonContent(content)
    validateJson(content)
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonContent(formatted)
      setIsValid(true)
      setError(null)
    } catch (err) {
      setError("No se puede formatear JSON inválido")
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error al copiar:", err)
    }
  }

  const downloadJson = () => {
    const blob = new Blob([jsonContent], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "rdf-data.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonContent)
      const minified = JSON.stringify(parsed)
      setJsonContent(minified)
    } catch (err) {
      setError("No se puede minificar JSON inválido")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Editor JSON-LD</span>
            <Badge variant={isValid ? "default" : "destructive"}>{isValid ? "Válido" : "Inválido"}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={formatJson}>
              Formatear
            </Button>
            <Button variant="outline" size="sm" onClick={minifyJson}>
              Minificar
            </Button>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadJson}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="relative">
          <Textarea
            value={jsonContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`font-mono text-sm min-h-96 ${!isValid ? "border-red-300 focus:border-red-500" : ""}`}
            placeholder="Edita el JSON-LD aquí..."
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-500 bg-white px-2 py-1 rounded">
            {jsonContent.split("\n").length} líneas
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-semibold text-slate-800 mb-2">Información del JSON-LD</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Tamaño:</span> {(jsonContent.length / 1024).toFixed(2)} KB
            </div>
            <div>
              <span className="font-medium">Líneas:</span> {jsonContent.split("\n").length}
            </div>
          </div>

          {isValid && (
            <div className="mt-3 text-xs text-slate-600">
              <p>✓ JSON válido y listo para usar</p>
              <p>✓ Compatible con estándares JSON-LD</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
