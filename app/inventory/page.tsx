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
  type: 'RESTOCK' | 'SALE'
  user?: string
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [logs, setLogs] = useState<StockLog[]>([])
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('monthly')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        // Fetch inventory summary
        const inventoryData = await getInitial('inventorySummary')
        if (Array.isArray(inventoryData)) {
          setItems(inventoryData as InventoryItem[])
        }

        // Fetch stock logs
        const logsData = await getInitial('stockLogs')
        if (Array.isArray(logsData)) {
          setLogs(logsData as StockLog[])
        }
      } catch (error) {
        console.error('Failed to load inventory:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInventory()

    // Subscribe to real-time updates
    const unsubscribeItems = subscribe('inventorySummary', (data) => {
      if (Array.isArray(data)) setItems(data as InventoryItem[])
    })

    const unsubscribeLogs = subscribe('stockLogs', (data) => {
      if (Array.isArray(data)) setLogs(data as StockLog[])
    })

    return () => {
      unsubscribeItems?.()
      unsubscribeLogs?.()
    }
  }, [])

  const totalAdded = items.reduce((sum, item) => sum + item.added, 0)
  const totalSold = logs.filter(l => l.type === 'SALE').reduce((sum, l) => sum + l.qty, 0)
  const totalSalesValue = logs
    .filter(l => l.type === 'SALE')
    .reduce((sum, l) => sum + (l.value || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm py-2 px-4 rounded mb-6">
          Real-time view — editing is disabled. Data synced from desktop app.
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory / Stock & Sales (Read-only)</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Current Opening (start of year to current)</div>
            <div className="text-2xl font-bold text-blue-600">
              {items.reduce((sum, item) => sum + item.opening, 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Total Added so far</div>
            <div className="text-2xl font-bold text-green-600">{totalAdded}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Total Sold so far</div>
            <div className="text-2xl font-bold text-red-600">{totalSold}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Current Closing (current stock)</div>
            <div className="text-2xl font-bold text-purple-600">
              {items.reduce((sum, item) => sum + item.closing, 0)}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded shadow mb-8">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Current Stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Opening</th>
                  <th className="px-4 py-2 text-right">Added</th>
                  <th className="px-4 py-2 text-right">Sold</th>
                  <th className="px-4 py-2 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-right">{item.opening}</td>
                    <td className="px-4 py-2 text-right text-green-600">+{item.added}</td>
                    <td className="px-4 py-2 text-right text-red-600">-{item.sold}</td>
                    <td className="px-4 py-2 text-right font-bold">{item.closing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Logs */}
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Stock & Sales History</h2>
            <div className="text-sm text-gray-600">
              Total Sales Value: <span className="font-bold text-green-600">${totalSalesValue.toFixed(2)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{log.date}</td>
                    <td className="px-4 py-2 font-medium">{log.item}</td>
                    <td className="px-4 py-2 text-right">{log.qty}</td>
                    <td className="px-4 py-2 text-right">{log.value ? `$${log.value.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.type === 'RESTOCK' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{log.user || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
