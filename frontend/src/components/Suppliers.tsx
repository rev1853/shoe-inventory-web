import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import AddSupplierDialog from './dialogs/AddSupplierDialog';
import EditSupplierDialog from './dialogs/EditSupplierDialog';
import DeleteConfirmDialog from './dialogs/DeleteConfirmDialog';
import Pagination from './Pagination';
import api from '../lib/api';
import { Supplier } from '../lib/types';
import { toast } from 'sonner@2.0.3';

type SortField = 'name' | 'contact' | 'address';
type SortOrder = 'asc' | 'desc';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchTerm || undefined,
        sort_by: sortField,
        sort_dir: sortOrder,
        page: currentPage,
        per_page: pageSize,
      };

      const { data } = await api.get('/suppliers', { params });
      setSuppliers(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortField, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
          <h1 className="text-2xl sm:text-3xl">Manage Suppliers</h1>
          <p className="text-gray-500 text-sm sm:text-base">Manage your supplier information</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, contact, or address..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4">
                      <SortButton field="name">Name</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell">
                      <SortButton field="contact">Contact</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell">
                      <SortButton field="address">Address</SortButton>
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 hidden xl:table-cell">Notes</th>
                    <th className="text-left py-3 px-2 sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500 text-sm">Loading suppliers...</td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">{supplier.name}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm hidden md:table-cell">{supplier.contact}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden lg:table-cell">{supplier.address}</td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden xl:table-cell">{supplier.notes}</td>
                        <td className="py-3 px-2 sm:px-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setDeleteDialogOpen(true);
                              }}
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

      <AddSupplierDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onCreated={fetchSuppliers} />
      <EditSupplierDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} supplier={selectedSupplier} onUpdated={fetchSuppliers} />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${selectedSupplier?.name}"?`}
        onConfirm={async () => {
          if (!selectedSupplier) return;
          try {
            await api.delete(`/suppliers/${selectedSupplier.id}`);
            toast.success('Supplier deleted');
            setDeleteDialogOpen(false);
            fetchSuppliers();
          } catch (error: any) {
            toast.error(error.response?.data?.message ?? 'Failed to delete supplier');
          }
        }}
      />
    </div>
  );
}
