import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: string[];
  categories: string[];
  onCreated?: () => void;
}

export default function AddProductDialog({ open, onOpenChange, brands, categories, onCreated }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    default_cost_price: '',
    default_sell_price: '',
  });
  const [codePreview, setCodePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(false);

  useEffect(() => {
    const resetForm = () => {
      setFormData({
        name: '',
        brand: '',
        category: '',
        description: '',
        default_cost_price: '',
        default_sell_price: '',
      });
      setLoading(false);
    };

    const fetchCode = async () => {
      setFetchingCode(true);
      try {
        const { data } = await api.get<{ code: string }>('/sequences/product-code');
        setCodePreview(data.code);
      } catch (error) {
        console.error(error);
        setCodePreview('');
      } finally {
        setFetchingCode(false);
      }
    };

    if (open) {
      fetchCode();
    } else {
      resetForm();
      setCodePreview('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        default_cost_price: Number(formData.default_cost_price),
        default_sell_price: Number(formData.default_sell_price),
      });
      toast.success('Product added successfully!');
      onCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Create a new product in your inventory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Product Code</Label>
              <Input
                id="code"
                value={fetchingCode ? 'Loading…' : codePreview}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nike Air Max 90"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                list="brand-options"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Nike"
                required
              />
              <datalist id="brand-options">
                {brands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                list="category-options"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Sneakers"
                required
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Default Cost Price ($) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.default_cost_price}
                onChange={(e) => setFormData({ ...formData, default_cost_price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Default Sell Price ($) *</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={formData.default_sell_price}
                onChange={(e) => setFormData({ ...formData, default_sell_price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
