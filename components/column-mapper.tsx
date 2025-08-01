"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Wand2, RotateCcw, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CsvData {
  headers: string[]
  rows: string[][]
}

interface ColumnMapping {
  [key: string]: {
    rdfProperty: string
    dataType: string
    isSubject?: boolean
    isPredicate?: boolean
    isObject?: boolean
    isAutoMapped?: boolean
  }
}

interface ColumnMapperProps {
  csvData: CsvData
  onMappingComplete: (mapping: ColumnMapping) => void
}

const commonRdfProperties = [
  "http://www.w3.org/2000/01/rdf-schema#label",
  "http://purl.org/dc/terms/title",
  "http://purl.org/dc/terms/description",
  "http://xmlns.com/foaf/0.1/name",
  "http://xmlns.com/foaf/0.1/email",
  "http://xmlns.com/foaf/0.1/age",
  "http://xmlns.com/foaf/0.1/phone",
  "http://schema.org/name",
  "http://schema.org/description",
  "http://schema.org/identifier",
  "http://schema.org/url",
  "http://schema.org/email",
  "http://schema.org/telephone",
  "http://schema.org/address",
  "http://schema.org/addressLocality",
  "http://schema.org/addressRegion",
  "http://schema.org/postalCode",
  "http://schema.org/addressCountry",
  "http://schema.org/dateCreated",
  "http://schema.org/dateModified",
  "http://schema.org/price",
  "http://schema.org/category",
]

const dataTypes = [
  "http://www.w3.org/2001/XMLSchema#string",
  "http://www.w3.org/2001/XMLSchema#integer",
  "http://www.w3.org/2001/XMLSchema#decimal",
  "http://www.w3.org/2001/XMLSchema#boolean",
  "http://www.w3.org/2001/XMLSchema#date",
  "http://www.w3.org/2001/XMLSchema#dateTime",
  "http://www.w3.org/2001/XMLSchema#anyURI",
]

