"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZoomIn, ZoomOut, RotateCcw, Download, Filter, Eye, EyeOff, Play, Pause } from "lucide-react"

interface Triplet {
  subject: string
  predicate: string
  object: string
  dataType?: string
}

interface Node {
  id: string
  label: string
  type: "subject" | "object"
  x: number
  y: number
  vx?: number
  vy?: number
  connections: number
  visible: boolean
  clusterId?: string
}

interface Edge {
  source: string
  target: string
  label: string
  predicate: string
  visible: boolean
  weight: number
}

interface GraphFilters {
  predicates: string[]
  nodeTypes: string[]
  minConnections: number
  maxConnections: number
  showLabels: boolean
  showIsolatedNodes: boolean
  clusterByPredicate: boolean
  layoutType: "force" | "circular" | "hierarchical" | "grid"
  maxNodes: number
  searchTerm: string
}

interface GraphVisualizationProps {
  triplets: Triplet[]
}

export default function GraphVisualization({ triplets }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  const [allNodes, setAllNodes] = useState<Node[]>([])
  const [allEdges, setAllEdges] = useState<Edge[]>([])
  const [visibleNodes, setVisibleNodes] = useState<Node[]>([])
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>([])

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isAnimating, setIsAnimating] = useState(false)

  const [filters, setFilters] = useState<GraphFilters>({
    predicates: [],
    nodeTypes: ["subject", "object"],
    minConnections: 0,
    maxConnections: 100,
    showLabels: true,
    showIsolatedNodes: true,
    clusterByPredicate: false,
    layoutType: "force",
    maxNodes: 50,
    searchTerm: "",
  })

  const [availablePredicates, setAvailablePredicates] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)

  // Crear nodos y aristas desde las tripletas
  useEffect(() => {
    if (triplets.length === 0) return

    const nodeMap = new Map<string, Node>()
    const edgeList: Edge[] = []
    const predicateSet = new Set<string>()

    triplets.forEach((triplet, index) => {
      predicateSet.add(triplet.predicate)

      // Agregar nodo sujeto
      if (!nodeMap.has(triplet.subject)) {
        nodeMap.set(triplet.subject, {
          id: triplet.subject,
          label: triplet.subject.split("/").pop() || triplet.subject,
          type: "subject",
          x: Math.random() * 400,
          y: Math.random() * 400,
          connections: 0,
          visible: true,
          clusterId: triplet.predicate,
        })
      }

      // Agregar nodo objeto
      const objectId = `${triplet.object}_${index}`
      if (!nodeMap.has(objectId)) {
        nodeMap.set(objectId, {
          id: objectId,
          label: triplet.object.length > 20 ? triplet.object.substring(0, 20) + "..." : triplet.object,
          type: "object",
          x: Math.random() * 400,
          y: Math.random() * 400,
          connections: 0,
          visible: true,
          clusterId: triplet.predicate,
        })
      }

      // Incrementar conexiones
      nodeMap.get(triplet.subject)!.connections++
      nodeMap.get(objectId)!.connections++

      // Agregar arista
      edgeList.push({
        source: triplet.subject,
        target: objectId,
        label: triplet.predicate.split("/").pop() || triplet.predicate,
        predicate: triplet.predicate,
        visible: true,
        weight: 1,
      })
    })

    setAllNodes(Array.from(nodeMap.values()))
    setAllEdges(edgeList)
    setAvailablePredicates(Array.from(predicateSet))

    // Inicializar filtros con todos los predicados seleccionados
    setFilters((prev) => ({
      ...prev,
      predicates: Array.from(predicateSet),
    }))
  }, [triplets])

  // Aplicar filtros
  useEffect(() => {
    let filteredNodes = allNodes.filter((node) => {
      // Filtro por tipo de nodo
      if (!filters.nodeTypes.includes(node.type)) return false

      // Filtro por conexiones
      if (node.connections < filters.minConnections || node.connections > filters.maxConnections) return false

      // Filtro por término de búsqueda
      if (filters.searchTerm && !node.label.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false

      return true
    })

    let filteredEdges = allEdges.filter((edge) => {
      // Filtro por predicados seleccionados
      if (!filters.predicates.includes(edge.predicate)) return false

      // Solo mostrar aristas cuyos nodos están visibles
      const sourceVisible = filteredNodes.some((n) => n.id === edge.source)
      const targetVisible = filteredNodes.some((n) => n.id === edge.target)

      return sourceVisible && targetVisible
    })

    // Filtrar nodos aislados si está deshabilitado
    if (!filters.showIsolatedNodes) {
      const connectedNodeIds = new Set<string>()
      filteredEdges.forEach((edge) => {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
      })
      filteredNodes = filteredNodes.filter((node) => connectedNodeIds.has(node.id))
    }

    // Limitar número máximo de nodos
    if (filteredNodes.length > filters.maxNodes) {
      // Priorizar nodos con más conexiones
      filteredNodes.sort((a, b) => b.connections - a.connections)
      filteredNodes = filteredNodes.slice(0, filters.maxNodes)

      // Actualizar aristas para solo incluir nodos visibles
      const visibleNodeIds = new Set(filteredNodes.map((n) => n.id))
      filteredEdges = filteredEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    }

    // Aplicar layout según el tipo seleccionado
    applyLayout(filteredNodes, filteredEdges, filters.layoutType)

    setVisibleNodes(filteredNodes)
    setVisibleEdges(filteredEdges)
  }, [allNodes, allEdges, filters])

  // Aplicar diferentes tipos de layout
  const applyLayout = (nodes: Node[], edges: Edge[], layoutType: string) => {
    const centerX = 200
    const centerY = 200
    const radius = 150

    switch (layoutType) {
      case "circular":
        nodes.forEach((node, index) => {
          const angle = (2 * Math.PI * index) / nodes.length
          node.x = centerX + radius * Math.cos(angle)
          node.y = centerY + radius * Math.sin(angle)
        })
        break

      case "grid":
        const cols = Math.ceil(Math.sqrt(nodes.length))
        nodes.forEach((node, index) => {
          node.x = (index % cols) * 80 + 50
          node.y = Math.floor(index / cols) * 80 + 50
        })
        break

      case "hierarchical":
        // Agrupar por tipo
        const subjects = nodes.filter((n) => n.type === "subject")
        const objects = nodes.filter((n) => n.type === "object")

        subjects.forEach((node, index) => {
          node.x = ((index * 100) % 400) + 50
          node.y = 100
        })

        objects.forEach((node, index) => {
          node.x = ((index * 100) % 400) + 50
          node.y = 300
        })
        break

      case "force":
      default:
        // Mantener posiciones actuales para simulación de fuerzas
        break
    }
  }

  // Simulación de fuerzas (solo para layout 'force')
  const runForceSimulation = useCallback(() => {
    if (filters.layoutType !== "force" || !isAnimating) return

    const nodes = [...visibleNodes]
    const edges = visibleEdges

    // Aplicar fuerzas
    nodes.forEach((node) => {
      node.vx = (node.vx || 0) * 0.9 // Fricción
      node.vy = (node.vy || 0) * 0.9

      // Fuerza hacia el centro
      const centerForce = 0.01
      node.vx += (200 - node.x) * centerForce
      node.vy += (200 - node.y) * centerForce

      // Repulsión entre nodos
      nodes.forEach((other) => {
        if (node.id !== other.id) {
          const dx = node.x - other.x
          const dy = node.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100 && distance > 0) {
            const force = 50 / (distance * distance)
            node.vx += (dx / distance) * force
            node.vy += (dy / distance) * force
          }
        }
      })
    })

    // Atracción por aristas
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)

      if (source && target) {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0) {
          const force = 0.02
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          source.vx = (source.vx || 0) + fx
          source.vy = (source.vy || 0) + fy
          target.vx = (target.vx || 0) - fx
          target.vy = (target.vy || 0) - fy
        }
      }
    })

    // Actualizar posiciones
    nodes.forEach((node) => {
      node.x += node.vx || 0
      node.y += node.vy || 0

      // Mantener dentro de los límites
      node.x = Math.max(20, Math.min(380, node.x))
      node.y = Math.max(20, Math.min(380, node.y))
    })

    setVisibleNodes(nodes)

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(runForceSimulation)
    }
  }, [visibleNodes, visibleEdges, filters.layoutType, isAnimating])

  useEffect(() => {
    if (isAnimating && filters.layoutType === "force") {
      runForceSimulation()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [runForceSimulation, isAnimating])

  // Renderizado del canvas
  useEffect(() => {
    if (!canvasRef.current || visibleNodes.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()

      // Aplicar transformaciones
      ctx.translate(offset.x, offset.y)
      ctx.scale(scale, scale)

      // Dibujar aristas
      ctx.strokeStyle = "#64748b"
      ctx.lineWidth = 1
      visibleEdges.forEach((edge) => {
        const sourceNode = visibleNodes.find((n) => n.id === edge.source)
        const targetNode = visibleNodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
          // Grosor basado en peso
          ctx.lineWidth = Math.max(1, edge.weight)

          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.stroke()

          // Dibujar etiqueta de la arista si está habilitado
          if (filters.showLabels && scale > 0.5) {
            const midX = (sourceNode.x + targetNode.x) / 2
            const midY = (sourceNode.y + targetNode.y) / 2

            ctx.fillStyle = "#475569"
            ctx.font = "10px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText(edge.label, midX, midY - 5)
          }
        }
      })

      // Dibujar nodos
      visibleNodes.forEach((node) => {
        // Tamaño basado en conexiones
        const nodeSize = Math.max(8, Math.min(20, 8 + node.connections * 2))

        // Color basado en tipo y conexiones
        let fillColor = node.type === "subject" ? "#3b82f6" : "#f59e0b"
        if (node.connections > 5) fillColor = "#ef4444" // Nodos muy conectados en rojo

        // Círculo del nodo
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
        ctx.fillStyle = fillColor
        ctx.fill()
        ctx.strokeStyle = "#1e293b"
        ctx.lineWidth = 2
        ctx.stroke()

        // Etiqueta del nodo si está habilitado
        if (filters.showLabels && scale > 0.3) {
          ctx.fillStyle = "#1e293b"
          ctx.font = `${Math.max(10, 12 * scale)}px sans-serif`
          ctx.textAlign = "center"
          ctx.fillText(node.label, node.x, node.y + nodeSize + 15)
        }

        // Mostrar número de conexiones si el zoom es alto
        if (scale > 1.5) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "8px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(node.connections.toString(), node.x, node.y + 2)
        }
      })

      ctx.restore()
    }

    draw()
  }, [visibleNodes, visibleEdges, scale, offset, filters.showLabels])

  // Controles de interacción
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const zoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3))
  const zoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.3))
  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating)
  }

  const exportGraph = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.download = "filtered-rdf-graph.png"
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const updateFilter = (key: keyof GraphFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const shortenUri = (uri: string) => {
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const parts = uri.split("/")
      return parts[parts.length - 1] || uri
    }
    return uri
  }

  return (
    <div className="space-y-4">
      {/* Panel de Filtros */}
      <Card className={`transition-all duration-300 ${showFilters ? "opacity-100" : "opacity-95"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Grafo
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro de Predicados */}
              <div className="space-y-2">
                <Label>Predicados Visibles</Label>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {availablePredicates.map((predicate) => (
                    <div key={predicate} className="flex items-center space-x-2">
                      <Checkbox
                        id={predicate}
                        checked={filters.predicates.includes(predicate)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter("predicates", [...filters.predicates, predicate])
                          } else {
                            updateFilter(
                              "predicates",
                              filters.predicates.filter((p) => p !== predicate),
                            )
                          }
                        }}
                      />
                      <Label htmlFor={predicate} className="text-xs">
                        {shortenUri(predicate)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtros de Conexiones */}
              <div className="space-y-2">
                <Label>Rango de Conexiones</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Mínimo: {filters.minConnections}</Label>
                    <Slider
                      value={[filters.minConnections]}
                      onValueChange={([value]) => updateFilter("minConnections", value)}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Máximo Nodos: {filters.maxNodes}</Label>
                    <Slider
                      value={[filters.maxNodes]}
                      onValueChange={([value]) => updateFilter("maxNodes", value)}
                      min={10}
                      max={200}
                      step={10}
                    />
                  </div>
                </div>
              </div>

              {/* Opciones de Visualización */}
              <div className="space-y-2">
                <Label>Opciones de Vista</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showLabels"
                      checked={filters.showLabels}
                      onCheckedChange={(checked) => updateFilter("showLabels", checked)}
                    />
                    <Label htmlFor="showLabels" className="text-sm">
                      Mostrar etiquetas
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showIsolated"
                      checked={filters.showIsolatedNodes}
                      onCheckedChange={(checked) => updateFilter("showIsolatedNodes", checked)}
                    />
                    <Label htmlFor="showIsolated" className="text-sm">
                      Nodos aislados
                    </Label>
                  </div>

                  <div>
                    <Label className="text-sm">Layout</Label>
                    <Select value={filters.layoutType} onValueChange={(value) => updateFilter("layoutType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="force">Fuerzas</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                        <SelectItem value="grid">Cuadrícula</SelectItem>
                        <SelectItem value="hierarchical">Jerárquico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            <div>
              <Label>Buscar Nodos</Label>
              <Input
                placeholder="Buscar por nombre de nodo..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
              />
            </div>

            {/* Estadísticas */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">
                Nodos: {visibleNodes.length}/{allNodes.length}
              </Badge>
              <Badge variant="outline">
                Aristas: {visibleEdges.length}/{allEdges.length}
              </Badge>
              <Badge variant="secondary">
                Predicados: {filters.predicates.length}/{availablePredicates.length}
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Grafo Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Grafo RDF Filtrado ({visibleNodes.length} nodos, {visibleEdges.length} aristas)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleAnimation}>
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetView}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportGraph}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-96 border rounded-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Sujetos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>Objetos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Alta conectividad</span>
                </div>
              </div>
              <div className="text-xs text-slate-600">
                Arrastra para mover • Zoom: {(scale * 100).toFixed(0)}% • Layout: {filters.layoutType}
              </div>
              {filters.layoutType === "force" && (
                <div className="text-xs text-slate-500">
                  {isAnimating ? "🟢 Simulación activa" : "⏸️ Simulación pausada"}
                </div>
              )}
            </div>

            {/* Filtros rápidos */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter("predicates", availablePredicates)}
                className="w-full text-xs"
              >
                Mostrar Todo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter("predicates", [])}
                className="w-full text-xs"
              >
                Ocultar Todo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter("minConnections", 2)
                  updateFilter("maxNodes", 30)
                }}
                className="w-full text-xs"
              >
                Solo Conectados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
