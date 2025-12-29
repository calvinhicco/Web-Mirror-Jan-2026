"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Boxes, AlertTriangle, TrendingUp, TrendingDown, Package, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'

// Types matching the Electron app
interface StockLogEntry {
  id: string
  date: string
  quantityChange: number
  actionType: "Initial Stock" | "Restock" | "Correction"
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
  inventoryName: string
  createdAt: string
  year: number
  items: InventoryItem[]
}

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
  status: "completed" | "reversed"
  reversedAt: string | null
  reversedBy: string | null
  reversalReason: string | null
}

// Mock data - in real implementation, this would come from Firebase
// TODO: Replace with Firebase real-time data sync
const mockInventories: Inventory[] = [
  {
    inventoryName: "School Supplies",
    createdAt: "2025-01-15",
    year: 2025,
    items: [
      {
        itemName: "Exercise Books",
        quantity: 150,
        defaultPrice: 2.50,
        lowStockThreshold: 20,
        stockLog: [
          {
            id: "1",
            date: "2025-01-15",
            quantityChange: 200,
            actionType: "Initial Stock",
            performedBy: "admin",
            year: 2025
          },
          {
            id: "2", 
            date: "2025-01-20",
            quantityChange: -50,
            actionType: "Correction",
            notes: "Damaged items removed",
            performedBy: "admin",
            year: 2025
          }
        ]
      },
      {
        itemName: "Pens",
        quantity: 8,
        defaultPrice: 1.00,
        lowStockThreshold: 15,
        stockLog: [
          {
            id: "3",
            date: "2025-01-15",
            quantityChange: 100,
            actionType: "Initial Stock",
            performedBy: "admin",
            year: 2025
          },
          {
            id: "4",
            date: "2025-01-25",
            quantityChange: -92,
            actionType: "Correction",
            notes: "Sales recorded",
            performedBy: "admin",
            year: 2025
          }
        ]
      }
    ]
  },
  {
    inventoryName: "Uniform Items",
    createdAt: "2025-01-10",
    year: 2025,
    items: [
      {
        itemName: "School Shirts",
        quantity: 45,
        defaultPrice: 15.00,
        lowStockThreshold: 10,
        stockLog: [
          {
            id: "5",
            date: "2025-01-10",
            quantityChange: 50,
            actionType: "Initial Stock",
            performedBy: "admin",
            year: 2025
          }
        ]
      }
    ]
  }
]

const mockSales: SaleRecord[] = [
  {
    id: "sale1",
    inventoryName: "School Supplies",
    itemName: "Exercise Books",
    quantitySold: 10,
    unitPrice: 2.50,
    total: 25.00,
    soldAt: "2025-01-22T10:30:00Z",
    soldBy: "sales_user1",
    year: 2025,
    status: "completed",
    reversedAt: null,
    reversedBy: null,
    reversalReason: null
  },
  {
    id: "sale2",
    inventoryName: "School Supplies", 
    itemName: "Pens",
    quantitySold: 25,
    unitPrice: 1.00,
    total: 25.00,
    soldAt: "2025-01-23T14:15:00Z",
    soldBy: "sales_user1",
    year: 2025,
    status: "completed",
    reversedAt: null,
    reversedBy: null,
    reversalReason: null
  }
]

