-- Create customer_invoice and customer_invoice_item tables if they don't exist
-- Run this migration manually if tables are missing

CREATE TABLE IF NOT EXISTS customer_invoice (
    invoice_id TEXT PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    so_id TEXT,
    dispatch_id TEXT,
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    customer_address TEXT,
    gst_number TEXT,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    payment_terms TEXT DEFAULT 'NET_30',
    notes TEXT,
    status TEXT DEFAULT 'ACTIVE',
    payment_status TEXT DEFAULT 'PENDING',
    payment_date TIMESTAMP,
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (so_id) REFERENCES sales_order(so_id) ON DELETE SET NULL,
    FOREIGN KEY (dispatch_id) REFERENCES dispatch_order(dispatch_id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS customer_invoice_item (
    invoice_item_id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    
    FOREIGN KEY (invoice_id) REFERENCES customer_invoice(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_invoice_so_id ON customer_invoice(so_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoice_customer_id ON customer_invoice(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoice_payment_status ON customer_invoice(payment_status);
CREATE INDEX IF NOT EXISTS idx_customer_invoice_item_invoice_id ON customer_invoice_item(invoice_id);

