"use client"

import { useState, useEffect } from 'react'
import { getInitial, subscribe } from '@/lib/realtime'
import { Package } from 'lucide-react'

interface StockLogEntry {
  id: string
  date: string
  quantityChange: number
  actionType: string
  reason?: string
  notes?: string
  performedBy: string | null
  year: number
}

interface InventoryItem {
  itemName: string
  quantity: number
  defaultPrice: number
  lowStockThreshold: number
  stockLog: StockLogEntry[]
}

interface Inventory {
  id?: string
  inventoryName: string
  createdAt: string
  year: number
  items: InventoryItem[]
  lastUpdated?: any
}

interface LegacyInventoryItem {
  id?: string
  itemName: string
  opening: number
  added: number
  sold: number
  closing: number
  inventoryName?: string
  year?: number
  lastUpdated?: any
}

interface LegacyInventorySummary {
  id?: string
  opening: number
  added: number
  sold: number
  closing: number
  inventoryName?: string
  year?: number
  date?: string
  reportMode?: string
  lastUpdated?: any
}

type SaleStatus = 'completed' | 'reversed'

interface SaleRecord {
  id: string
  inventoryName: string
  itemName: string
  quantitySold: number
  unitPrice: number
  total: number
  soldAt: string
  soldBy: string
  year: number
  status: SaleStatus
  reversedAt: string | null
  reversedBy: string | null
  reversalReason: string | null
  lastUpdated?: any
}

function toDateString(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toISOString()
  return ''
}

