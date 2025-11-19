import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
}

export default function ImagePreviewDialog({ open, onOpenChange, imageUrl, title }: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">Image preview for {title}</DialogDescription>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="relative w-full p-4">
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-h-[75vh] object-contain rounded"
          />
        </div>
        <div className="px-4 pb-4 border-t pt-3">
          <p className="text-center text-sm text-gray-600">{title}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}