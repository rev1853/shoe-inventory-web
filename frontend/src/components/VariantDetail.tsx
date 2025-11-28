import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, Package, DollarSign, TrendingUp, TrendingDown, AlertCircle, QrCode, Edit, Settings } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import QRCodeDialog from './dialogs/QRCodeDialog';
import EditVariantDialog from './dialogs/EditVariantDialog';
import StockInDialog from './dialogs/StockInDialog';
import StockOutDialog from './dialogs/StockOutDialog';
import StockAdjustDialog from './dialogs/StockAdjustDialog';
import ImagePreviewDialog from './dialogs/ImagePreviewDialog';
import { ProductVariant, StockMovement, Supplier, User } from '../lib/types';
import api from '../lib/api';
import { fetchVariantByCode } from '../lib/variantLookup';
import { toast } from 'sonner@2.0.3';

interface VariantDetailProps {
  currentUser: User;
}

export default function VariantDetail({ currentUser }: VariantDetailProps) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const lookupCode = code ? decodeURIComponent(code) : '';

  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const canManageVariant = currentUser.role === 'admin';

  const loadVariant = async (variantCode: string) => {
    if (!variantCode) return;
    setLoading(true);
    setNotFound(false);
    try {
      const data = await fetchVariantByCode(variantCode);
      setVariant(data);
      await Promise.all([loadMovements(data.id), loadSuppliers()]);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Variant not found.';
      setNotFound(true);
      toast.error(message);
      setVariant(null);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async (variantId: number) => {
    try {
      const { data } = await api.get('/stock-movements', {
        params: { variant_id: variantId, per_page: 10 },
      });
      setMovements(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSuppliers = async () => {
    if (suppliers.length) return;
    try {
      const { data } = await api.get('/suppliers', { params: { per_page: 100 } });
      setSuppliers(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (lookupCode) {
      void loadVariant(lookupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupCode]);

  const stockStatus = useMemo(() => {
    if (!variant) return { label: 'N/A', badge: 'secondary' as const };
    if (variant.current_qty === 0) return { label: 'Out of Stock', badge: 'destructive' as const };
    if (variant.current_qty <= variant.min_qty) return { label: 'Low Stock', badge: 'secondary' as const };
    return { label: 'In Stock', badge: 'default' as const };
  }, [variant]);

  const profitMargin = useMemo(() => {
    if (!variant || variant.sell_price <= 0) return '0.0';
    const margin = ((variant.sell_price - variant.cost_price) / variant.sell_price) * 100;
    return margin.toFixed(1);
  }, [variant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Loading variant...
      </div>
    );
  }

  if (notFound || !variant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2>Variant Not Found</h2>
          <p className="text-muted-foreground">
            {lookupCode ? `The code "${lookupCode}" does not exist in the system.` : 'Variant not found.'}
          </p>
        </div>
        <Button onClick={() => navigate('/barcode-scanner')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scanner
        </Button>
      </div>
    );
  }

  const productName = variant.product?.name ?? 'Product';
  const brand = variant.product?.brand ?? '-';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/barcode-scanner')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Variant Details</h1>
            <p className="text-muted-foreground text-sm">{variant.sku}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setQrCodeOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>
          {canManageVariant && (
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                className="relative w-full max-w-[240px] aspect-[4/5] rounded-lg overflow-hidden bg-muted group"
                onClick={() => variant.image_url && setImagePreviewOpen(true)}
              >
                <ImageWithFallback
                  src={variant.image_url || undefined}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
                {variant.image_url && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center text-white text-sm">
                    <span className="px-3 py-1 rounded-full bg-black/50">View larger</span>
                  </div>
                )}
                {!variant.image_url && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-muted-foreground text-sm">Product</div>
                <div>{productName}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Brand</div>
                <div>{brand}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">SKU</div>
                <div className="font-mono text-sm">{variant.sku}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Variant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-muted-foreground">Physical Attributes</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gender</span>
                    <Badge variant="outline">{variant.gender}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Color</span>
                    <span>{variant.color}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Size</span>
                    <span>
                      {variant.size_system} {variant.size}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Size System</span>
                    <span>{variant.size_system}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-muted-foreground">Pricing</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cost Price</span>
                    <span>${variant.cost_price.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sell Price</span>
                    <span>${variant.sell_price.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="text-secondary-foreground">{profitMargin}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Profit per Unit</span>
                    <span className="text-secondary-foreground">
                      ${(variant.sell_price - variant.cost_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl">{variant.current_qty}</div>
              <span className="text-muted-foreground text-sm">units</span>
            </div>
            <Badge variant={stockStatus.badge} className="mt-2">
              {stockStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Minimum Quantity</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl">{variant.min_qty}</div>
              <span className="text-muted-foreground text-sm">units</span>
            </div>
            {variant.current_qty <= variant.min_qty && (
              <p className="text-xs text-destructive mt-2">Reorder needed</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(variant.current_qty * variant.cost_price).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">At cost price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Potential Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${(variant.current_qty * variant.sell_price).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">At sell price</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setStockInOpen(true)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Stock In
            </Button>
            <Button variant="outline" onClick={() => setStockOutOpen(true)}>
              <TrendingDown className="mr-2 h-4 w-4" />
              Stock Out
            </Button>
            <Button variant="outline" onClick={() => setStockAdjustOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Adjust Stock
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length > 0 ? (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-4 p-3 rounded-lg border">
                  <div
                    className={`p-2 rounded-full ${
                      movement.movement_type === 'IN'
                        ? 'bg-secondary'
                        : movement.movement_type === 'OUT'
                          ? 'bg-primary'
                          : 'bg-muted'
                    }`}
                  >
                    {movement.movement_type === 'IN' ? (
                      <TrendingUp className="h-4 w-4 text-secondary-foreground" />
                    ) : movement.movement_type === 'OUT' ? (
                      <TrendingDown className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Settings className="h-4 w-4 text-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          movement.movement_type === 'IN'
                            ? 'text-secondary-foreground'
                            : movement.movement_type === 'OUT'
                              ? 'text-primary'
                              : 'text-foreground'
                        }
                      >
                        {movement.qty_change > 0 ? '+' : ''}
                        {movement.qty_change} units
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {new Date(movement.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">Ref: {movement.reference}</div>
                    {movement.reason && <div className="text-sm">{movement.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">No stock movements recorded yet</div>
          )}
        </CardContent>
      </Card>

      <QRCodeDialog open={qrCodeOpen} onOpenChange={setQrCodeOpen} variant={variant} />
      <ImagePreviewDialog
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        imageUrl={variant?.image_url || ''}
        title={variant ? `${productName} - ${variant.sku}` : ''}
      />
      {canManageVariant && (
        <EditVariantDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          variant={variant}
          onUpdated={() => lookupCode && void loadVariant(lookupCode)}
        />
      )}
      <StockInDialog
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        variants={variant ? [variant] : []}
        suppliers={suppliers}
        preselectedVariant={variant}
        onSuccess={() => {
          void loadVariant(lookupCode);
        }}
      />
      <StockOutDialog
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        variants={variant ? [variant] : []}
        preselectedVariant={variant}
        onSuccess={() => {
          void loadVariant(lookupCode);
        }}
      />
      <StockAdjustDialog
        open={stockAdjustOpen}
        onOpenChange={setStockAdjustOpen}
        variant={variant}
        variants={variant ? [variant] : []}
        onSuccess={() => {
          void loadVariant(lookupCode);
        }}
      />
    </div>
  );
}
