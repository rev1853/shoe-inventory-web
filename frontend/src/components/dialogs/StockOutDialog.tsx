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
import { optionalText, positiveInteger, requiredText } from '../../lib/validation';

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [lastScan, setLastScan] = useState('');
  const [scannedVariant, setScannedVariant] = useState<ProductVariant | null>(null);

  const variantOptions = useMemo(() => {
    const list = [...variants];
    if (preselectedVariant && !list.find((v) => v.id === preselectedVariant.id)) {
      list.push(preselectedVariant);
    }
    if (scannedVariant && !list.find((v) => v.id === scannedVariant.id)) {
      list.push(scannedVariant);
    }
    return list;
  }, [variants, preselectedVariant, scannedVariant]);

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
      setScannerOpen(false);
      setScanError('');
      setLastScan('');
      setScannedVariant(null);
      fetchReference();
      setLoading(false);
    }
  }, [open, preselectedVariant]);

  const handleCodeLookup = async (code: string) => {
    if (!code || code === lastScan) return;

    setLastScan(code);
    setScanError('');
    try {
      const variant = await fetchVariantByCode(code);
      setFormData((prev) => ({ ...prev, variantId: String(variant.id) }));
      setScannedVariant(variant);
      toast.success(`Variant selected: ${variant.sku}`);
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

    const errors: string[] = [];
    if (!formData.variantId) errors.push('Please select a variant.');
    const qtyError = positiveInteger(formData.quantity, 'Quantity');
    if (qtyError) errors.push(qtyError);
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
      showApiError(error, 'Failed to remove stock');
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label htmlFor="variantId">Variant *</Label>
                  <p className="text-xs text-gray-500">Select manually or scan the QR code</p>
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
                value={formData.variantId}
                onValueChange={(value) => setFormData({ ...formData, variantId: value })}
                disabled={!!preselectedVariant}
              >
                <SelectTrigger id="variantId">
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
                  <p className="text-xs text-gray-500">Point your camera at the QR code to auto-fill the variant.</p>
                  {scanError && <p className="text-xs text-red-600">{scanError}</p>}
                </div>
              )}
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
