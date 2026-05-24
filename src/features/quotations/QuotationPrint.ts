import logoUrl from '@/assets/logo-sinfondo.png'

interface QuotationPrintData {
  code: string
  created_at: string
  valid_until: string
  customer_name: string
  customer_ci?: string
  customer_phone?: string
  customer_address?: string
  notes?: string
  subtotal: number
  discount: number
  total: number
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
  status?: string
}

export function printQuotation(data: QuotationPrintData) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const statusLabel = data.status === 'approved' ? 'APROBADA' : data.status === 'cancelled' ? 'CANCELADA' : data.status === 'expired' ? 'EXPIRADA' : ''
  const statusBadge = statusLabel
    ? `<div style="position:absolute;top:10px;right:10px;background:${data.status === 'approved' ? '#16a34a' : '#dc2626'};color:#fff;padding:4px 14px;font-size:12px;font-weight:bold;border-radius:4px;letter-spacing:1px;">${statusLabel}</div>`
    : ''

  const createdDate = new Date(data.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const validDate = new Date(data.valid_until + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const html = `
    <html>
      <head>
        <title>Cotización ${data.code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; position: relative; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #1a1a1a; padding-bottom: 15px; }
          .header .brand { display: flex; align-items: center; gap: 12px; }
          .header .logo { max-width: 80px; }
          .header .brand-text h1 { font-size: 22px; margin: 0; letter-spacing: 1px; }
          .header .brand-text p { font-size: 11px; color: #666; margin-top: 2px; }
          .header .doc-info { text-align: right; }
          .header .doc-info .code { font-size: 20px; font-weight: bold; color: #1a1a1a; }
          .header .doc-info .dates { font-size: 11px; color: #555; margin-top: 5px; line-height: 1.6; }
          
          .client-box { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px; }
          .client-box h3 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 6px; letter-spacing: 1px; }
          .client-box .name { font-size: 16px; font-weight: bold; }
          .client-box .detail { font-size: 12px; color: #555; margin-top: 3px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #1a1a1a; color: #fff; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          thead th:first-child { border-radius: 4px 0 0 0; }
          thead th:last-child { border-radius: 0 4px 0 0; }
          tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
          tbody tr:nth-child(even) { background: #fafafa; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .totals-box { width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
          .totals-row.total { border-top: 2px solid #1a1a1a; margin-top: 5px; padding-top: 8px; font-size: 16px; font-weight: bold; }
          
          .notes-box { background: #fffbe6; border: 1px solid #f0e68c; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; }
          .notes-box h4 { font-size: 11px; text-transform: uppercase; color: #b8860b; margin-bottom: 4px; }
          .notes-box p { font-size: 12px; color: #555; line-height: 1.5; white-space: pre-line; }

          .footer { text-align: center; font-size: 10px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 12px; }

          @media print { body { padding: 15px 20px; } }
        </style>
      </head>
      <body>
        ${statusBadge}
        <div class="header">
          <div class="brand">
            <img src="${window.location.origin}${logoUrl}" class="logo" />
            <div class="brand-text">
              <h1>NOEZRA</h1>
              <p>Importadora</p>
            </div>
          </div>
          <div class="doc-info">
            <div class="code">${data.code}</div>
            <div class="dates">
              Emitida: ${createdDate}<br/>
              Válida hasta: <strong>${validDate}</strong>
            </div>
          </div>
        </div>

        <div class="client-box">
          <h3>Cliente</h3>
          <div class="name">${data.customer_name}</div>
          ${data.customer_ci ? `<div class="detail">CI: ${data.customer_ci}</div>` : ''}
          ${data.customer_phone ? `<div class="detail">Tel: ${data.customer_phone}</div>` : ''}
          ${data.customer_address ? `<div class="detail">Dir: ${data.customer_address}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width:8%">#</th>
              <th style="width:42%">Descripción</th>
              <th class="text-center" style="width:12%">Cant.</th>
              <th class="text-right" style="width:19%">P. Unitario</th>
              <th class="text-right" style="width:19%">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>${item.product_name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">Bs ${Number(item.unit_price).toFixed(2)}</td>
                <td class="text-right">Bs ${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>Bs ${Number(data.subtotal).toFixed(2)}</span>
            </div>
            ${Number(data.discount) > 0 ? `
              <div class="totals-row" style="color:#b91c1c;">
                <span>Descuento</span>
                <span>- Bs ${Number(data.discount).toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="totals-row total">
              <span>TOTAL</span>
              <span>Bs ${Number(data.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        ${data.notes ? `
          <div class="notes-box">
            <h4>Notas y Condiciones</h4>
            <p>${data.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          Cotización generada por el sistema NOEZRA Importadora.<br/>
          Este documento no constituye una venta. Los precios pueden estar sujetos a cambios después de la fecha de validez.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
}
