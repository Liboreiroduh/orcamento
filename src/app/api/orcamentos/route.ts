import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const orcamentos = await db.orcamento.findMany({
      include: {
        vendedor: true,
        produto: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(orcamentos)
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar orçamentos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const orcamento = await db.orcamento.create({
      data: {
        numeroProposta: body.numeroProposta,
        tributacao: body.tributacao,
        aplicacao: body.aplicacao,
        pixelPitch: body.pixelPitch,
        vendedorId: body.vendedorId,
        larguraNominal: body.larguraNominal,
        alturaNominal: body.alturaNominal,
        larguraGab: body.larguraGab,
        alturaGab: body.alturaGab,
        totalGabinetes: body.totalGabinetes,
        larguraReal: body.larguraReal,
        alturaReal: body.alturaReal,
        resolucaoHorizontal: body.resolucaoHorizontal,
        resolucaoVertical: body.resolucaoVertical,
        resolucaoVideoHorizontal: body.resolucaoVideoHorizontal,
        resolucaoVideoVertical: body.resolucaoVideoVertical,
        valorUnitario: body.valorUnitario,
        valorAcessorios: body.valorAcessorios,
        valorTotal: body.valorTotal,
        valorComDesconto: body.valorComDesconto,
        produtoId: body.produtoId
      },
      include: {
        vendedor: true,
        produto: true
      }
    })
    
    return NextResponse.json(orcamento, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar orçamento:", error)
    return NextResponse.json(
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    )
  }
}