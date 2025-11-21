import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { ProductVariant } from '../../lib/types';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode } from 'lucide-react';
import { fetchVariantByCode } from '../../lib/variantLookup';
import { showApiError } from '../../lib/errors';
import { nonNegativeInteger, optionalText, requiredText } from '../../lib/validation';

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [lastScan, setLastScan] = useState('');
  const [scannedVariant, setScannedVariant] = useState<ProductVariant | null>(null);

  const variantOptions = useMemo(() => {
    const base = [...(variants ?? [])];
    if (variant && !base.find((v) => v.id === variant.id)) {
      base.push(variant);
    }
    if (scannedVariant && !base.find((v) => v.id === scannedVariant.id)) {
      base.push(scannedVariant);
    }
    return base;
  }, [variant, variants, scannedVariant]);

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
      const defaultVariant = variant ?? (variantOptions.find((v) => String(v.id) === selectedVariantId) ?? variantOptions[0] ?? null);
      setSelectedVariantId(defaultVariant ? String(defaultVariant.id) : '');
      setFormData({
        newQuantity: defaultVariant ? defaultVariant.current_qty.toString() : '',
        reference: '',
        reason: 'Inventory adjustment',
      });
      setScannerOpen(false);
      setScanError('');
      setLastScan('');
      setScannedVariant(null);
      fetchReference();
      setLoading(false);
    }
  }, [open, variant, variants, variantOptions]);
  const activeVariant = variant ?? variantOptions.find((v) => String(v.id) === selectedVariantId) ?? null;

  const handleCodeLookup = async (code: string) => {
    if (!code || code === lastScan) return;

    setLastScan(code);
    setScanError('');
    try {
      const foundVariant = await fetchVariantByCode(code);
      setScannedVariant(foundVariant);
      setSelectedVariantId(String(foundVariant.id));
      setFormData((prev) => ({
        ...prev,
        newQuantity: foundVariant.current_qty.toString(),
      }));
      toast.success(`Variant selected: ${foundVariant.sku}`);
      setScannerOpen(false);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error.message ?? 'Could not find variant for this QR code';
      setScanError(message);
      toast.error(message);
    }
  };

  const handleScan = (detectedCodes: Array<{ rawValue?: string }>) => {
    const value = detectedCodes.find((code) => code.rawValue)?.rawValue;
    if (value) {
      void handleCodeLookup(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariant) return;

    const errors: string[] = [];
    const quantityError = nonNegativeInteger(formData.newQuantity, 'New quantity');
    if (quantityError) errors.push(quantityError);
    const referenceError = optionalText(formData.reference, 'Reference', 100);
    if (referenceError) errors.push(referenceError);
    const reasonError = requiredText(formData.reason, 'Reason', 100);
    if (reasonError) errors.push(reasonError);

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
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
      showApiError(error, 'Failed to adjust stock');
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label htmlFor="variantSelect">Variant *</Label>
                  <p className="text-xs text-gray-500">Pick a variant or scan its QR code</p>
                </div>
                <Button
                  type="button"
                  variant={scannerOpen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setScannerOpen((open) => {
                      const next = !open;
                      if (next) {
                        setLastScan('');
                      }
                      return next;
                    });
                    setScanError('');
                  }}
                  className="shrink-0"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {scannerOpen ? 'Hide scanner' : 'Scan QR'}
                </Button>
              </div>
              <Select
                id="variantSelect"
                value={selectedVariantId}
                onValueChange={(value) => {
                  setSelectedVariantId(value);
                  const nextVariant = variantOptions.find((v) => String(v.id) === value);
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
                  {variantOptions.map((variantOption) => (
                    <SelectItem key={variantOption.id} value={String(variantOption.id)}>
                      {variantOption.sku} - {variantOption.product?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scannerOpen && (
                <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
                  <Scanner
                    onScan={handleScan}
                    onError={(error) => setScanError((error as Error)?.message ?? 'Camera unavailable')}
                    constraints={{ facingMode: 'environment' }}
                    scanDelay={400}
                    styles={{
                      container: { width: '100%', height: 'auto' },
                      video: { width: '100%', borderRadius: '12px' },
                    }}
                  />
                  <p className="text-xs text-gray-500">Scan the QR code to load the variant and its current quantity.</p>
                  {scanError && <p className="text-xs text-red-600">{scanError}</p>}
                </div>
              )}
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
