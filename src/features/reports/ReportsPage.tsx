import { useState } from 'react'
import api from '@/api/axios'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { TrendingUp, Package, FileText, Wallet, BarChart, Download, Loader2, FileSpreadsheet, File as FilePdf } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'))
  const [loadingReport, setLoadingReport] = useState<string | null>(null)

  const downloadCSV = (filename: string, csvData: string) => {
    // \uFEFF adds BOM so Excel reads UTF-8 Spanish accents correctly
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' }) 
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadPDF = (reportType: string, filename: string, rawData: any) => {
    const doc = new jsPDF()
    
    // Configuración de estilo global para las tablas
    const commonTableStyles = {
      theme: 'grid' as const,
      headStyles: { 
        fillColor: [15, 23, 42], // Slate 900
        textColor: 255, 
        fontSize: 10, 
        fontStyle: 'bold' as const, 
        halign: 'center' as const 
      },
      bodyStyles: { 
        fontSize: 9, 
        textColor: [51, 65, 85] // Slate 700
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] // Slate 50
      },
      styles: { 
        cellPadding: 5,
        lineColor: [226, 232, 240], // Slate 200
        lineWidth: 0.1,
      },
    }

    // Cabecera del Documento
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 28, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')

    let title = ''
    if (reportType === 'profits') title = 'Reporte de Ganancias y Utilidades'
    else if (reportType === 'inventory') title = 'Reporte de Inventario Valorizado'
    else if (reportType === 'sales') title = 'Detalle de Ventas'
    else if (reportType === 'credits') title = 'Estado de Cuentas por Cobrar'
    else if (reportType === 'products') title = 'Análisis de Productos'

    doc.text(title, 14, 19)
    
    doc.setTextColor(51, 65, 85)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 38)

    if (reportType === 'profits' || reportType === 'sales' || reportType === 'products') {
      doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 44)
    }

    if (reportType === 'profits') {
      const { summary, daily } = rawData
      
      // Resumen Financiero en Cajas
      doc.setFillColor(248, 250, 252)
      doc.rect(14, 50, 85, 35, 'F')
      doc.rect(110, 50, 85, 35, 'F')

      doc.setFontSize(10)
      doc.text('Ingresos Totales:', 18, 58)
      doc.text('Costo Total:', 18, 66)
      doc.text('Gastos Operativos:', 18, 74)
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Bs ${Number(summary.revenue).toFixed(2)}`, 60, 58)
      doc.text(`Bs ${Number(summary.cost).toFixed(2)}`, 60, 66)
      doc.setTextColor(239, 68, 68) // Red
      doc.text(`Bs ${Number(summary.expenses).toFixed(2)}`, 60, 74)

      doc.setTextColor(51, 65, 85)
      doc.setFontSize(12)
      doc.text('GANANCIA NETA', 114, 62)
      doc.setFontSize(18)
      doc.setTextColor(16, 185, 129) // Emerald
      doc.text(`Bs ${Number(summary.net_profit).toFixed(2)}`, 114, 74)

      autoTable(doc, {
        ...commonTableStyles,
        startY: 95,
        head: [['Fecha', 'Ingresos (Bs)', 'Costos (Bs)', 'Ganancia (Bs)']],
        body: daily.map((d: any) => [
          format(parseISO(d.date), 'dd/MM/yyyy'), 
          Number(d.revenue).toFixed(2), 
          Number(d.cost).toFixed(2), 
          Number(d.profit).toFixed(2)
        ]),
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right', textColor: [239, 68, 68] },
          3: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        }
      })
    } 
    else if (reportType === 'inventory') {
      const { summary, products } = rawData
      
      doc.setFillColor(248, 250, 252)
      doc.rect(14, 45, 182, 25, 'F')
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Valor Total del Inventario:', 20, 55)
      doc.text('Productos con Stock Crítico:', 120, 55)
      
      doc.setFontSize(14)
      doc.setTextColor(16, 185, 129)
      doc.text(`Bs ${Number(summary.total_inventory_value).toFixed(2)}`, 20, 63)
      doc.setTextColor(239, 68, 68)
      doc.text(`${summary.low_stock_items}`, 120, 63)

      autoTable(doc, {
        ...commonTableStyles,
        startY: 80,
        head: [['Producto', 'Stock', 'Costo Unit.', 'Precio Venta', 'Valor Total']],
        body: products.map((p: any) => [
          p.name, 
          p.stock.toString(), 
          `Bs ${Number(p.cost).toFixed(2)}`, 
          `Bs ${Number(p.price).toFixed(2)}`, 
          `Bs ${Number(p.total_value).toFixed(2)}`
        ]),
        columnStyles: {
          1: { halign: 'center', fontStyle: 'bold' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
        }
      })
    } 
    else if (reportType === 'sales') {
      autoTable(doc, {
        ...commonTableStyles,
        startY: 55,
        head: [['ID Venta', 'Fecha', 'Cliente', 'Método', 'Total (Bs)']],
        body: rawData.map((s: any) => [
          `#${s.id.toString().padStart(6, '0')}`, 
          format(parseISO(s.created_at), 'dd/MM/yyyy HH:mm'), 
          s.customer_name || 'Consumidor Final', 
          s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'card' ? 'Tarjeta' : s.payment_method === 'transfer' ? 'Transferencia' : 'Crédito', 
          Number(s.total).toFixed(2)
        ]),
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        }
      })
    } 
    else if (reportType === 'credits') {
      autoTable(doc, {
        ...commonTableStyles,
        startY: 46,
        head: [['ID Crédito', 'Cliente', 'Teléfono', 'Fecha Emisión', 'Total Deuda', 'Saldo Pendiente']],
        body: rawData.map((c: any) => [
          `CR-${c.id.toString().padStart(5, '0')}`, 
          c.customer_name, 
          c.phone || 'S/N', 
          format(parseISO(c.created_at), 'dd/MM/yyyy'), 
          `Bs ${Number(c.total_amount).toFixed(2)}`, 
          `Bs ${Number(c.balance).toFixed(2)}`
        ]),
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold', textColor: [239, 68, 68] }
        }
      })
    } 
    else if (reportType === 'products') {
      autoTable(doc, {
        ...commonTableStyles,
        startY: 55,
        head: [['Producto', 'Stock Actual', 'Unidades Vendidas', 'Ingresos (Bs)']],
        body: rawData.map((p: any) => [
          p.name, 
          p.stock.toString(), 
          p.qty_sold.toString(), 
          Number(p.revenue).toFixed(2)
        ]),
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center', fontStyle: 'bold' },
          3: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        }
      })
    }

    doc.save(`${filename}.pdf`)
  }

  const handleDownload = async (reportType: string, formatType: 'csv' | 'pdf') => {
    if (!startDate || !endDate) {
      toast.error('Selecciona un rango de fechas válido')
      return
    }
    
    setLoadingReport(reportType)
    try {
      let csv = ''
      let filename = `reporte_${reportType}_${format(new Date(), 'yyyyMMdd')}`
      let rawData = null

      if (reportType === 'profits') {
        const res = await api.get(`/reports/profits?startDate=${startDate}&endDate=${endDate}`)
        rawData = res.data.data
        if (formatType === 'csv') {
          csv += 'RESUMEN FINANCIERO\n'
          csv += `Ingresos,${rawData.summary.revenue}\n`
          csv += `Costo Mercaderia,${rawData.summary.cost}\n`
          csv += `Gastos Operativos,${rawData.summary.expenses}\n`
          csv += `Ganancia Neta,${rawData.summary.net_profit}\n\n`
          csv += 'DETALLE DIARIO\nFecha,Ingresos,Costos,Ganancia\n'
          rawData.daily.forEach((d: any) => {
            csv += `${d.date},${d.revenue},${d.cost},${d.profit}\n`
          })
        }
      } 
      else if (reportType === 'inventory') {
        const res = await api.get(`/reports/inventory`)
        rawData = res.data.data
        if (formatType === 'csv') {
          csv += 'RESUMEN INVENTARIO\n'
          csv += `Valor Total Inventario,${rawData.summary.total_inventory_value}\n`
          csv += `Items con Stock Bajo,${rawData.summary.low_stock_items}\n\n`
          csv += 'PRODUCTOS\nID,Nombre,Stock,Min.Stock,Costo,Precio,Valor Total\n'
          rawData.products.forEach((p: any) => {
            csv += `${p.id},"${p.name}",${p.stock},${p.min_stock},${p.cost},${p.price},${p.total_value}\n`
          })
        }
      }
      else if (reportType === 'sales') {
        const res = await api.get(`/reports/sales-detailed?startDate=${startDate}&endDate=${endDate}`)
        rawData = res.data.data
        if (formatType === 'csv') {
          csv += 'DETALLE DE VENTAS\nID,Fecha,Cliente,Metodo,Total\n'
          rawData.forEach((s: any) => {
            csv += `${s.id},${s.created_at},"${s.customer_name || 'Consumidor Final'}",${s.payment_method},${s.total}\n`
          })
        }
      }
      else if (reportType === 'credits') {
        const res = await api.get(`/reports/credits`)
        rawData = res.data.data
        if (formatType === 'csv') {
          csv += 'CUENTAS POR COBRAR\nID Credito,Cliente,Telefono,Fecha,Total Deuda,Saldo Pendiente\n'
          rawData.forEach((c: any) => {
            csv += `CR-${c.id},"${c.customer_name}",${c.phone || ''},${c.created_at},${c.total_amount},${c.balance}\n`
          })
        }
      }
      else if (reportType === 'products') {
        const res = await api.get(`/reports/top-products?startDate=${startDate}&endDate=${endDate}`)
        rawData = res.data.data
        if (formatType === 'csv') {
          csv += 'ANALISIS DE PRODUCTOS\nID,Producto,Stock Actual,Unidades Vendidas,Ingresos Generados\n'
          rawData.forEach((p: any) => {
            csv += `${p.id},"${p.name}",${p.stock},${p.qty_sold},${p.revenue}\n`
          })
        }
      }

      if (formatType === 'csv') {
        downloadCSV(filename, csv)
      } else {
        downloadPDF(reportType, filename, rawData)
      }

      toast.success('Reporte descargado con éxito')
      
    } catch (err) {
      toast.error('Error al generar el reporte')
      console.error(err)
    } finally {
      setLoadingReport(null)
    }
  }

  const reports = [
    {
      id: 'profits',
      title: 'Ganancias y Utilidades',
      description: 'Descarga un resumen financiero con tus ingresos, costos y ganancia neta. Muestra los totales y un desglose diario de tu rentabilidad.',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      id: 'inventory',
      title: 'Inventario y Valorización',
      description: 'Obtén el Kardex completo de tus productos. Descubre cuánto capital tienes invertido en mercadería y qué productos están con stock crítico.',
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'sales',
      title: 'Detalle de Ventas',
      description: 'Un registro cronológico y detallado de todas las ventas en el periodo, listando clientes, fechas y método de pago (Efectivo, Tarjeta, etc.).',
      icon: FileText,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      id: 'credits',
      title: 'Estado de Cuentas por Cobrar',
      description: 'Lista completa de todos los clientes que te deben dinero. Muestra la deuda original y el saldo que falta por pagar a la fecha de hoy.',
      icon: Wallet,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      id: 'products',
      title: 'Análisis de Productos',
      description: 'El ranking de tus productos. Observa cuántas unidades has vendido de cada artículo y el total de ingresos que generó individualmente.',
      icon: BarChart,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground text-sm">Descarga tus análisis en formato Excel o PDF.</p>
        </div>

        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border shadow-sm flex-wrap">
          <label className="text-sm font-medium text-muted-foreground pl-2">Desde:</label>
          <Input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto border-0 shadow-none focus-visible:ring-0 cursor-pointer h-8"
          />
          <span className="text-muted-foreground">-</span>
          <label className="text-sm font-medium text-muted-foreground">Hasta:</label>
          <Input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto border-0 shadow-none focus-visible:ring-0 cursor-pointer h-8"
          />
        </div>
      </div>

      {/* Tarjetas de Reportes */}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const Icon = report.icon
            const isDownloading = loadingReport === report.id

            return (
              <Card key={report.id} className="flex flex-col relative overflow-visible">
                <CardHeader>
                  <div className={`w-10 h-10 rounded-lg ${report.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="text-xs mt-2 min-h-[48px]">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <div className="flex-1" />
                <CardFooter className="pt-0 relative z-10">
                  {isDownloading ? (
                    <Button disabled className="w-full font-bold">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Descargando...
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full font-bold">
                          <Download className="w-4 h-4 mr-2" /> Descargar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-[200px]">
                        <DropdownMenuItem onClick={() => handleDownload(report.id, 'pdf')} className="cursor-pointer">
                          <FilePdf className="w-4 h-4 mr-2 text-rose-500" /> Formato PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(report.id, 'csv')} className="cursor-pointer">
                          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Formato Excel (CSV)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
