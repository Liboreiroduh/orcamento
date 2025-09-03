"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileSpreadsheet, FileText, Download, Eye, Grid3X3, Info } from "lucide-react"

interface Produto {
  id: string
  modelo: string
  linha: string
  pixelPitch: number
  gabinete: string
  aplicacao: string
}

interface Vendedor {
  id: string
  nome: string
}

interface Preco {
  id: string
  produtoId: string
  valor: number
  acessorios: number
}

interface OrcamentoCalculado {
  larguraGab: number
  alturaGab: number
  totalGabinetes: number
  larguraReal: number
  alturaReal: number
  resolucaoHorizontal: number
  resolucaoVertical: number
  resolucaoVideoHorizontal: number
  resolucaoVideoVertical: number
  valorTotal: number
  valorComDesconto: number
}

export default function Home() {
  const [tributacao, setTributacao] = useState<string>("")
  const [aplicacao, setAplicacao] = useState<string>("")
  const [pixelPitch, setPixelPitch] = useState<string>("")
  const [vendedor, setVendedor] = useState<string>("")
  const [nomeCliente, setNomeCliente] = useState<string>("")
  const [largura, setLargura] = useState<string>("")
  const [altura, setAltura] = useState<string>("")
  
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [precos, setPrecos] = useState<Preco[]>([])
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([])
  
  const [resultado, setResultado] = useState<OrcamentoCalculado | null>(null)
  const [loading, setLoading] = useState(false)
  const [orcamentoSalvo, setOrcamentoSalvo] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, vendRes, precRes] = await Promise.all([
          fetch("/api/produtos"),
          fetch("/api/vendedores"),
          fetch("/api/precos")
        ])
        
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setProdutos(prodData)
        }
        
        if (vendRes.ok) {
          const vendData = await vendRes.json()
          setVendedores(vendData)
        }
        
        if (precRes.ok) {
          const precData = await precRes.json()
          setPrecos(precData)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }
    
    loadData()
  }, [])

  // Filtrar produtos por aplicação
  useEffect(() => {
    if (aplicacao) {
      const filtered = produtos.filter(p => p.aplicacao === aplicacao)
      setFilteredProdutos(filtered)
    } else {
      setFilteredProdutos([])
    }
  }, [aplicacao, produtos])

  const calcularOrcamento = () => {
    if (!tributacao || !aplicacao || !pixelPitch || !vendedor || !largura || !altura) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    setLoading(true)
    
    const larguraNum = parseFloat(largura)
    const alturaNum = parseFloat(altura)
    const pixelPitchNum = parseFloat(pixelPitch)
    
    const produto = produtos.find(p => p.pixelPitch === pixelPitchNum && p.aplicacao === aplicacao)
    const preco = precos.find(p => p.produtoId === produto?.id)
    
    if (!produto || !preco) {
      alert("Produto ou preço não encontrado")
      setLoading(false)
      return
    }

    // Cálculos baseados na linha do produto
    let larguraGab = 0
    let alturaGab = 0
    let larguraReal = 0
    let alturaReal = 0

    if (produto.linha === "Rental") {
      // Gabinete = 0,50 m × 1,00 m
      larguraGab = Math.ceil(larguraNum / 0.50)
      alturaGab = Math.ceil(alturaNum / 1.00)
      larguraReal = larguraGab * 0.50
      alturaReal = alturaGab * 1.00
    } else {
      // Gabinete = 0,96 × 0,96 m
      larguraGab = Math.round(larguraNum / 0.96)
      alturaGab = Math.round(alturaNum / 0.96)
      larguraReal = larguraGab * 0.96
      alturaReal = alturaGab * 0.96
    }

    const totalGabinetes = larguraGab * alturaGab
    
    // Resolução Painel (px)
    const resolucaoHorizontal = Math.round((larguraReal * 1000) / pixelPitchNum)
    const resolucaoVertical = Math.round((alturaReal * 1000) / pixelPitchNum)
    
    // Resolução Vídeo (px)
    const resolucaoVideoHorizontal = resolucaoHorizontal * 2
    const resolucaoVideoVertical = resolucaoVertical * 2
    
    // Cálculo de valores
    const valorTotal = totalGabinetes * preco.valor + preco.acessorios
    const valorComDesconto = tributacao === "Sem DIFAL" ? valorTotal * 0.85 : valorTotal

    setResultado({
      larguraGab,
      alturaGab,
      totalGabinetes,
      larguraReal,
      alturaReal,
      resolucaoHorizontal,
      resolucaoVertical,
      resolucaoVideoHorizontal,
      resolucaoVideoVertical,
      valorTotal,
      valorComDesconto
    })
    
    setLoading(false)
  }

  const salvarOrcamento = async () => {
    if (!resultado) return
    
    try {
      const produto = produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao)
      const preco = precos.find(p => p.produtoId === produto?.id)
      
      if (!produto || !preco) return

      // Gerar número da proposta
      const now = new Date()
      const ano = now.getFullYear()
      const mes = String(now.getMonth() + 1).padStart(2, '0')
      
      // Buscar último orçamento do ano
      const response = await fetch("/api/orcamentos/ultimo")
      const data = await response.json()
      
      let sequencial = 1
      if (data.ultimo) {
        const ultimoAno = parseInt(data.ultimo.numeroProposta.substring(0, 4))
        if (ultimoAno === ano) {
          sequencial = parseInt(data.ultimo.numeroProposta.substring(4, 8)) + 1
        }
      }
      
      const numeroProposta = `${ano}${String(sequencial).padStart(4, '0')}${mes}`

      const orcamentoData = {
        numeroProposta,
        tributacao,
        aplicacao,
        pixelPitch: parseFloat(pixelPitch),
        vendedorId: vendedor,
        nomeCliente: nomeCliente || null,
        larguraNominal: parseFloat(largura),
        alturaNominal: parseFloat(altura),
        larguraGab: resultado.larguraGab,
        alturaGab: resultado.alturaGab,
        totalGabinetes: resultado.totalGabinetes,
        larguraReal: resultado.larguraReal,
        alturaReal: resultado.alturaReal,
        resolucaoHorizontal: resultado.resolucaoHorizontal,
        resolucaoVertical: resultado.resolucaoVertical,
        resolucaoVideoHorizontal: resultado.resolucaoVideoHorizontal,
        resolucaoVideoVertical: resultado.resolucaoVideoVertical,
        valorUnitario: preco.valor,
        valorAcessorios: preco.acessorios,
        valorTotal: resultado.valorTotal,
        valorComDesconto: resultado.valorComDesconto,
        produtoId: produto.id
      }

      const saveResponse = await fetch("/api/orcamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orcamentoData)
      })

      if (saveResponse.ok) {
        const savedOrcamento = await saveResponse.json()
        setOrcamentoSalvo(savedOrcamento)
        alert("Orçamento salvo com sucesso!")
      } else {
        alert("Erro ao salvar orçamento")
      }
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
      alert("Erro ao salvar orçamento")
    }
  }

  const exportarExcel = async () => {
    if (!orcamentoSalvo) {
      alert("Salve o orçamento primeiro")
      return
    }

    try {
      const response = await fetch("/api/exportar/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orcamentoId: orcamentoSalvo.id })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `proposta_${orcamentoSalvo.numeroProposta}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Erro ao gerar arquivo Excel")
      }
    } catch (error) {
      console.error("Erro ao exportar Excel:", error)
      alert("Erro ao exportar Excel")
    }
  }

  const exportarPDF = async () => {
    if (!orcamentoSalvo) {
      alert("Salve o orçamento primeiro")
      return
    }

    try {
      const response = await fetch("/api/exportar/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orcamentoId: orcamentoSalvo.id })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `proposta_${orcamentoSalvo.numeroProposta}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Erro ao gerar arquivo PDF")
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      alert("Erro ao exportar PDF")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">LED Expert - Sistema de Orçamentos</h1>
          <p className="text-gray-300">Soluções profissionais em painéis de LED</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Nova Proposta
                </CardTitle>
                <CardDescription>Preencha os dados para gerar um novo orçamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tributacao">Tributação</Label>
                    <Select value={tributacao} onValueChange={setTributacao}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione a tributação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Com DIFAL">Com DIFAL</SelectItem>
                        <SelectItem value="Sem DIFAL">Sem DIFAL (15% desconto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="aplicacao">Aplicação</Label>
                    <Select value={aplicacao} onValueChange={setAplicacao}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione a aplicação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indoor Rental">Indoor Rental</SelectItem>
                        <SelectItem value="Outdoor Rental">Outdoor Rental</SelectItem>
                        <SelectItem value="Indoor Fixo">Indoor Fixo</SelectItem>
                        <SelectItem value="Outdoor Fixo">Outdoor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pixelPitch">Pixel Pitch (mm)</Label>
                    <Select value={pixelPitch} onValueChange={setPixelPitch} disabled={!aplicacao}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione o pixel pitch" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProdutos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.pixelPitch.toString()}>
                            {produto.pixelPitch}mm - {produto.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vendedor">Vendedor</Label>
                    <Select value={vendedor} onValueChange={setVendedor}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione o vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendedores.map((vendedor) => (
                          <SelectItem key={vendedor.id} value={vendedor.id}>
                            {vendedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nomeCliente">Nome do Cliente</Label>
                    <Input
                      id="nomeCliente"
                      type="text"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      placeholder="Nome do cliente (opcional)"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="largura">Largura Nominal (m)</Label>
                    <Input
                      id="largura"
                      type="number"
                      step="0.1"
                      value={largura}
                      onChange={(e) => setLargura(e.target.value)}
                      placeholder="Ex: 6.0"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="altura">Altura Nominal (m)</Label>
                    <Input
                      id="altura"
                      type="number"
                      step="0.1"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="Ex: 3.0"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={calcularOrcamento} 
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Calculando..." : "Calcular Orçamento"}
                  </Button>
                  
                  {resultado && (
                    <Button 
                      onClick={salvarOrcamento}
                      variant="outline"
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      Salvar Proposta
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="space-y-6">
            {resultado && (
              <>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Resultados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Total Gabinetes</p>
                        <p className="text-2xl font-bold">{resultado.totalGabinetes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Dimensão Real</p>
                        <p className="text-lg">{resultado.larguraReal.toFixed(2)}m × {resultado.alturaReal.toFixed(2)}m</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm text-gray-400">Resolução Painel</p>
                      <p className="text-lg">{resultado.resolucaoHorizontal} × {resultado.resolucaoVertical} px</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Resolução Vídeo</p>
                      <p className="text-lg">{resultado.resolucaoVideoHorizontal} × {resultado.resolucaoVideoVertical} px</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-red-600 to-orange-600 border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Valor Final</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold mb-2">
                        R$ {resultado.valorComDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {tributacao === "Sem DIFAL" && (
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          15% de desconto aplicado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Exportar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-600 hover:bg-gray-700"
                      onClick={exportarExcel}
                      disabled={!orcamentoSalvo}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-600 hover:bg-gray-700"
                      onClick={exportarPDF}
                      disabled={!orcamentoSalvo}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          {/* Preview Completo */}
          {resultado && (
            <div className="lg:col-span-3">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview Completo da Proposta
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      {showPreview ? "Ocultar" : "Mostrar"} Detalhes
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Visualização completa de todas as informações da proposta
                  </CardDescription>
                </CardHeader>
                
                {showPreview && (
                  <CardContent className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-400 mb-2">Proposta</h4>
                        <p className="text-sm text-gray-300">Número: {orcamentoSalvo?.numeroProposta || 'A salvar'}</p>
                        <p className="text-sm text-gray-300">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-gray-300">Tributação: {tributacao}</p>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-400 mb-2">Cliente e Vendedor</h4>
                        <p className="text-sm text-gray-300">Vendedor: {vendedores.find(v => v.id === vendedor)?.nome || 'Não selecionado'}</p>
                        {nomeCliente && (
                          <p className="text-sm text-gray-300">Cliente: {nomeCliente}</p>
                        )}
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-400 mb-2">Produto</h4>
                        <p className="text-sm text-gray-300">Modelo: {produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao)?.modelo || '-'}</p>
                        <p className="text-sm text-gray-300">Aplicação: {aplicacao}</p>
                        <p className="text-sm text-gray-300">Pixel Pitch: {pixelPitch}mm</p>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-400 mb-2">Valores</h4>
                        <p className="text-sm text-gray-300">Total: R$ {resultado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-lg font-bold text-orange-400">
                          Final: R$ {resultado.valorComDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Ficha Técnica Completa */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Ficha Técnica Completa
                      </h3>
                      {(() => {
                        const produto = produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao);
                        if (!produto) return null;
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-gray-700 p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-400 mb-3">Identificação</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Modelo:</span>
                                  <span>{produto.modelo}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Linha:</span>
                                  <span>{produto.linha}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Aplicação:</span>
                                  <span>{produto.aplicacao}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Pixel Pitch:</span>
                                  <span>{produto.pixelPitch}mm</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-700 p-4 rounded-lg">
                              <h4 className="font-semibold text-green-400 mb-3">Especificações Físicas</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Gabinete:</span>
                                  <span>{produto.gabinete}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Peso:</span>
                                  <span>{produto.peso} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Consumo:</span>
                                  <span>{produto.consumo} W</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Voltagem:</span>
                                  <span>{produto.voltagem}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-700 p-4 rounded-lg">
                              <h4 className="font-semibold text-purple-400 mb-3">Performance e Garantia</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Brilho:</span>
                                  <span>{produto.brilho} nits</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Vida Útil:</span>
                                  <span>{produto.vidaUtil.toLocaleString('pt-BR')} horas</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">IP Rating:</span>
                                  <span>{produto.ipRating}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Garantia:</span>
                                  <span>{produto.garantia} meses</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {(() => {
                        const produto = produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao);
                        if (!produto) return null;
                        
                        return (
                          <div className="mt-4 bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-semibold text-orange-400 mb-2">Itens Complementares</h4>
                            <p className="text-sm text-gray-300">{produto.complementares}</p>
                          </div>
                        );
                      })()}
                    </div>

                    <Separator />

                    {/* Layout de Gabinetes */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Grid3X3 className="w-5 h-5" />
                        Layout de Gabinetes
                      </h3>
                      <div className="bg-gray-700 p-6 rounded-lg">
                        <div className="text-center mb-4">
                          <p className="text-lg font-semibold">Configuração: {resultado.larguraGab} × {resultado.alturaGab} gabinetes</p>
                          <p className="text-sm text-gray-400">Total: {resultado.totalGabinetes} gabinetes</p>
                        </div>
                        
                        <div className="flex justify-center">
                          <div 
                            className="grid gap-1 p-4 bg-gray-800 rounded-lg"
                            style={{ 
                              gridTemplateColumns: `repeat(${resultado.larguraGab}, 1fr)`,
                              maxWidth: '400px'
                            }}
                          >
                            {Array(resultado.alturaGab).fill(null).map((_, row) => 
                              Array(resultado.larguraGab).fill(null).map((_, col) => (
                                <div
                                  key={`${row}-${col}`}
                                  className="bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500 rounded flex items-center justify-center text-xs font-bold text-white aspect-square"
                                  style={{ 
                                    aspectRatio: produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao)?.linha === 'Rental' ? '0.5' : '1'
                                  }}
                                >
                                  {row + 1}-{col + 1}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Especificações do Projeto */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">Especificações do Projeto</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-400 mb-3">Dimensões</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Largura Nominal:</span>
                              <span>{largura}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Altura Nominal:</span>
                              <span>{altura}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Largura Real:</span>
                              <span>{resultado.larguraReal.toFixed(2)}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Altura Real:</span>
                              <span>{resultado.alturaReal.toFixed(2)}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Área Total:</span>
                              <span>{(resultado.larguraReal * resultado.alturaReal).toFixed(2)}m²</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-400 mb-3">Resoluções</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Resolução Painel:</span>
                              <span>{resultado.resolucaoHorizontal.toLocaleString('pt-BR')} × {resultado.resolucaoVertical.toLocaleString('pt-BR')} px</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Resolução Vídeo:</span>
                              <span>{resultado.resolucaoVideoHorizontal.toLocaleString('pt-BR')} × {resultado.resolucaoVideoVertical.toLocaleString('pt-BR')} px</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Pixels:</span>
                              <span>{(resultado.resolucaoHorizontal * resultado.resolucaoVertical).toLocaleString('pt-BR')} px</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-400 mb-3">Performance</h4>
                          {(() => {
                            const produto = produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao);
                            if (!produto) return null;
                            
                            return (
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Peso Total:</span>
                                  <span>{(resultado.totalGabinetes * produto.peso).toFixed(2)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Consumo Total:</span>
                                  <span>{(resultado.totalGabinetes * produto.consumo).toFixed(2)} W</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Brilho:</span>
                                  <span>{produto.brilho} nits</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">IP Rating:</span>
                                  <span>{produto.ipRating}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Tabela de Preços */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">Tabela de Preços Detalhada</h3>
                      <div className="bg-gray-700 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-4 bg-gray-600 p-3 font-semibold text-sm">
                          <div>Descrição</div>
                          <div>Valor Unitário</div>
                          <div>Quantidade</div>
                          <div>Total</div>
                        </div>
                        {(() => {
                          const produto = produtos.find(p => p.pixelPitch === parseFloat(pixelPitch) && p.aplicacao === aplicacao);
                          const preco = precos.find(p => p.produtoId === produto?.id);
                          if (!produto || !preco) return null;
                          
                          return (
                            <>
                              <div className="grid grid-cols-4 p-3 border-b border-gray-600 text-sm">
                                <div>Gabinetes {produto.modelo}</div>
                                <div>R$ {preco.valor.toFixed(2)}</div>
                                <div>{resultado.totalGabinetes}</div>
                                <div>R$ {(preco.valor * resultado.totalGabinetes).toFixed(2)}</div>
                              </div>
                              <div className="grid grid-cols-4 p-3 border-b border-gray-600 text-sm">
                                <div>Acessórios e Instalação</div>
                                <div>-</div>
                                <div>1</div>
                                <div>R$ {preco.acessorios.toFixed(2)}</div>
                              </div>
                              <div className="grid grid-cols-4 p-3 bg-red-600 text-white font-semibold text-sm">
                                <div>VALOR FINAL</div>
                                <div>-</div>
                                <div>-</div>
                                <div>R$ {resultado.valorComDesconto.toFixed(2)}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}