// Plantillas de mapeo predefinidas
const mappingTemplates = {
  personas: {
    name: "Plantilla: Personas",
    mappings: {
      name: { rdfProperty: "http://xmlns.com/foaf/0.1/name", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      nombre: { rdfProperty: "http://xmlns.com/foaf/0.1/name", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      email: { rdfProperty: "http://xmlns.com/foaf/0.1/email", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      correo: { rdfProperty: "http://xmlns.com/foaf/0.1/email", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      age: { rdfProperty: "http://xmlns.com/foaf/0.1/age", dataType: "http://www.w3.org/2001/XMLSchema#integer" },
      edad: { rdfProperty: "http://xmlns.com/foaf/0.1/age", dataType: "http://www.w3.org/2001/XMLSchema#integer" },
      phone: { rdfProperty: "http://xmlns.com/foaf/0.1/phone", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      telefono: { rdfProperty: "http://xmlns.com/foaf/0.1/phone", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      city: { rdfProperty: "http://schema.org/addressLocality", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      ciudad: { rdfProperty: "http://schema.org/addressLocality", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      address: { rdfProperty: "http://schema.org/address", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      direccion: { rdfProperty: "http://schema.org/address", dataType: "http://www.w3.org/2001/XMLSchema#string" },
    },
  },
  productos: {
    name: "Plantilla: Productos",
    mappings: {
      name: { rdfProperty: "http://schema.org/name", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      nombre: { rdfProperty: "http://schema.org/name", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      title: { rdfProperty: "http://purl.org/dc/terms/title", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      titulo: { rdfProperty: "http://purl.org/dc/terms/title", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      description: {
        rdfProperty: "http://schema.org/description",
        dataType: "http://www.w3.org/2001/XMLSchema#string",
      },
      descripcion: {
        rdfProperty: "http://schema.org/description",
        dataType: "http://www.w3.org/2001/XMLSchema#string",
      },
      price: { rdfProperty: "http://schema.org/price", dataType: "http://www.w3.org/2001/XMLSchema#decimal" },
      precio: { rdfProperty: "http://schema.org/price", dataType: "http://www.w3.org/2001/XMLSchema#decimal" },
      category: { rdfProperty: "http://schema.org/category", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      categoria: { rdfProperty: "http://schema.org/category", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      url: { rdfProperty: "http://schema.org/url", dataType: "http://www.w3.org/2001/XMLSchema#anyURI" },
      id: { rdfProperty: "http://schema.org/identifier", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      identifier: { rdfProperty: "http://schema.org/identifier", dataType: "http://www.w3.org/2001/XMLSchema#string" },
    },
  },
  general: {
    name: "Plantilla: General",
    mappings: {
      id: { rdfProperty: "http://schema.org/identifier", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      identifier: { rdfProperty: "http://schema.org/identifier", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      name: {
        rdfProperty: "http://www.w3.org/2000/01/rdf-schema#label",
        dataType: "http://www.w3.org/2001/XMLSchema#string",
      },
      nombre: {
        rdfProperty: "http://www.w3.org/2000/01/rdf-schema#label",
        dataType: "http://www.w3.org/2001/XMLSchema#string",
      },
      title: { rdfProperty: "http://purl.org/dc/terms/title", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      titulo: { rdfProperty: "http://purl.org/dc/terms/title", dataType: "http://www.w3.org/2001/XMLSchema#string" },
      description: {
        rdfProperty: "http://purl.org/dc/terms/description",
        dataType: "http://www.w3.org/2001/XMLSchema#string",
      },
      descripcion: {
        rdfProperty: "http://purl.org/dc/terms/description",
        dataType: "http://www.w3.org/2001/XMLSchema#string",
      },
      date: { rdfProperty: "http://schema.org/dateCreated", dataType: "http://www.w3.org/2001/XMLSchema#date" },
      fecha: { rdfProperty: "http://schema.org/dateCreated", dataType: "http://www.w3.org/2001/XMLSchema#date" },
      url: { rdfProperty: "http://schema.org/url", dataType: "http://www.w3.org/2001/XMLSchema#anyURI" },
    },
  },
}

export default function ColumnMapper({ csvData, onMappingComplete }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [customProperty, setCustomProperty] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("general")
  const [autoMappingEnabled, setAutoMappingEnabled] = useState(true)
  const [savedMappings, setSavedMappings] = useState<{ [key: string]: ColumnMapping }>({})

  // Función para aplicar mapeo automático
  const applyAutoMapping = (templateKey: string = selectedTemplate) => {
    const template = mappingTemplates[templateKey as keyof typeof mappingTemplates]
    if (!template) return

    const newMapping: ColumnMapping = {}
    let autoMappedCount = 0

    csvData.headers.forEach((header) => {
      const lowerHeader = header.toLowerCase().trim()

      // Buscar coincidencia exacta o parcial
      const exactMatch = template.mappings[lowerHeader]
      if (exactMatch) {
        newMapping[header] = {
          ...exactMatch,
          isAutoMapped: true,
        }
        autoMappedCount++
        return
      }

      // Buscar coincidencias parciales
      for (const [templateKey, templateMapping] of Object.entries(template.mappings)) {
        if (lowerHeader.includes(templateKey) || templateKey.includes(lowerHeader)) {
          newMapping[header] = {
            ...templateMapping,
            isAutoMapped: true,
          }
          autoMappedCount++
          break
        }
      }
    })

    setMapping((prev) => ({
      ...prev,
      ...newMapping,
    }))

    return autoMappedCount
  }

  // Aplicar mapeo automático al cargar
  useEffect(() => {
    if (autoMappingEnabled && csvData.headers.length > 0) {
      const mappedCount = applyAutoMapping()
      console.log(`Auto-mapeadas ${mappedCount} columnas de ${csvData.headers.length}`)
    }
  }, [csvData.headers, selectedTemplate, autoMappingEnabled])

  const updateMapping = (column: string, field: string, value: string | boolean) => {
    setMapping((prev) => ({
      ...prev,
      [column]: {
        ...prev[column],
        [field]: value,
        isAutoMapped: false, // Marcar como modificado manualmente
      },
    }))
  }

  const removeMapping = (column: string) => {
    setMapping((prev) => {
      const newMapping = { ...prev }
      delete newMapping[column]
      return newMapping
    })
  }

  const addCustomProperty = () => {
    if (customProperty.trim()) {
      // Agregar la propiedad personalizada a la lista temporal
      setCustomProperty("")
    }
  }

  const resetToAutoMapping = () => {
    setMapping({})
    if (autoMappingEnabled) {
      setTimeout(() => applyAutoMapping(), 100)
    }
  }

  const saveCurrentMapping = () => {
    const mappingName = prompt("Nombre para guardar este mapeo:")
    if (mappingName) {
      setSavedMappings((prev) => ({
        ...prev,
        [mappingName]: { ...mapping },
      }))
    }
  }

  const loadSavedMapping = (mappingName: string) => {
    if (savedMappings[mappingName]) {
      setMapping(savedMappings[mappingName])
    }
  }

  const handleComplete = () => {
    // Validar que al menos una columna esté mapeada
    if (Object.keys(mapping).length === 0) {
      alert("Debes mapear al menos una columna")
      return
    }

    // Asegurar que todas las propiedades mapeadas tengan valores válidos
    const validMapping: ColumnMapping = {}
    Object.entries(mapping).forEach(([column, config]) => {
      if (config.rdfProperty && config.dataType) {
        validMapping[column] = config
      }
    })

    onMappingComplete(validMapping)
  }

  const autoMappedCount = Object.values(mapping).filter((m) => m.isAutoMapped).length
  const manualMappedCount = Object.values(mapping).filter((m) => !m.isAutoMapped).length

  return (
    <div className="space-y-6">
      {/* Panel de Control de Mapeo */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Wand2 className="w-5 h-5" />
            Mapeo Automático Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="auto-mapping" checked={autoMappingEnabled} onCheckedChange={setAutoMappingEnabled} />
            <Label htmlFor="auto-mapping">Habilitar mapeo automático</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Plantilla de Mapeo</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mappingTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => applyAutoMapping()} className="flex-1">
                <Wand2 className="w-4 h-4 mr-2" />
                Aplicar Auto-mapeo
              </Button>
              <Button variant="outline" onClick={resetToAutoMapping}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Estadísticas de Mapeo */}
          <div className="flex gap-4 text-sm">
            <Badge variant="default" className="bg-green-100 text-green-800">
              Auto-mapeadas: {autoMappedCount}
            </Badge>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Manuales: {manualMappedCount}
            </Badge>
            <Badge variant="secondary">Sin mapear: {csvData.headers.length - Object.keys(mapping).length}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Alert>
        <AlertDescription>
          <strong>Mapeo Inteligente Activado:</strong> Las columnas se mapean automáticamente según la plantilla
          seleccionada. Puedes modificar cualquier mapeo o agregar nuevos. Los mapeos automáticos aparecen con una
          etiqueta verde.
        </AlertDescription>
      </Alert>

      {/* Controles Adicionales */}
      <div className="flex gap-2">
        <Input
          placeholder="Agregar propiedad RDF personalizada (ej: http://example.org/property)"
          value={customProperty}
          onChange={(e) => setCustomProperty(e.target.value)}
          className="flex-1"
        />
        <Button onClick={addCustomProperty} variant="outline">
          <Plus className="w-4 h-4" />
        </Button>
        <Button onClick={saveCurrentMapping} variant="outline">
          <Save className="w-4 h-4" />
        </Button>
      </div>

      {/* Mapeos Guardados */}
      {Object.keys(savedMappings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mapeos Guardados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(savedMappings).map((name) => (
                <Button key={name} variant="outline" size="sm" onClick={() => loadSavedMapping(name)}>
                  {name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapeo de Columnas */}
      <div className="space-y-4">
        {csvData.headers.map((header, index) => (
          <Card key={index} className={mapping[header]?.isAutoMapped ? "border-green-200 bg-green-50/30" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Columna: {header}</span>
                  {mapping[header]?.isAutoMapped && (
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                      <Wand2 className="w-3 h-3 mr-1" />
                      Auto-mapeado
                    </Badge>
                  )}
                </div>
                {mapping[header] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMapping(header)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
              <div className="text-sm text-slate-600">
                Ejemplo de datos: <code className="bg-slate-100 px-1 rounded">{csvData.rows[0]?.[index] || "N/A"}</code>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`property-${index}`}>Propiedad RDF</Label>
                  <Select
                    value={mapping[header]?.rdfProperty || ""}
                    onValueChange={(value) => updateMapping(header, "rdfProperty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar propiedad RDF" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonRdfProperties.map((prop) => (
                        <SelectItem key={prop} value={prop}>
                          {prop.split("/").pop() || prop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`datatype-${index}`}>Tipo de Dato</Label>
                  <Select
                    value={mapping[header]?.dataType || ""}
                    onValueChange={(value) => updateMapping(header, "dataType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de dato" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.split("#").pop() || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mapping[header]?.rdfProperty && mapping[header]?.dataType && (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Propiedad: {mapping[header].rdfProperty.split("/").pop()}</Badge>
                  <Badge variant="outline">Tipo: {mapping[header].dataType.split("#").pop()}</Badge>
                  {mapping[header].isAutoMapped && (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Mapeo Automático
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón de Completar */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-slate-600">
          <div>
            Columnas mapeadas: {Object.keys(mapping).length} de {csvData.headers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {autoMappedCount} automáticas • {manualMappedCount} manuales
          </div>
        </div>
        <Button
          onClick={handleComplete}
          disabled={Object.keys(mapping).length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Completar Mapeo
        </Button>
      </div>
    </div>
  )
}
