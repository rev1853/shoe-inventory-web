import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowUp, ArrowDown, Settings, Search, ArrowUpDown } from 'lucide-react';
import StockInDialog from './dialogs/StockInDialog';
import StockOutDialog from './dialogs/StockOutDialog';
import StockAdjustDialog from './dialogs/StockAdjustDialog';
import Pagination from './Pagination';
import api from '../lib/api';
import { ProductVariant, StockMovement, Supplier } from '../lib/types';
import { toast } from 'sonner@2.0.3';

type SortField = 'date' | 'type' | 'sku' | 'product';
type SortOrder = 'asc' | 'desc';

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchTerm || undefined,
        movement_type: typeFilter !== 'all' ? typeFilter : undefined,
        page: currentPage,
        per_page: pageSize,
      };

      const { data } = await api.get('/stock-movements', { params });
      setMovements(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, currentPage, pageSize]);

  const fetchVariantOptions = useCallback(async () => {
    try {
      const { data } = await api.get('/variants', { params: { per_page: 100 } });
      setVariants(data.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data } = await api.get('/suppliers', { params: { per_page: 100 } });
      setSuppliers(data.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    fetchVariantOptions();
    fetchSuppliers();
  }, [fetchVariantOptions, fetchSuppliers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-primary transition-colors">
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-gray-400'}`} />
    </button>
  );

  const refreshAll = () => {
    fetchMovements();
    fetchVariantOptions();
  };

  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortField === 'date') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else if (sortField === 'type') {
        aValue = a.movement_type;
        bValue = b.movement_type;
      } else if (sortField === 'sku') {
        aValue = a.variant.sku;
        bValue = b.variant.sku;
      } else {
        aValue = a.variant.product?.name ?? '';
        bValue = b.variant.product?.name ?? '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
    });
  }, [movements, sortField, sortOrder]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Stock Movements</h1>
          <p className="text-gray-500 text-sm sm:text-base">Track every stock change</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button onClick={() => setStockInOpen(true)} variant="secondary">
            <ArrowUp className="w-4 h-4 mr-2" />
            Stock In
          </Button>
          <Button onClick={() => setStockOutOpen(true)}>
            <ArrowDown className="w-4 h-4 mr-2" />
            Stock Out
          </Button>
          <Button
            onClick={() => {
              setSelectedVariant(null);
              setStockAdjustOpen(true);
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Adjust
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by SKU, product, or reference..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IN">Stock In</SelectItem>
                <SelectItem value="OUT">Stock Out</SelectItem>
                <SelectItem value="ADJ">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4 text-sm">
                      <SortButton field="date">Date/Time</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm">
                      <SortButton field="type">Type</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm hidden md:table-cell">
                      <SortButton field="sku">SKU</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm">
                      <SortButton field="product">Product</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm">Qty</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm hidden lg:table-cell">Reason</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm hidden xl:table-cell">Supplier</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm hidden lg:table-cell">User</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-sm hidden xl:table-cell">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-gray-500 text-sm">Loading movements...</td>
                    </tr>
                  ) : (
                  sortedMovements.map((movement) => (
                      <tr key={movement.id} className="border-b hover:bg-muted">
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {new Date(movement.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                            movement.movement_type === 'IN'
                              ? 'bg-secondary text-secondary-foreground'
                              : movement.movement_type === 'OUT'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                          }`}>
                            {movement.movement_type === 'IN' ? 'Stock In' : movement.movement_type === 'OUT' ? 'Stock Out' : 'Adjustment'}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 font-mono text-xs hidden md:table-cell">{movement.variant.sku}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm">{movement.variant.product?.name ?? 'N/A'}</td>
                        <td className={`py-3 px-2 sm:px-4 text-sm font-semibold whitespace-nowrap ${
                          movement.qty_change >= 0 ? 'text-secondary-foreground' : 'text-primary'
                        }`}>
                          {movement.qty_change >= 0 ? `+${movement.qty_change}` : movement.qty_change}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden lg:table-cell max-w-xs truncate">{movement.reason}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden xl:table-cell">{movement.supplier?.name ?? '-'}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden lg:table-cell">{movement.user?.name ?? '-'}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm font-mono hidden xl:table-cell">{movement.reference}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
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
      <StockAdjustDialog
        open={stockAdjustOpen}
        onOpenChange={setStockAdjustOpen}
        variant={selectedVariant}
        variants={variants}
        onSuccess={refreshAll}
      />
    </div>
  );
}
