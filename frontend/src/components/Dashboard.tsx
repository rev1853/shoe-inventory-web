import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Package, Grid3x3, AlertTriangle, XCircle, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StockInDialog from './dialogs/StockInDialog';
import StockOutDialog from './dialogs/StockOutDialog';
import AddProductDialog from './dialogs/AddProductDialog';
import api from '../lib/api';
import { DashboardChartPoint, DashboardMetrics, Product, ProductVariant, StockMovement, Supplier } from '../lib/types';
import { toast } from 'sonner@2.0.3';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, chartRes, movementRes] = await Promise.all([
        api.get<DashboardMetrics>('/dashboard/metrics'),
        api.get<{ data: DashboardChartPoint[] }>('/dashboard/chart'),
        api.get<{ data: StockMovement[] }>('/dashboard/recent-movements'),
      ]);

      setMetrics(metricsRes.data);
      setChartData(chartRes.data.data);
      setRecentMovements(movementRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const [variantsRes, suppliersRes, productsRes] = await Promise.all([
        api.get('/variants', { params: { per_page: 100 } }),
        api.get('/suppliers', { params: { per_page: 100 } }),
        api.get('/products', { params: { per_page: 100 } }),
      ]);

      setVariants(variantsRes.data.data);
      setSuppliers(suppliersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchOptions();
  }, [fetchDashboard, fetchOptions]);

  const refreshAll = () => {
    fetchDashboard();
    fetchOptions();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Dashboard</h1>
          <p className="text-gray-500 text-sm sm:text-base">Overview of your inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button onClick={() => setStockInOpen(true)} className="bg-green-600 hover:bg-green-700">
            <ArrowUp className="w-4 h-4 mr-2" />
            Quick Stock In
          </Button>
          <Button onClick={() => setStockOutOpen(true)} className="bg-orange-600 hover:bg-orange-700">
            <ArrowDown className="w-4 h-4 mr-2" />
            Quick Stock Out
          </Button>
          <Button onClick={() => setAddProductOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Products</CardTitle>
            <Package className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{metrics?.products ?? '—'}</div>
            <p className="text-xs text-gray-500 mt-1">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Variants</CardTitle>
            <Grid3x3 className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{metrics?.variants ?? '—'}</div>
            <p className="text-xs text-gray-500 mt-1">All size/color variants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Low Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{metrics?.low_stock ?? '—'}</div>
            <p className="text-xs text-gray-500 mt-1">Below minimum quantity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Out of Stock</CardTitle>
            <XCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{metrics?.out_of_stock ?? '—'}</div>
            <p className="text-xs text-gray-500 mt-1">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Stock Movement Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="stock_in" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Stock In" />
              <Area type="monotone" dataKey="stock_out" stackId="2" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Stock Out" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Date/Time</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Type</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">SKU</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Product</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm">Qty</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">User</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((movement) => (
                    <tr key={movement.id} className="border-b">
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          movement.movement_type === 'IN'
                            ? 'bg-green-100 text-green-700'
                            : movement.movement_type === 'OUT'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {movement.movement_type === 'IN' ? 'Stock In' : movement.movement_type === 'OUT' ? 'Stock Out' : 'Adjustment'}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs font-mono hidden md:table-cell">{movement.variant.sku}</td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{movement.variant.product?.name ?? 'N/A'}</td>
                      <td className={`py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap ${
                        movement.qty_change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.qty_change >= 0 ? `+${movement.qty_change}` : movement.qty_change}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{movement.user?.name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <StockInDialog
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        variants={variants}
        suppliers={suppliers}
        onSuccess={refreshAll}
      />
      <StockOutDialog
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        variants={variants}
        onSuccess={refreshAll}
      />
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        brands={[...new Set(products.map((product) => product.brand))]}
        categories={[...new Set(products.map((product) => product.category))]}
        onCreated={refreshAll}
      />
    </div>
  );
}
