import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { ProductVariant } from '../../lib/types';

interface EditVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ProductVariant | null;
  onUpdated?: () => void;
}

const genders = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'];
const sizeSystems = ['US', 'EU', 'UK', 'CM'];

export default function EditVariantDialog({ open, onOpenChange, variant, onUpdated }: EditVariantDialogProps) {
  const [formData, setFormData] = useState({
    gender: 'MEN',
    color: '',
    sizeSystem: 'US',
    size: '',
    minQty: '',
    costPrice: '',
    sellPrice: '',
    image: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant && open) {
      setFormData({
        gender: variant.gender,
        color: variant.color,
        sizeSystem: variant.size_system,
        size: variant.size.toString(),
        minQty: variant.min_qty.toString(),
        costPrice: variant.cost_price.toString(),
        sellPrice: variant.sell_price.toString(),
        image: null,
      });
    }
  }, [variant, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('product_id', String(variant.product_id));
      payload.append('gender', formData.gender);
      payload.append('color', formData.color);
      payload.append('size_system', formData.sizeSystem);
      payload.append('size', formData.size);
      payload.append('min_qty', formData.minQty);
      payload.append('cost_price', formData.costPrice);
      payload.append('sell_price', formData.sellPrice);
      payload.append('current_qty', String(variant.current_qty));
      payload.append('is_active', '1');
      if (formData.image) {
        payload.append('image', formData.image);
      }

      await api.post(`/variants/${variant.id}?_method=PUT`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Variant updated successfully!');
      onUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to update variant');
    } finally {
      setLoading(false);
    }
  };

  if (!variant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>Update variant information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>SKU (Auto-generated)</Label>
              <Input value={variant.sku} disabled className="bg-gray-50" />
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
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="image">Update Product Image</Label>
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
              {loading ? 'Saving...' : 'Update Variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
