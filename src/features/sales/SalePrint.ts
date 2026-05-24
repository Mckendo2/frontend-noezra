import logoUrl from '@/assets/logo-sinfondo.png'

export interface SalePrintData {
  date: Date | string
  items: Array<{
    name: string
    quantity: number
    price: number | string
  }>
  subtotal: number
  discount: number
  total: number
}

export function printSaleReceipt(data: SalePrintData) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const dateStr = data.date instanceof Date ? data.date.toLocaleString() : new Date(data.date).toLocaleString()

  const html = `
    <html>
      <head>
        <title>Comprobante de Venta</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; color: #000; }
          .header { text-align: center; margin-bottom: 15px; }
          .logo { max-width: 140px; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; font-weight: bold; }
          td { padding: 5px 0; vertical-align: top; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .item-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 10px; }
          .footer { text-align: center; font-size: 11px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${window.location.origin}${logoUrl}" class="logo" />
          <p class="title">Comprobante de Venta</p>
          <p style="font-size: 11px; margin: 5px 0;">Fecha: ${dateStr}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 15%">CANT</th>
              <th style="width: 45%">DESCRIPCIÓN</th>
              <th class="text-right" style="width: 20%">P.UNIT</th>
              <th class="text-right" style="width: 20%">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td class="text-center">${item.quantity}</td>
                <td>${item.name}</td>
                <td class="text-right">${Number(item.price).toFixed(2)}</td>
                <td class="text-right">${(item.quantity * Number(item.price)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="item-row">
          <span>SUBTOTAL</span>
          <span>Bs ${data.subtotal.toFixed(2)}</span>
        </div>
        ${data.discount > 0 ? `
          <div class="item-row" style="color: #444;">
            <span>DESCUENTO</span>
            <span>- Bs ${data.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="total-row">
          <span>TOTAL A PAGAR</span>
          <span>Bs ${data.total.toFixed(2)}</span>
        </div>
        
        <div class="footer">
          ¡Gracias por su compra!<br/>
          Vuelva pronto
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
  }, 250)
}
