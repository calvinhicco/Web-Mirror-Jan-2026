interface InventoryItem {
  itemName: string
  opening: number
  added: number
  sold: number
  closing: number
}

interface Inventory {
  id?: string
  inventoryName: string
  year: number
  items: InventoryItem[]
  lastUpdated?: string
}

import { useState, useEffect } from 'react';
import { getInitial, subscribe } from '@/lib/realtime'
import { Package } from 'lucide-react'

export default function InventoryPage() {
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const initial = await getInitial<Inventory>('inventories')
        setInventories(initial)
        setLoading(false)
      } catch (err) {
        console.error('Error loading inventories:', err)
        setError('Failed to load inventories')
        setLoading(false)
      }
    }

    loadData()
    const unsub = subscribe<Inventory>('inventories', (docs) => setInventories(docs))
    return () => unsub()
  }, [])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  if (inventories.length === 0) {
    return <div className="p-6 text-muted-foreground">No inventory data.</div>
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Package className="w-5 h-5" /> Inventory
      </h1>

      {inventories.map((inv) => (
        <div key={inv.id || inv.inventoryName} className="border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 flex justify-between items-center">
            <span className="font-medium">{inv.inventoryName} (Year {inv.year})</span>
            {inv.lastUpdated && (
              <span className="text-xs text-muted-foreground">Updated {new Date(inv.lastUpdated).toLocaleDateString()}</span>
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
                {inv.items?.map((item) => (
                  <tr key={item.itemName} className="border-t">
                    <td className="px-4 py-1 whitespace-nowrap">{item.itemName}</td>
                    <td className="px-4 py-1 text-right">{item.opening}</td>
                    <td className="px-4 py-1 text-right">{item.added}</td>
                    <td className="px-4 py-1 text-right">{item.sold}</td>
                    <td className="px-4 py-1 text-right font-medium">{item.closing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}