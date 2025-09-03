import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const produtos = await db.produto.findMany({
      orderBy: {
        pixelPitch: 'asc'
      }
    })
    
    return NextResponse.json(produtos)
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const produto = await db.produto.create({
      data: {
        modelo: body.modelo,
        linha: body.linha,
        pixelPitch: body.pixelPitch,
        gabinete: body.gabinete,
        peso: body.peso,
        consumo: body.consumo,
        brilho: body.brilho,
        voltagem: body.voltagem,
        vidaUtil: body.vidaUtil,
        ipRating: body.ipRating,
        garantia: body.garantia,
        complementares: body.complementares,
        aplicacao: body.aplicacao
      }
    })
    
    return NextResponse.json(produto, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}