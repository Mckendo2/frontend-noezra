import { useState } from 'react'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, ShoppingCart, XCircle, Edit, Loader2, CalendarDays, User, FileText } from 'lucide-react'
import { printQuotation } from './QuotationPrint'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  approved: { label: 'Aprobada', variant: 'default' },
  expired: { label: 'Expirada', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'outline' },
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  quotation: any | null
  onEdit: () => void
  onSuccess: () => void
}

export default function QuotationDetailDialog({ open, onOpenChange, quotation, onEdit, onSuccess }: Props) {
  const { user } = useAuthStore()
  const [converting, setConverting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  if (!quotation) return null

  const status = STATUS_MAP[quotation.status] || STATUS_MAP.pending
  const items = quotation.items || []
  const isPending = quotation.status === 'pending'

  const createdDate = new Date(quotation.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const validDate = new Date(quotation.valid_until + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  const handlePrint = () => {
    printQuotation({
      code: quotation.code,
      created_at: quotation.created_at,
      valid_until: quotation.valid_until,
      customer_name: quotation.customer_name,
      customer_ci: quotation.customer_ci,
      customer_phone: quotation.customer_phone,
      customer_address: quotation.customer_address,
      notes: quotation.notes,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      total: quotation.total,
      items,
      status: quotation.status,
    })
  }

  const handleConvert = async () => {
    if (!window.confirm('¿Convertir esta cotización en venta? Se descontará el stock de los productos.')) return
    setConverting(true)
    try {
      await api.post(`/quotations/${quotation.id}/convert`, {
        user_id: user?.id,
        payment_method: paymentMethod,
      })
      toast.success('¡Cotización convertida en venta exitosamente!')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al convertir')
    } finally {
      setConverting(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar esta cotización? Esta acción no se puede deshacer.')) return
    setCancelling(true)
    try {
      await api.patch(`/quotations/${quotation.id}/status`, { status: 'cancelled' })
      toast.success('Cotización cancelada')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cancelar')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span>{quotation.code}</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Cliente</p>
            <p className="font-medium text-foreground">{quotation.customer_name}</p>
            {quotation.customer_phone && <p className="text-xs text-muted-foreground">Tel: {quotation.customer_phone}</p>}
            {quotation.customer_ci && <p className="text-xs text-muted-foreground">CI: {quotation.customer_ci}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Fechas</p>
            <p className="text-xs text-foreground">Creada: <strong>{createdDate}</strong></p>
            <p className="text-xs text-foreground">Válida hasta: <strong>{validDate}</strong></p>
          </div>
        </div>

        {quotation.notes && (
          <div className="bg-accent/10 border border-accent/30 rounded-md p-3">
            <p className="text-xs font-medium text-accent-foreground dark:text-accent mb-1">Notas / Condiciones</p>
            <p className="text-xs text-foreground whitespace-pre-line">{quotation.notes}</p>
          </div>
        )}

        <Separator />

        {/* Items table */}
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Producto</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Cant.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">P. Unit.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: any, i: number) => (
                <tr key={i}>
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
        <div className="flex justify-end">
          <div className="w-56 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Bs{Number(quotation.subtotal).toFixed(2)}</span>
            </div>
            {Number(quotation.discount) > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Descuento</span>
                <span>- Bs{Number(quotation.discount).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">Bs{Number(quotation.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Convert to sale section */}
        {isPending && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Convertir a Venta — Método de pago:</p>
              <div className="flex gap-2">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="credit">A Crédito</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleConvert} disabled={converting} className="gap-1.5">
                  {converting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />}
                  Convertir a Venta
                </Button>
              </div>
            </div>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
          {isPending && (
            <>
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit() }} className="gap-1.5">
                <Edit className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-1.5">
                {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Cancelar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
