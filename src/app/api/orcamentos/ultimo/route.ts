import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const ultimoOrcamento = await db.orcamento.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ ultimo: ultimoOrcamento })
  } catch (error) {
    console.error("Erro ao buscar último orçamento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar último orçamento" },
      { status: 500 }
    )
  }
}