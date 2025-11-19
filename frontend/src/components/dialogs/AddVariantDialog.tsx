import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';

interface AddVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Array<{ id: number; name: string; code: string; brand: string }>;
  onCreated?: () => void;
}

const genders = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'];
const sizeSystems = ['US', 'EU', 'UK', 'CM'];

export default function AddVariantDialog({ open, onOpenChange, products, onCreated }: AddVariantDialogProps) {
  const [formData, setFormData] = useState({
    productId: '',
    gender: 'MEN',
    color: '',
    sizeSystem: 'US',
    size: '',
    minQty: '',
    costPrice: '',
    sellPrice: '',
    image: null as File | null,
  });
  const [skuPreview, setSkuPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        productId: '',
        gender: 'MEN',
        color: '',
        sizeSystem: 'US',
        size: '',
        minQty: '',
        costPrice: '',
        sellPrice: '',
        image: null,
      });
      setSkuPreview('');
      setLoading(false);
      return;
    }

    const fetchSku = async () => {
      try {
        const { data } = await api.get<{ sku: string }>('/sequences/variant-sku');
        setSkuPreview(data.sku);
      } catch (error) {
        console.error(error);
        setSkuPreview('');
      }
    };

    fetchSku();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      toast.error('Please select a product.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('product_id', formData.productId);
      payload.append('gender', formData.gender);
      payload.append('color', formData.color);
      payload.append('size_system', formData.sizeSystem);
      payload.append('size', formData.size);
      payload.append('min_qty', formData.minQty || '0');
      payload.append('cost_price', formData.costPrice || '0');
      payload.append('sell_price', formData.sellPrice || '0');
      payload.append('current_qty', '0');
      if (formData.image) {
        payload.append('image', formData.image);
      }

      await api.post('/variants', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Variant added successfully!');
      onCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to add variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Variant</DialogTitle>
          <DialogDescription>Create a new product variant</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>SKU (Auto-generated)</Label>
              <Input value={skuPreview || 'Generating...'} readOnly disabled />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="productId">Product *</Label>
              <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                <SelectTrigger id="productId">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g., Black/White"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizeSystem">Size System *</Label>
              <Select value={formData.sizeSystem} onValueChange={(value) => setFormData({ ...formData, sizeSystem: value })}>
                <SelectTrigger id="sizeSystem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeSystems.map((system) => (
                    <SelectItem key={system} value={system}>{system}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size *</Label>
              <Input
                id="size"
                type="number"
                step="0.5"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 9.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQty">Minimum Quantity *</Label>
              <Input
                id="minQty"
                type="number"
                value={formData.minQty}
                onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
                placeholder="e.g., 5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price ($) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price ($) *</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={formData.sellPrice}
                onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="image">Product Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Add Variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
