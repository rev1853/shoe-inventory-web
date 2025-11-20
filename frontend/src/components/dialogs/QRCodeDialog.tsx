import { useEffect, useMemo, useRef } from 'react';
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
  const qrValue = useMemo(() => {
    if (!variant) return '';
    return variant.qr_token || variant.sku;
  }, [variant]);

  useEffect(() => {
    if (variant && canvasRef.current && open && qrValue) {
      QRCode.toCanvas(
        canvasRef.current,
        qrValue,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [variant, open, qrValue]);

  const handleDownload = () => {
    if (!canvasRef.current || !variant) return;

    const url = canvasRef.current.toDataURL('image/png');
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
            <canvas ref={canvasRef} />
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
