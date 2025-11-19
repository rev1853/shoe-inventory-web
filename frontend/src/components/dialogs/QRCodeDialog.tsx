import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: any;
}

export default function QRCodeDialog({ open, onOpenChange, variant }: QRCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (variant && canvasRef.current && open) {
      QRCode.toCanvas(
        canvasRef.current,
        variant.sku,
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
  }, [variant, open]);

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
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>{variant.sku} - {variant.productName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <canvas ref={canvasRef} />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Scan this QR code to view variant details</p>
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
