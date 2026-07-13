import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  gender?: 'men' | 'women' | 'unisex';
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  brand: string;
  material?: string;
  care_instructions?: string;
  fit_guide?: string;
  tags?: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  fit?: string;
  color: string;
  color_hex?: string;
  price: number;
  compare_at_price?: number;
  inventory_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  title?: string;
  body?: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface CartItemWithDetails {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  product_variants: ProductVariant & {
    products: Product & {
      product_images: ProductImage[];
      categories?: Category;
    };
  };
}

export interface Address {
  full_name: string;
  email?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  user_id?: string;
  order_number: string;
  status: string;
  shipping_address: Address;
  billing_address?: Address;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  discount_code?: string;
  payment_method?: string;
  payment_status: string;
  tracking_number?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id?: string;
  product_snapshot: {
    name: string;
    sku: string;
    color: string;
    size: string;
    fit?: string;
    image_url?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  min_order_amount?: number;
  usage_limit?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
}

export type ProductWithDetails = Product & {
  categories?: Category;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
  reviews?: Review[];
};
