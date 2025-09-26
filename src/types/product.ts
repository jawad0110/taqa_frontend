export interface ProductDetailModel {
  uid: string;
  title: string;
  description: string;
  price: number;
  stock?: number;
  is_active: boolean;
  user_uid?: string;
  created_at: string;
  updated_at: string;
  main_image?: string;
  cost_price?: number;
  
  // Relationships
  user?: {
    uid: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_verified: boolean;
  };
  
  
  reviews: Review[];
  variant_groups: VariantGroup[];
  images: ProductImage[];
  
  // Additional fields from backend
  stock_status?: string;
  in_stock?: boolean;
}

export interface VariantGroup {
  id: string;
  product_uid: string;
  name: string;
  
  // Relationships
  product: ProductDetailModel;
  choices: VariantChoice[];
}

export interface VariantChoice {
  id: string;
  stock?: number;
  extra_price?: number;
  group_id: string;
  value: string;
  created_at: string;
  updated_at: string;
  product: ProductDetailModel;
  name: string;
}

export interface ProductImage {
  uid: string;
  product_uid: string;
  filename: string;
  is_main: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  product: ProductDetailModel;
}

export interface Review {
  uid: string;
  rating: number;
  review_text: string;
  user_uid?: string;
  product_uid?: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  user?: {
    uid: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  product?: ProductDetailModel;
}

interface Product {
  uid: string;
  title: string;
  description: string;
  price: number;
  cost_price?: number; // Only for admin
  stock: number;
  is_active: boolean;
  user_uid?: string;
  created_at: string;
  updated_at: string;
  main_image?: string;
  
  // Relationships
  user?: {
    uid: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_verified: boolean;
  };
  
  
  reviews: Review[];
  variant_groups: VariantGroup[];
  images: ProductImage[];
  
  // Additional fields from backend
  stock_status?: string;
  in_stock?: boolean;
}