export default function InventoryPage() {
  const [inventories] = useState<Inventory[]>(mockInventories)
  const [sales] = useState<SaleRecord[]>(mockSales)
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null)

  const calculateInventoryStats = (inventory: Inventory) => {
    const totalItems = inventory.items.length
    const totalQuantity = inventory.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const totalValue = inventory.items.reduce((sum, item) => sum + (item.quantity * item.defaultPrice), 0)
    
    let lowStockCount = 0
    let outOfStockCount = 0

    inventory.items.forEach((item) => {
      const qty = item.quantity || 0
      const threshold = typeof item.lowStockThreshold === "number" ? item.lowStockThreshold : 5
      if (qty === 0) {
        outOfStockCount += 1
      } else if (qty <= threshold) {
        lowStockCount += 1
      }
    })

    return {
      totalItems,
      totalQuantity,
      totalValue,
      lowStockCount,
      outOfStockCount
    }
  }

  const getInventorySales = (inventoryName: string) => {
    return sales.filter(sale => 
      sale.inventoryName === inventoryName && 
      sale.status === "completed"
    )
  }

  const getStockHistory = (inventory: Inventory) => {
    const restocks = inventory.items.flatMap((item) =>
      item.stockLog.map((log) => ({
        type: "restock" as const,
        date: log.date,
        itemName: item.itemName,
        quantity: log.quantityChange,
        value: null,
        note: log.actionType,
        performedBy: log.performedBy ?? null,
      }))
    )

    const salesRows = sales
      .filter(
        (s) =>
          s.inventoryName === inventory.inventoryName &&
          s.year === inventory.year &&
          s.status === "completed",
      )
      .map((s) => ({
        type: "sale" as const,
        date: s.soldAt,
        itemName: s.itemName,
        quantity: -s.quantitySold,
        value: s.total,
        note: `Sold by ${s.soldBy}`,
        performedBy: s.soldBy,
      }))

    return [...restocks, ...salesRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }

  if (selectedInventory) {
    const stats = calculateInventoryStats(selectedInventory)
    const inventorySales = getInventorySales(selectedInventory.inventoryName)
    const stockHistory = getStockHistory(selectedInventory)
    const totalSalesValue = inventorySales.reduce((sum, sale) => sum + sale.total, 0)

    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Inventories
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Boxes className="w-6 h-6" />
              {selectedInventory.inventoryName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Year: {selectedInventory.year} • Created: {new Date(selectedInventory.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuantity}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSalesValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Status */}
        {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.outOfStockCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    OUT OF STOCK: {stats.outOfStockCount}
                  </Badge>
                )}
                {stats.lowStockCount > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 border-yellow-400 text-yellow-700 bg-yellow-50">
                    <AlertTriangle className="w-3 h-3" />
                    LOW STOCK: {stats.lowStockCount}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="items" className="space-y-4">
          <TabsList>
            <TabsTrigger value="items">Items ({selectedInventory.items.length})</TabsTrigger>
            <TabsTrigger value="sales">Sales ({inventorySales.length})</TabsTrigger>
            <TabsTrigger value="history">History ({stockHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Current stock levels and values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedInventory.items.map((item) => {
                    const isOutOfStock = item.quantity === 0
                    const isLowStock = item.quantity <= item.lowStockThreshold && item.quantity > 0
                    const itemValue = item.quantity * item.defaultPrice

                    return (
                      <div key={item.itemName} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-muted-foreground">
                            Default Price: ${item.defaultPrice.toFixed(2)} • Threshold: {item.lowStockThreshold}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{item.quantity} units</div>
                          <div className="text-sm text-muted-foreground">${itemValue.toFixed(2)}</div>
                          {isOutOfStock && (
                            <Badge variant="destructive" className="mt-1">Out of Stock</Badge>
                          )}
                          {isLowStock && (
                            <Badge variant="outline" className="mt-1 border-yellow-400 text-yellow-700 bg-yellow-50">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Sales Records</CardTitle>
                <CardDescription>Completed sales transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventorySales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No sales records found for this inventory.
                    </div>
                  ) : (
                    inventorySales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{sale.itemName}</div>
                          <div className="text-sm text-muted-foreground">
                            Sold by {sale.soldBy} • {new Date(sale.soldAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{sale.quantitySold} units</div>
                          <div className="text-sm text-muted-foreground">${sale.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Stock History</CardTitle>
                <CardDescription>All stock movements and sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.type === 'restock' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{entry.itemName}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.note} • {entry.performedBy || 'System'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          entry.quantity > 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {entry.quantity > 0 ? '+' : ''}{entry.quantity} units
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                          {entry.value && ` • $${entry.value.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Boxes className="w-6 h-6" />
          Inventory Management
        </h1>
        <p className="text-muted-foreground">
          View inventory levels, stock movements, and sales history (Read-only)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventories.map((inventory) => {
          const stats = calculateInventoryStats(inventory)
          const hasLowStock = stats.lowStockCount > 0
          const hasOutOfStock = stats.outOfStockCount > 0

          return (
            <Card 
              key={inventory.inventoryName} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedInventory(inventory)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="w-5 h-5" />
                  {inventory.inventoryName}
                </CardTitle>
                <CardDescription>
                  Year: {inventory.year} • Created: {new Date(inventory.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Items</div>
                    <div className="font-semibold">{stats.totalItems}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Qty</div>
                    <div className="font-semibold">{stats.totalQuantity}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Value</div>
                    <div className="font-semibold">${stats.totalValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Sales</div>
                    <div className="font-semibold">{getInventorySales(inventory.inventoryName).length}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {hasOutOfStock && (
                    <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      OUT OF STOCK: {stats.outOfStockCount}
                    </Badge>
                  )}
                  {hasLowStock && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs border-yellow-400 text-yellow-700 bg-yellow-50">
                      <AlertTriangle className="w-3 h-3" />
                      LOW STOCK: {stats.lowStockCount}
                    </Badge>
                  )}
                  {!hasLowStock && !hasOutOfStock && (
                    <Badge variant="outline" className="text-xs border-green-400 text-green-700 bg-green-50">
                      Stock Healthy
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {inventories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Boxes className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inventories Found</h3>
            <p className="text-muted-foreground">
              No inventory data is available. Please ensure the desktop application is synced with the web mirror.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
