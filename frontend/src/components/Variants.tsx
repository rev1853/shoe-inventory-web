import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Settings, QrCode, Search, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import AddVariantDialog from './dialogs/AddVariantDialog';
import EditVariantDialog from './dialogs/EditVariantDialog';
import DeleteConfirmDialog from './dialogs/DeleteConfirmDialog';
import StockInDialog from './dialogs/StockInDialog';
import StockOutDialog from './dialogs/StockOutDialog';
import StockAdjustDialog from './dialogs/StockAdjustDialog';
import QRCodeDialog from './dialogs/QRCodeDialog';
import ImagePreviewDialog from './dialogs/ImagePreviewDialog';
import Pagination from './Pagination';
import api from '../lib/api';
import { LookupOptions, ProductVariant, Supplier } from '../lib/types';
import { toast } from 'sonner@2.0.3';

type SortField = 'sku' | 'color' | 'size' | 'stock';
type SortOrder = 'asc' | 'desc';

type UserRole = 'admin' | 'staff';

interface VariantsProps {
  role: UserRole;
}

export default function Variants({ role }: VariantsProps) {
  const [searchParams] = useSearchParams();
  const productFilterParam = searchParams.get('product');

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [products, setProducts] = useState<LookupOptions['products']>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [productIdFilter, setProductIdFilter] = useState(productFilterParam || 'all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('sku');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const canManageVariants = role === 'admin';
  const canAdjustStock = ['admin', 'staff'].includes(role);

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchTerm || undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        product_id: productIdFilter !== 'all' ? productIdFilter : undefined,
        sort_by: sortField,
        sort_dir: sortOrder,
        page: currentPage,
        per_page: pageSize,
      };

      const { data } = await api.get('/variants', { params });
      setVariants(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, genderFilter, productIdFilter, sortField, sortOrder, currentPage, pageSize]);

  const fetchLookups = useCallback(async () => {
    try {
      const lookups = await api.get<LookupOptions>('/lookups/options');
      setProducts(lookups.data.products);
      setSuppliers(
        lookups.data.suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          contact: '',
          address: '',
          notes: '',
        })) as Supplier[],
      );
      if (productFilterParam) {
        setExpandedProducts(new Set([Number(productFilterParam)]));
      }
    } catch (error) {
      console.error(error);
    }
  }, [productFilterParam]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const groupedVariants = useMemo(() => {
    const groups: Record<number, ProductVariant[]> = {};
    variants.forEach((variant) => {
      if (!groups[variant.product_id]) {
        groups[variant.product_id] = [];
      }
      groups[variant.product_id].push(variant);
    });
    return groups;
  }, [variants]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleProductExpand = (productId: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.current_qty <= 0) return 'out';
    if (variant.current_qty <= variant.min_qty) return 'low';
    return 'ok';
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button className="flex items-center gap-1 text-xs" onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`} />
    </button>
  );

  const actions = (variant: ProductVariant) => (
    <div className="flex gap-1">
      {canAdjustStock && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVariant(variant);
              setStockInOpen(true);
            }}
          >
            <ArrowUp className="w-4 h-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVariant(variant);
              setStockOutOpen(true);
            }}
          >
            <ArrowDown className="w-4 h-4 text-orange-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVariant(variant);
              setStockAdjustOpen(true);
            }}
          >
            <Settings className="w-4 h-4 text-blue-600" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setSelectedVariant(variant);
          setQrCodeOpen(true);
        }}
      >
        <QrCode className="w-4 h-4 text-purple-600" />
      </Button>
      {canManageVariants && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVariant(variant);
              setEditDialogOpen(true);
            }}
          >
            <Pencil className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVariant(variant);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">{canManageVariants ? 'Manage Variants' : 'Variants'}</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {canManageVariants ? 'Manage product variants and stock levels' : 'View variants and update stock'}
          </p>
        </div>
        {canManageVariants && (
          <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by SKU or product..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={productIdFilter}
              onValueChange={(value) => {
                setProductIdFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={genderFilter}
              onValueChange={(value) => {
                setGenderFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="MEN">Men</SelectItem>
                <SelectItem value="WOMEN">Women</SelectItem>
                <SelectItem value="UNISEX">Unisex</SelectItem>
                <SelectItem value="KIDS">Kids</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedVariants).map(([productId, productVariants]) => {
              const productInfo = productVariants[0].product;
              const isExpanded = expandedProducts.has(Number(productId));

              return (
                <div key={productId} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleProductExpand(Number(productId))}
                    className="w-full bg-gray-50 hover:bg-gray-100 transition-colors p-4 flex items-center gap-4"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="w-16 h-16 bg-white rounded border flex-shrink-0 overflow-hidden">
                      {productVariants[0].image_url && (
                        <ImageWithFallback
                          src={productVariants[0].image_url}
                          alt={productInfo?.name ?? 'Variant image'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base sm:text-lg">{productInfo?.name ?? 'Product'}</div>
                      <div className="text-sm text-gray-500">{productInfo?.brand} • {productVariants.length} variant{productVariants.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-sm text-gray-500 hidden sm:block">
                      Total Stock: {productVariants.reduce((sum, v) => sum + v.current_qty, 0)}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-t border-b">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm">Image</th>
                            <th className="text-left py-3 px-4 text-sm">SKU</th>
                            <th className="text-left py-3 px-4 text-sm hidden sm:table-cell">Gender</th>
                            <th className="text-left py-3 px-4 text-sm hidden md:table-cell">Color</th>
                            <th className="text-left py-3 px-4 text-sm">
                              <SortButton field="size">Size</SortButton>
                            </th>
                            <th className="text-left py-3 px-4 text-sm hidden lg:table-cell">Min</th>
                            <th className="text-left py-3 px-4 text-sm hidden lg:table-cell">Cost</th>
                            <th className="text-left py-3 px-4 text-sm hidden lg:table-cell">Sell</th>
                            <th className="text-left py-3 px-4 text-sm">
                              <SortButton field="stock">Stock</SortButton>
                            </th>
                            <th className="text-left py-3 px-4 text-sm hidden md:table-cell">Status</th>
                            <th className="text-left py-3 px-4 text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productVariants.map((variant) => {
                            const status = getStockStatus(variant);
                            return (
                              <tr key={variant.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => {
                                      if (variant.image_url) {
                                        setSelectedVariant(variant);
                                        setImagePreviewOpen(true);
                                      }
                                    }}
                                    className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                                  >
                                    {variant.image_url ? (
                                      <ImageWithFallback src={variant.image_url} alt={variant.sku} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs text-gray-400">No img</span>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-4 font-mono text-xs">{variant.sku}</td>
                                <td className="py-3 px-4 text-sm hidden sm:table-cell">{variant.gender}</td>
                                <td className="py-3 px-4 text-sm hidden md:table-cell">{variant.color}</td>
                                <td className="py-3 px-4 text-sm">{variant.size_system} {variant.size}</td>
                                <td className="py-3 px-4 text-sm hidden lg:table-cell">{variant.min_qty}</td>
                                <td className="py-3 px-4 text-sm hidden lg:table-cell">${variant.cost_price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-sm hidden lg:table-cell">${variant.sell_price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-sm font-semibold">{variant.current_qty}</td>
                                <td className="py-3 px-4 text-sm hidden md:table-cell">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    status === 'out'
                                      ? 'bg-red-100 text-red-600'
                                      : status === 'low'
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'bg-green-100 text-green-600'
                                  }`}>
                                    {status === 'out' ? 'Out of stock' : status === 'low' ? 'Low stock' : 'OK'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm">{actions(variant)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
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

      {canManageVariants && (
        <>
          <AddVariantDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            products={products}
            onCreated={fetchVariants}
          />
          <EditVariantDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            variant={selectedVariant}
            onUpdated={fetchVariants}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Variant"
            description={`Are you sure you want to delete variant "${selectedVariant?.sku}"?`}
            onConfirm={async () => {
              if (!selectedVariant) return;
              try {
                await api.delete(`/variants/${selectedVariant.id}`);
                toast.success('Variant deleted');
                setDeleteDialogOpen(false);
                fetchVariants();
              } catch (error: any) {
                toast.error(error.response?.data?.message ?? 'Failed to delete variant');
              }
            }}
          />
        </>
      )}
      <StockInDialog
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        variants={variants}
        suppliers={suppliers}
        preselectedVariant={selectedVariant}
        onSuccess={fetchVariants}
      />
      <StockOutDialog
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        variants={variants}
        preselectedVariant={selectedVariant}
        onSuccess={fetchVariants}
      />
      <StockAdjustDialog
        open={stockAdjustOpen}
        onOpenChange={setStockAdjustOpen}
        variant={selectedVariant}
        variants={variants}
        onSuccess={fetchVariants}
      />
      <QRCodeDialog
        open={qrCodeOpen}
        onOpenChange={setQrCodeOpen}
        variant={selectedVariant ?? undefined}
      />
      <ImagePreviewDialog
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        imageUrl={selectedVariant?.image_url || ''}
        title={selectedVariant ? `${selectedVariant.product?.name} - ${selectedVariant.sku}` : ''}
      />
    </div>
  );
}
