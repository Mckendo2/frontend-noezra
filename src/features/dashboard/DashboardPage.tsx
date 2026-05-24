import { useEffect, useState } from 'react'
import api from '@/api/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShoppingCart, TrendingUp, Package, AlertTriangle, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, ComposedChart, Line
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardData {
  salesToday: { sales_today: number; tx_today: number }
  salesMonth: { sales_month: number }
  lowStock: { low_stock: number }
  topProducts: Array<{ name: string; qty_sold: number; revenue: number }>
  salesByDay: Array<{ date: string; total: number }>
  salesByPaymentMethod: Array<{ payment_method: string; total: number }>
  salesByCategory: Array<{ category: string; total: number }>
  expensesByDay: Array<{ date: string; total: number }>
  mixedChartData?: Array<{ date: string; income: number; expense: number }>
  paymentMethodsData?: Array<{ name: string; total: number }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const PAYMENT_COLORS: Record<string, string> = {
  'Efectivo': '#10b981',      // Emerald
  'Tarjeta': '#3b82f6',       // Blue
  'Transferencia': '#8b5cf6', // Violet
  'Crédito': '#f59e0b'        // Amber
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [startDate, setStartDate] = useState(() => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'))

  useEffect(() => {
    if (!startDate || !endDate) return;
    
    setLoading(true)
    api.get(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`)
      .then(res => {
        const d = res.data.data;
        
        // Formatear Top Productos
        if (d.topProducts) {
          d.topProducts = d.topProducts.map((p: any) => ({
            ...p,
            qty_sold: Number(p.qty_sold),
            revenue: Number(p.revenue)
          }))
        }
        
        // Formatear Gráfico Mixto (Ingresos vs Gastos)
        if (d.salesByDay && d.expensesByDay) {
          const merged: Record<string, { date: string; income: number; expense: number }> = {}
          d.salesByDay.forEach((s: any) => {
            merged[s.date] = { date: s.date, income: Number(s.total), expense: 0 }
          })
          d.expensesByDay.forEach((e: any) => {
            if (!merged[e.date]) {
              merged[e.date] = { date: e.date, income: 0, expense: Number(e.total) }
            } else {
              merged[e.date].expense = Number(e.total)
            }
          })
          d.mixedChartData = Object.values(merged).sort((a, b) => a.date.localeCompare(b.date))
        }

        // Formatear Métodos de Pago
        if (d.salesByPaymentMethod) {
          d.paymentMethodsData = d.salesByPaymentMethod.map((s: any) => ({
            name: s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'card' ? 'Tarjeta' : s.payment_method === 'transfer' ? 'Transferencia' : 'Crédito',
            total: Number(s.total)
          }))
        }

        // Formatear Categorías
        if (d.salesByCategory) {
          d.salesByCategory = d.salesByCategory.map((c: any) => ({
            name: c.category,
            total: Number(c.total)
          }))
        }

        setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  const MixedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-2 text-foreground">
            {format(parseISO(label), "d 'de' MMMM", { locale: es })}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-bold flex items-center justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name === 'income' ? 'Ingresos:' : 'Gastos:'}</span>
              <span>Bs {Number(entry.value).toFixed(2)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Resumen de indicadores clave y rendimiento</p>
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg border border-border shadow-sm flex-wrap">
          <label className="text-sm font-medium text-muted-foreground pl-2">Desde:</label>
          <Input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto border-0 shadow-none focus-visible:ring-0 cursor-pointer h-8 text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <label className="text-sm font-medium text-muted-foreground">Hasta:</label>
          <Input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto border-0 shadow-none focus-visible:ring-0 cursor-pointer h-8 text-sm"
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Hoy</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">Bs{Number(data?.salesToday?.sales_today ?? 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{data?.salesToday?.tx_today ?? 0} transacciones hoy</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Periodo</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">Bs{Number(data?.salesMonth?.sales_month ?? 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{startDate ? format(parseISO(startDate), 'd MMM', { locale: es }) : ''} - {endDate ? format(parseISO(endDate), 'd MMM', { locale: es }) : ''}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stock Crítico</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data?.lowStock?.low_stock ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Productos bajo mínimo</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Productos</CardTitle>
                <Package className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data?.topProducts?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Con ventas en periodo</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Ingresos vs Gastos */}
            <Card className="border-border bg-card lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Flujo: Ingresos vs Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {data?.mixedChartData && data.mixedChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <ComposedChart data={data.mixedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(tick) => format(parseISO(tick), "d MMM", { locale: es })}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickMargin={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickFormatter={(value) => `Bs${value}`}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<MixedTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="income" 
                          name="Ingresos"
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expense" 
                          name="Gastos"
                          stroke="#ef4444" 
                          strokeWidth={3}
                          dot={{ r: 3 }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No hay flujos registrados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 2: Top Productos (Pie) */}
            <Card className="border-border bg-card shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Top 5 Productos Estrella</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="h-56 w-full relative">
                  {data?.topProducts && data.topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={data.topProducts}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="qty_sold"
                          stroke="none"
                        >
                          {data.topProducts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any, props: any) => [`${value} uds (Bs${Number(props.payload.revenue).toFixed(2)})`, name]}
                          contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin ventas
                    </div>
                  )}
                </div>
                
                {data?.topProducts && data.topProducts.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 bg-secondary/50">Bs{Number(p.revenue).toFixed(2)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico 3: Métodos de Pago */}
            <Card className="border-border bg-card shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="h-64 w-full">
                  {data?.paymentMethodsData && data.paymentMethodsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={data.paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="total"
                          stroke="none"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          style={{ fontSize: '11px', fill: 'hsl(var(--foreground))' }}
                        >
                          {data.paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`Bs ${Number(value).toFixed(2)}`, 'Ingreso']}
                          contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin datos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 4: Ventas por Categoría */}
            <Card className="border-border bg-card lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Ingresos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  {data?.salesByCategory && data.salesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={data.salesByCategory} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `Bs${val}`} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={11} width={100} tickLine={false} />
                        <Tooltip 
                          formatter={(value: any) => [`Bs ${Number(value).toFixed(2)}`, 'Total']}
                          contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin categorías registradas
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  )
}