export default function InventoryPage() {
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [legacyItems, setLegacyItems] = useState<LegacyInventoryItem[]>([])
  const [legacySummary, setLegacySummary] = useState<LegacyInventorySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const initial = await getInitial<Inventory>('inventories')
        setInventories(initial)
        const initialSales = await getInitial<SaleRecord>('sales')
        setSales(initialSales)

        if (initial.length === 0) {
          const legacy = await getInitial<LegacyInventoryItem>('inventoryItems')
          setLegacyItems(legacy)
          const legacySum = await getInitial<LegacyInventorySummary>('inventorySummary')
          setLegacySummary(legacySum)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading inventories:', err)
        setError('Failed to load inventories')
        setLoading(false)
      }
    }

    loadData()
    const unsub = subscribe<Inventory>('inventories', (docs) => setInventories(docs))
    const unsubSales = subscribe<SaleRecord>('sales', (docs) => setSales(docs))
    const unsubLegacyItems = subscribe<LegacyInventoryItem>('inventoryItems', (docs) => setLegacyItems(docs))
    const unsubLegacySummary = subscribe<LegacyInventorySummary>('inventorySummary', (docs) => setLegacySummary(docs))
    return () => {
      unsub()
      unsubSales()
      unsubLegacyItems()
      unsubLegacySummary()
    }
  }, [])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  const hasNewData = inventories.length > 0
  const hasLegacyData = legacyItems.length > 0 || legacySummary.length > 0

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Package className="w-5 h-5" /> Inventory
      </h1>

      {!hasNewData && !hasLegacyData && (
        <div className="text-muted-foreground">
          No inventory data.
        </div>
      )}

      {!hasNewData && hasLegacyData && (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 flex justify-between items-center">
            <span className="font-medium">Inventory</span>
            {toDateString(legacySummary?.[0]?.lastUpdated) && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(toDateString(legacySummary?.[0]?.lastUpdated)).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="p-4">
            {legacySummary.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Current Opening</div>
                  <div className="text-lg font-semibold">{legacySummary[0].opening}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Added</div>
                  <div className="text-lg font-semibold">{legacySummary[0].added}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Sold</div>
                  <div className="text-lg font-semibold">{legacySummary[0].sold}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Closing</div>
                  <div className="text-lg font-semibold">{legacySummary[0].closing}</div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border-t">
            <table className="min-w-full text-sm table-fixed w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Opening</th>
                  <th className="px-4 py-2 text-right">Added</th>
                  <th className="px-4 py-2 text-right">Sold</th>
                  <th className="px-4 py-2 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {legacyItems.map((item) => {
                  const label =
                    (item as any).itemName ??
                    item.id ??
                    (item as any).name ??
                    (item as any).item ??
                    '—'

                  const opening = Number((item as any).opening ?? (item as any).currentOpening ?? 0)
                  const added = Number((item as any).added ?? (item as any).totalAdded ?? 0)
                  const sold = Number((item as any).sold ?? (item as any).totalSold ?? 0)
                  const closing = Number((item as any).closing ?? (item as any).currentClosing ?? 0)

                  return (
                    <tr key={item.id || String(label)} className="border-t">
                      <td className="px-4 py-1 whitespace-nowrap">{label}</td>
                      <td className="px-4 py-1 text-right">{opening}</td>
                      <td className="px-4 py-1 text-right">{added}</td>
                      <td className="px-4 py-1 text-right">{sold}</td>
                      <td className="px-4 py-1 text-right font-medium">{closing}</td>
                    </tr>
                  )
                })}

                {legacyItems.length === 0 && (
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground" colSpan={5}>
                      No stock items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasNewData && inventories.map((inv) => (
        <div key={inv.id || inv.inventoryName} className="border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 flex justify-between items-center">
            <span className="font-medium">{inv.inventoryName} (Year {inv.year})</span>
            {toDateString(inv.lastUpdated) && (
              <span className="text-xs text-muted-foreground">Updated {new Date(toDateString(inv.lastUpdated)).toLocaleDateString()}</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Opening</th>
                  <th className="px-4 py-2">Added</th>
                  <th className="px-4 py-2">Sold</th>
                  <th className="px-4 py-2">Closing</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items?.length ? inv.items : []).map((item) => {
                  const invSales = sales.filter(
                    (s) =>
                      s.inventoryName === inv.inventoryName &&
                      s.year === inv.year &&
                      s.itemName === item.itemName &&
                      s.status === 'completed',
                  )
                  const sold = invSales.reduce((sum, s) => sum + (s.quantitySold || 0), 0)
                  const added = (item.stockLog || []).reduce(
                    (sum, log) => sum + (log.quantityChange > 0 ? log.quantityChange : 0),
                    0,
                  )
                  const closing = item.quantity || 0
                  const opening = closing + sold - added

                  return (
                    <tr key={item.itemName} className="border-t">
                      <td className="px-4 py-1 whitespace-nowrap">{item.itemName}</td>
                      <td className="px-4 py-1 text-right">{opening}</td>
                      <td className="px-4 py-1 text-right">{added}</td>
                      <td className="px-4 py-1 text-right">{sold}</td>
                      <td className="px-4 py-1 text-right font-medium">{closing}</td>
                    </tr>
                  )
                })}

                {(!inv.items || inv.items.length === 0) && (
                  <tr className="border-t">
                    <td className="px-4 py-2 text-muted-foreground" colSpan={5}>
                      No stock items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto border-t">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const restocks = (inv.items || []).flatMap((item) =>
                    (item.stockLog || []).map((log) => ({
                      type: 'restock' as const,
                      date: log.date,
                      itemName: item.itemName,
                      quantity: log.quantityChange,
                      value: null as number | null,
                      label: `${log.actionType}${log.performedBy ? ` (${log.performedBy})` : ''}`,
                    })),
                  )

                  const invSales = sales
                    .filter(
                      (s) => s.inventoryName === inv.inventoryName && s.year === inv.year && s.status === 'completed',
                    )
                    .map((s) => ({
                      type: 'sale' as const,
                      date: s.soldAt,
                      itemName: s.itemName,
                      quantity: -s.quantitySold,
                      value: s.total,
                      label: `SALE (${s.soldBy})`,
                    }))

                  const combined = [...restocks, ...invSales].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )

                  if (combined.length === 0) {
                    return (
                      <tr className="border-t">
                        <td className="px-4 py-2 text-muted-foreground" colSpan={5}>
                          No stock/sales history yet.
                        </td>
                      </tr>
                    )
                  }

                  return combined.map((row) => (
                    <tr key={`${row.type}-${row.date}-${row.itemName}-${row.quantity}`} className="border-t">
                      <td className="px-4 py-1 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-4 py-1 whitespace-nowrap">{row.itemName}</td>
                      <td className="px-4 py-1 text-right">{row.quantity}</td>
                      <td className="px-4 py-1 text-right">{row.value == null ? '—' : row.value.toFixed(2)}</td>
                      <td className="px-4 py-1">{row.label}</td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}