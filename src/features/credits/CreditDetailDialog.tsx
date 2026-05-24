import { useState, useEffect } from 'react'
import api from '@/api/axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, History } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditId: number | null
  onSuccess: () => void
}

export default function CreditDetailDialog({ open, onOpenChange, creditId, onSuccess }: Props) {
  const [credit, setCredit] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && creditId) {
      fetchDetail()
    } else {
      setCredit(null)
      setAmount('')
      setNotes('')
    }
  }, [open, creditId])

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/credits/${creditId}`)
      setCredit(res.data.data)
    } catch (err) {
      toast.error('Error al cargar detalle del crédito')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    if (Number(amount) > credit.balance) {
      toast.error('El abono no puede superar el saldo pendiente')
      return
    }

    try {
      setIsSubmitting(true)
      await api.post(`/credits/${creditId}/payments`, { amount: Number(amount), notes })
      toast.success('Abono registrado con éxito')
      setAmount('')
      setNotes('')
      await fetchDetail()
      onSuccess() // refresh main list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar abono')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Detalle de Crédito
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando...</div>
        ) : credit ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Cliente</p>
                <p className="font-semibold text-foreground truncate" title={credit.customer_name}>{credit.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Venta</p>
                <p className="font-semibold">Bs {Number(credit.total_amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Saldo Pendiente</p>
                <p className="font-bold text-destructive">Bs {Number(credit.balance).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Estado</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                  credit.status === 'paid' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                  {credit.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                </span>
              </div>
            </div>

            {credit.status !== 'paid' && (
              <form onSubmit={handleAddPayment} className="flex gap-2 items-end bg-card border p-3 rounded-lg">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium">Monto a abonar (Bs)</label>
                  <Input type="number" step="0.01" min="0.01" max={credit.balance} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="flex-[2] space-y-1">
                  <label className="text-xs font-medium">Notas (opcional)</label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Efectivo" />
                </div>
                <Button type="submit" disabled={isSubmitting || !amount}>Abonar</Button>
              </form>
            )}

            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <History className="h-4 w-4" /> Historial de Pagos
              </h3>
              {credit.payments?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No hay pagos registrados.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credit.payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{new Date(p.payment_date).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold text-success">+ Bs {Number(p.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{p.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No se encontró información.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
