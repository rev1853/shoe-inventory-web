import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Camera, Keyboard, ScanLine, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { fetchVariantByCode } from '../lib/variantLookup';

export default function BarcodeScanner() {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [lastScan, setLastScan] = useState('');
  const [scanError, setScanError] = useState('');
  const [searching, setSearching] = useState(false);

  const hasInput = useMemo(() => manualInput.trim().length > 0, [manualInput]);

  const goToVariant = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || trimmed === lastScan) return;

    setLastScan(trimmed);
    setScanError('');
    setSearching(true);

    try {
      await fetchVariantByCode(trimmed);
      navigate(`/variant-detail/${encodeURIComponent(trimmed)}`);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error.message ?? 'Variant not found.';
      setScanError(message);
    } finally {
      setSearching(false);
    }
  };

  const handleScan = (detectedCodes: Array<{ rawValue?: string }>) => {
    const value = detectedCodes.find((code) => code.rawValue)?.rawValue;
    if (value) {
      void goToVariant(value);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasInput) {
      void goToVariant(manualInput);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Barcode Scanner</h1>
          <p className="text-muted-foreground">Scan a product variant barcode to view details</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Scanner</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScanMode(scanMode === 'camera' ? 'manual' : 'camera');
                setScanError('');
                setLastScan('');
              }}
            >
              {scanMode === 'camera' ? (
                <>
                  <Keyboard className="mr-2 h-4 w-4" />
                  Manual Entry
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Use Camera
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            {scanMode === 'camera' ? 'Point your camera at the barcode/QR' : 'Enter the SKU or QR code manually'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanMode === 'camera' ? (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-[4/3] min-h-[260px] sm:min-h-[320px]">
                <Scanner
                  onScan={handleScan}
                  onError={(error) => setScanError((error as Error)?.message ?? 'Camera unavailable')}
                  constraints={{ facingMode: 'environment' }}
                  scanDelay={400}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' },
                  }}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto sm:flex-1"
                  onClick={() => {
                    setScanMode('manual');
                    setScanError('');
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Stop Camera
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto sm:flex-1"
                  disabled={searching}
                  onClick={() => void goToVariant(lastScan || manualInput)}
                >
                  <ScanLine className="mr-2 h-4 w-4" />
                  Re-try scan
                </Button>
              </div>
              {scanError && <p className="text-xs text-red-600">{scanError}</p>}
              <p className="text-xs text-muted-foreground">
                Tip: hold steady and ensure the barcode/QR is inside the frame.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">Enter SKU or Barcode</Label>
                <Input
                  id="sku"
                  placeholder="e.g., NK-001-M-BLK-US-9"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!hasInput || searching}>
                <ScanLine className="mr-2 h-4 w-4" />
                Search Variant
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Camera Mode
              </h3>
              <ul className="space-y-1 text-muted-foreground text-sm ml-7">
                <li>• Click "Use Camera" to activate your device camera</li>
                <li>• Allow camera permissions when prompted</li>
                <li>• Position the barcode within the scanning area</li>
                <li>• The system will automatically detect and redirect</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-blue-600" />
                Manual Mode
              </h3>
              <ul className="space-y-1 text-muted-foreground text-sm ml-7">
                <li>• Type or paste the SKU in the input field</li>
                <li>• SKU format: BRAND-PRODUCT-GENDER-COLOR-SIZE</li>
                <li>• Click "Search Variant" to view details</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
