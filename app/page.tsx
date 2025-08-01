"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Network, Edit } from "lucide-react"
import CsvUploader from "@/components/csv-uploader"
import ColumnMapper from "@/components/column-mapper"
import TripletsViewer from "@/components/triplets-viewer"
import GraphVisualization from "@/components/graph-visualization"
import JsonEditor from "@/components/json-editor"
import FilterPanel from "@/components/filter-panel"

export interface CsvData {
  headers: string[]
  rows: string[][]
}

export interface ColumnMapping {
  [key: string]: {
    rdfProperty: string
    dataType: string
    isSubject?: boolean
    isPredicate?: boolean
    isObject?: boolean
  }
}

export interface Triplet {
  subject: string
  predicate: string
  object: string
  dataType?: string
}

export default function Home() {
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [triplets, setTriplets] = useState<Triplet[]>([])
  const [filteredTriplets, setFilteredTriplets] = useState<Triplet[]>([])
  const [rdfJson, setRdfJson] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("upload")

  const handleCsvLoad = (data: CsvData) => {
    setCsvData(data)
    setActiveTab("mapping")
  }

  const handleMappingComplete = (mapping: ColumnMapping) => {
    setColumnMapping(mapping)
    setActiveTab("processing")
  }

  const handleTripletsGenerated = (generatedTriplets: Triplet[], jsonData: any) => {
    setTriplets(generatedTriplets)
    setFilteredTriplets(generatedTriplets)
    setRdfJson(jsonData)
    setActiveTab("triplets")
  }

  const handleFilterChange = (filtered: Triplet[]) => {
    setFilteredTriplets(filtered)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Procesador CSV a RDF</h1>
          <p className="text-slate-600 text-lg">Convierte datos CSV en tripletas RDF</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Cargar CSV
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={!csvData} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mapeo
            </TabsTrigger>
            <TabsTrigger
              value="processing"
              disabled={!Object.keys(columnMapping).length}
              className="flex items-center gap-2"
            >
              <Network className="w-4 h-4" />
              Procesar
            </TabsTrigger>
            <TabsTrigger value="triplets" disabled={!triplets.length} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tripletas
            </TabsTrigger>
            <TabsTrigger value="graph" disabled={!triplets.length} className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Grafo
            </TabsTrigger>
            <TabsTrigger value="json" disabled={!rdfJson} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Cargar Archivo CSV
                </CardTitle>
                <CardDescription>Selecciona un archivo CSV para comenzar el procesamiento</CardDescription>
              </CardHeader>
              <CardContent>
                <CsvUploader onCsvLoad={handleCsvLoad} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Mapeo de Columnas
                </CardTitle>
                <CardDescription>Define cómo mapear las columnas CSV a propiedades RDF</CardDescription>
              </CardHeader>
              <CardContent>
                {csvData && <ColumnMapper csvData={csvData} onMappingComplete={handleMappingComplete} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Procesamiento RDF
                </CardTitle>
                <CardDescription>Convierte los datos CSV en tripletas RDF usando Python</CardDescription>
              </CardHeader>
              <CardContent>
                {csvData && columnMapping && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Configuración de Procesamiento</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Filas a procesar:</span> {csvData.rows.length}
                        </div>
                        <div>
                          <span className="font-medium">Columnas mapeadas:</span> {Object.keys(columnMapping).length}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Simular procesamiento y generar tripletas
                        const generatedTriplets: Triplet[] = []
                        const baseUri = "http://example.org/"

                        csvData.rows.forEach((row, index) => {
                          const subject = `${baseUri}entity_${index + 1}`

                          csvData.headers.forEach((header, colIndex) => {
                            if (columnMapping[header]) {
                              const mapping = columnMapping[header]
                              const value = row[colIndex]

                              if (value && value.trim()) {
                                generatedTriplets.push({
                                  subject,
                                  predicate: mapping.rdfProperty,
                                  object: value,
                                  dataType: mapping.dataType,
                                })
                              }
                            }
                          })
                        })

                        const jsonData = {
                          "@context": {
                            "@base": baseUri,
                            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
                          },
                          "@graph": generatedTriplets.map((t) => ({
                            "@id": t.subject,
                            [t.predicate]: {
                              "@value": t.object,
                              "@type": t.dataType,
                            },
                          })),
                        }

                        handleTripletsGenerated(generatedTriplets, jsonData)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                    >
                      Procesar y Generar RDF
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triplets">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <FilterPanel triplets={triplets} onFilterChange={handleFilterChange} />
              </div>
              <div className="lg:col-span-3">
                <TripletsViewer triplets={filteredTriplets} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="graph">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Visualización de Grafo
                </CardTitle>
                <CardDescription>Visualización interactiva del grafo RDF generado</CardDescription>
              </CardHeader>
              <CardContent>
                <GraphVisualization triplets={filteredTriplets} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Editor JSON-LD
                </CardTitle>
                <CardDescription>Edita el JSON-LD generado del RDF</CardDescription>
              </CardHeader>
              <CardContent>{rdfJson && <JsonEditor initialJson={rdfJson} />}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
