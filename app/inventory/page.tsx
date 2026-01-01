'use client'

import { useState, useEffect } from 'react'
import { getInitial, subscribe } from '@/lib/realtime'

interface InventoryItem {
  id: string
  name: string
  opening: number
  added: number
  sold: number
  closing: number
}

interface StockLog {
  date: string
  item: string
  qty: number
  value?: number
  type: string
}

export default function Inventory() {
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('monthly')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState({
    currentOpening: 0,
    totalAdded: 0,
    totalSold: 0,
    currentClosing: 0,
  })
  const [items, setItems] = useState<InventoryItem[]>([])
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        // Fetch inventory summary
        const summarySnap = await getInitial('inventorySummary')
        if (summarySnap && Array.isArray(summarySnap) && summarySnap.length > 0) {
          setSummary(summarySnap[0] as unknown as typeof summary)
        }

        // Fetch inventory items
        const itemsSnap = await getInitial('inventoryItems')
        if (itemsSnap && Array.isArray(itemsSnap)) {
          setItems(itemsSnap as unknown as InventoryItem[])
        }

        // Fetch stock logs
        const logsSnap = await getInitial('stockLogs')
        if (logsSnap && Array.isArray(logsSnap)) {
          setLogs(logsSnap as unknown as StockLog[])
        }

        // Subscribe to real-time updates
        const unsubSummary = subscribe('inventorySummary', (data) => {
          if (Array.isArray(data) && data.length > 0) setSummary(data[0] as unknown as typeof summary)
        })
        const unsubItems = subscribe('inventoryItems', (data) => setItems(data as unknown as InventoryItem[]))
        const unsubLogs = subscribe('stockLogs', (data) => setLogs(data as unknown as StockLog[]))

        return () => {
          unsubSummary?.()
          unsubItems?.()
          unsubLogs?.()
        }
      } catch (error) {
        console.error('Failed to load inventory data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Inventory / Stock & Sales (Read‑Only)</h2>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Inventory / Stock & Sales (Read‑Only)</h2>
      <p className="text-sm text-gray-600 mb-6">This view mirrors the desktop app. Editing is disabled.</p>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Stock & Sales History</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600">Report Mode:</label>
            <select
              value={reportMode}
              onChange={(e) => setReportMode(e.target.value as 'daily' | 'monthly')}
              className="ml-2 border rounded px-2 py-1"
              disabled
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 border rounded px-2 py-1"
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.currentOpening}</div>
            <div className="text-sm text-gray-600">Current Opening (start of year to current)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.totalAdded}</div>
            <div className="text-sm text-gray-600">Total Added so far</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.totalSold}</div>
            <div className="text-sm text-gray-600">Total Sold so far</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.currentClosing}</div>
            <div className="text-sm text-gray-600">Current Closing (current stock)</div>
          </div>
        </div>

        {/* Items Table */}
        <h4 className="font-semibold mb-2">Items</h4>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Item</th>
                <th className="border p-2 text-right">Opening</th>
                <th className="border p-2 text-right">Added</th>
                <th className="border p-2 text-right">Sold</th>
                <th className="border p-2 text-right">Closing</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2 text-right">{item.opening}</td>
                  <td className="border p-2 text-right">{item.added}</td>
                  <td className="border p-2 text-right">{item.sold}</td>
                  <td className="border p-2 text-right">{item.closing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stock Logs */}
        <h4 className="font-semibold mb-2">Stock Logs</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Item</th>
                <th className="border p-2 text-right">Qty</th>
                <th className="border p-2 text-right">Value</th>
                <th className="border p-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{log.date}</td>
                  <td className="border p-2">{log.item}</td>
                  <td className="border p-2 text-right">{log.qty}</td>
                  <td className="border p-2 text-right">{log.value ?? '—'}</td>
                  <td className="border p-2">{log.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-gray-600">
          Total Sales Value: {logs
            .filter((l) => l.type.toLowerCase().includes('sale'))
            .reduce((sum, l) => sum + (l.value || 0), 0)
            .toFixed(2)}
        </div>
      </div>
    </div>
  )
}