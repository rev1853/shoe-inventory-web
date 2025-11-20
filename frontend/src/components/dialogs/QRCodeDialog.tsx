import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { ProductVariant } from '../../lib/types';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ProductVariant;
}

export default function QRCodeDialog({ open, onOpenChange, variant }: QRCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const qrValue = useMemo(() => {
    if (!variant) return '';
    return variant.qr_token || variant.sku;
  }, [variant]);

  useEffect(() => {
    const generate = async () => {
      if (!variant || !open || !qrValue) return;
      try {
        const url = await QRCode.toDataURL(qrValue, {
          width: 320,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        setQrDataUrl(url);
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrValue, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
          });
        }
      } catch (error) {
        console.error('Failed to generate QR', error);
        setQrDataUrl('');
      }
    };

    void generate();
  }, [variant, open, qrValue]);

  const handleDownload = () => {
    const url = qrDataUrl || canvasRef.current?.toDataURL('image/png');
    if (!url || !variant) return;

    const link = document.createElement('a');
    link.download = `QR-${variant.sku}.png`;
    link.href = url;
    link.click();
  };

  if (!variant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code
          </DialogTitle>
          <DialogDescription>
            {variant.product?.name ?? 'Product'} • {variant.sku}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Variant QR code" className="w-64 h-64 object-contain" />
            ) : (
              <canvas ref={canvasRef} className="w-64 h-64" />
            )}
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">Scan this QR code to select this variant</p>
            <p className="text-xs text-gray-400 font-mono break-all">{qrValue}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
