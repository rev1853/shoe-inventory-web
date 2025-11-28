import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Pencil, Trash2, KeyRound, Search, ArrowUpDown } from 'lucide-react';
import { Badge } from './ui/badge';
import AddUserDialog from './dialogs/AddUserDialog';
import EditUserDialog from './dialogs/EditUserDialog';
import DeleteConfirmDialog from './dialogs/DeleteConfirmDialog';
import ResetPasswordDialog from './dialogs/ResetPasswordDialog';
import Pagination from './Pagination';
import { toast } from 'sonner@2.0.3';
import api from '../lib/api';
import { User } from '../lib/types';

type SortField = 'name' | 'email' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortField,
        sort_dir: sortOrder,
        page: currentPage,
        per_page: pageSize,
      };

      const { data } = await api.get('/users', { params });
      setUsers(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.last_page);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, sortField, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Manage Users</h1>
          <p className="text-gray-500 text-sm sm:text-base">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 sm:px-4">
                    <SortButton field="name">Name</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4">
                    <SortButton field="email">Email</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden md:table-cell">
                    <SortButton field="role">Role</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 hidden lg:table-cell">
                    <SortButton field="status">Status</SortButton>
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500 text-sm">Loading users...</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted">
                      <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">{user.name}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm hidden md:table-cell">
                        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-sm hidden lg:table-cell">
                        <Badge variant={user.status === 'active' ? 'outline' : 'destructive'} className="capitalize">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordOpen(true);
                            }}
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-primary" />
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

      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onCreated={fetchUsers} />
      <EditUserDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} user={selectedUser} onUpdated={fetchUsers} />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete user "${selectedUser?.name}"?`}
        onConfirm={async () => {
          if (!selectedUser) return;
          try {
            await api.delete(`/users/${selectedUser.id}`);
            toast.success('User deleted');
            setDeleteDialogOpen(false);
            fetchUsers();
          } catch (error: any) {
            toast.error(error.response?.data?.message ?? 'Failed to delete user');
          }
        }}
      />
      <ResetPasswordDialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen} user={selectedUser} />
    </div>
  );
}
