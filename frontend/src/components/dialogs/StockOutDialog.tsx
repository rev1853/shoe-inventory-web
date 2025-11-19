import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { ProductVariant } from '../../lib/types';

interface StockOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: ProductVariant[];
  preselectedVariant?: ProductVariant | null;
  onSuccess?: () => void;
}

export default function StockOutDialog({ open, onOpenChange, variants, preselectedVariant, onSuccess }: StockOutDialogProps) {
  const [formData, setFormData] = useState({
    variantId: '',
    quantity: '',
    reference: '',
    reason: 'Store sale',
  });
  const [loading, setLoading] = useState(false);

  const fetchReference = async () => {
    try {
      const { data } = await api.get<{ reference: string }>('/sequences/reference/out');
      setFormData((prev) => ({ ...prev, reference: data.reference }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (open) {
      setFormData({
        variantId: preselectedVariant?.id ? String(preselectedVariant.id) : '',
        quantity: '',
        reference: '',
        reason: 'Store sale',
      });
      fetchReference();
      setLoading(false);
    }
  }, [open, preselectedVariant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.variantId) {
      toast.error('Please select a variant.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock-movements', {
        variant_id: Number(formData.variantId),
        movement_type: 'OUT',
        quantity: Number(formData.quantity),
        reference: formData.reference,
        reason: formData.reason,
      });
      toast.success(`Stock removed: -${formData.quantity} units`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock Out</DialogTitle>
          <DialogDescription>Remove stock from inventory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variantId">Variant *</Label>
              <Select
                value={formData.variantId}
                onValueChange={(value) => setFormData({ ...formData, variantId: value })}
                disabled={!!preselectedVariant}
              >
                <SelectTrigger id="variantId">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={String(variant.id)}>
                      {variant.sku} - {variant.product?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g., SALE-2025-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Remove Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
