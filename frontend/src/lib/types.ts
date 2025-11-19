export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
}

export interface Product {
  id: number;
  code: string;
  name: string;
  brand: string;
  category: string;
  description?: string | null;
  default_cost_price: number;
  default_sell_price: number;
  is_active: boolean;
  variants_count?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  gender: string;
  color: string;
  size_system: string;
  size: number;
  current_qty: number;
  min_qty: number;
  cost_price: number;
  sell_price: number;
  image_filename?: string | null;
  image_url?: string | null;
  product?: {
    id: number;
    code: string;
    name: string;
    brand: string;
  };
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  address?: string | null;
  notes?: string | null;
}

export interface StockMovement {
  id: number;
  movement_type: 'IN' | 'OUT' | 'ADJ';
  qty_change: number;
  reason: string;
  reference: string;
  supplier?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  variant: {
    id: number;
    sku: string;
    color: string;
    size_system: string;
    size: number;
    product?: {
      id: number;
      name: string;
      brand: string;
    } | null;
  };
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface LookupOptions {
  brands: string[];
  categories: string[];
  products: Array<{ id: number; code: string; name: string; brand: string }>;
  suppliers: Array<{ id: number; name: string }>;
  genders: string[];
  size_systems: string[];
  roles: Array<'admin' | 'staff'>;
  statuses: Array<'active' | 'inactive'>;
}

export interface DashboardMetrics {
  products: number;
  variants: number;
  low_stock: number;
  out_of_stock: number;
}

export interface DashboardChartPoint {
  key: string;
  label: string;
  stock_in: number;
  stock_out: number;
}
