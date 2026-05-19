"use client"

import { useState, useMemo } from 'react'
import { 
  LayoutGrid, 
  Package, 
  Tag, 
  History, 
  BarChart3, 
  Settings,
  Plus,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Download,
  Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { usePOS } from '@/lib/pos-context'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getProductEmoji } from '@/lib/pos-store'

type AdminTab = 'dashboard' | 'products' | 'categories' | 'users' | 'transactions' | 'reports' | 'settings'

export function AdminDashboard() {
  const { 
    products, 
    categories, 
    transactions,
    users,
    settings,
    printerSettings,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteUser,
    register,
    updateSettings,
    updatePrinterSettings,
    formatCurrency,
  } = usePOS()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<typeof products[0] | null>(null)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<typeof categories[0] | null>(null)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [isViewTransactionOpen, setIsViewTransactionOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null)
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  
  // Product form state
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('')
  
  // Category form state
  const [categoryName, setCategoryName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')
  
  // Edit product form state
  const [editProductName, setEditProductName] = useState('')
  const [editProductCategory, setEditProductCategory] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')
  const [editProductStock, setEditProductStock] = useState('')
  const [editProductImage, setEditProductImage] = useState<string | undefined>('')
  const [editProductImagePreview, setEditProductImagePreview] = useState<string | undefined>('')
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false)
  
  // Settings form state
  const [storeName, setStoreName] = useState(settings.storeName)
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail)
  const [minStock, setMinStock] = useState(settings.minStock.toString())

  // Printer settings state
  const [printerConnectionType, setPrinterConnectionType] = useState(printerSettings.connectionType)
  const [printerDeviceName, setPrinterDeviceName] = useState(printerSettings.deviceName)
  const [printerIpAddress, setPrinterIpAddress] = useState(printerSettings.ipAddress || '')
  const [printerPort, setPrinterPort] = useState(printerSettings.port?.toString() || '9100')
  const [printerEnabled, setPrinterEnabled] = useState(printerSettings.isEnabled)
  const [printerAutoprint, setPrinterAutoprint] = useState(printerSettings.autoprint)

  // User management form state
  const [newUserName, setNewUserName] = useState('')
  const [newUserUsername, setNewUserUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'cashier'>('cashier')
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)

  // Calculated stats
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const todayTransactions = transactions.filter(tx => new Date(tx.createdAt) >= startOfToday)
  const monthTransactions = transactions.filter(tx => new Date(tx.createdAt) >= startOfMonth)
  
  const todayRevenue = todayTransactions.reduce((sum, tx) => sum + tx.total, 0)
  const monthRevenue = monthTransactions.reduce((sum, tx) => sum + tx.total, 0)
  
  const lowStockProducts = products.filter(p => p.stock < settings.minStock)

  // Top selling products
  const productSales: Record<string, number> = {}
  transactions.forEach(tx => {
    const lineItems = tx.lineItems || []
    lineItems.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity
    })
  })
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Filtered transactions
  const getFilteredTransactions = () => {
    const now = new Date()
    switch (transactionFilter) {
      case 'today':
        return transactions.filter(tx => new Date(tx.createdAt) >= startOfToday)
      case 'week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        return transactions.filter(tx => new Date(tx.createdAt) >= startOfWeek)
      case 'month':
        return transactions.filter(tx => new Date(tx.createdAt) >= startOfMonth)
      default:
        return transactions
    }
  }
  const filteredTransactions = getFilteredTransactions()

  // Monthly chart data calculations
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    // Initialize data for all 12 months
    const monthlyData: Record<string, { month: string; revenue: number; quantity: number; transactions: number }> = {}
    monthNames.forEach((month, index) => {
      monthlyData[index] = { month, revenue: 0, quantity: 0, transactions: 0 }
    })
    
    // Aggregate transaction data by month
    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt)
      if (txDate.getFullYear() === currentYear) {
        const monthIndex = txDate.getMonth()
        monthlyData[monthIndex].revenue += tx.total
        monthlyData[monthIndex].transactions += 1
        
        // Sum up quantities from line items
        const lineItems = tx.lineItems || []
        lineItems.forEach(item => {
          monthlyData[monthIndex].quantity += item.quantity
        })
      }
    })
    
    return Object.values(monthlyData)
  }, [transactions])

  // Category breakdown data for pie chart
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, { category: string; quantity: number; revenue: number }> = {}
    
    transactions.forEach(tx => {
      const lineItems = tx.lineItems || []
      lineItems.forEach(item => {
        // Find the product's category
        const product = products.find(p => p.name === item.name)
        const categoryName = product?.category || 'Other'
        
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { category: categoryName, quantity: 0, revenue: 0 }
        }
        categoryTotals[categoryName].quantity += item.quantity
        categoryTotals[categoryName].revenue += item.price * item.quantity
      })
    })
    
    return Object.values(categoryTotals)
  }, [transactions, products])

  // Chart config
  const monthlyChartConfig: ChartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#f59e0b',
    },
    quantity: {
      label: 'Quantity',
      color: '#6366f1',
    },
    transactions: {
      label: 'Transactions',
      color: '#10b981',
    },
  }

  const categoryChartConfig: ChartConfig = {
    quantity: {
      label: 'Quantity',
    },
  }

  const CATEGORY_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

  const handleAddProduct = () => {
    if (!productName || !productCategory || !productPrice || !productStock) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    
    const result = createProduct({
      name: productName,
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
    })
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsAddProductOpen(false)
      setProductName('')
      setProductCategory('')
      setProductPrice('')
      setProductStock('')
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const handleAddCategory = () => {
    if (!categoryName) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' })
      return
    }
    
    const result = createCategory(categoryName)
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsAddCategoryOpen(false)
      setCategoryName('')
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const openEditProduct = (product: typeof products[0]) => {
    setEditingProduct(product)
    setEditProductName(product.name)
    setEditProductCategory(product.category)
    setEditProductPrice(product.price.toString())
    setEditProductStock(product.stock.toString())
    setEditProductImage(product.imageUrl)
    setEditProductImagePreview(product.imageUrl)
    setIsEditProductOpen(true)
  }

  const handleEditProduct = () => {
    if (!editingProduct || !editProductName || !editProductCategory || !editProductPrice || !editProductStock) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    
    const result = updateProduct(editingProduct.id, {
      name: editProductName,
      category: editProductCategory,
      price: parseFloat(editProductPrice),
      stock: parseInt(editProductStock),
      imageUrl: editProductImage,
    })
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsEditProductOpen(false)
      setEditingProduct(null)
      setEditProductImage('')
      setEditProductImagePreview('')
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const handleEditProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingEditImage(true)
    try {
      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditProductImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        toast({ title: 'Error', description: error.error || 'Upload failed', variant: 'destructive' })
        return
      }

      const data = await response.json()
      setEditProductImage(data.url)
      toast({ title: 'Success', description: 'Image uploaded successfully' })
    } catch (error) {
      console.error('Upload error:', error)
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploadingEditImage(false)
    }
  }

  const openEditCategory = (category: typeof categories[0]) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setIsEditCategoryOpen(true)
  }

  const handleEditCategory = () => {
    if (!editingCategory || !editCategoryName) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' })
      return
    }
    
    const result = updateCategory(editingCategory.id, editCategoryName)
    
    if (result.success) {
      toast({ title: 'Success', description: result.message })
      setIsEditCategoryOpen(false)
      setEditingCategory(null)
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const handleSaveSettings = () => {
    updateSettings({
      storeName,
      notificationEmail,
      minStock: parseInt(minStock) || 10,
    })
    toast({ title: 'Success', description: 'Settings saved successfully' })
  }

  const handleSavePrinterSettings = () => {
    if (printerEnabled && !printerDeviceName) {
      toast({ title: 'Error', description: 'Please enter a device name/port for the printer', variant: 'destructive' })
      return
    }

    updatePrinterSettings({
      isEnabled: printerEnabled,
      connectionType: printerConnectionType as 'USB' | 'Network' | 'Bluetooth',
      deviceName: printerDeviceName,
      ipAddress: printerIpAddress,
      port: parseInt(printerPort) || 9100,
      autoprint: printerAutoprint,
    })

    toast({ title: 'Success', description: 'Printer settings saved successfully' })
  }

  const handleTestPrinterConnection = () => {
    // Simulate printer connection test
    toast({ title: 'Info', description: 'Testing printer connection...', variant: 'default' })
    
    // Simulate async test
    setTimeout(() => {
      updatePrinterSettings({ isConnected: true })
      toast({ title: 'Success', description: 'Printer connected successfully!' })
    }, 1500)
  }

  const handleCreateNewUser = () => {
    if (!newUserName || !newUserUsername || !newUserPassword || !newUserConfirmPassword) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    
    if (newUserPassword !== newUserConfirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    if (newUserPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }

    if (users.some(u => u.username === newUserUsername)) {
      toast({ title: 'Error', description: 'Username already exists', variant: 'destructive' })
      return
    }

    const result = register({
      name: newUserName,
      username: newUserUsername,
      password: newUserPassword,
      role: newUserRole,
    })

    if (result.success) {
      toast({ title: 'Success', description: 'User created successfully' })
      setIsUserManagementOpen(false)
      setNewUserName('')
      setNewUserUsername('')
      setNewUserPassword('')
      setNewUserConfirmPassword('')
      setNewUserRole('cashier')
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' })
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId)
      toast({ title: 'Success', description: 'User deleted successfully' })
    }
  }

  const handleExportData = () => {
    if (transactions.length === 0) {
      toast({ title: 'No Data', description: 'There are no transactions to export', variant: 'destructive' })
      return
    }

    // Create CSV headers
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Customer Name',
      'Table Number',
      'Service Type',
      'Items',
      'Subtotal',
      'Discount (%)',
      'Total',
      'Payment Method',
      'Cashier'
    ]

    // Create CSV rows
    const rows = transactions.map(tx => {
      const date = new Date(tx.createdAt)
      const items = tx.lineItems?.map(item => `${item.name} x${item.quantity}`).join('; ') || ''
      const paymentLabels: Record<string, string> = { qris: 'QRIS', debit: 'Debit', credit: 'Credit', cash: 'Cash' }
      
      return [
        tx.id,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        tx.customerName,
        tx.tableNumber || '-',
        tx.serviceType,
        `"${items}"`,
        tx.subtotal,
        tx.discount,
        tx.total,
        paymentLabels[tx.paymentMethod] || tx.paymentMethod,
        tx.cashierName
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({ title: 'Success', description: `Exported ${transactions.length} transactions to CSV` })
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <div className="fade-in">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button 
          onClick={handleExportData}
          variant="outline"
          className="border-amber-500 text-amber-700 hover:bg-amber-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-3 ${
              activeTab === tab.id
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-700 hover:text-amber-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">📦 Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Active stock
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">🏷️ Total Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Categories saved
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">📊 {"Today's Transactions"}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{todayTransactions.length}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Sales
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 font-medium">💰 {"Today's Revenue"}</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(todayRevenue)}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>$</span> Total
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚠️ Low Stock Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-5">No low stock items</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-l-amber-500">
                      <div>
                        <span className="font-semibold text-gray-900">{product.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({product.category})</span>
                      </div>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {product.stock} units
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">📦 Manage Products</h2>
            <Button onClick={() => setIsAddProductOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-amber-500 to-amber-700">
                  <TableHead className="text-white font-semibold">Image</TableHead>
                  <TableHead className="text-white font-semibold">Product Name</TableHead>
                  <TableHead className="text-white font-semibold">Category</TableHead>
                  <TableHead className="text-white font-semibold">Price</TableHead>
                  <TableHead className="text-white font-semibold">Stock</TableHead>
                  <TableHead className="text-white font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">No products</TableCell>
                  </TableRow>
                ) : (
                  products.map(product => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell>
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-500">No img</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{product.name}</TableCell>
                      <TableCell>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.stock < settings.minStock 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stock} units
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-700 hover:bg-amber-50"
                            onClick={() => openEditProduct(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deleteProduct(product.id)
                              toast({ title: 'Success', description: 'Product deleted' })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">🏷️ Manage Categories</h2>
            <Button onClick={() => setIsAddCategoryOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </div>
          
          {categories.length === 0 ? (
            <Card className="p-10 text-center text-gray-500">
              No categories created yet. Add one to get started!
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-400">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
                        onClick={() => openEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          deleteCategory(category.id)
                          toast({ title: 'Success', description: 'Category deleted' })
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">👥 User Management</h2>
            <Button onClick={() => setIsUserManagementOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-700">
              <Plus className="w-4 h-4 mr-2" /> Register New User
            </Button>
          </div>
          
          {users.length === 0 ? (
            <Card className="p-10 text-center text-gray-500">
              No users registered yet.
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-amber-500 to-amber-700">
                    <TableHead className="text-white font-semibold">Username</TableHead>
                    <TableHead className="text-white font-semibold">Full Name</TableHead>
                    <TableHead className="text-white font-semibold">Role</TableHead>
                    <TableHead className="text-white font-semibold">Created</TableHead>
                    <TableHead className="text-white font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-gray-900">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">📜 Transaction History</h2>
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'all'] as const).map(filter => (
                <Button
                  key={filter}
                  size="sm"
                  variant={transactionFilter === filter ? 'default' : 'outline'}
                  onClick={() => setTransactionFilter(filter)}
                  className={transactionFilter === filter ? 'bg-gradient-to-r from-amber-500 to-amber-700' : ''}
                >
                  {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All'}
                </Button>
              ))}
            </div>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-amber-500 to-amber-700">
                  <TableHead className="text-white font-semibold">Transaction ID</TableHead>
                  <TableHead className="text-white font-semibold">Date</TableHead>
                  <TableHead className="text-white font-semibold">Customer</TableHead>
                  <TableHead className="text-white font-semibold">Items</TableHead>
                  <TableHead className="text-white font-semibold">Total</TableHead>
                  <TableHead className="text-white font-semibold">Payment</TableHead>
                  <TableHead className="text-white font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">No transactions</TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(tx => {
                    const paymentLabels = { qris: 'QRIS', debit: 'Debit', credit: 'Credit', cash: 'Cash' }
                    return (
                      <TableRow key={tx.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{tx.customerName}</TableCell>
                        <TableCell>{tx.lineItems?.length || 0} items</TableCell>
                        <TableCell className="font-semibold text-amber-600">{formatCurrency(tx.total)}</TableCell>
                        <TableCell>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                            {paymentLabels[tx.paymentMethod]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransaction(tx)
                              setIsViewTransactionOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">📈 Financial Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">{"Today's Revenue"}</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(todayRevenue)}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(monthRevenue)}</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">{"This Month's Transactions"}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{monthTransactions.length}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>⭐ Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-5">No data</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map(([name, qty]) => (
                    <div key={name} className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-l-amber-500">
                      <span className="font-semibold text-gray-900">{name}</span>
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {qty} units
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Transaction History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Transaction History</CardTitle>
              <CardDescription>
                Revenue volume vs quantity of products sold per month ({new Date().getFullYear()})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No transaction data available</p>
              ) : (
                <ChartContainer config={monthlyChartConfig} className="h-[350px] w-full">
                  <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name) => {
                            if (name === 'revenue') {
                              return [formatCurrency(value as number), 'Revenue']
                            }
                            return [value, name === 'quantity' ? 'Quantity Sold' : 'Transactions']
                          }}
                        />
                      } 
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar 
                      yAxisId="left" 
                      dataKey="revenue" 
                      fill="var(--color-revenue)" 
                      radius={[4, 4, 0, 0]}
                      name="revenue"
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="quantity" 
                      fill="var(--color-quantity)" 
                      radius={[4, 4, 0, 0]}
                      name="quantity"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Product Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Product Category</CardTitle>
                <CardDescription>
                  Quantity distribution across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No category data available</p>
                ) : (
                  <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => {
                              const payload = item?.payload
                              return [
                                <span key="value" className="font-semibold">{value} units</span>,
                                payload?.category || name
                              ]
                            }}
                          />
                        } 
                      />
                      <Pie
                        data={categoryChartData}
                        dataKey="quantity"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Trend</CardTitle>
                <CardDescription>
                  Number of transactions per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No transaction data available</p>
                ) : (
                  <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
                    <LineChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            formatter={(value) => [value, 'Transactions']}
                          />
                        } 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="var(--color-transactions)" 
                        strokeWidth={3}
                        dot={{ fill: 'var(--color-transactions)', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">⚙️ System Settings</h2>
          
          <Card className="max-w-xl">
            <CardContent className="pt-6 space-y-5">
              <div>
                <Label className="font-semibold text-gray-900">Store Name</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Enter store name"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="font-semibold text-gray-900">Notification Email</Label>
                <Input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="email@store.com"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="font-semibold text-gray-900">Minimum Stock Level</Label>
                <Input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="10"
                  min="1"
                  className="mt-2"
                />
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-amber-500 to-amber-700">
                <Settings className="w-4 h-4 mr-2" /> Save Settings
              </Button>
              
              <div className="pt-4 border-t">
                <Button onClick={() => setIsUserManagementOpen(true)} variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" /> Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Printer Settings */}
          <Card className="max-w-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">🖨️ Printer Settings</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${printerSettings.isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs font-semibold text-gray-600">
                    {printerSettings.isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Enable Printer */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="printer-enable"
                    checked={printerEnabled}
                    onChange={(e) => setPrinterEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="printer-enable" className="font-semibold text-gray-900 cursor-pointer">
                    Enable Receipt Printer
                  </Label>
                </div>

                {printerEnabled && (
                  <>
                    {/* Connection Type */}
                    <div>
                      <Label className="font-semibold text-gray-900">Connection Type</Label>
                      <Select value={printerConnectionType} onValueChange={(v) => setPrinterConnectionType(v as 'USB' | 'Network' | 'Bluetooth')}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USB">USB</SelectItem>
                          <SelectItem value="Network">Network (Ethernet)</SelectItem>
                          <SelectItem value="Bluetooth">Bluetooth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Device Name */}
                    <div>
                      <Label className="font-semibold text-gray-900">Device Name / Port</Label>
                      <Input
                        value={printerDeviceName}
                        onChange={(e) => setPrinterDeviceName(e.target.value)}
                        placeholder={printerConnectionType === 'USB' ? 'e.g., COM1 or /dev/usb0' : 'e.g., Printer-001'}
                        className="mt-2"
                      />
                    </div>

                    {/* IP Address (Network only) */}
                    {printerConnectionType === 'Network' && (
                      <>
                        <div>
                          <Label className="font-semibold text-gray-900">IP Address</Label>
                          <Input
                            value={printerIpAddress}
                            onChange={(e) => setPrinterIpAddress(e.target.value)}
                            placeholder="192.168.1.100"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="font-semibold text-gray-900">Port</Label>
                          <Input
                            type="number"
                            value={printerPort}
                            onChange={(e) => setPrinterPort(e.target.value)}
                            placeholder="9100"
                            className="mt-2"
                            min="1"
                            max="65535"
                          />
                        </div>
                      </>
                    )}

                    {/* Auto Print */}
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="autoprint"
                        checked={printerAutoprint}
                        onChange={(e) => setPrinterAutoprint(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="autoprint" className="font-semibold text-gray-900 cursor-pointer text-sm">
                        Auto-print receipt on checkout
                      </Label>
                    </div>

                    {/* Test Connection Button */}
                    <Button 
                      onClick={handleTestPrinterConnection} 
                      variant="outline" 
                      className="w-full mt-4"
                    >
                      Test Connection
                    </Button>
                  </>
                )}

                {/* Save Button */}
                <Button 
                  onClick={handleSavePrinterSettings} 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-700 mt-4"
                  disabled={!printerEnabled && !printerSettings.isEnabled}
                >
                  Save Printer Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Product Modal */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label className="font-semibold">Product Name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Example: Nasi Goreng"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-semibold">Category</Label>
              <Select value={productCategory} onValueChange={setProductCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="font-semibold">Price</Label>
              <Input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="15000"
                min="0"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="font-semibold">Stock</Label>
              <Input
                type="number"
                value={productStock}
                onChange={(e) => setProductStock(e.target.value)}
                placeholder="100"
                min="0"
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} className="bg-gradient-to-r from-amber-500 to-amber-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          
          <div className="pt-4">
            <Label className="font-semibold">Category Name</Label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Example: Food"
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} className="bg-gradient-to-r from-amber-500 to-amber-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Management Modal */}
      <Dialog open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Management</DialogTitle>
            <DialogDescription>Register new users or view existing users</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Register New User Form */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register New User</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-900 font-semibold">Full Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter full name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-900 font-semibold">Username</Label>
                  <Input
                    type="text"
                    placeholder="Enter username"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-900 font-semibold">Password</Label>
                  <div className="relative mt-2">
                    <Input
                      type={showNewUserPassword ? 'text' : 'password'}
                      placeholder="Enter password (min 8 characters)"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-900 font-semibold">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={newUserConfirmPassword}
                    onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-900 font-semibold">Role</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as 'admin' | 'cashier')}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateNewUser} 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Register User
                </Button>
              </div>
            </div>
            
            {/* Users List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Users</h3>
              
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-5">No users registered yet.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead>Username</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-semibold">{user.username}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' ? 'Administrator' : 'Cashier'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsUserManagementOpen(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Transaction Modal */}
      <Dialog open={isViewTransactionOpen} onOpenChange={setIsViewTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-semibold">{selectedTransaction.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <p className="font-semibold">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Service Type:</span>
                  <p className="font-semibold capitalize">{selectedTransaction.serviceType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Payment:</span>
                  <p className="font-semibold uppercase">{selectedTransaction.paymentMethod}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Items:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTransaction.lineItems?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedTransaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-amber-600">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedTransaction.total)}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewTransactionOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-category">Category</Label>
              <Select value={editProductCategory} onValueChange={setEditProductCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-price">Price</Label>
              <Input
                id="edit-product-price"
                type="number"
                value={editProductPrice}
                onChange={(e) => setEditProductPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-product-stock">Stock</Label>
              <Input
                id="edit-product-stock"
                type="number"
                value={editProductStock}
                onChange={(e) => setEditProductStock(e.target.value)}
                placeholder="Enter stock quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-product-image">Product Image</Label>
              {editProductImagePreview && (
                <div className="mb-3 relative">
                  <img 
                    src={editProductImagePreview} 
                    alt="Product preview" 
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="edit-product-image" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs text-amber-600 font-semibold">Click to upload image</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input 
                    id="edit-product-image" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleEditProductImageUpload}
                    disabled={isUploadingEditImage}
                  />
                </label>
              </div>
              {isUploadingEditImage && (
                <p className="text-xs text-amber-600 font-semibold">Uploading image...</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} className="bg-gradient-to-r from-amber-500 to-amber-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} className="bg-gradient-to-r from-amber-500 to-amber-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
