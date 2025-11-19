import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Grid3x3 } from 'lucide-react';
import AddProductDialog from './dialogs/AddProductDialog';
import EditProductDialog from './dialogs/EditProductDialog';
import DeleteConfirmDialog from './dialogs/DeleteConfirmDialog';
import Pagination from './Pagination';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner@2.0.3';
import api from '../lib/api';
import { LookupOptions, Product } from '../lib/types';

type SortField = 'code' | 'name' | 'brand' | 'category' | 'default_cost_price' | 'default_sell_price';
type SortOrder = 'asc' | 'desc';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchLookups = useCallback(async () => {
    try {
      const { data } = await api.get<LookupOptions>('/lookups/options');
      setBrands(Array.from(new Set(data.brands)));
      setCategories(Array.from(new Set(data.categories)));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchTerm || undefined,
        brand: brandFilter !== 'all' ? brandFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sort_by: sortField,
        sort_dir: sortOrder,
        page: currentPage,
        per_page: pageSize,
      };

      const { data } = await api.get('/products', { params });
      setProducts(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, brandFilter, categoryFilter, sortField, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleManageVariants = (product: Product) => {
    navigate(`/variants?product=${product.id}`);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Manage Products</h1>
          <p className="text-gray-500 text-sm sm:text-base">Add, edit, and manage your product catalog</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-visible">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={brandFilter}
              onValueChange={(value) => {
                setBrandFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 sm:px-4">
                    <SortButton field="code">Code</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4">
                    <SortButton field="name">Name</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell">
                    <SortButton field="brand">Brand</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell">
                    <SortButton field="category">Category</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden xl:table-cell">Description</th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell">
                    <SortButton field="default_cost_price">Cost</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell">
                    <SortButton field="default_sell_price">Sell</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500 text-sm">
                      Loading products...
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 sm:px-4 font-mono text-xs sm:text-sm">{product.code}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">{product.name}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm hidden md:table-cell">{product.brand}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm hidden lg:table-cell">{product.category}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden xl:table-cell max-w-xs truncate">{product.description}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm hidden lg:table-cell">${product.default_cost_price.toFixed(2)}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm hidden lg:table-cell">${product.default_sell_price.toFixed(2)}</td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleManageVariants(product)}
                            title="Manage Variants"
                          >
                            <Grid3x3 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        brands={brands}
        categories={categories}
        onCreated={fetchProducts}
      />
      <EditProductDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={selectedProduct}
        brands={brands}
        categories={categories}
        onUpdated={fetchProducts}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This will also delete all variants.`}
        onConfirm={async () => {
          if (!selectedProduct) return;
          try {
            await api.delete(`/products/${selectedProduct.id}`);
            toast.success('Product deleted');
            setDeleteDialogOpen(false);
            fetchProducts();
          } catch (error: any) {
            toast.error(error.response?.data?.message ?? 'Failed to delete product');
          }
        }}
      />
    </div>
  );
}
