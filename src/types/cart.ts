export interface ProductInCart {
  uid: string;
  name: string;
  price: number;
  main_image_url?: string;
}

export interface VariantChoice {
  id: string;
  value: string;
}

export interface VariantGroup {
  id: string;
  name: string;
  choices: VariantChoice[];
}

export interface Product {
  uid: string;
  title: string;
  variant_groups: VariantGroup[];
}

export interface CartItem {
  uid: string;
  product_uid: string;
  variant_choice_id?: string;
  variant_choice_value?: string;
  product_title: string;
  main_image_url?: string;
  quantity: number;
  user_uid: string;
  added_at: string;
  updated_at: string;
  price: number;  // This field will contain the final price including any variant extra price
  stock: number;  // Available stock for this item (product stock or variant stock)
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_price: number;
  subtotal: number;
  shipping: number;
  tax: number;
}

export interface CartTotalsResponse {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}
