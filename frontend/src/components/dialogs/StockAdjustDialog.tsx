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

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ProductVariant | null;
  variants?: ProductVariant[];
  onSuccess?: () => void;
}

export default function StockAdjustDialog({ open, onOpenChange, variant, variants = [], onSuccess }: StockAdjustDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [formData, setFormData] = useState({
    newQuantity: '',
    reference: '',
    reason: 'Inventory adjustment',
  });
  const [loading, setLoading] = useState(false);

  const fetchReference = async () => {
    try {
      const { data } = await api.get<{ reference: string }>('/sequences/reference/adj');
      setFormData((prev) => ({ ...prev, reference: data.reference }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (open) {
      const defaultVariant = variant ?? (variants.find((v) => String(v.id) === selectedVariantId) ?? variants[0] ?? null);
      setSelectedVariantId(defaultVariant ? String(defaultVariant.id) : '');
      setFormData({
        newQuantity: defaultVariant ? defaultVariant.current_qty.toString() : '',
        reference: '',
        reason: 'Inventory adjustment',
      });
      fetchReference();
      setLoading(false);
    }
  }, [open, variant, variants]);

  const activeVariant = variant ?? variants.find((v) => String(v.id) === selectedVariantId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariant) return;
    setLoading(true);
    try {
      await api.post('/stock-movements', {
        variant_id: activeVariant.id,
        movement_type: 'ADJ',
        new_quantity: Number(formData.newQuantity),
        reference: formData.reference,
        reason: formData.reason,
      });
      toast.success('Stock adjusted successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const diff = formData.newQuantity && activeVariant
    ? Number(formData.newQuantity) - activeVariant.current_qty
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust stock quantity for {activeVariant ? activeVariant.sku : 'a variant'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variantSelect">Variant *</Label>
              <Select
                id="variantSelect"
                value={selectedVariantId}
                onValueChange={(value) => {
                  setSelectedVariantId(value);
                  const nextVariant = variants.find((v) => String(v.id) === value);
                  setFormData((prev) => ({
                    ...prev,
                    newQuantity: nextVariant ? nextVariant.current_qty.toString() : '',
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((variantOption) => (
                    <SelectItem key={variantOption.id} value={String(variantOption.id)}>
                      {variantOption.sku} - {variantOption.product?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeVariant && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600">Current Stock</div>
                <div className="text-2xl text-blue-600">{activeVariant.current_qty} units</div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newQuantity">New Quantity *</Label>
              <Input
                id="newQuantity"
                type="number"
                min="0"
                value={formData.newQuantity}
                onChange={(e) => setFormData({ ...formData, newQuantity: e.target.value })}
                required
              />
              {formData.newQuantity && activeVariant && (
                <p className={`text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Change: {diff >= 0 ? '+' : ''}{diff} units
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
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
            <Button type="submit" disabled={loading || !activeVariant} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
