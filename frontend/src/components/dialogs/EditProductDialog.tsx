import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { requiredText, decimalMax, optionalText } from '../../lib/validation';
import { showApiError } from '../../lib/errors';
import { Product } from '../../lib/types';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  brands: string[];
  categories: string[];
  onUpdated?: () => void;
}

export default function EditProductDialog({ open, onOpenChange, product, brands, categories, onUpdated }: EditProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    default_cost_price: '',
    default_sell_price: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && open) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        description: product.description || '',
        default_cost_price: product.default_cost_price?.toString() || '',
        default_sell_price: product.default_sell_price?.toString() || '',
      });
      setErrors({});
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const nextErrors: Record<string, string> = {};
    const nameError = requiredText(formData.name, 'Product name', 150);
    if (nameError) nextErrors.name = nameError;
    const brandError = requiredText(formData.brand, 'Brand', 100);
    if (brandError) nextErrors.brand = brandError;
    const categoryError = requiredText(formData.category, 'Category', 100);
    if (categoryError) nextErrors.category = categoryError;
    const descError = optionalText(formData.description, 'Description', 500);
    if (descError) nextErrors.description = descError;
    const costError = decimalMax(formData.default_cost_price, 'Default cost price', 9999999999.99, 2);
    if (costError) nextErrors.default_cost_price = costError;
    const sellError = decimalMax(formData.default_sell_price, 'Default sell price', 9999999999.99, 2);
    if (sellError) nextErrors.default_sell_price = sellError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setLoading(true);
    try {
      await api.put(`/products/${product.id}`, {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        default_cost_price: Number(formData.default_cost_price),
        default_sell_price: Number(formData.default_sell_price),
        is_active: product.is_active,
      });
      toast.success('Product updated successfully!');
      onUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      showApiError(error, 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Product Code *</Label>
              <Input id="code" value={product.code} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                list="brand-edit-options"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
              {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
              <datalist id="brand-edit-options">
                {brands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                list="category-edit-options"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              <datalist id="category-edit-options">
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
                rows={3}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Default Cost Price ($) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.default_cost_price}
                onChange={(e) => setFormData({ ...formData, default_cost_price: e.target.value })}
                required
              />
              {errors.default_cost_price && <p className="text-xs text-destructive">{errors.default_cost_price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Default Sell Price ($) *</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={formData.default_sell_price}
                onChange={(e) => setFormData({ ...formData, default_sell_price: e.target.value })}
                required
              />
              {errors.default_sell_price && <p className="text-xs text-destructive">{errors.default_sell_price}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 disabled:opacity-70">
              {loading ? 'Saving...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
