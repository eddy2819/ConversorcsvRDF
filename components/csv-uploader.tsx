"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CsvData {
  headers: string[]
  rows: string[][]
}

interface CsvUploaderProps {
  onCsvLoad: (data: CsvData) => void
}

export default function CsvUploader({ onCsvLoad }: CsvUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CsvData | null>(null)

  const parseCsv = (text: string): CsvData => {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim().replace(/"/g, "")))

    return { headers, rows }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const csvData = parseCsv(text)

      if (csvData.headers.length === 0) {
        throw new Error("El archivo CSV no contiene encabezados válidos")
      }

      setPreview(csvData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo")
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  })

  const handleConfirm = () => {
    if (preview) {
      onCsvLoad(preview)
    }
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <Upload className="w-12 h-12 text-slate-400" />
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isDragActive ? "Suelta el archivo aquí" : "Arrastra un archivo CSV aquí"}
            </p>
            <p className="text-sm text-slate-500 mt-1">o haz clic para seleccionar un archivo</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Procesando archivo...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vista Previa del CSV
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Columnas:</span> {preview.headers.length}
              </div>
              <div>
                <span className="font-medium">Filas:</span> {preview.rows.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    {preview.headers.map((header, index) => (
                      <th key={index} className="px-3 py-2 text-left font-medium text-slate-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-slate-200">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-slate-600">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 5 && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Mostrando las primeras 5 filas de {preview.rows.length} total
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Confirmar y Continuar
          </button>
        </div>
      )}
    </div>
  )
}
