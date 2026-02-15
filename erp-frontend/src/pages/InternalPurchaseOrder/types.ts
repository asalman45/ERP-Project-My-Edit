// Types for Internal Purchase Orders

export interface IPOItem {
  ipo_item_id?: string;
  material_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_amount?: number;
  uom_id?: string;
  uom_name?: string;
}

export interface InternalPurchaseOrder {
  ipo_id: string;
  po_number: string;
  supplier_id?: string;
  supplier_name: string;
  contact_person?: string;
  contact_phone?: string;
  supplier_address?: string;
  supplier_email?: string;
  supplier_ntn?: string;
  supplier_strn?: string;
  order_date: string;
  expected_date?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
  items: IPOItem[];
  supplier_company_name?: string;
  items_count?: number;
  total_amount?: number;
}

export interface CreateIPORequest {
  supplier_id?: string;
  supplier_name: string;
  contact_person?: string;
  contact_phone?: string;
  supplier_address?: string;
  supplier_email?: string;
  supplier_ntn?: string;
  supplier_strn?: string;
  order_date?: string;
  expected_date?: string;
  notes?: string;
  items: IPOItem[];
  tax_percentage?: number;
  created_by?: string;
}

export interface UpdateIPOStatusRequest {
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  updated_by?: string;
}

export interface IPOStats {
  total_orders: number;
  total_value: number;
  by_status: {
    [status: string]: {
      count: number;
      value: number;
    };
  };
}

export interface IPOFilters {
  status?: string;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PDFGenerationResult {
  file_name: string;
  file_path: string;
  file_size: number;
}

export interface EmailResult {
  messageId: string;
  message: string;
}

export interface GenerateAndSendResult {
  ipo: InternalPurchaseOrder;
  email_result: EmailResult;
  pdf_result: PDFGenerationResult;
}
