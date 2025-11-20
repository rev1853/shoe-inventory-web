import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import api from '../../lib/api';
import { ProductVariant, Supplier } from '../../lib/types';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode } from 'lucide-react';
import { fetchVariantByCode } from '../../lib/variantLookup';

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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label htmlFor="variantId">Variant *</Label>
                  <p className="text-xs text-gray-500">Choose from the list or scan its QR code</p>
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
                  <p className="text-xs text-gray-500">Aim your camera at the variant QR. We will auto-select it if recognized.</p>
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
