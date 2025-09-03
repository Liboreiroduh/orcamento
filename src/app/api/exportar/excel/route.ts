import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orcamentoId } = body

    if (!orcamentoId) {
      return NextResponse.json(
        { error: "ID do orçamento não fornecido" },
        { status: 400 }
      )
    }

    // Buscar dados completos do orçamento
    const orcamento = await db.orcamento.findUnique({
      where: { id: orcamentoId },
      include: {
        vendedor: true,
        produto: true
      }
    })

    if (!orcamento) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      )
    }

    // Criar dados para o Excel
    const dadosExcel = [
      // Cabeçalho
      ['LED EXPERT - PROPOSTA COMERCIAL'],
      [''],
      ['Informações da Proposta'],
      ['Número da Proposta', orcamento.numeroProposta],
      ['Data', new Date(orcamento.createdAt).toLocaleDateString('pt-BR')],
      ['Vendedor', orcamento.vendedor.nome],
      ['Tributação', orcamento.tributacao],
      [''],
      ['Especificações Técnicas'],
      ['Aplicação', orcamento.aplicacao],
      ['Modelo', orcamento.produto.modelo],
      ['Pixel Pitch', `${orcamento.pixelPitch}mm`],
      ['Linha', orcamento.produto.linha],
      [''],
      ['Dimensões'],
      ['Largura Nominal', `${orcamento.larguraNominal}m`],
      ['Altura Nominal', `${orcamento.alturaNominal}m`],
      ['Largura Real', `${orcamento.larguraReal}m`],
      ['Altura Real', `${orcamento.alturaReal}m`],
      ['Gabinetes (L × A)', `${orcamento.larguraGab} × ${orcamento.alturaGab}`],
      ['Total de Gabinetes', orcamento.totalGabinetes],
      [''],
      ['Resoluções'],
      ['Resolução Painel', `${orcamento.resolucaoHorizontal} × ${orcamento.resolucaoVertical} px`],
      ['Resolução Vídeo', `${orcamento.resolucaoVideoHorizontal} × ${orcamento.resolucaoVideoVertical} px`],
      [''],
      ['Ficha Técnica do Produto'],
      ['Gabinete', orcamento.produto.gabinete],
      ['Peso', `${orcamento.produto.peso} kg`],
      ['Consumo', `${orcamento.produto.consumo} W`],
      ['Brilho', `${orcamento.produto.brilho} nits`],
      ['Voltagem', orcamento.produto.voltagem],
      ['Vida Útil', `${orcamento.produto.vidaUtil} horas`],
      ['IP Rating', orcamento.produto.ipRating],
      ['Garantia', `${orcamento.produto.garantia} meses`],
      ['Itens Complementares', orcamento.produto.complementares],
      [''],
      ['Valores'],
      ['Valor Unitário por Gabinete', `R$ ${orcamento.valorUnitario.toFixed(2)}`],
      ['Valor dos Acessórios', `R$ ${orcamento.valorAcessorios.toFixed(2)}`],
      ['Valor Total', `R$ ${orcamento.valorTotal.toFixed(2)}`],
      ['Valor com Desconto', `R$ ${orcamento.valorComDesconto.toFixed(2)}`],
      [''],
      ['Observações'],
      [orcamento.tributacao === 'Sem DIFAL' ? 'Desconto de 15% aplicado (Sem DIFAL)' : 'Tributação normal (Com DIFAL)']
    ]

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(dadosExcel)

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 25 }, // Coluna A
      { wch: 20 }  // Coluna B
    ]
    ws['!cols'] = colWidths

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Proposta')

    // Gerar buffer do arquivo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    // Retornar arquivo Excel
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="proposta_${orcamento.numeroProposta}.xlsx"`
      }
    })

  } catch (error) {
    console.error("Erro ao gerar Excel:", error)
    return NextResponse.json(
      { error: "Erro ao gerar arquivo Excel" },
      { status: 500 }
    )
  }
}