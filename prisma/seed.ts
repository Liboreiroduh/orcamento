import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  // Criar vendedores
  const vendedores = await Promise.all([
    prisma.vendedor.create({
      data: { nome: 'João Silva' }
    }),
    prisma.vendedor.create({
      data: { nome: 'Maria Santos' }
    }),
    prisma.vendedor.create({
      data: { nome: 'Pedro Oliveira' }
    }),
    prisma.vendedor.create({
      data: { nome: 'Ana Costa' }
    })
  ])

  console.log('Vendedores criados:', vendedores.length)

  // Criar produtos
  const produtos = await Promise.all([
    // Indoor Rental
    prisma.produto.create({
      data: {
        modelo: 'P2.5 Indoor Rental',
        linha: 'Rental',
        pixelPitch: 2.5,
        gabinete: '500×1000mm',
        peso: 8.5,
        consumo: 120,
        brilho: 800,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP31',
        garantia: 24,
        complementares: 'Cabo de sinal, fonte de alimentação',
        aplicacao: 'Indoor Rental'
      }
    }),
    prisma.produto.create({
      data: {
        modelo: 'P3.0 Indoor Rental',
        linha: 'Rental',
        pixelPitch: 3.0,
        gabinete: '500×1000mm',
        peso: 8.0,
        consumo: 100,
        brilho: 800,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP31',
        garantia: 24,
        complementares: 'Cabo de sinal, fonte de alimentação',
        aplicacao: 'Indoor Rental'
      }
    }),
    
    // Outdoor Rental
    prisma.produto.create({
      data: {
        modelo: 'P4.0 Outdoor Rental',
        linha: 'Rental',
        pixelPitch: 4.0,
        gabinete: '500×1000mm',
        peso: 12.0,
        consumo: 180,
        brilho: 5500,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP65',
        garantia: 24,
        complementares: 'Cabo de sinal, fonte de alimentação, proteção UV',
        aplicacao: 'Outdoor Rental'
      }
    }),
    prisma.produto.create({
      data: {
        modelo: 'P5.0 Outdoor Rental',
        linha: 'Rental',
        pixelPitch: 5.0,
        gabinete: '500×1000mm',
        peso: 11.5,
        consumo: 160,
        brilho: 5500,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP65',
        garantia: 24,
        complementares: 'Cabo de sinal, fonte de alimentação, proteção UV',
        aplicacao: 'Outdoor Rental'
      }
    }),
    
    // Indoor Fixo
    prisma.produto.create({
      data: {
        modelo: 'P2.5 Indoor Fixo',
        linha: 'Fixa',
        pixelPitch: 2.5,
        gabinete: '960×960mm',
        peso: 15.0,
        consumo: 200,
        brilho: 800,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP30',
        garantia: 36,
        complementares: 'Cabo de sinal, fonte de alimentação, estrutura de fixação',
        aplicacao: 'Indoor Fixo'
      }
    }),
    prisma.produto.create({
      data: {
        modelo: 'P3.0 Indoor Fixo',
        linha: 'Fixa',
        pixelPitch: 3.0,
        gabinete: '960×960mm',
        peso: 14.5,
        consumo: 180,
        brilho: 800,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP30',
        garantia: 36,
        complementares: 'Cabo de sinal, fonte de alimentação, estrutura de fixação',
        aplicacao: 'Indoor Fixo'
      }
    }),
    
    // Outdoor Fixo
    prisma.produto.create({
      data: {
        modelo: 'P4.0 Outdoor Fixo',
        linha: 'Fixa',
        pixelPitch: 4.0,
        gabinete: '960×960mm',
        peso: 20.0,
        consumo: 300,
        brilho: 6500,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP66',
        garantia: 36,
        complementares: 'Cabo de sinal, fonte de alimentação, estrutura de fixação, proteção UV',
        aplicacao: 'Outdoor Fixo'
      }
    }),
    prisma.produto.create({
      data: {
        modelo: 'P5.0 Outdoor Fixo',
        linha: 'Fixa',
        pixelPitch: 5.0,
        gabinete: '960×960mm',
        peso: 19.5,
        consumo: 280,
        brilho: 6500,
        voltagem: '110-220V',
        vidaUtil: 100000,
        ipRating: 'IP66',
        garantia: 36,
        complementares: 'Cabo de sinal, fonte de alimentação, estrutura de fixação, proteção UV',
        aplicacao: 'Outdoor Fixo'
      }
    })
  ])

  console.log('Produtos criados:', produtos.length)

  // Criar preços para cada produto
  const precos = await Promise.all([
    // Indoor Rental
    prisma.preco.create({
      data: {
        produtoId: produtos[0].id, // P2.5 Indoor Rental
        valor: 1200.00,
        acessorios: 500.00
      }
    }),
    prisma.preco.create({
      data: {
        produtoId: produtos[1].id, // P3.0 Indoor Rental
        valor: 1000.00,
        acessorios: 500.00
      }
    }),
    
    // Outdoor Rental
    prisma.preco.create({
      data: {
        produtoId: produtos[2].id, // P4.0 Outdoor Rental
        valor: 1800.00,
        acessorios: 800.00
      }
    }),
    prisma.preco.create({
      data: {
        produtoId: produtos[3].id, // P5.0 Outdoor Rental
        valor: 1600.00,
        acessorios: 800.00
      }
    }),
    
    // Indoor Fixo
    prisma.preco.create({
      data: {
        produtoId: produtos[4].id, // P2.5 Indoor Fixo
        valor: 1500.00,
        acessorios: 700.00
      }
    }),
    prisma.preco.create({
      data: {
        produtoId: produtos[5].id, // P3.0 Indoor Fixo
        valor: 1300.00,
        acessorios: 700.00
      }
    }),
    
    // Outdoor Fixo
    prisma.preco.create({
      data: {
        produtoId: produtos[6].id, // P4.0 Outdoor Fixo
        valor: 2200.00,
        acessorios: 1000.00
      }
    }),
    prisma.preco.create({
      data: {
        produtoId: produtos[7].id, // P5.0 Outdoor Fixo
        valor: 2000.00,
        acessorios: 1000.00
      }
    })
  ])

  console.log('Preços criados:', precos.length)
  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })