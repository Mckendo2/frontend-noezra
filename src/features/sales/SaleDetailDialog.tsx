import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Printer, ShoppingCart, CalendarDays, User, FileText, Banknote } from 'lucide-react'
import { printSaleReceipt } from './SalePrint'

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  cash: { label: 'Efectivo', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  card: { label: 'Tarjeta', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  transfer: { label: 'Transferencia', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  credit: { label: 'Crédito', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  sale: any | null
}

export default function SaleDetailDialog({ open, onOpenChange, sale }: Props) {
  if (!sale) return null

  const items = sale.items || []
  const createdDate = new Date(sale.created_at).toLocaleDateString('es-ES', { 
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
  
  const paymentInfo = PAYMENT_MAP[sale.payment_method] || { label: sale.payment_method, color: 'bg-muted text-muted-foreground border-border' }

  const handlePrint = () => {
    printSaleReceipt({
      date: sale.created_at,
      items: items.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: i.unit_price
      })),
      subtotal: Number(sale.total) + Number(sale.discount),
      discount: Number(sale.discount),
      total: Number(sale.total)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span>Venta #{String(sale.id).padStart(6, '0')}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${paymentInfo.color}`}>
              {paymentInfo.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
          <div className="space-y-1 bg-accent/10 p-3 rounded-md border border-accent/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Cliente</p>
            <p className="font-medium text-foreground">{sale.customer_name || 'Cliente Ocasional'}</p>
          </div>
          <div className="space-y-1 bg-accent/10 p-3 rounded-md border border-accent/20">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Fecha y Cajero</p>
            <p className="text-xs text-foreground font-medium">{createdDate}</p>
            <p className="text-xs text-muted-foreground mt-1">Cajero: {sale.cashier_name}</p>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Items table */}
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Producto</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Cant.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">P. Unit.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-foreground">{item.product_name}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">Bs{Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">Bs{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-2">
          <div className="w-56 space-y-1 bg-card border border-border rounded-md p-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Bs{(Number(sale.total) + Number(sale.discount)).toFixed(2)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Descuento</span>
                <span>- Bs{Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold">
              <span>Total Pagado</span>
              <span className="text-primary">Bs{Number(sale.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 w-full sm:w-auto">
            <Printer className="h-3.5 w-3.5" /> Re-imprimir Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
