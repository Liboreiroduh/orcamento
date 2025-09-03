import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const precos = await db.preco.findMany({
      include: {
        produto: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(precos)
  } catch (error) {
    console.error("Erro ao buscar preços:", error)
    return NextResponse.json(
      { error: "Erro ao buscar preços" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const preco = await db.preco.create({
      data: {
        produtoId: body.produtoId,
        valor: body.valor,
        acessorios: body.acessorios || 0
      },
      include: {
        produto: true
      }
    })
    
    return NextResponse.json(preco, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar preço:", error)
    return NextResponse.json(
      { error: "Erro ao criar preço" },
      { status: 500 }
    )
  }
}