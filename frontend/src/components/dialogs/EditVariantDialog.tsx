import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { ProductVariant } from '../../lib/types';
import { decimalMax, nonNegativeInteger, nonNegativeNumber, requiredText } from '../../lib/validation';
import { showApiError } from '../../lib/errors';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      setErrors({});
    }
  }, [variant, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;

    const nextErrors: Record<string, string> = {};
    const colorError = requiredText(formData.color, 'Color', 50);
    if (colorError) nextErrors.color = colorError;
    const sizeVal = Number(formData.size);
    if (!formData.size || Number.isNaN(sizeVal) || sizeVal <= 0) {
      nextErrors.size = 'Size must be greater than 0.';
    } else {
      const sizeError = decimalMax(formData.size, 'Size', 999.9, 1);
      if (sizeError) nextErrors.size = sizeError;
    }
    const minQtyError = nonNegativeInteger(formData.minQty, 'Minimum quantity');
    if (minQtyError) nextErrors.minQty = minQtyError;
    const costError = decimalMax(formData.costPrice, 'Cost price', 9999999999.99, 2) || nonNegativeNumber(formData.costPrice, 'Cost price');
    if (costError) nextErrors.costPrice = costError;
    const sellError = decimalMax(formData.sellPrice, 'Sell price', 9999999999.99, 2) || nonNegativeNumber(formData.sellPrice, 'Sell price');
    if (sellError) nextErrors.sellPrice = sellError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

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
      showApiError(error, 'Failed to update variant');
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
            <div className="space-y-2">
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
              {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
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
                step="0.1"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
              {errors.size && <p className="text-xs text-destructive">{errors.size}</p>}
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
              {errors.minQty && <p className="text-xs text-destructive">{errors.minQty}</p>}
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
              {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice}</p>}
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
              {errors.sellPrice && <p className="text-xs text-destructive">{errors.sellPrice}</p>}
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
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 disabled:opacity-70">
              {loading ? 'Saving...' : 'Update Variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
