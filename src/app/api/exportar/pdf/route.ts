import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import puppeteer from 'puppeteer'
import { join } from 'path'

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

    // Iniciar browser Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Gerar HTML para o PDF
    const html = gerarHTMLPDF(orcamento)

    // Definir conteúdo HTML
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Gerar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    })

    // Fechar browser
    await browser.close()

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta_${orcamento.numeroProposta}.pdf"`
      }
    })

  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json(
      { error: "Erro ao gerar arquivo PDF" },
      { status: 500 }
    )
  }
}

function gerarHTMLPDF(orcamento: any) {
  const data = new Date(orcamento.createdAt).toLocaleDateString('pt-BR')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proposta ${orcamento.numeroProposta}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #fff;
          color: #333;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          box-sizing: border-box;
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1a1a1a;
          border-bottom: 2px solid #ff4444;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .value {
          color: #333;
        }
        .highlight {
          background: linear-gradient(135deg, #ff4444, #ff6644);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
        }
        .highlight .amount {
          font-size: 28px;
          font-weight: bold;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .grid-display {
          display: grid;
          grid-template-columns: repeat(${orcamento.larguraGab}, 1fr);
          gap: 2px;
          max-width: 400px;
          margin: 20px auto;
          background: #333;
          padding: 10px;
          border-radius: 8px;
        }
        .cabinet {
          aspect-ratio: ${orcamento.produto.linha === 'Rental' ? '0.5' : '1'};
          background: #666;
          border: 1px solid #444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
        }
        .capa {
          background: linear-gradient(135deg, #1a1a1a, #333);
          color: white;
          text-align: center;
          padding: 60px 20px;
          border-radius: 15px;
        }
        .capa h1 {
          font-size: 36px;
          margin-bottom: 20px;
        }
        .capa .proposta {
          font-size: 24px;
          margin-bottom: 40px;
        }
        .capa .info {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .fundo {
          background: linear-gradient(135deg, #1a1a1a, #333);
          color: white;
          text-align: center;
          padding: 40px 20px;
          border-radius: 15px;
        }
        .fundo h2 {
          font-size: 24px;
          margin-bottom: 20px;
        }
        .fundo p {
          font-size: 16px;
          margin-bottom: 10px;
        }
        .ficha-tecnica-completa {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .ficha-tecnica-completa .titulo {
          font-size: 20px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 15px;
          text-align: center;
          border-bottom: 2px solid #ff4444;
          padding-bottom: 10px;
        }
        .ficha-tecnica-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .ficha-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .ficha-item:last-child {
          border-bottom: none;
        }
        .ficha-label {
          font-weight: bold;
          color: #555;
        }
        .ficha-value {
          color: #333;
          text-align: right;
        }
        .orcamento-tabela {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .orcamento-tabela th,
        .orcamento-tabela td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .orcamento-tabela th {
          background: linear-gradient(135deg, #ff4444, #ff6644);
          color: white;
          font-weight: bold;
        }
        .orcamento-tabela tr:nth-child(even) {
          background: #f9f9f9;
        }
        .orcamento-tabela .total {
          background: #ff4444 !important;
          color: white;
          font-weight: bold;
        }
        .grid-cabinet {
          display: grid;
          grid-template-columns: repeat(${orcamento.larguraGab}, 1fr);
          gap: 3px;
          max-width: 500px;
          margin: 20px auto;
          background: #2c3e50;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .cabinet-item {
          aspect-ratio: ${orcamento.produto.linha === 'Rental' ? '0.5' : '1'};
          background: linear-gradient(135deg, #34495e, #2c3e50);
          border: 2px solid #1a252f;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .cabinet-item:hover {
          background: linear-gradient(135deg, #3498db, #2980b9);
        }
        .dados-display {
          background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .dados-display h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          text-align: center;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        .info-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ff4444;
        }
        .info-card h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
          font-size: 14px;
        }
        .info-card p {
          margin: 5px 0;
          color: #555;
          font-size: 13px;
        }
        .info-card .valor {
          font-size: 16px;
          font-weight: bold;
          color: #ff4444;
        }
      </style>
    </head>
    <body>
      <!-- Página 1: Capa -->
      <div class="page">
        <div class="capa">
          <h1>LED EXPERT</h1>
          <div class="proposta">PROPOSTA COMERCIAL</div>
          <div class="info">Nº ${orcamento.numeroProposta}</div>
          <div class="info">Data: ${data}</div>
          <div class="info">Vendedor: ${orcamento.vendedor.nome}</div>
          ${orcamento.nomeCliente ? `<div class="info">Cliente: ${orcamento.nomeCliente}</div>` : ''}
          <div style="margin-top: 60px; font-size: 20px;">
            ${orcamento.aplicacao}<br>
            ${orcamento.produto.modelo}
          </div>
        </div>
      </div>

      <!-- Página 2: Ficha Técnica Completa -->
      <div class="page">
        <div class="header">
          <div class="title">FICHA TÉCNICA COMPLETA</div>
          <div class="subtitle">${orcamento.produto.modelo}</div>
        </div>

        <div class="ficha-tecnica-completa">
          <div class="titulo">ESPECIFICAÇÕES TÉCNICAS DETALHADAS</div>
          <div class="ficha-tecnica-grid">
            <div class="ficha-item">
              <span class="ficha-label">Modelo:</span>
              <span class="ficha-value">${orcamento.produto.modelo}</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Linha:</span>
              <span class="ficha-value">${orcamento.produto.linha}</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Pixel Pitch:</span>
              <span class="ficha-value">${orcamento.pixelPitch}mm</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Aplicação:</span>
              <span class="ficha-value">${orcamento.aplicacao}</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Gabinete:</span>
              <span class="ficha-value">${orcamento.produto.gabinete}</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Peso:</span>
              <span class="ficha-value">${orcamento.produto.peso} kg</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Consumo:</span>
              <span class="ficha-value">${orcamento.produto.consumo} W</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Brilho:</span>
              <span class="ficha-value">${orcamento.produto.brilho} nits</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Voltagem:</span>
              <span class="ficha-value">${orcamento.produto.voltagem}</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Vida Útil:</span>
              <span class="ficha-value">${orcamento.produto.vidaUtil.toLocaleString('pt-BR')} horas</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">IP Rating:</span>
              <span class="ficha-value">${orcamento.produto.ipRating}</span>
            </div>
            <div class="ficha-item">
              <span class="ficha-label">Garantia:</span>
              <span class="ficha-value">${orcamento.produto.garantia} meses</span>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <div class="ficha-item">
              <span class="ficha-label">Itens Complementares:</span>
              <span class="ficha-value">${orcamento.produto.complementares}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Página 3: Orçamento Detalhado -->
      <div class="page">
        <div class="header">
          <div class="title">ORÇAMENTO DETALHADO</div>
          <div class="subtitle">Proposta Nº ${orcamento.numeroProposta}</div>
        </div>

        <div class="section">
          <div class="grid">
            <div>
              <span class="label">Tributação:</span>
              <span class="value"> ${orcamento.tributacao}</span>
            </div>
            <div>
              <span class="label">Vendedor:</span>
              <span class="value"> ${orcamento.vendedor.nome}</span>
            </div>
            ${orcamento.nomeCliente ? `
            <div>
              <span class="label">Cliente:</span>
              <span class="value"> ${orcamento.nomeCliente}</span>
            </div>
            <div>
              <span class="label">Data:</span>
              <span class="value"> ${data}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Especificações do Projeto</div>
          <div class="grid">
            <div>
              <span class="label">Largura Nominal:</span>
              <span class="value"> ${orcamento.larguraNominal}m</span>
            </div>
            <div>
              <span class="label">Altura Nominal:</span>
              <span class="value"> ${orcamento.alturaNominal}m</span>
            </div>
            <div>
              <span class="label">Largura Real:</span>
              <span class="value"> ${orcamento.larguraReal}m</span>
            </div>
            <div>
              <span class="label">Altura Real:</span>
              <span class="value"> ${orcamento.alturaReal}m</span>
            </div>
            <div>
              <span class="label">Área Total:</span>
              <span class="value"> ${(orcamento.larguraReal * orcamento.alturaReal).toFixed(2)}m²</span>
            </div>
            <div>
              <span class="label">Total Gabinetes:</span>
              <span class="value"> ${orcamento.totalGabinetes}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resoluções</div>
          <div class="grid">
            <div>
              <span class="label">Resolução Painel:</span>
              <span class="value"> ${orcamento.resolucaoHorizontal.toLocaleString('pt-BR')} × ${orcamento.resolucaoVertical.toLocaleString('pt-BR')} px</span>
            </div>
            <div>
              <span class="label">Resolução Vídeo:</span>
              <span class="value"> ${orcamento.resolucaoVideoHorizontal.toLocaleString('pt-BR')} × ${orcamento.resolucaoVideoVertical.toLocaleString('pt-BR')} px</span>
            </div>
            <div>
              <span class="label">Configuração:</span>
              <span class="value"> ${orcamento.larguraGab} × ${orcamento.alturaGab} gabinetes</span>
            </div>
            <div>
              <span class="label">Peso Total:</span>
              <span class="value"> ${(orcamento.totalGabinetes * orcamento.produto.peso).toFixed(2)} kg</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Tabela de Preços</div>
          <table class="orcamento-tabela">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor Unitário</th>
                <th>Quantidade</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gabinetes ${orcamento.produto.modelo}</td>
                <td>R$ ${orcamento.valorUnitario.toFixed(2)}</td>
                <td>${orcamento.totalGabinetes}</td>
                <td>R$ ${(orcamento.valorUnitario * orcamento.totalGabinetes).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Acessórios e Instalação</td>
                <td>-</td>
                <td>1</td>
                <td>R$ ${orcamento.valorAcessorios.toFixed(2)}</td>
              </tr>
              <tr class="total">
                <td><strong>Valor Total</strong></td>
                <td>-</td>
                <td>-</td>
                <td><strong>R$ ${orcamento.valorTotal.toFixed(2)}</strong></td>
              </tr>
              ${orcamento.tributacao === 'Sem DIFAL' ? `
              <tr>
                <td colspan="3"><strong>Desconto (15%)</strong></td>
                <td><strong>-R$ ${(orcamento.valorTotal * 0.15).toFixed(2)}</strong></td>
              </tr>
              ` : ''}
              <tr class="total">
                <td><strong>VALOR FINAL</strong></td>
                <td>-</td>
                <td>-</td>
                <td><strong>R$ ${orcamento.valorComDesconto.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="highlight">
          <div>VALOR FINAL DA PROPOSTA</div>
          <div class="amount">R$ ${orcamento.valorComDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          ${orcamento.tributacao === 'Sem DIFAL' ? '<div style="font-size: 14px; margin-top: 10px;">* Desconto de 15% aplicado (Sem DIFAL)</div>' : ''}
        </div>
      </div>

      <!-- Página 4: Layout de Gabinetes e Dados Técnicos -->
      <div class="page">
        <div class="header">
          <div class="title">LAYOUT DE GABINETES E DADOS TÉCNICOS</div>
          <div class="subtitle">Configuração: ${orcamento.larguraGab} × ${orcamento.alturaGab}</div>
        </div>

        <div class="section">
          <div class="section-title">Disposição dos Gabinetes</div>
          <div class="grid-cabinet">
            ${Array(orcamento.alturaGab).fill(null).map((_, row) => 
              Array(orcamento.larguraGab).fill(null).map((_, col) => 
                `<div class="cabinet-item">${row + 1}-${col + 1}</div>`
              ).join('')
            ).join('')}
          </div>
          <div style="text-align: center; margin-top: 15px; font-size: 14px; color: #666;">
            Total: ${orcamento.totalGabinetes} gabinetes (${orcamento.larguraGab} × ${orcamento.alturaGab})
          </div>
        </div>

        <div class="dados-display">
          <h3>DADOS TÉCNICOS COMPLETOS DO DISPLAY</h3>
          <div class="info-grid">
            <div class="info-card">
              <h4>Dimensões</h4>
              <p><strong>Largura:</strong> ${orcamento.larguraReal.toFixed(2)}m</p>
              <p><strong>Altura:</strong> ${orcamento.alturaReal.toFixed(2)}m</p>
              <p><strong>Área:</strong> ${(orcamento.larguraReal * orcamento.alturaReal).toFixed(2)}m²</p>
            </div>
            <div class="info-card">
              <h4>Resoluções</h4>
              <p><strong>Painel:</strong> ${orcamento.resolucaoHorizontal.toLocaleString('pt-BR')} × ${orcamento.resolucaoVertical.toLocaleString('pt-BR')} px</p>
              <p><strong>Vídeo:</strong> ${orcamento.resolucaoVideoHorizontal.toLocaleString('pt-BR')} × ${orcamento.resolucaoVideoVertical.toLocaleString('pt-BR')} px</p>
              <p><strong>Total Pixels:</strong> ${(orcamento.resolucaoHorizontal * orcamento.resolucaoVertical).toLocaleString('pt-BR')} px</p>
            </div>
            <div class="info-card">
              <h4>Especificações</h4>
              <p><strong>Pixel Pitch:</strong> ${orcamento.pixelPitch}mm</p>
              <p><strong>Tipo:</strong> ${orcamento.produto.linha}</p>
              <p><strong>IP Rating:</strong> ${orcamento.produto.ipRating}</p>
            </div>
            <div class="info-card">
              <h4>Performance</h4>
              <p><strong>Brilho:</strong> ${orcamento.produto.brilho} nits</p>
              <p><strong>Consumo Total:</strong> ${(orcamento.totalGabinetes * orcamento.produto.consumo).toFixed(2)} W</p>
              <p><strong>Peso Total:</strong> ${(orcamento.totalGabinetes * orcamento.produto.peso).toFixed(2)} kg</p>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informações Adicionais</div>
          <div class="grid">
            <div>
              <span class="label">Voltagem:</span>
              <span class="value"> ${orcamento.produto.voltagem}</span>
            </div>
            <div>
              <span class="label">Vida Útil:</span>
              <span class="value"> ${orcamento.produto.vidaUtil.toLocaleString('pt-BR')} horas</span>
            </div>
            <div>
              <span class="label">Garantia:</span>
              <span class="value"> ${orcamento.produto.garantia} meses</span>
            </div>
            <div>
              <span class="label">Itens Inclusos:</span>
              <span class="value"> ${orcamento.produto.complementares}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Página 5: Fundo -->
      <div class="page">
        <div class="fundo">
          <h2>LED EXPERT</h2>
          <p>Soluções profissionais em painéis de LED</p>
          <p>Qualidade e inovação em cada projeto</p>
          <div style="margin-top: 40px;">
            <p>📞 Contato: (11) 9999-9999</p>
            <p>📧 Email: contato@ledexpert.com.br</p>
            <p>🌐 www.ledexpert.com.br</p>
          </div>
          <div style="margin-top: 40px; font-size: 14px;">
            <p>✅ Esta proposta é válida por 30 dias</p>
            <p>⚠️ Valores sujeitos a alteração sem prévio aviso</p>
            <p>🔧 Instalação e treinamento inclusos</p>
            <p>🛡️ Garantia e suporte técnico especializado</p>
          </div>
          <div style="margin-top: 30px; font-size: 12px; opacity: 0.8;">
            <p>LED Expert - Sistemas de Display Profissionais</p>
            <p>CNPJ: 00.000.000/0001-00</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}