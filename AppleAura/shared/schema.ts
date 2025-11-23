

// Tipos manuales para MongoDB
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  createdAt?: number;
}

export type InsertUser = Omit<User, 'id' | 'createdAt'> & Partial<Pick<User, 'id' | 'createdAt'>>;

export interface SellerProfile {
  id: string;
  userId: string;
  displayName: string;
  description?: string;
  status: 'pending' | 'verified' | 'rejected';
  location?: string;
  rating?: number;
  createdAt?: number;
}
export type InsertSellerProfile = Omit<SellerProfile, 'id' | 'createdAt'> & Partial<Pick<SellerProfile, 'id' | 'createdAt'>>;

export interface Address {
  id: string;
  userId: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}
export type InsertAddress = Omit<Address, 'id'> & Partial<Pick<Address, 'id'>>;

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
}
export type InsertCategory = Omit<Category, 'id'> & Partial<Pick<Category, 'id'>>;

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  slug: string;
  description?: string;
  specsJson?: any;
  images: string[];
  status: 'draft' | 'active' | 'paused';
  createdAt?: number;
  seller?: SellerProfile;
  reviewCount?: number;
  rating?: number;
  // Enriched fields
  price?: number;
  stock?: number;
  shippingCost?: number;
  isFreeShipping?: boolean;
  brand?: string;
}
export type InsertProduct = Omit<Product, 'id' | 'createdAt'> & Partial<Pick<Product, 'id' | 'createdAt'>>;

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  priceCents: number;
  currency: string;
  stock: number;
  discountPercentage?: number;
  shippingCostCents?: number;
  isFreeShipping?: boolean;
  attributesJson?: any;
}
export type InsertProductVariant = Omit<ProductVariant, 'id'> & Partial<Pick<ProductVariant, 'id'>>;

export interface CartItem {
  id: string;
  userId: string;
  productName: string;
  variantId: string;
  quantity: number;
  productPrice: number;
  productImage: string;
}
export type InsertCartItem = Omit<CartItem, 'id'> & Partial<Pick<CartItem, 'id'>>;

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  totalCents: number;
  currency: string;
  shippingAddressId?: string;
  createdAt?: number;
  items?: OrderItem[];
}
export type InsertOrder = Omit<Order, 'id' | 'createdAt'> & Partial<Pick<Order, 'id' | 'createdAt'>>;

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  sellerId: string;
  unitPriceCents: number;
  quantity: number;
}
export type InsertOrderItem = Omit<OrderItem, 'id'> & Partial<Pick<OrderItem, 'id'>>;

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt?: number;
}
export type InsertReview = Omit<Review, 'id' | 'createdAt'> & Partial<Pick<Review, 'id' | 'createdAt'>>;


