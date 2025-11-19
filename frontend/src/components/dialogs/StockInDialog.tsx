import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { ProductVariant, Supplier } from '../../lib/types';

interface StockInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: ProductVariant[];
  suppliers: Supplier[];
  preselectedVariant?: ProductVariant | null;
  onSuccess?: () => void;
}

export default function StockInDialog({ open, onOpenChange, variants, suppliers, preselectedVariant, onSuccess }: StockInDialogProps) {
  const [formData, setFormData] = useState({
    variantId: '',
    quantity: '',
    supplierId: '',
    reference: '',
    reason: 'New stock from supplier',
  });
  const [loading, setLoading] = useState(false);

  const fetchReference = async () => {
    try {
      const { data } = await api.get<{ reference: string }>('/sequences/reference/in');
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
        supplierId: '',
        reference: '',
        reason: 'New stock from supplier',
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
    if (!formData.supplierId) {
      toast.error('Please select a supplier.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock-movements', {
        variant_id: Number(formData.variantId),
        movement_type: 'IN',
        quantity: Number(formData.quantity),
        supplier_id: formData.supplierId ? Number(formData.supplierId) : null,
        reference: formData.reference,
        reason: formData.reason,
      });
      toast.success(`Stock added: +${formData.quantity} units`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock In</DialogTitle>
          <DialogDescription>Add stock to inventory</DialogDescription>
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
                placeholder="e.g., 20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                <SelectTrigger id="supplierId">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g., PO-2025-001"
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
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
