import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tipo,
      filtros = {}
    } = body;
    
    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de exportação é obrigatório' },
        { status: 400 }
      );
    }
    
    let data;
    
    switch (tipo) {
      case 'orcamentos':
        data = await exportarOrcamentos(filtros);
        break;
      case 'produtos':
        data = await exportarProdutos(filtros);
        break;
      case 'vendedores':
        data = await exportarVendedores(filtros);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de exportação inválido' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados' },
      { status: 500 }
    );
  }
}

async function exportarOrcamentos(filtros: any) {
  const where: any = {};
  
  if (filtros.status) {
    where.status = filtros.status;
  }
  
  if (filtros.dataInicio && filtros.dataFim) {
    where.data = {
      gte: new Date(filtros.dataInicio),
      lte: new Date(filtros.dataFim)
    };
  }
  
  const orcamentos = await db.orcamento.findMany({
    where,
    include: {
      vendedor: true,
      itens: {
        include: {
          produto: true
        }
      }
    },
    orderBy: { data: 'desc' }
  });
  
  return orcamentos.map(orc => ({
    número: orc.numero,
    cliente: orc.cliente,
    vendedor: orc.vendedor.nome,
    data: orc.data.toISOString().split('T')[0],
    validade: orc.validade.toISOString().split('T')[0],
    status: orc.status,
    total: orc.total,
    observacoes: orc.observacoes || '',
    itens: orc.itens.map(item => ({
      produto: item.produto.nome,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal
    }))
  }));
}

async function exportarProdutos(filtros: any) {
  const where: any = {};
  
  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }
  
  const produtos = await db.produto.findMany({
    where,
    include: {
      precos: {
        orderBy: { data: 'desc' },
        take: 1
      }
    },
    orderBy: { nome: 'asc' }
  });
  
  return produtos.map(produto => ({
    nome: produto.nome,
    descricao: produto.descricao || '',
    preco: produto.preco,
    precoAtual: produto.precos[0]?.valor || produto.preco,
    categoria: produto.categoria || '',
    codigo: produto.codigo || ''
  }));
}

async function exportarVendedores(filtros: any) {
  const where: any = {};
  
  const vendedores = await db.vendedor.findMany({
    where,
    orderBy: { nome: 'asc' }
  });
  
  return vendedores.map(vendedor => ({
    nome: vendedor.nome,
    email: vendedor.email || '',
    telefone: vendedor.telefone || ''
  }));
}