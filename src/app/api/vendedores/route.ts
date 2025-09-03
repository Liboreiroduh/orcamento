import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const vendedores = await db.vendedor.findMany({
      orderBy: {
        nome: 'asc'
      }
    })
    
    return NextResponse.json(vendedores)
  } catch (error) {
    console.error("Erro ao buscar vendedores:", error)
    return NextResponse.json(
      { error: "Erro ao buscar vendedores" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const vendedor = await db.vendedor.create({
      data: {
        nome: body.nome
      }
    })
    
    return NextResponse.json(vendedor, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar vendedor:", error)
    return NextResponse.json(
      { error: "Erro ao criar vendedor" },
      { status: 500 }
    )
  }
}