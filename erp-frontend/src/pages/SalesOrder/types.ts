// Types for Sales Order Management System

export interface Customer {
  customer_id: string;
  customer_code: string;
  company_name: string;
  oem_name?: string;
  mapped_customer_id?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  billing_address?: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  created_at?: string;
}

export interface SalesOrderItem {
  item_id?: string;
  item_code?: string;
  item_name: string;
  description?: string;
  specification?: string;
  quantity: number;
  unit_of_measure?: string;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  line_total?: number;
  production_required?: boolean;
  estimated_production_time?: number;
  delivery_required?: boolean;
  delivery_date?: string;
  product_id?: string;
  product_name?: string;
  product_code?: string;
}

export interface SalesOrder {
  sales_order_id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  required_date?: string;
  delivery_date?: string;
  status: SalesOrderStatus;
  priority?: string;
  order_type?: string;
  order_source?: string;
  reference_number?: string;
  customer_po_date?: string;
  currency?: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount: number;
  discount_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  shipping_method?: string;
  shipping_address?: string;
  delivery_instructions?: string;
  payment_terms?: string;
  warranty_terms?: string;
  special_instructions?: string;
  salesperson_id?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_billing_address?: string;
  customer_shipping_address?: string;
  customer_tax_id?: string;
  customer_payment_terms?: string;
  items_count?: number;
  
  // Items array
  items?: SalesOrderItem[];
}

export type SalesOrderStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PRODUCTION'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export interface SalesOrderStats {
  total_orders: number;
  draft_count: number;
  pending_count: number;
  approved_count: number;
  in_production_count: number;
  ready_dispatch_count: number;
  dispatched_count: number;
  delivered_count: number;
  completed_count: number;
  cancelled_count: number;
  on_hold_count: number;
  total_value: number;
  average_order_value: number;
  orders_last_30_days: number;
}

export interface CreateSalesOrderRequest {
  customer_id: string;
  reference_number?: string;
  customer_po_date?: string;
  required_date?: string;
  delivery_date?: string;
  order_type?: string;
  priority?: string;
  shipping_method?: string;
  shipping_address?: string;
  delivery_instructions?: string;
  payment_terms?: string;
  warranty_terms?: string;
  special_instructions?: string;
  items: Omit<SalesOrderItem, 'item_id' | 'line_total'>[];
}

export interface UpdateSalesOrderStatusRequest {
  status: SalesOrderStatus;
  updated_by?: string;
  reason?: string;
}

export interface SalesOrderFilters {
  status?: SalesOrderStatus;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
}
