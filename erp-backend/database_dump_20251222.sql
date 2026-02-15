--
-- PostgreSQL database dump
--

\restrict Ww3sFw7cLZcgGtWTaWOhGBjov0e5W3hECCdyCXZOO3hIxbd0M0iryfPrRwUl8KU

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: erp_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO erp_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: erp_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Category; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."Category" AS ENUM (
    'RAW_MATERIAL',
    'SEMI_FINISHED',
    'FINISHED_GOOD',
    'SCRAP_ITEM'
);


ALTER TYPE public."Category" OWNER TO erp_user;

--
-- Name: DispatchStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."DispatchStatus" AS ENUM (
    'PENDING',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."DispatchStatus" OWNER TO erp_user;

--
-- Name: InventoryStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."InventoryStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'ISSUED',
    'DAMAGED',
    'QUARANTINE',
    'CONSUMED'
);


ALTER TYPE public."InventoryStatus" OWNER TO erp_user;

--
-- Name: ItemType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."ItemType" AS ENUM (
    'CUT_PART',
    'BOUGHT_OUT',
    'CONSUMABLE',
    'SUB_ASSEMBLY'
);


ALTER TYPE public."ItemType" OWNER TO erp_user;

--
-- Name: LedgerItemType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."LedgerItemType" AS ENUM (
    'PRODUCT',
    'MATERIAL',
    'SCRAP'
);


ALTER TYPE public."LedgerItemType" OWNER TO erp_user;

--
-- Name: MaterialType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."MaterialType" AS ENUM (
    'SHEET',
    'BOUGHT_OUT',
    'CONSUMABLE',
    'SEMI_FINISHED',
    'RAW_MATERIAL'
);


ALTER TYPE public."MaterialType" OWNER TO erp_user;

--
-- Name: OperationType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."OperationType" AS ENUM (
    'CUTTING',
    'FORMING',
    'PIERCING',
    'WELDING',
    'ASSEMBLY',
    'QC',
    'PACKAGING',
    'MACHINING',
    'HEAT_TREATMENT',
    'PAINTING'
);


ALTER TYPE public."OperationType" OWNER TO erp_user;

--
-- Name: POStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."POStatus" AS ENUM (
    'OPEN',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public."POStatus" OWNER TO erp_user;

--
-- Name: PRStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."PRStatus" AS ENUM (
    'OPEN',
    'APPROVED',
    'REJECTED',
    'CONVERTED'
);


ALTER TYPE public."PRStatus" OWNER TO erp_user;

--
-- Name: ProductionStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."ProductionStatus" AS ENUM (
    'PLANNED',
    'RELEASED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ProductionStatus" OWNER TO erp_user;

--
-- Name: SOStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."SOStatus" AS ENUM (
    'OPEN',
    'PARTIALLY_SHIPPED',
    'SHIPPED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public."SOStatus" OWNER TO erp_user;

--
-- Name: ScrapStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."ScrapStatus" AS ENUM (
    'AVAILABLE',
    'CONSUMED',
    'SOLD',
    'QUARANTINED'
);


ALTER TYPE public."ScrapStatus" OWNER TO erp_user;

--
-- Name: ScrapTxnType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."ScrapTxnType" AS ENUM (
    'GENERATED',
    'REUSED',
    'ADJUSTED',
    'CONSUMED',
    'SOLD'
);


ALTER TYPE public."ScrapTxnType" OWNER TO erp_user;

--
-- Name: StepStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."StepStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED'
);


ALTER TYPE public."StepStatus" OWNER TO erp_user;

--
-- Name: TxnType; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."TxnType" AS ENUM (
    'ISSUE',
    'RECEIVE',
    'TRANSFER',
    'ADJUSTMENT',
    'RETURN'
);


ALTER TYPE public."TxnType" OWNER TO erp_user;

--
-- Name: WOStatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public."WOStatus" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'ON_HOLD',
    'CANCELLED'
);


ALTER TYPE public."WOStatus" OWNER TO erp_user;

--
-- Name: ipostatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public.ipostatus AS ENUM (
    'PENDING',
    'APPROVED',
    'SENT',
    'RECEIVED',
    'CANCELLED'
);


ALTER TYPE public.ipostatus OWNER TO erp_user;

--
-- Name: salesorderstatus; Type: TYPE; Schema: public; Owner: erp_user
--

CREATE TYPE public.salesorderstatus AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'IN_PRODUCTION',
    'READY_FOR_DISPATCH',
    'DISPATCHED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'ON_HOLD'
);


ALTER TYPE public.salesorderstatus OWNER TO erp_user;

--
-- Name: generate_plan_number(); Type: FUNCTION; Schema: public; Owner: erp_user
--

CREATE FUNCTION public.generate_plan_number() RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
  date_str TEXT;
  seq_num INTEGER;
BEGIN
  date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(plan_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM planned_production
  WHERE plan_number LIKE 'PP-' || date_str || '-%';
  
  RETURN 'PP-' || date_str || '-' || LPAD(seq_num::TEXT, 3, '0');
END;
$_$;


ALTER FUNCTION public.generate_plan_number() OWNER TO erp_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO erp_user;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.audit_log (
    id text NOT NULL,
    user_id text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    old_values text,
    new_values text,
    reference_id text,
    ip_address text,
    user_agent text,
    additional_data text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_log OWNER TO erp_user;

--
-- Name: batch; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.batch (
    batch_id text NOT NULL,
    inventory_id text NOT NULL,
    batch_no text NOT NULL,
    quantity double precision NOT NULL,
    unit_cost double precision,
    expiry_date timestamp(3) without time zone,
    supplier_id text,
    received_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    quality_status text DEFAULT 'PENDING'::text NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.batch OWNER TO erp_user;

--
-- Name: batch_consumption; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.batch_consumption (
    consumption_id text NOT NULL,
    batch_id text NOT NULL,
    quantity double precision NOT NULL,
    wo_id text,
    reference text,
    created_by text NOT NULL,
    consumption_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.batch_consumption OWNER TO erp_user;

--
-- Name: blank_optimization; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.blank_optimization (
    optimization_id uuid DEFAULT gen_random_uuid() NOT NULL,
    blank_id uuid NOT NULL,
    sheet_size_id uuid,
    blank_width_mm double precision NOT NULL,
    blank_length_mm double precision NOT NULL,
    blank_thickness_mm double precision NOT NULL,
    blank_quantity integer NOT NULL,
    weight_of_blank_kg double precision,
    total_blank_weight_kg double precision,
    best_direction character varying(20),
    sheet_width_mm double precision,
    sheet_length_mm double precision,
    primary_blanks_per_sheet integer,
    extra_blanks_from_leftover integer,
    total_blanks_per_sheet integer,
    total_blanks_weight_kg double precision,
    efficiency_percentage double precision,
    scrap_percentage double precision,
    utilization_percentage double precision,
    leftover_area_mm2 double precision,
    leftover_width_mm double precision,
    leftover_length_mm double precision,
    leftover_reusable boolean DEFAULT false,
    horizontal_result jsonb,
    vertical_result jsonb,
    all_sheet_comparisons jsonb,
    optimization_mode character varying(20) DEFAULT 'AUTO'::character varying,
    calculated_at timestamp without time zone DEFAULT now(),
    calculated_by character varying(255)
);


ALTER TABLE public.blank_optimization OWNER TO erp_user;

--
-- Name: blank_spec; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.blank_spec (
    blank_id text NOT NULL,
    product_id text NOT NULL,
    width_mm double precision NOT NULL,
    length_mm double precision NOT NULL,
    thickness_mm double precision NOT NULL,
    blank_weight_kg double precision,
    pcs_per_sheet integer,
    sheet_util_pct double precision,
    sheet_type text,
    sheet_weight_kg double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by text,
    updated_at timestamp(3) without time zone NOT NULL,
    consumption_pct double precision,
    material_density double precision,
    quantity integer DEFAULT 1 NOT NULL,
    sub_assembly_name text,
    total_blanks double precision,
    sheet_width_mm numeric(10,2),
    sheet_length_mm numeric(10,2),
    material_type character varying(50),
    cutting_direction character varying(20),
    efficiency_pct numeric(5,2),
    scrap_pct numeric(5,2)
);


ALTER TABLE public.blank_spec OWNER TO erp_user;

--
-- Name: bom; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.bom (
    bom_id text NOT NULL,
    product_id text NOT NULL,
    material_id text,
    quantity double precision NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_optional boolean DEFAULT false NOT NULL,
    step_sequence integer,
    sub_assembly_name text,
    uom_id text,
    updated_at timestamp(3) without time zone NOT NULL,
    item_type public."ItemType",
    reference_type character varying(50),
    reference_id text,
    item_name character varying(255),
    is_critical boolean DEFAULT false,
    scrap_allowance_pct numeric(5,2) DEFAULT 0,
    operation_code character varying(50),
    bom_version character varying(20) DEFAULT 'v1.0'::character varying,
    substitution_priority integer DEFAULT 1,
    cost_impact_pct numeric(5,2) DEFAULT 0.0,
    quality_impact character varying(20) DEFAULT 'same'::character varying
);


ALTER TABLE public.bom OWNER TO erp_user;

--
-- Name: COLUMN bom.is_optional; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.is_optional IS 'Whether this material is optional and can be skipped if not available';


--
-- Name: COLUMN bom.item_type; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.item_type IS 'Type of BOM item: CUT_PART (from blank_spec), BOUGHT_OUT, CONSUMABLE, SUB_ASSEMBLY';


--
-- Name: COLUMN bom.reference_type; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.reference_type IS 'Type of referenced entity: blank_spec, material, product';


--
-- Name: COLUMN bom.reference_id; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.reference_id IS 'ID of the referenced entity (polymorphic relation)';


--
-- Name: COLUMN bom.substitution_priority; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.substitution_priority IS 'Priority order for this material in substitution rules (1=highest)';


--
-- Name: COLUMN bom.cost_impact_pct; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.cost_impact_pct IS 'Cost impact percentage when using this material';


--
-- Name: COLUMN bom.quality_impact; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.bom.quality_impact IS 'Quality impact: better, same, or worse';


--
-- Name: bom_explosion_log; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.bom_explosion_log (
    explosion_id text DEFAULT gen_random_uuid() NOT NULL,
    sales_order_id text,
    product_id text NOT NULL,
    quantity numeric(15,4) NOT NULL,
    explosion_data jsonb,
    total_sheet_count integer,
    total_bought_items_count integer,
    total_consumables_count integer,
    total_material_cost numeric(15,2),
    exploded_by text,
    exploded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bom_explosion_log OWNER TO erp_user;

--
-- Name: TABLE bom_explosion_log; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.bom_explosion_log IS 'Audit log of BOM explosions for traceability';


--
-- Name: bom_substitution_rules; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.bom_substitution_rules (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    product_id text,
    sub_assembly_name character varying(255),
    primary_material_id text,
    substitute_material_id text,
    priority integer DEFAULT 1,
    uom_factor numeric(10,4) DEFAULT 1.0,
    min_thickness numeric(8,3),
    min_grade character varying(50),
    cost_impact_pct numeric(5,2) DEFAULT 0.0,
    quality_impact character varying(20) DEFAULT 'same'::character varying,
    approval_required boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bom_substitution_rules OWNER TO erp_user;

--
-- Name: client_ordered_materials; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.client_ordered_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    so_id text,
    material_id text,
    quantity numeric(15,4),
    cost numeric(15,4),
    supplier_id text,
    po_id text,
    expected_delivery date,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.client_ordered_materials OWNER TO erp_user;

--
-- Name: customer_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.customer_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_seq OWNER TO erp_user;

--
-- Name: customer; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.customer (
    customer_id text DEFAULT ('CUST-'::text || lpad((nextval('public.customer_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    customer_code character varying(50),
    company_name character varying(255) NOT NULL,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    fax character varying(50),
    billing_address text,
    shipping_address text,
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(100) DEFAULT 'Pakistan'::character varying,
    tax_id character varying(50),
    credit_limit numeric(18,2) DEFAULT 0,
    payment_terms character varying(100) DEFAULT 'NET 30'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer OWNER TO erp_user;

--
-- Name: dispatch; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.dispatch (
    dispatch_id text NOT NULL,
    so_id text,
    so_number text NOT NULL,
    customer_name text NOT NULL,
    product_id text,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    dispatched_quantity integer NOT NULL,
    dispatch_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dispatch_method text DEFAULT 'Ground Shipping'::text,
    tracking_number text,
    dispatched_by text,
    status text DEFAULT 'DISPATCHED'::text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dispatch OWNER TO erp_user;

--
-- Name: dispatch_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.dispatch_item (
    di_id text NOT NULL,
    dispatch_id text NOT NULL,
    product_id text NOT NULL,
    qty double precision NOT NULL,
    uom_id text
);


ALTER TABLE public.dispatch_item OWNER TO erp_user;

--
-- Name: dispatch_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.dispatch_order (
    dispatch_id text NOT NULL,
    dispatch_no text NOT NULL,
    so_id text,
    customer_id text,
    location_id text,
    vehicle_no text,
    driver_name text,
    dispatch_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by text,
    status public."DispatchStatus" DEFAULT 'PENDING'::public."DispatchStatus" NOT NULL
);


ALTER TABLE public.dispatch_order OWNER TO erp_user;

--
-- Name: goods_receipt; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.goods_receipt (
    grn_id text NOT NULL,
    grn_no text NOT NULL,
    po_id text,
    supplier_id text,
    received_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    received_by text,
    location_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


ALTER TABLE public.goods_receipt OWNER TO erp_user;

--
-- Name: goods_receipt_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.goods_receipt_item (
    gri_id text NOT NULL,
    grn_id text NOT NULL,
    po_item_id text,
    product_id text,
    material_id text,
    qty_received double precision NOT NULL,
    uom_id text
);


ALTER TABLE public.goods_receipt_item OWNER TO erp_user;

--
-- Name: internal_purchase_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.internal_purchase_order (
    ipo_id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_number character varying(50) NOT NULL,
    supplier_id text,
    supplier_name character varying(255),
    contact_person character varying(255),
    contact_phone character varying(50),
    supplier_address text,
    supplier_email character varying(255),
    supplier_ntn character varying(50),
    supplier_strn character varying(50),
    order_date date NOT NULL,
    expected_date date,
    status public.ipostatus DEFAULT 'PENDING'::public.ipostatus,
    created_by character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(100)
);


ALTER TABLE public.internal_purchase_order OWNER TO erp_user;

--
-- Name: TABLE internal_purchase_order; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.internal_purchase_order IS 'Internal Purchase Orders for internal material transfers';


--
-- Name: COLUMN internal_purchase_order.po_number; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.internal_purchase_order.po_number IS 'Unique Purchase Order Number';


--
-- Name: COLUMN internal_purchase_order.status; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.internal_purchase_order.status IS 'IPO Status: PENDING, APPROVED, SENT, RECEIVED, CANCELLED';


--
-- Name: internal_purchase_order_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.internal_purchase_order_item (
    ipo_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    ipo_id uuid NOT NULL,
    material_id text,
    item_name character varying(255) NOT NULL,
    description text,
    quantity numeric(18,4) NOT NULL,
    unit_price numeric(18,4) NOT NULL,
    total_amount numeric(18,4) NOT NULL,
    uom_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.internal_purchase_order_item OWNER TO erp_user;

--
-- Name: TABLE internal_purchase_order_item; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.internal_purchase_order_item IS 'Items within Internal Purchase Orders';


--
-- Name: COLUMN internal_purchase_order_item.total_amount; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.internal_purchase_order_item.total_amount IS 'Calculated as quantity * unit_price';


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory (
    inventory_id text NOT NULL,
    product_id text,
    material_id text,
    quantity double precision NOT NULL,
    location_id text,
    batch_no text,
    uom_id text,
    status public."InventoryStatus" DEFAULT 'AVAILABLE'::public."InventoryStatus" NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory OWNER TO erp_user;

--
-- Name: inventory_txn; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.inventory_txn (
    txn_id text NOT NULL,
    inventory_id text,
    product_id text,
    wastage_id text,
    material_id text,
    wo_id text,
    po_id text,
    txn_type public."TxnType" NOT NULL,
    quantity double precision NOT NULL,
    unit_cost double precision,
    location_id text,
    batch_no text,
    reference text,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    procurement_request_id text
);


ALTER TABLE public.inventory_txn OWNER TO erp_user;

--
-- Name: invoice; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.invoice (
    invoice_id text NOT NULL,
    invoice_no text NOT NULL,
    po_id text NOT NULL,
    supplier_id text NOT NULL,
    invoice_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    due_date timestamp(3) without time zone,
    total_amount double precision NOT NULL,
    status text DEFAULT 'RECEIVED'::text NOT NULL,
    payment_terms text,
    payment_method text,
    approved_by text,
    approved_amount double precision,
    approved_at timestamp(3) without time zone,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.invoice OWNER TO erp_user;

--
-- Name: invoice_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.invoice_item (
    invoice_item_id text NOT NULL,
    invoice_id text NOT NULL,
    po_item_id text,
    material_id text,
    product_id text,
    quantity double precision NOT NULL,
    unit_price double precision NOT NULL,
    total_price double precision NOT NULL
);


ALTER TABLE public.invoice_item OWNER TO erp_user;

--
-- Name: location; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.location (
    location_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.location OWNER TO erp_user;

--
-- Name: manual_opening_stock; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.manual_opening_stock (
    id integer NOT NULL,
    period_key character varying(10) NOT NULL,
    product_id text NOT NULL,
    opening_quantity numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.manual_opening_stock OWNER TO erp_user;

--
-- Name: TABLE manual_opening_stock; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.manual_opening_stock IS 'Stores manually entered opening stock values for monthly reports';


--
-- Name: COLUMN manual_opening_stock.period_key; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.manual_opening_stock.period_key IS 'Period identifier in format YYYY-MM';


--
-- Name: COLUMN manual_opening_stock.opening_quantity; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.manual_opening_stock.opening_quantity IS 'Manually entered opening stock quantity for the period';


--
-- Name: manual_opening_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: erp_user
--

CREATE SEQUENCE public.manual_opening_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.manual_opening_stock_id_seq OWNER TO erp_user;

--
-- Name: manual_opening_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: erp_user
--

ALTER SEQUENCE public.manual_opening_stock_id_seq OWNED BY public.manual_opening_stock.id;


--
-- Name: material; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.material (
    material_id text NOT NULL,
    material_code text NOT NULL,
    name text NOT NULL,
    description text,
    category public."Category" DEFAULT 'RAW_MATERIAL'::public."Category" NOT NULL,
    uom_id text,
    min_stock double precision,
    max_stock double precision,
    material_type public."MaterialType",
    unit_weight_kg numeric(12,4),
    unit_cost numeric(15,2),
    supplier_id text,
    reorder_level integer,
    sheet_width_mm numeric(10,2),
    sheet_length_mm numeric(10,2),
    sheet_thickness_mm numeric(6,2)
);


ALTER TABLE public.material OWNER TO erp_user;

--
-- Name: material_allocations; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.material_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    so_id text,
    material_id text,
    allocation_type character varying(20),
    quantity numeric(15,4),
    cost numeric(15,4),
    delivery_date date,
    status character varying(50) DEFAULT 'allocated'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_allocations OWNER TO erp_user;

--
-- Name: material_availability_cache; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.material_availability_cache (
    material_id text NOT NULL,
    current_stock numeric(15,4) DEFAULT 0,
    reserved_quantity numeric(15,4) DEFAULT 0,
    available_quantity numeric(15,4) DEFAULT 0,
    incoming_quantity numeric(15,4) DEFAULT 0,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cache_expiry timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '01:00:00'::interval)
);


ALTER TABLE public.material_availability_cache OWNER TO erp_user;

--
-- Name: material_consumption; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.material_consumption (
    consumption_id text NOT NULL,
    product_id text NOT NULL,
    material_id text NOT NULL,
    sub_assembly_name text,
    sheet_type text NOT NULL,
    sheet_width_mm double precision NOT NULL,
    sheet_length_mm double precision NOT NULL,
    sheet_weight_kg double precision NOT NULL,
    blank_width_mm double precision NOT NULL,
    blank_length_mm double precision NOT NULL,
    blank_thickness_mm double precision NOT NULL,
    blank_weight_kg double precision NOT NULL,
    pieces_per_sheet integer NOT NULL,
    utilization_pct double precision NOT NULL,
    total_blanks double precision NOT NULL,
    consumption_pct double precision NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.material_consumption OWNER TO erp_user;

--
-- Name: material_requisition; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.material_requisition (
    requisition_id text DEFAULT gen_random_uuid() NOT NULL,
    sales_order_id text,
    work_order_id text,
    material_id text NOT NULL,
    material_code character varying(100),
    material_name character varying(255),
    material_type character varying(50),
    quantity_required numeric(15,4) NOT NULL,
    quantity_available numeric(15,4) DEFAULT 0,
    quantity_shortage numeric(15,4) DEFAULT 0,
    unit_cost numeric(15,2),
    total_cost numeric(15,2),
    status character varying(30) DEFAULT 'PENDING'::character varying,
    priority character varying(20) DEFAULT 'NORMAL'::character varying,
    required_by_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by text,
    approved_at timestamp without time zone,
    approved_by text
);


ALTER TABLE public.material_requisition OWNER TO erp_user;

--
-- Name: TABLE material_requisition; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.material_requisition IS 'Material requirements from BOM explosion, linked to sales orders or work orders';


--
-- Name: material_reservation; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.material_reservation (
    reservation_id text NOT NULL,
    work_order_id text NOT NULL,
    material_id text NOT NULL,
    quantity double precision NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    status text DEFAULT 'RESERVED'::text NOT NULL,
    created_by text NOT NULL,
    reserved_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    released_at timestamp(3) without time zone,
    released_by text
);


ALTER TABLE public.material_reservation OWNER TO erp_user;

--
-- Name: uom; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.uom (
    uom_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.uom OWNER TO erp_user;

--
-- Name: maximum_bom_with_availability; Type: VIEW; Schema: public; Owner: erp_user
--

CREATE VIEW public.maximum_bom_with_availability AS
 SELECT b.bom_id,
    b.product_id,
    b.material_id,
    b.quantity,
    b.created_at,
    b.is_optional,
    b.step_sequence,
    b.sub_assembly_name,
    b.uom_id,
    b.updated_at,
    b.item_type,
    b.reference_type,
    b.reference_id,
    b.item_name,
    b.is_critical,
    b.scrap_allowance_pct,
    b.operation_code,
    b.bom_version,
    b.substitution_priority,
    b.cost_impact_pct,
    b.quality_impact,
    m.material_code,
    m.name AS material_name,
    m.material_type,
    m.unit_cost,
    u.code AS uom_code,
    COALESCE(mac.available_quantity, (0)::numeric) AS available_quantity,
    COALESCE(mac.current_stock, (0)::numeric) AS current_stock,
    COALESCE(mac.reserved_quantity, (0)::numeric) AS reserved_quantity,
    COALESCE(mac.incoming_quantity, (0)::numeric) AS incoming_quantity,
        CASE
            WHEN ((COALESCE(mac.available_quantity, (0)::numeric))::double precision >= b.quantity) THEN 'available'::text
            WHEN (COALESCE(mac.available_quantity, (0)::numeric) > (0)::numeric) THEN 'low_stock'::text
            ELSE 'shortage'::text
        END AS availability_status
   FROM (((public.bom b
     LEFT JOIN public.material m ON ((b.material_id = m.material_id)))
     LEFT JOIN public.uom u ON ((b.uom_id = u.uom_id)))
     LEFT JOIN public.material_availability_cache mac ON ((b.material_id = mac.material_id)));


ALTER TABLE public.maximum_bom_with_availability OWNER TO erp_user;

--
-- Name: model; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.model (
    model_id text NOT NULL,
    oem_id text NOT NULL,
    model_name text NOT NULL,
    model_year text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.model OWNER TO erp_user;

--
-- Name: oem; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.oem (
    oem_id text NOT NULL,
    oem_name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.oem OWNER TO erp_user;

--
-- Name: operation; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.operation (
    operation_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.operation OWNER TO erp_user;

--
-- Name: packaging_priority; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.packaging_priority (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    product_id text,
    carton_size character varying(20),
    priority_order integer DEFAULT 1,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.packaging_priority OWNER TO erp_user;

--
-- Name: payment; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.payment (
    payment_id text NOT NULL,
    invoice_id text NOT NULL,
    amount double precision NOT NULL,
    payment_method text,
    payment_status text DEFAULT 'PENDING'::text NOT NULL,
    due_date timestamp(3) without time zone,
    paid_date timestamp(3) without time zone,
    reference text,
    created_by text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment OWNER TO erp_user;

--
-- Name: planned_production; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.planned_production (
    planned_production_id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_number text NOT NULL,
    product_id text NOT NULL,
    quantity_planned double precision NOT NULL,
    uom_id text,
    forecast_method text DEFAULT 'MANUAL'::text,
    start_date date NOT NULL,
    end_date date,
    delivery_date date,
    status text DEFAULT 'PLANNED'::text,
    priority integer DEFAULT 1,
    created_by text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    forecast_data jsonb,
    material_requirements jsonb
);


ALTER TABLE public.planned_production OWNER TO erp_user;

--
-- Name: procurement_request; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.procurement_request (
    id text NOT NULL,
    material_id text NOT NULL,
    quantity double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    requested_by text NOT NULL,
    approved_by text,
    received_by text,
    notes text,
    reference_po text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    rejection_reason text
);


ALTER TABLE public.procurement_request OWNER TO erp_user;

--
-- Name: product; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.product (
    product_id text NOT NULL,
    product_code text NOT NULL,
    part_name text NOT NULL,
    description text,
    standard_cost double precision,
    category public."Category" DEFAULT 'FINISHED_GOOD'::public."Category" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    oem_id text,
    model_id text,
    uom_id text,
    min_stock double precision,
    max_stock double precision,
    reorder_qty double precision
);


ALTER TABLE public.product OWNER TO erp_user;

--
-- Name: production_material_consumption; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.production_material_consumption (
    consumption_id uuid DEFAULT gen_random_uuid() NOT NULL,
    production_order_id character varying(255) NOT NULL,
    product_id uuid NOT NULL,
    blank_spec_id uuid,
    sub_assembly_name character varying(255),
    material_id uuid,
    planned_quantity double precision NOT NULL,
    consumed_quantity double precision NOT NULL,
    scrap_quantity double precision DEFAULT 0,
    consumption_type character varying(20) DEFAULT 'FRESH'::character varying,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    updated_by character varying(255)
);


ALTER TABLE public.production_material_consumption OWNER TO erp_user;

--
-- Name: production_material_usage; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.production_material_usage (
    usage_id text NOT NULL,
    production_id text NOT NULL,
    product_id text,
    material_id text,
    scrap_id text,
    qty_required double precision NOT NULL,
    qty_issued double precision DEFAULT 0 NOT NULL,
    uom_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.production_material_usage OWNER TO erp_user;

--
-- Name: production_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.production_order (
    po_id text NOT NULL,
    po_no text NOT NULL,
    product_id text NOT NULL,
    qty_ordered double precision NOT NULL,
    qty_completed double precision DEFAULT 0 NOT NULL,
    uom_id text,
    priority integer DEFAULT 1,
    planned_start timestamp(3) without time zone,
    planned_end timestamp(3) without time zone,
    status public."ProductionStatus" DEFAULT 'PLANNED'::public."ProductionStatus" NOT NULL,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    produced_inventory_id text
);


ALTER TABLE public.production_order OWNER TO erp_user;

--
-- Name: production_output; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.production_output (
    output_id text DEFAULT gen_random_uuid() NOT NULL,
    work_order_id text NOT NULL,
    item_id text,
    item_type character varying(50),
    item_name character varying(255),
    quantity_planned numeric(15,4),
    quantity_good numeric(15,4),
    quantity_rejected numeric(15,4) DEFAULT 0,
    quantity_rework numeric(15,4) DEFAULT 0,
    rejection_reason text,
    recorded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recorded_by text
);


ALTER TABLE public.production_output OWNER TO erp_user;

--
-- Name: TABLE production_output; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.production_output IS 'Records production output including good, rejected, and rework quantities';


--
-- Name: production_recipe_snapshots; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.production_recipe_snapshots (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    work_order_id text,
    product_id text,
    material_id text,
    substitute_material_id text,
    chosen_quantity numeric(12,4),
    substitution_reason character varying(255),
    cost_impact numeric(12,2) DEFAULT 0.0,
    sheet_size character varying(50),
    cutting_layout jsonb,
    is_primary boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_recipe_snapshots OWNER TO erp_user;

--
-- Name: production_step; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.production_step (
    ps_id text NOT NULL,
    production_id text NOT NULL,
    step_no integer NOT NULL,
    operation text NOT NULL,
    planned_qty double precision,
    completed_qty double precision DEFAULT 0,
    status public."StepStatus" DEFAULT 'PENDING'::public."StepStatus" NOT NULL,
    start_time timestamp(3) without time zone,
    end_time timestamp(3) without time zone,
    remarks text
);


ALTER TABLE public.production_step OWNER TO erp_user;

--
-- Name: purchase_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_order (
    po_id text NOT NULL,
    po_no text NOT NULL,
    supplier_id text NOT NULL,
    pr_id text,
    order_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expected_date timestamp(3) without time zone,
    status public."POStatus" DEFAULT 'OPEN'::public."POStatus" NOT NULL,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "purchaseRequisitionItemId" text
);


ALTER TABLE public.purchase_order OWNER TO erp_user;

--
-- Name: purchase_order_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_order_item (
    po_item_id text NOT NULL,
    po_id text NOT NULL,
    product_id text,
    material_id text,
    uom_id text,
    quantity double precision NOT NULL,
    received_qty double precision DEFAULT 0 NOT NULL,
    unit_price double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.purchase_order_item OWNER TO erp_user;

--
-- Name: purchase_requisition; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_requisition (
    pr_id text NOT NULL,
    pr_no text NOT NULL,
    requested_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."PRStatus" DEFAULT 'OPEN'::public."PRStatus" NOT NULL,
    notes text
);


ALTER TABLE public.purchase_requisition OWNER TO erp_user;

--
-- Name: purchase_requisition_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.purchase_requisition_item (
    id text NOT NULL,
    pr_id text NOT NULL,
    product_id text,
    material_id text,
    uom_id text,
    qty_requested double precision NOT NULL,
    qty_approved double precision
);


ALTER TABLE public.purchase_requisition_item OWNER TO erp_user;

--
-- Name: qa_rejection; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.qa_rejection (
    rejection_id text NOT NULL,
    inventory_id text NOT NULL,
    product_id text NOT NULL,
    rejection_reason text NOT NULL,
    disposition text NOT NULL,
    rejected_by text,
    rejected_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    root_cause text,
    corrective_action text,
    rework_wo_id text,
    scrap_id text,
    disposal_date timestamp(3) without time zone,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.qa_rejection OWNER TO erp_user;

--
-- Name: raw_material; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.raw_material (
    raw_material_id text NOT NULL,
    material_code text NOT NULL,
    name text NOT NULL,
    description text,
    uom_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.raw_material OWNER TO erp_user;

--
-- Name: report_schedule; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.report_schedule (
    report_id text NOT NULL,
    name text NOT NULL,
    cron_expr text NOT NULL,
    last_run timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by text,
    params jsonb
);


ALTER TABLE public.report_schedule OWNER TO erp_user;

--
-- Name: routing; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.routing (
    routing_id text NOT NULL,
    product_id text NOT NULL,
    step_no integer NOT NULL,
    operation text NOT NULL,
    work_center text,
    duration integer,
    cost_rate double precision,
    alternative_path_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    is_primary_path boolean DEFAULT true NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.routing OWNER TO erp_user;

--
-- Name: sales_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.sales_order (
    sales_order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_id text NOT NULL,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    required_date date,
    delivery_date date,
    status public.salesorderstatus DEFAULT 'DRAFT'::public.salesorderstatus,
    priority character varying(20) DEFAULT 'NORMAL'::character varying,
    order_type character varying(50) DEFAULT 'STANDARD'::character varying,
    order_source character varying(50) DEFAULT 'MANUAL'::character varying,
    reference_number character varying(100),
    customer_po_date date,
    currency character varying(3) DEFAULT 'PKR'::character varying,
    subtotal numeric(18,4) DEFAULT 0,
    tax_rate numeric(5,2) DEFAULT 18.00,
    tax_amount numeric(18,4) DEFAULT 0,
    discount_amount numeric(18,4) DEFAULT 0,
    shipping_cost numeric(18,4) DEFAULT 0,
    total_amount numeric(18,4) DEFAULT 0,
    shipping_method character varying(100),
    shipping_address text,
    delivery_instructions text,
    payment_terms character varying(100),
    warranty_terms text,
    special_instructions text,
    salesperson_id text,
    created_by character varying(100),
    approved_by character varying(100),
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    linked_po_id text
);


ALTER TABLE public.sales_order OWNER TO erp_user;

--
-- Name: COLUMN sales_order.linked_po_id; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.sales_order.linked_po_id IS 'Links to a pre-existing purchase order for fast production workflow';


--
-- Name: sales_order_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.sales_order_item (
    item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    sales_order_id uuid NOT NULL,
    product_id uuid,
    item_code character varying(100),
    item_name character varying(255) NOT NULL,
    description text,
    specification text,
    quantity numeric(18,4) NOT NULL,
    unit_of_measure character varying(50) DEFAULT 'PCS'::character varying,
    unit_price numeric(18,4) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    discount_amount numeric(18,4) DEFAULT 0,
    line_total numeric(18,4) NOT NULL,
    production_required boolean DEFAULT true,
    bom_id uuid,
    estimated_production_time integer,
    production_start_date date,
    production_end_date date,
    delivery_required boolean DEFAULT true,
    delivery_date date,
    delivery_status character varying(50) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    qty_allocated_from_stock double precision DEFAULT 0,
    qty_to_produce double precision DEFAULT 0
);


ALTER TABLE public.sales_order_item OWNER TO erp_user;

--
-- Name: COLUMN sales_order_item.qty_allocated_from_stock; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.sales_order_item.qty_allocated_from_stock IS 'Quantity allocated from finished goods inventory (pre-made stock)';


--
-- Name: COLUMN sales_order_item.qty_to_produce; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.sales_order_item.qty_to_produce IS 'Quantity that needs to be produced (shortage after allocation)';


--
-- Name: sales_order_work_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.sales_order_work_order (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sales_order_id uuid NOT NULL,
    sales_order_item_id uuid NOT NULL,
    work_order_id uuid,
    quantity numeric(18,4) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sales_order_work_order OWNER TO erp_user;

--
-- Name: scrap_inventory; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.scrap_inventory (
    scrap_id text NOT NULL,
    blank_id text,
    material_id text,
    width_mm double precision,
    length_mm double precision,
    thickness_mm double precision,
    weight_kg double precision NOT NULL,
    location_id text,
    status public."ScrapStatus" DEFAULT 'AVAILABLE'::public."ScrapStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by text,
    reference text,
    consumed_by_po text,
    material_name character varying(255),
    leftover_area_mm2 double precision,
    orientation character varying(10),
    sheet_original_size character varying(50),
    blank_size character varying(50),
    efficiency_percentage double precision,
    scrap_percentage double precision,
    unit character varying(20) DEFAULT 'kg'::character varying
);


ALTER TABLE public.scrap_inventory OWNER TO erp_user;

--
-- Name: scrap_movement; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.scrap_movement (
    movement_id uuid DEFAULT gen_random_uuid() NOT NULL,
    scrap_id uuid NOT NULL,
    movement_type character varying(20) NOT NULL,
    quantity double precision NOT NULL,
    reason text,
    reference text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.scrap_movement OWNER TO erp_user;

--
-- Name: scrap_origin; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.scrap_origin (
    origin_id uuid DEFAULT gen_random_uuid() NOT NULL,
    scrap_id text NOT NULL,
    source_type character varying(50) NOT NULL,
    source_reference character varying(255),
    product_id text,
    blank_id text,
    process_step character varying(100),
    operator_id character varying(100),
    bom_efficiency double precision,
    sheet_dimensions character varying(50),
    blank_dimensions character varying(50),
    leftover_width double precision,
    leftover_length double precision,
    cutting_direction character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100)
);


ALTER TABLE public.scrap_origin OWNER TO erp_user;

--
-- Name: scrap_transaction; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.scrap_transaction (
    txn_id text NOT NULL,
    scrap_id text NOT NULL,
    txn_type public."ScrapTxnType" NOT NULL,
    qty_used double precision,
    weight_kg double precision,
    reference text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by text
);


ALTER TABLE public.scrap_transaction OWNER TO erp_user;

--
-- Name: scrap_transaction_log; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.scrap_transaction_log (
    log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    scrap_id text NOT NULL,
    transaction_type character varying(50) NOT NULL,
    quantity_before double precision NOT NULL,
    quantity_after double precision NOT NULL,
    quantity_changed double precision NOT NULL,
    reason text,
    reference character varying(255),
    destination character varying(255),
    performed_by character varying(100),
    performed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.scrap_transaction_log OWNER TO erp_user;

--
-- Name: sheet_sizes; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.sheet_sizes (
    sheet_size_id uuid DEFAULT gen_random_uuid() NOT NULL,
    width_mm double precision NOT NULL,
    length_mm double precision NOT NULL,
    material_type character varying(10),
    sheet_weight_kg double precision,
    cost_per_kg double precision,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by character varying(255),
    thickness_mm double precision DEFAULT 2.0
);


ALTER TABLE public.sheet_sizes OWNER TO erp_user;

--
-- Name: shortage_alerts; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.shortage_alerts (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    po_id text,
    product_id text,
    alert_type character varying(50) DEFAULT 'material_shortage'::character varying,
    severity character varying(20) DEFAULT 'warning'::character varying,
    message text,
    details jsonb,
    status character varying(20) DEFAULT 'pending'::character varying,
    resolved_at timestamp without time zone,
    resolved_by text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shortage_alerts OWNER TO erp_user;

--
-- Name: stock_in; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.stock_in (
    stock_in_id text NOT NULL,
    material_id text,
    material_name text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text DEFAULT 'Pieces'::text,
    location text,
    supplier text,
    purchase_order_ref text,
    cost_per_unit numeric(10,2) DEFAULT 0,
    total_cost numeric(10,2) DEFAULT 0,
    received_by text,
    received_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status text DEFAULT 'RECEIVED'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_in OWNER TO erp_user;

--
-- Name: stock_ledger; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.stock_ledger (
    ledger_id text NOT NULL,
    item_type public."LedgerItemType" NOT NULL,
    product_id text,
    material_id text,
    scrap_id text,
    txn_id text,
    txn_type public."TxnType" NOT NULL,
    quantity double precision NOT NULL,
    unit_cost double precision,
    total_cost double precision,
    location_id text,
    reference text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by text
);


ALTER TABLE public.stock_ledger OWNER TO erp_user;

--
-- Name: strategic_inventory; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.strategic_inventory (
    material_id text NOT NULL,
    current_stock numeric(15,4) DEFAULT 0,
    safety_stock numeric(15,4) DEFAULT 0,
    reorder_point numeric(15,4) DEFAULT 0,
    economic_order_qty numeric(15,4) DEFAULT 0,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.strategic_inventory OWNER TO erp_user;

--
-- Name: supplier; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.supplier (
    supplier_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    contact text,
    phone text,
    email text,
    address text,
    lead_time_days integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.supplier OWNER TO erp_user;

--
-- Name: three_way_match; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.three_way_match (
    matching_id text NOT NULL,
    po_id text NOT NULL,
    grn_id text NOT NULL,
    invoice_id text NOT NULL,
    po_item_id text NOT NULL,
    grn_item_id text NOT NULL,
    invoice_item_id text NOT NULL,
    po_quantity double precision NOT NULL,
    po_unit_price double precision NOT NULL,
    po_total double precision NOT NULL,
    grn_quantity double precision NOT NULL,
    grn_unit_price double precision NOT NULL,
    grn_total double precision NOT NULL,
    invoice_quantity double precision NOT NULL,
    invoice_unit_price double precision NOT NULL,
    invoice_total double precision NOT NULL,
    quantity_variance double precision NOT NULL,
    price_variance double precision NOT NULL,
    total_variance double precision NOT NULL,
    quantity_variance_percent double precision NOT NULL,
    price_variance_percent double precision NOT NULL,
    total_variance_percent double precision NOT NULL,
    match_status text NOT NULL,
    exceptions text,
    created_by text NOT NULL,
    matched_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.three_way_match OWNER TO erp_user;

--
-- Name: wastage; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.wastage (
    wastage_id text NOT NULL,
    wo_id text NOT NULL,
    step_id text,
    material_id text NOT NULL,
    reentry_txn_id text,
    quantity double precision NOT NULL,
    uom_id text,
    location_id text,
    reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wastage OWNER TO erp_user;

--
-- Name: work_center; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.work_center (
    work_center_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.work_center OWNER TO erp_user;

--
-- Name: work_order; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.work_order (
    wo_id text NOT NULL,
    wo_no text NOT NULL,
    product_id text NOT NULL,
    quantity double precision NOT NULL,
    uom_id text,
    priority integer DEFAULT 1,
    scheduled_start timestamp(3) without time zone,
    scheduled_end timestamp(3) without time zone,
    status public."WOStatus" DEFAULT 'PLANNED'::public."WOStatus" NOT NULL,
    created_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parent_wo_id text,
    operation_type character varying(255),
    sheets_allocated integer,
    dependency_status character varying(20) DEFAULT 'READY'::character varying,
    depends_on_wo_id text,
    customer character varying(255),
    sales_order_ref character varying(255),
    purchase_order_ref text
);


ALTER TABLE public.work_order OWNER TO erp_user;

--
-- Name: COLUMN work_order.parent_wo_id; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.work_order.parent_wo_id IS 'Parent work order ID for hierarchical work orders';


--
-- Name: COLUMN work_order.operation_type; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.work_order.operation_type IS 'Type of operation: Can be any operation name from process flow (e.g., "BLANKING OF HOOK", "CUTTING", "FORMING", etc.)';


--
-- Name: COLUMN work_order.sheets_allocated; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.work_order.sheets_allocated IS 'Number of sheets allocated for cutting operations';


--
-- Name: COLUMN work_order.dependency_status; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.work_order.dependency_status IS 'Dependency status: READY, WAITING, BLOCKED';


--
-- Name: COLUMN work_order.customer; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.work_order.customer IS 'Customer name for the work order';


--
-- Name: COLUMN work_order.sales_order_ref; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON COLUMN public.work_order.sales_order_ref IS 'Reference to the sales order that generated this work order';


--
-- Name: work_order_item; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.work_order_item (
    id text NOT NULL,
    wo_id text NOT NULL,
    product_id text NOT NULL,
    quantity double precision NOT NULL
);


ALTER TABLE public.work_order_item OWNER TO erp_user;

--
-- Name: work_order_material_issue; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.work_order_material_issue (
    issue_id text DEFAULT gen_random_uuid() NOT NULL,
    work_order_id text NOT NULL,
    material_id text NOT NULL,
    material_type character varying(50),
    quantity_planned numeric(15,4),
    quantity_issued numeric(15,4),
    quantity_consumed numeric(15,4),
    quantity_returned numeric(15,4) DEFAULT 0,
    unit_cost numeric(15,2),
    total_cost numeric(15,2),
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    issued_by text,
    status character varying(30) DEFAULT 'ISSUED'::character varying
);


ALTER TABLE public.work_order_material_issue OWNER TO erp_user;

--
-- Name: TABLE work_order_material_issue; Type: COMMENT; Schema: public; Owner: erp_user
--

COMMENT ON TABLE public.work_order_material_issue IS 'Tracks material issuance from inventory to production';


--
-- Name: work_order_step; Type: TABLE; Schema: public; Owner: erp_user
--

CREATE TABLE public.work_order_step (
    step_id text NOT NULL,
    wo_id text NOT NULL,
    step_no integer NOT NULL,
    routing_id text,
    operation text NOT NULL,
    work_center text,
    assigned_to text,
    planned_qty double precision,
    start_time timestamp(3) without time zone,
    end_time timestamp(3) without time zone,
    status public."StepStatus" DEFAULT 'PENDING'::public."StepStatus" NOT NULL,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.work_order_step OWNER TO erp_user;

--
-- Name: manual_opening_stock id; Type: DEFAULT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.manual_opening_stock ALTER COLUMN id SET DEFAULT nextval('public.manual_opening_stock_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c3fb90b4-5b80-4124-96cf-71fa88b13059	06c3a66460f81a77354888f20ea11b63f6b39ced0639755b19a57c40e184ad2f	2025-09-23 14:36:01.140655+00	20250919113925_init	\N	\N	2025-09-23 14:36:00.573016+00	1
b1c0f810-4ec6-449d-9d47-463706d5ff27	1f6c356fc873bb2f64d0b11989e7784accff8e085fc85b22ae552ba7b03cffdf	2025-09-23 14:36:14.475973+00	20250923143614_add_procurement_request	\N	\N	2025-09-23 14:36:14.425015+00	1
61224114-3245-4429-8669-0223d0366846	e128502179c6ee82e97baba7f4a6e454a212c72ed22bc15dbfea5dc0ff2bd663	2025-09-23 14:49:59.792877+00	20250923144959_add_procurement_request	\N	\N	2025-09-23 14:49:59.777195+00	1
d74bf14f-94b2-4b05-bb4f-8025687e30bf	958fab6e02d26df8b4a808a96e56683a68d5ba205f012bf2f9f60ba03f11ea0b	2025-09-23 17:04:40.627173+00	20250923170440_add_procurement_workflow_fields	\N	\N	2025-09-23 17:04:40.608775+00	1
54de39b8-49cb-4ed9-8bb0-140a3066ddd0	9232b7eebe21c8a9827317ccba00acf306d45961add1a8e1857d755855a13db9	2025-11-14 19:55:10.686274+00	20250106000000_create_internal_purchase_order	\N	\N	2025-11-14 19:55:10.617496+00	1
e3673d89-ae6f-46c5-ac52-0a5ccb8de39d	10c0ac423fdbbe708f0589596978dc69c8cf5daeb64a3eb90929c60d9d497ca4	2025-11-14 19:55:10.764705+00	20250120000000_create_planned_production	\N	\N	2025-11-14 19:55:10.703241+00	1
48c01af2-8939-409f-8a24-a22a0feef661	1f649a0d6b055a08a48248923b3953decf32f8c0791b4348625d34cf7dd56b0a	2025-11-14 19:55:10.832158+00	20250120000001_add_allocation_fields_to_sales_order_item	\N	\N	2025-11-14 19:55:10.782624+00	1
df9b91b2-197f-4f0d-ae99-dfcd5f579768	40b2c499b01d5637c46775d7699ad77352bb3dd9e79e49da6d886f30545b7779	2025-11-14 19:57:13.598464+00	20250110000000_add_purchase_order_ref_to_work_order		\N	2025-11-14 19:57:13.598464+00	0
174edbb1-b752-4192-8b6d-d9aad4b780be	0fa728a8d1551a09e39536f6f8c2a9c8009f06b1892a3c69676db227bb7b77ab	2025-12-14 11:05:30.343765+00	20250121000000_add_qa_rejection	\N	\N	2025-12-14 11:05:30.163501+00	1
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.audit_log (id, user_id, action, entity_type, entity_id, old_values, new_values, reference_id, ip_address, user_agent, additional_data, "timestamp") FROM stdin;
\.


--
-- Data for Name: batch; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.batch (batch_id, inventory_id, batch_no, quantity, unit_cost, expiry_date, supplier_id, received_date, quality_status, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: batch_consumption; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.batch_consumption (consumption_id, batch_id, quantity, wo_id, reference, created_by, consumption_date) FROM stdin;
\.


--
-- Data for Name: blank_optimization; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.blank_optimization (optimization_id, blank_id, sheet_size_id, blank_width_mm, blank_length_mm, blank_thickness_mm, blank_quantity, weight_of_blank_kg, total_blank_weight_kg, best_direction, sheet_width_mm, sheet_length_mm, primary_blanks_per_sheet, extra_blanks_from_leftover, total_blanks_per_sheet, total_blanks_weight_kg, efficiency_percentage, scrap_percentage, utilization_percentage, leftover_area_mm2, leftover_width_mm, leftover_length_mm, leftover_reusable, horizontal_result, vertical_result, all_sheet_comparisons, optimization_mode, calculated_at, calculated_by) FROM stdin;
27763f99-916c-494e-a067-86cd4471e53d	f59c682a-d082-4521-a04e-8b0aa19b2d25	6325161b-e75b-495c-873f-739da1cc3a4e	90	90	3	2	0.19075499999999998	0.38150999999999996	HORIZONTAL	1525	3050	528	0	528	100.71864	91.949475947326	8.050524052674007	91.949475947326	374450	85	80	f	{"scrap": 8.050524052674007, "usedArea": 4276800, "direction": "HORIZONTAL", "efficiency": 91.949475947326, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 528, "utilization": 91.949475947326, "blanksAcross": 16, "leftoverArea": 374450, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 528, "sheet_size_id": "6325161b-e75b-495c-873f-739da1cc3a4e", "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}	{"scrap": 8.050524052674007, "usedArea": 4276800, "direction": "VERTICAL", "efficiency": 91.949475947326, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 528, "utilization": 91.949475947326, "blanksAcross": 16, "leftoverArea": 374450, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 528, "sheet_size_id": "6325161b-e75b-495c-873f-739da1cc3a4e", "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}	[{"scrap": 8.050524052674007, "usedArea": 4276800, "direction": "HORIZONTAL", "efficiency": 91.949475947326, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 528, "utilization": 91.949475947326, "blanksAcross": 16, "leftoverArea": 374450, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 528, "sheet_size_id": "6325161b-e75b-495c-873f-739da1cc3a4e", "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 8.050524052674007, "usedArea": 4276800, "direction": "VERTICAL", "efficiency": 91.949475947326, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 528, "utilization": 91.949475947326, "blanksAcross": 16, "leftoverArea": 374450, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 528, "sheet_size_id": "6325161b-e75b-495c-873f-739da1cc3a4e", "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 8.050524052674007, "usedArea": 4276800, "direction": "HORIZONTAL", "efficiency": 91.949475947326, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 528, "utilization": 91.949475947326, "blanksAcross": 16, "leftoverArea": 374450, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 528, "sheet_size_id": "494c395b-6cb4-4d69-a2c3-f44b4fb1479b", "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 8.050524052674007, "usedArea": 4276800, "direction": "VERTICAL", "efficiency": 91.949475947326, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 528, "utilization": 91.949475947326, "blanksAcross": 16, "leftoverArea": 374450, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 528, "sheet_size_id": "494c395b-6cb4-4d69-a2c3-f44b4fb1479b", "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "HORIZONTAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 520, "sheet_size_id": "8b15689b-5a21-4e4b-9eff-730219cabba6", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "VERTICAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 520, "sheet_size_id": "8b15689b-5a21-4e4b-9eff-730219cabba6", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "HORIZONTAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 520, "sheet_size_id": "584d1f60-851e-403d-995c-910e56e6cd98", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "VERTICAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 520, "sheet_size_id": "584d1f60-851e-403d-995c-910e56e6cd98", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "HORIZONTAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 520, "sheet_size_id": "f983be92-7e31-413c-b450-cbc3a8ad9e65", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "VERTICAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 520, "sheet_size_id": "f983be92-7e31-413c-b450-cbc3a8ad9e65", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "HORIZONTAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 520, "sheet_size_id": "7bd02a1d-c73e-4e06-ade3-090474b89644", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 5.670518677774794, "usedArea": 4212000, "direction": "VERTICAL", "efficiency": 94.3294813222252, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 520, "utilization": 94.3294813222252, "blanksAcross": 13, "leftoverArea": 253200, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 520, "sheet_size_id": "7bd02a1d-c73e-4e06-ade3-090474b89644", "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "HORIZONTAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "GI", "primaryBlanks": 351, "sheet_size_id": "8d81209b-a881-4403-b0dd-6bafa0c614e8", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 120, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "GI", "primaryBlanks": 351, "sheet_size_id": "8d81209b-a881-4403-b0dd-6bafa0c614e8", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 120, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "HORIZONTAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 351, "sheet_size_id": "3826cd3d-36c0-44c0-9fe0-e109294989a6", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 351, "sheet_size_id": "3826cd3d-36c0-44c0-9fe0-e109294989a6", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "HORIZONTAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 351, "sheet_size_id": "5fd58a77-3532-4956-b2ba-f5975e23056c", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 351, "sheet_size_id": "5fd58a77-3532-4956-b2ba-f5975e23056c", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "HORIZONTAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 351, "sheet_size_id": "62f95939-90c8-46eb-8fdb-f5ac21c28efc", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 351, "sheet_size_id": "62f95939-90c8-46eb-8fdb-f5ac21c28efc", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 250, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "HORIZONTAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "GI", "primaryBlanks": 351, "sheet_size_id": "f759e101-e6ac-4009-90b6-30704ffcf3f5", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 120, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "GI", "primaryBlanks": 351, "sheet_size_id": "f759e101-e6ac-4009-90b6-30704ffcf3f5", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 120, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "HORIZONTAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 351, "sheet_size_id": "77fa7b02-9026-42cd-a923-9505b0810e0b", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 351, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 351, "sheet_size_id": "77fa7b02-9026-42cd-a923-9505b0810e0b", "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "sheet_cost_per_kg": 80, "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-07 11:33:04.220067	current_user
17ac3a5c-30a8-4d0b-8679-564f8d13c6b6	a17f847c-47f9-41d0-a451-6180d6560ca5	\N	170	760	2.4	1	2.434128	2.434128	VERTICAL	1525	3050	34	0	34	82.760352	94.44342918570277	5.556570814297231	94.44342918570277	258450	5	160	f	{"scrap": 11.112066648750343, "usedArea": 4134400, "direction": "HORIZONTAL", "efficiency": 88.88793335124966, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.88793335124966, "blanksAcross": 8, "leftoverArea": 516850, "leftoverWidth": 165, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 5.556570814297231, "usedArea": 4392800, "direction": "VERTICAL", "efficiency": 94.44342918570277, "sheetWidth": 1525, "blanksAlong": 17, "sheetLength": 3050, "totalBlanks": 34, "utilization": 94.44342918570277, "blanksAcross": 2, "leftoverArea": 258450, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 34, "leftoverLength": 160, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 5.556570814297231, "usedArea": 4392800, "direction": "VERTICAL", "efficiency": 94.44342918570277, "sheetWidth": 1525, "blanksAlong": 17, "sheetLength": 3050, "totalBlanks": 34, "utilization": 94.44342918570277, "blanksAcross": 2, "leftoverArea": 258450, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 34, "leftoverLength": 160, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 11.112066648750343, "usedArea": 4134400, "direction": "HORIZONTAL", "efficiency": 88.88793335124966, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.88793335124966, "blanksAcross": 8, "leftoverArea": 516850, "leftoverWidth": 165, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.982352414225574, "usedArea": 3617600, "direction": "HORIZONTAL", "efficiency": 81.01764758577443, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 28, "utilization": 81.01764758577443, "blanksAcross": 7, "leftoverArea": 847600, "leftoverWidth": 30, "material_type": "MS", "primaryBlanks": 28, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.982352414225574, "usedArea": 3617600, "direction": "HORIZONTAL", "efficiency": 81.01764758577443, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 28, "utilization": 81.01764758577443, "blanksAcross": 7, "leftoverArea": 847600, "leftoverWidth": 30, "material_type": "SS", "primaryBlanks": 28, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "MS", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "SS", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "GI", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 2713200, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 21, "sheetLength": 3660, "totalBlanks": 21, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1752000, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 21, "leftoverLength": 90, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 2713200, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 21, "sheetLength": 3660, "totalBlanks": 21, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1752000, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 21, "leftoverLength": 90, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "GI", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-23 12:19:50.280717	current_user
4f65931a-0023-40c8-8899-5ae96d029547	c629d162-0a64-4ed4-901f-79c72f735b03	\N	270	900	2.5	1	4.7688749999999995	4.7688749999999995	HORIZONTAL	1220	3660	16	0	16	76.30199999999999	87.07336737436174	12.926632625638263	87.07336737436174	577200	140	60	f	{"scrap": 12.926632625638263, "usedArea": 3888000, "direction": "HORIZONTAL", "efficiency": 87.07336737436174, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 16, "utilization": 87.07336737436174, "blanksAcross": 4, "leftoverArea": 577200, "leftoverWidth": 140, "material_type": "MS", "primaryBlanks": 16, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 29.252889008331096, "usedArea": 3159000, "direction": "VERTICAL", "efficiency": 70.7471109916689, "sheetWidth": 1220, "blanksAlong": 13, "sheetLength": 3660, "totalBlanks": 13, "utilization": 70.7471109916689, "blanksAcross": 1, "leftoverArea": 1306200, "leftoverWidth": 320, "material_type": "MS", "primaryBlanks": 13, "leftoverLength": 150, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 12.926632625638263, "usedArea": 3888000, "direction": "HORIZONTAL", "efficiency": 87.07336737436174, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 16, "utilization": 87.07336737436174, "blanksAcross": 4, "leftoverArea": 577200, "leftoverWidth": 140, "material_type": "MS", "primaryBlanks": 16, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 12.926632625638263, "usedArea": 3888000, "direction": "HORIZONTAL", "efficiency": 87.07336737436174, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 16, "utilization": 87.07336737436174, "blanksAcross": 4, "leftoverArea": 577200, "leftoverWidth": 140, "material_type": "SS", "primaryBlanks": 16, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 21.633969363074442, "usedArea": 3645000, "direction": "HORIZONTAL", "efficiency": 78.36603063692556, "sheetWidth": 1525, "blanksAlong": 3, "sheetLength": 3050, "totalBlanks": 15, "utilization": 78.36603063692556, "blanksAcross": 5, "leftoverArea": 1006250, "leftoverWidth": 175, "material_type": "MS", "primaryBlanks": 15, "leftoverLength": 350, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 29.252889008331096, "usedArea": 3159000, "direction": "VERTICAL", "efficiency": 70.7471109916689, "sheetWidth": 1220, "blanksAlong": 13, "sheetLength": 3660, "totalBlanks": 13, "utilization": 70.7471109916689, "blanksAcross": 1, "leftoverArea": 1306200, "leftoverWidth": 320, "material_type": "MS", "primaryBlanks": 13, "leftoverLength": 150, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 29.252889008331096, "usedArea": 3159000, "direction": "VERTICAL", "efficiency": 70.7471109916689, "sheetWidth": 1220, "blanksAlong": 13, "sheetLength": 3660, "totalBlanks": 13, "utilization": 70.7471109916689, "blanksAcross": 1, "leftoverArea": 1306200, "leftoverWidth": 320, "material_type": "SS", "primaryBlanks": 13, "leftoverLength": 150, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 42.53157753292126, "usedArea": 2673000, "direction": "VERTICAL", "efficiency": 57.46842246707874, "sheetWidth": 1525, "blanksAlong": 11, "sheetLength": 3050, "totalBlanks": 11, "utilization": 57.46842246707874, "blanksAcross": 1, "leftoverArea": 1978250, "leftoverWidth": 625, "material_type": "MS", "primaryBlanks": 11, "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 26.53184627788228, "usedArea": 2187000, "direction": "VERTICAL", "efficiency": 73.46815372211772, "sheetWidth": 1220, "blanksAlong": 9, "sheetLength": 2440, "totalBlanks": 9, "utilization": 73.46815372211772, "blanksAcross": 1, "leftoverArea": 789800, "leftoverWidth": 320, "material_type": "MS", "primaryBlanks": 9, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 26.53184627788228, "usedArea": 2187000, "direction": "VERTICAL", "efficiency": 73.46815372211772, "sheetWidth": 1220, "blanksAlong": 9, "sheetLength": 2440, "totalBlanks": 9, "utilization": 73.46815372211772, "blanksAcross": 1, "leftoverArea": 789800, "leftoverWidth": 320, "material_type": "SS", "primaryBlanks": 9, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 26.53184627788228, "usedArea": 2187000, "direction": "VERTICAL", "efficiency": 73.46815372211772, "sheetWidth": 1220, "blanksAlong": 9, "sheetLength": 2440, "totalBlanks": 9, "utilization": 73.46815372211772, "blanksAcross": 1, "leftoverArea": 789800, "leftoverWidth": 320, "material_type": "GI", "primaryBlanks": 9, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.6949744692287, "usedArea": 1944000, "direction": "HORIZONTAL", "efficiency": 65.3050255307713, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 8, "utilization": 65.3050255307713, "blanksAcross": 4, "leftoverArea": 1032800, "leftoverWidth": 140, "material_type": "MS", "primaryBlanks": 8, "leftoverLength": 640, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.6949744692287, "usedArea": 1944000, "direction": "HORIZONTAL", "efficiency": 65.3050255307713, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 8, "utilization": 65.3050255307713, "blanksAcross": 4, "leftoverArea": 1032800, "leftoverWidth": 140, "material_type": "SS", "primaryBlanks": 8, "leftoverLength": 640, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.6949744692287, "usedArea": 1944000, "direction": "HORIZONTAL", "efficiency": 65.3050255307713, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 8, "utilization": 65.3050255307713, "blanksAcross": 4, "leftoverArea": 1032800, "leftoverWidth": 140, "material_type": "GI", "primaryBlanks": 8, "leftoverLength": 640, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-23 12:37:36.143627	current_user
33f2d4c9-2333-454f-8a55-7ee93d5ac71e	b5913ae9-872a-427e-ab1b-bb3cb2edd980	\N	800	760	2	1	9.545599999999999	9.545599999999999	VERTICAL	1525	3050	6	0	6	57.27359999999999	78.43052942757323	21.569470572426766	78.43052942757323	1003250	5	650	f	{"scrap": 47.71298038161784, "usedArea": 2432000, "direction": "HORIZONTAL", "efficiency": 52.28701961838216, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 4, "utilization": 52.28701961838216, "blanksAcross": 1, "leftoverArea": 2219250, "leftoverWidth": 725, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 21.569470572426766, "usedArea": 3648000, "direction": "VERTICAL", "efficiency": 78.43052942757323, "sheetWidth": 1525, "blanksAlong": 3, "sheetLength": 3050, "totalBlanks": 6, "utilization": 78.43052942757323, "blanksAcross": 2, "leftoverArea": 1003250, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 6, "leftoverLength": 650, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 21.569470572426766, "usedArea": 3648000, "direction": "VERTICAL", "efficiency": 78.43052942757323, "sheetWidth": 1525, "blanksAlong": 3, "sheetLength": 3050, "totalBlanks": 6, "utilization": 78.43052942757323, "blanksAcross": 2, "leftoverArea": 1003250, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 6, "leftoverLength": 650, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.53435456418525, "usedArea": 2432000, "direction": "HORIZONTAL", "efficiency": 54.46564543581475, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 4, "utilization": 54.46564543581475, "blanksAcross": 1, "leftoverArea": 2033200, "leftoverWidth": 420, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.53435456418525, "usedArea": 2432000, "direction": "VERTICAL", "efficiency": 54.46564543581475, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 4, "utilization": 54.46564543581475, "blanksAcross": 1, "leftoverArea": 2033200, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 460, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.53435456418525, "usedArea": 2432000, "direction": "HORIZONTAL", "efficiency": 54.46564543581475, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 4, "utilization": 54.46564543581475, "blanksAcross": 1, "leftoverArea": 2033200, "leftoverWidth": 420, "material_type": "SS", "primaryBlanks": 4, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.53435456418525, "usedArea": 2432000, "direction": "VERTICAL", "efficiency": 54.46564543581475, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 4, "utilization": 54.46564543581475, "blanksAcross": 1, "leftoverArea": 2033200, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 4, "leftoverLength": 460, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 47.71298038161784, "usedArea": 2432000, "direction": "HORIZONTAL", "efficiency": 52.28701961838216, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 4, "utilization": 52.28701961838216, "blanksAcross": 1, "leftoverArea": 2219250, "leftoverWidth": 725, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 38.72614888470841, "usedArea": 1824000, "direction": "HORIZONTAL", "efficiency": 61.27385111529159, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 61.27385111529159, "blanksAcross": 1, "leftoverArea": 1152800, "leftoverWidth": 420, "material_type": "MS", "primaryBlanks": 3, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 38.72614888470841, "usedArea": 1824000, "direction": "VERTICAL", "efficiency": 61.27385111529159, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 61.27385111529159, "blanksAcross": 1, "leftoverArea": 1152800, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 3, "leftoverLength": 40, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 38.72614888470841, "usedArea": 1824000, "direction": "HORIZONTAL", "efficiency": 61.27385111529159, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 61.27385111529159, "blanksAcross": 1, "leftoverArea": 1152800, "leftoverWidth": 420, "material_type": "SS", "primaryBlanks": 3, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 38.72614888470841, "usedArea": 1824000, "direction": "VERTICAL", "efficiency": 61.27385111529159, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 61.27385111529159, "blanksAcross": 1, "leftoverArea": 1152800, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 3, "leftoverLength": 40, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 38.72614888470841, "usedArea": 1824000, "direction": "HORIZONTAL", "efficiency": 61.27385111529159, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 61.27385111529159, "blanksAcross": 1, "leftoverArea": 1152800, "leftoverWidth": 420, "material_type": "GI", "primaryBlanks": 3, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 38.72614888470841, "usedArea": 1824000, "direction": "VERTICAL", "efficiency": 61.27385111529159, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 61.27385111529159, "blanksAcross": 1, "leftoverArea": 1152800, "leftoverWidth": 460, "material_type": "GI", "primaryBlanks": 3, "leftoverLength": 40, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-23 12:46:46.924065	current_user
13e6e9b8-4a76-491a-8649-b02ab3525ac5	22aa10fb-4651-46f0-926a-cd6592e08127	\N	305	660	4	1	6.320819999999999	6.320819999999999	HORIZONTAL	1220	3660	20	0	20	126.41639999999998	90.1639344262295	9.836065573770497	90.1639344262295	439200	0	360	f	{"scrap": 9.836065573770497, "usedArea": 4026000, "direction": "HORIZONTAL", "efficiency": 90.1639344262295, "sheetWidth": 1220, "blanksAlong": 5, "sheetLength": 3660, "totalBlanks": 20, "utilization": 90.1639344262295, "blanksAcross": 4, "leftoverArea": 439200, "leftoverWidth": 0, "material_type": "MS", "primaryBlanks": 20, "leftoverLength": 360, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 45.90163934426229, "usedArea": 2415600, "direction": "VERTICAL", "efficiency": 54.09836065573771, "sheetWidth": 1220, "blanksAlong": 12, "sheetLength": 3660, "totalBlanks": 12, "utilization": 54.09836065573771, "blanksAcross": 1, "leftoverArea": 2049600, "leftoverWidth": 560, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 0, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 9.836065573770497, "usedArea": 4026000, "direction": "HORIZONTAL", "efficiency": 90.1639344262295, "sheetWidth": 1220, "blanksAlong": 5, "sheetLength": 3660, "totalBlanks": 20, "utilization": 90.1639344262295, "blanksAcross": 4, "leftoverArea": 439200, "leftoverWidth": 0, "material_type": "MS", "primaryBlanks": 20, "leftoverLength": 360, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 9.836065573770497, "usedArea": 4026000, "direction": "HORIZONTAL", "efficiency": 90.1639344262295, "sheetWidth": 1220, "blanksAlong": 5, "sheetLength": 3660, "totalBlanks": 20, "utilization": 90.1639344262295, "blanksAcross": 4, "leftoverArea": 439200, "leftoverWidth": 0, "material_type": "SS", "primaryBlanks": 20, "leftoverLength": 360, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.442622950819668, "usedArea": 4026000, "direction": "HORIZONTAL", "efficiency": 86.55737704918033, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 20, "utilization": 86.55737704918033, "blanksAcross": 5, "leftoverArea": 625250, "leftoverWidth": 0, "material_type": "MS", "primaryBlanks": 20, "leftoverLength": 410, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.442622950819668, "usedArea": 4026000, "direction": "VERTICAL", "efficiency": 86.55737704918033, "sheetWidth": 1525, "blanksAlong": 10, "sheetLength": 3050, "totalBlanks": 20, "utilization": 86.55737704918033, "blanksAcross": 2, "leftoverArea": 625250, "leftoverWidth": 205, "material_type": "MS", "primaryBlanks": 20, "leftoverLength": 0, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.85245901639344, "usedArea": 2415600, "direction": "HORIZONTAL", "efficiency": 81.14754098360656, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 12, "utilization": 81.14754098360656, "blanksAcross": 4, "leftoverArea": 561200, "leftoverWidth": 0, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 460, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.85245901639344, "usedArea": 2415600, "direction": "HORIZONTAL", "efficiency": 81.14754098360656, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 12, "utilization": 81.14754098360656, "blanksAcross": 4, "leftoverArea": 561200, "leftoverWidth": 0, "material_type": "SS", "primaryBlanks": 12, "leftoverLength": 460, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.85245901639344, "usedArea": 2415600, "direction": "HORIZONTAL", "efficiency": 81.14754098360656, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 12, "utilization": 81.14754098360656, "blanksAcross": 4, "leftoverArea": 561200, "leftoverWidth": 0, "material_type": "GI", "primaryBlanks": 12, "leftoverLength": 460, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.90163934426229, "usedArea": 2415600, "direction": "VERTICAL", "efficiency": 54.09836065573771, "sheetWidth": 1220, "blanksAlong": 12, "sheetLength": 3660, "totalBlanks": 12, "utilization": 54.09836065573771, "blanksAcross": 1, "leftoverArea": 2049600, "leftoverWidth": 560, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 0, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.90163934426229, "usedArea": 2415600, "direction": "VERTICAL", "efficiency": 54.09836065573771, "sheetWidth": 1220, "blanksAlong": 12, "sheetLength": 3660, "totalBlanks": 12, "utilization": 54.09836065573771, "blanksAcross": 1, "leftoverArea": 2049600, "leftoverWidth": 560, "material_type": "SS", "primaryBlanks": 12, "leftoverLength": 0, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.90163934426229, "usedArea": 1610400, "direction": "VERTICAL", "efficiency": 54.09836065573771, "sheetWidth": 1220, "blanksAlong": 8, "sheetLength": 2440, "totalBlanks": 8, "utilization": 54.09836065573771, "blanksAcross": 1, "leftoverArea": 1366400, "leftoverWidth": 560, "material_type": "MS", "primaryBlanks": 8, "leftoverLength": 0, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.90163934426229, "usedArea": 1610400, "direction": "VERTICAL", "efficiency": 54.09836065573771, "sheetWidth": 1220, "blanksAlong": 8, "sheetLength": 2440, "totalBlanks": 8, "utilization": 54.09836065573771, "blanksAcross": 1, "leftoverArea": 1366400, "leftoverWidth": 560, "material_type": "SS", "primaryBlanks": 8, "leftoverLength": 0, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.90163934426229, "usedArea": 1610400, "direction": "VERTICAL", "efficiency": 54.09836065573771, "sheetWidth": 1220, "blanksAlong": 8, "sheetLength": 2440, "totalBlanks": 8, "utilization": 54.09836065573771, "blanksAcross": 1, "leftoverArea": 1366400, "leftoverWidth": 560, "material_type": "GI", "primaryBlanks": 8, "leftoverLength": 0, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-26 17:28:42.433678	current_user
861a02e5-f96c-44e6-b0dc-106912193339	dfc0cd3f-c8fc-4ba9-91a2-4cce112cffe4	\N	30	90	3	1	0.06358499999999999	0.06358499999999999	HORIZONTAL	1525	3050	1650	0	1650	104.91524999999999	95.7807041117979	4.2192958882020974	95.7807041117979	196250	25	80	f	{"scrap": 4.2192958882020974, "usedArea": 4455000, "direction": "HORIZONTAL", "efficiency": 95.7807041117979, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 1650, "utilization": 95.7807041117979, "blanksAcross": 50, "leftoverArea": 196250, "leftoverWidth": 25, "material_type": "MS", "primaryBlanks": 1650, "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 6.19295888202096, "usedArea": 4363200, "direction": "VERTICAL", "efficiency": 93.80704111797904, "sheetWidth": 1525, "blanksAlong": 101, "sheetLength": 3050, "totalBlanks": 1616, "utilization": 93.80704111797904, "blanksAcross": 16, "leftoverArea": 288050, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 1616, "leftoverLength": 20, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 4.2192958882020974, "usedArea": 4455000, "direction": "HORIZONTAL", "efficiency": 95.7807041117979, "sheetWidth": 1525, "blanksAlong": 33, "sheetLength": 3050, "totalBlanks": 1650, "utilization": 95.7807041117979, "blanksAcross": 50, "leftoverArea": 196250, "leftoverWidth": 25, "material_type": "MS", "primaryBlanks": 1650, "leftoverLength": 80, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 6.19295888202096, "usedArea": 4363200, "direction": "VERTICAL", "efficiency": 93.80704111797904, "sheetWidth": 1525, "blanksAlong": 101, "sheetLength": 3050, "totalBlanks": 1616, "utilization": 93.80704111797904, "blanksAcross": 16, "leftoverArea": 288050, "leftoverWidth": 85, "material_type": "MS", "primaryBlanks": 1616, "leftoverLength": 20, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 3.2518140284869617, "usedArea": 4320000, "direction": "HORIZONTAL", "efficiency": 96.74818597151304, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 1600, "utilization": 96.74818597151304, "blanksAcross": 40, "leftoverArea": 145200, "leftoverWidth": 20, "material_type": "MS", "primaryBlanks": 1600, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 3.2518140284869617, "usedArea": 4320000, "direction": "HORIZONTAL", "efficiency": 96.74818597151304, "sheetWidth": 1220, "blanksAlong": 40, "sheetLength": 3660, "totalBlanks": 1600, "utilization": 96.74818597151304, "blanksAcross": 40, "leftoverArea": 145200, "leftoverWidth": 20, "material_type": "SS", "primaryBlanks": 1600, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 4.098360655737707, "usedArea": 4282200, "direction": "VERTICAL", "efficiency": 95.90163934426229, "sheetWidth": 1220, "blanksAlong": 122, "sheetLength": 3660, "totalBlanks": 1586, "utilization": 95.90163934426229, "blanksAcross": 13, "leftoverArea": 183000, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 1586, "leftoverLength": 0, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 4.098360655737707, "usedArea": 4282200, "direction": "VERTICAL", "efficiency": 95.90163934426229, "sheetWidth": 1220, "blanksAlong": 122, "sheetLength": 3660, "totalBlanks": 1586, "utilization": 95.90163934426229, "blanksAcross": 13, "leftoverArea": 183000, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 1586, "leftoverLength": 0, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 2.0424617038430597, "usedArea": 2916000, "direction": "HORIZONTAL", "efficiency": 97.95753829615694, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 1080, "utilization": 97.95753829615694, "blanksAcross": 40, "leftoverArea": 60800, "leftoverWidth": 20, "material_type": "MS", "primaryBlanks": 1080, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 2.0424617038430597, "usedArea": 2916000, "direction": "HORIZONTAL", "efficiency": 97.95753829615694, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 1080, "utilization": 97.95753829615694, "blanksAcross": 40, "leftoverArea": 60800, "leftoverWidth": 20, "material_type": "SS", "primaryBlanks": 1080, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 2.0424617038430597, "usedArea": 2916000, "direction": "HORIZONTAL", "efficiency": 97.95753829615694, "sheetWidth": 1220, "blanksAlong": 27, "sheetLength": 2440, "totalBlanks": 1080, "utilization": 97.95753829615694, "blanksAcross": 40, "leftoverArea": 60800, "leftoverWidth": 20, "material_type": "GI", "primaryBlanks": 1080, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 81, "sheetLength": 2440, "totalBlanks": 1053, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "MS", "primaryBlanks": 1053, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 81, "sheetLength": 2440, "totalBlanks": 1053, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "SS", "primaryBlanks": 1053, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 4.491400161246972, "usedArea": 2843100, "direction": "VERTICAL", "efficiency": 95.50859983875303, "sheetWidth": 1220, "blanksAlong": 81, "sheetLength": 2440, "totalBlanks": 1053, "utilization": 95.50859983875303, "blanksAcross": 13, "leftoverArea": 133700, "leftoverWidth": 50, "material_type": "GI", "primaryBlanks": 1053, "leftoverLength": 10, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-26 17:29:48.131606	current_user
8b781479-2b29-4be4-92ec-e9da63884405	40bdd4ed-3256-48df-8d3d-28bc5719a0b3	\N	170	760	2.5	1	2.5355499999999997	2.5355499999999997	VERTICAL	1525	3050	34	0	34	86.2087	94.44342918570277	5.556570814297231	94.44342918570277	258450	5	160	f	{"scrap": 11.112066648750343, "usedArea": 4134400, "direction": "HORIZONTAL", "efficiency": 88.88793335124966, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.88793335124966, "blanksAcross": 8, "leftoverArea": 516850, "leftoverWidth": 165, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 5.556570814297231, "usedArea": 4392800, "direction": "VERTICAL", "efficiency": 94.44342918570277, "sheetWidth": 1525, "blanksAlong": 17, "sheetLength": 3050, "totalBlanks": 34, "utilization": 94.44342918570277, "blanksAcross": 2, "leftoverArea": 258450, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 34, "leftoverLength": 160, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 5.556570814297231, "usedArea": 4392800, "direction": "VERTICAL", "efficiency": 94.44342918570277, "sheetWidth": 1525, "blanksAlong": 17, "sheetLength": 3050, "totalBlanks": 34, "utilization": 94.44342918570277, "blanksAcross": 2, "leftoverArea": 258450, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 34, "leftoverLength": 160, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 11.112066648750343, "usedArea": 4134400, "direction": "HORIZONTAL", "efficiency": 88.88793335124966, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.88793335124966, "blanksAcross": 8, "leftoverArea": 516850, "leftoverWidth": 165, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.982352414225574, "usedArea": 3617600, "direction": "HORIZONTAL", "efficiency": 81.01764758577443, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 28, "utilization": 81.01764758577443, "blanksAcross": 7, "leftoverArea": 847600, "leftoverWidth": 30, "material_type": "MS", "primaryBlanks": 28, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.982352414225574, "usedArea": 3617600, "direction": "HORIZONTAL", "efficiency": 81.01764758577443, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 28, "utilization": 81.01764758577443, "blanksAcross": 7, "leftoverArea": 847600, "leftoverWidth": 30, "material_type": "SS", "primaryBlanks": 28, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "MS", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "SS", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "GI", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 2713200, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 21, "sheetLength": 3660, "totalBlanks": 21, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1752000, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 21, "leftoverLength": 90, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 2713200, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 21, "sheetLength": 3660, "totalBlanks": 21, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1752000, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 21, "leftoverLength": 90, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "GI", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-10-27 11:35:53.279766	current_user
b3b3e025-313a-48cf-9465-82ed26bdbe3a	04c6b03d-d2e6-4c61-a6b7-d669e60d5acf	\N	700	903	3	1	14.885955	14.885955	HORIZONTAL	1525	3050	6	0	6	89.31573	81.53937113679119	18.46062886320881	81.53937113679119	858650	125	341	t	{"scrap": 18.46062886320881, "usedArea": 3792600, "direction": "HORIZONTAL", "efficiency": 81.53937113679119, "sheetWidth": 1525, "blanksAlong": 3, "sheetLength": 3050, "totalBlanks": 6, "utilization": 81.53937113679119, "blanksAcross": 2, "leftoverArea": 858650, "leftoverWidth": 125, "material_type": "MS", "primaryBlanks": 6, "leftoverLength": 341, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 45.64041924213921, "usedArea": 2528400, "direction": "VERTICAL", "efficiency": 54.35958075786079, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 4, "utilization": 54.35958075786079, "blanksAcross": 1, "leftoverArea": 2122850, "leftoverWidth": 622, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 250, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 18.46062886320881, "usedArea": 3792600, "direction": "HORIZONTAL", "efficiency": 81.53937113679119, "sheetWidth": 1525, "blanksAlong": 3, "sheetLength": 3050, "totalBlanks": 6, "utilization": 81.53937113679119, "blanksAcross": 2, "leftoverArea": 858650, "leftoverWidth": 125, "material_type": "MS", "primaryBlanks": 6, "leftoverLength": 341, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 29.219295888202097, "usedArea": 3160500, "direction": "VERTICAL", "efficiency": 70.7807041117979, "sheetWidth": 1220, "blanksAlong": 5, "sheetLength": 3660, "totalBlanks": 5, "utilization": 70.7807041117979, "blanksAcross": 1, "leftoverArea": 1304700, "leftoverWidth": 317, "material_type": "MS", "primaryBlanks": 5, "leftoverLength": 160, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 29.219295888202097, "usedArea": 3160500, "direction": "VERTICAL", "efficiency": 70.7807041117979, "sheetWidth": 1220, "blanksAlong": 5, "sheetLength": 3660, "totalBlanks": 5, "utilization": 70.7807041117979, "blanksAcross": 1, "leftoverArea": 1304700, "leftoverWidth": 317, "material_type": "SS", "primaryBlanks": 5, "leftoverLength": 160, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 43.37543671056168, "usedArea": 2528400, "direction": "HORIZONTAL", "efficiency": 56.62456328943832, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 4, "utilization": 56.62456328943832, "blanksAcross": 1, "leftoverArea": 1936800, "leftoverWidth": 520, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 48, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 43.37543671056168, "usedArea": 2528400, "direction": "HORIZONTAL", "efficiency": 56.62456328943832, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 4, "utilization": 56.62456328943832, "blanksAcross": 1, "leftoverArea": 1936800, "leftoverWidth": 520, "material_type": "SS", "primaryBlanks": 4, "leftoverLength": 48, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 45.64041924213921, "usedArea": 2528400, "direction": "VERTICAL", "efficiency": 54.35958075786079, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 4, "utilization": 54.35958075786079, "blanksAcross": 1, "leftoverArea": 2122850, "leftoverWidth": 622, "material_type": "MS", "primaryBlanks": 4, "leftoverLength": 250, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 36.297366299381885, "usedArea": 1896300, "direction": "VERTICAL", "efficiency": 63.702633700618115, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 63.702633700618115, "blanksAcross": 1, "leftoverArea": 1080500, "leftoverWidth": 317, "material_type": "MS", "primaryBlanks": 3, "leftoverLength": 340, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 36.297366299381885, "usedArea": 1896300, "direction": "VERTICAL", "efficiency": 63.702633700618115, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 63.702633700618115, "blanksAcross": 1, "leftoverArea": 1080500, "leftoverWidth": 317, "material_type": "SS", "primaryBlanks": 3, "leftoverLength": 340, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 36.297366299381885, "usedArea": 1896300, "direction": "VERTICAL", "efficiency": 63.702633700618115, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 3, "utilization": 63.702633700618115, "blanksAcross": 1, "leftoverArea": 1080500, "leftoverWidth": 317, "material_type": "GI", "primaryBlanks": 3, "leftoverLength": 340, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 57.531577532921254, "usedArea": 1264200, "direction": "HORIZONTAL", "efficiency": 42.468422467078746, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 2, "utilization": 42.468422467078746, "blanksAcross": 1, "leftoverArea": 1712600, "leftoverWidth": 520, "material_type": "MS", "primaryBlanks": 2, "leftoverLength": 634, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 57.531577532921254, "usedArea": 1264200, "direction": "HORIZONTAL", "efficiency": 42.468422467078746, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 2, "utilization": 42.468422467078746, "blanksAcross": 1, "leftoverArea": 1712600, "leftoverWidth": 520, "material_type": "SS", "primaryBlanks": 2, "leftoverLength": 634, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 57.531577532921254, "usedArea": 1264200, "direction": "HORIZONTAL", "efficiency": 42.468422467078746, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 2, "utilization": 42.468422467078746, "blanksAcross": 1, "leftoverArea": 1712600, "leftoverWidth": 520, "material_type": "GI", "primaryBlanks": 2, "leftoverLength": 634, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-11-03 08:44:33.890914	current_user
341fee7a-163d-4585-b0cc-ee19987b5715	586b9ee3-8e53-44fe-9faa-282854a54965	\N	358	903	3	1	7.6131027	7.6131027	HORIZONTAL	1220	3660	12	0	12	91.3572324	86.87825853265251	13.12174146734749	86.87825853265251	585912	146	48	f	{"scrap": 13.12174146734749, "usedArea": 3879288, "direction": "HORIZONTAL", "efficiency": 86.87825853265251, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 12, "utilization": 86.87825853265251, "blanksAcross": 3, "leftoverArea": 585912, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 48, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 27.601451222789578, "usedArea": 3232740, "direction": "VERTICAL", "efficiency": 72.39854877721042, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 10, "utilization": 72.39854877721042, "blanksAcross": 1, "leftoverArea": 1232460, "leftoverWidth": 317, "material_type": "MS", "primaryBlanks": 10, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 13.12174146734749, "usedArea": 3879288, "direction": "HORIZONTAL", "efficiency": 86.87825853265251, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 12, "utilization": 86.87825853265251, "blanksAcross": 3, "leftoverArea": 585912, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 48, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.12174146734749, "usedArea": 3879288, "direction": "HORIZONTAL", "efficiency": 86.87825853265251, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 12, "utilization": 86.87825853265251, "blanksAcross": 3, "leftoverArea": 585912, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 12, "leftoverLength": 48, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 16.59687180865359, "usedArea": 3879288, "direction": "HORIZONTAL", "efficiency": 83.40312819134641, "sheetWidth": 1525, "blanksAlong": 3, "sheetLength": 3050, "totalBlanks": 12, "utilization": 83.40312819134641, "blanksAcross": 4, "leftoverArea": 771962, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 341, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 27.601451222789578, "usedArea": 3232740, "direction": "VERTICAL", "efficiency": 72.39854877721042, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 10, "utilization": 72.39854877721042, "blanksAcross": 1, "leftoverArea": 1232460, "leftoverWidth": 317, "material_type": "MS", "primaryBlanks": 10, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 27.601451222789578, "usedArea": 3232740, "direction": "VERTICAL", "efficiency": 72.39854877721042, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 10, "utilization": 72.39854877721042, "blanksAcross": 1, "leftoverArea": 1232460, "leftoverWidth": 317, "material_type": "SS", "primaryBlanks": 10, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 44.39791453910239, "usedArea": 2586192, "direction": "VERTICAL", "efficiency": 55.60208546089761, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 8, "utilization": 55.60208546089761, "blanksAcross": 1, "leftoverArea": 2065058, "leftoverWidth": 622, "material_type": "MS", "primaryBlanks": 8, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.84130610051062, "usedArea": 1939644, "direction": "HORIZONTAL", "efficiency": 65.15869389948938, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 6, "utilization": 65.15869389948938, "blanksAcross": 3, "leftoverArea": 1037156, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 6, "leftoverLength": 634, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.84130610051062, "usedArea": 1939644, "direction": "VERTICAL", "efficiency": 65.15869389948938, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 6, "utilization": 65.15869389948938, "blanksAcross": 1, "leftoverArea": 1037156, "leftoverWidth": 317, "material_type": "MS", "primaryBlanks": 6, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.84130610051062, "usedArea": 1939644, "direction": "HORIZONTAL", "efficiency": 65.15869389948938, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 6, "utilization": 65.15869389948938, "blanksAcross": 3, "leftoverArea": 1037156, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 6, "leftoverLength": 634, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.84130610051062, "usedArea": 1939644, "direction": "VERTICAL", "efficiency": 65.15869389948938, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 6, "utilization": 65.15869389948938, "blanksAcross": 1, "leftoverArea": 1037156, "leftoverWidth": 317, "material_type": "SS", "primaryBlanks": 6, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.84130610051062, "usedArea": 1939644, "direction": "HORIZONTAL", "efficiency": 65.15869389948938, "sheetWidth": 1220, "blanksAlong": 2, "sheetLength": 2440, "totalBlanks": 6, "utilization": 65.15869389948938, "blanksAcross": 3, "leftoverArea": 1037156, "leftoverWidth": 146, "material_type": "GI", "primaryBlanks": 6, "leftoverLength": 634, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 34.84130610051062, "usedArea": 1939644, "direction": "VERTICAL", "efficiency": 65.15869389948938, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 6, "utilization": 65.15869389948938, "blanksAcross": 1, "leftoverArea": 1037156, "leftoverWidth": 317, "material_type": "GI", "primaryBlanks": 6, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-11-03 08:45:28.974031	current_user
7816b527-c7a9-499d-a2d7-985810c11266	3f004986-4bf2-45b8-a12d-886e6bd9b6e1	\N	358	358	3	1	3.0182621999999997	3.0182621999999997	HORIZONTAL	1525	3050	32	0	32	96.58439039999999	88.17517871539908	11.824821284600915	88.17517871539908	550002	93	186	f	{"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "HORIZONTAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "VERTICAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "HORIZONTAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "VERTICAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "HORIZONTAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "VERTICAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "HORIZONTAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "VERTICAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "HORIZONTAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "VERTICAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "HORIZONTAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "VERTICAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "HORIZONTAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "GI", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "VERTICAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "GI", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-11-03 08:47:00.343724	current_user
a9ae121a-5d0f-44a1-b632-d33ea0f3d014	f80c6f72-fd08-4a9b-8a41-eadff822e9df	\N	358	358	3	1	3.0182621999999997	3.0182621999999997	HORIZONTAL	1525	3050	32	0	32	96.58439039999999	88.17517871539908	11.824821284600915	88.17517871539908	550002	93	186	f	{"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "HORIZONTAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "VERTICAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "HORIZONTAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 11.824821284600915, "usedArea": 4101248, "direction": "VERTICAL", "efficiency": 88.17517871539908, "sheetWidth": 1525, "blanksAlong": 8, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.17517871539908, "blanksAcross": 4, "leftoverArea": 550002, "leftoverWidth": 93, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 186, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "HORIZONTAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "VERTICAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "HORIZONTAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 13.891427035743078, "usedArea": 3844920, "direction": "VERTICAL", "efficiency": 86.10857296425692, "sheetWidth": 1220, "blanksAlong": 10, "sheetLength": 3660, "totalBlanks": 30, "utilization": 86.10857296425692, "blanksAcross": 3, "leftoverArea": 620280, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 30, "leftoverLength": 80, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "HORIZONTAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "VERTICAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "MS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "HORIZONTAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "VERTICAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "SS", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "HORIZONTAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "GI", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 22.50228433216877, "usedArea": 2306952, "direction": "VERTICAL", "efficiency": 77.49771566783123, "sheetWidth": 1220, "blanksAlong": 6, "sheetLength": 2440, "totalBlanks": 18, "utilization": 77.49771566783123, "blanksAcross": 3, "leftoverArea": 669848, "leftoverWidth": 146, "material_type": "GI", "primaryBlanks": 18, "leftoverLength": 292, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-11-03 08:48:32.698811	current_user
cdc827a6-55f3-492c-bdfa-dc29d4e3353e	c6802e95-80b3-4482-944c-61af536610ee	\N	170	760	2.5	1	2.5355499999999997	2.5355499999999997	VERTICAL	1525	3050	34	0	34	86.2087	94.44342918570277	5.556570814297231	94.44342918570277	258450	5	160	f	{"scrap": 11.112066648750343, "usedArea": 4134400, "direction": "HORIZONTAL", "efficiency": 88.88793335124966, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.88793335124966, "blanksAcross": 8, "leftoverArea": 516850, "leftoverWidth": 165, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 5.556570814297231, "usedArea": 4392800, "direction": "VERTICAL", "efficiency": 94.44342918570277, "sheetWidth": 1525, "blanksAlong": 17, "sheetLength": 3050, "totalBlanks": 34, "utilization": 94.44342918570277, "blanksAcross": 2, "leftoverArea": 258450, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 34, "leftoverLength": 160, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 5.556570814297231, "usedArea": 4392800, "direction": "VERTICAL", "efficiency": 94.44342918570277, "sheetWidth": 1525, "blanksAlong": 17, "sheetLength": 3050, "totalBlanks": 34, "utilization": 94.44342918570277, "blanksAcross": 2, "leftoverArea": 258450, "leftoverWidth": 5, "material_type": "MS", "primaryBlanks": 34, "leftoverLength": 160, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 11.112066648750343, "usedArea": 4134400, "direction": "HORIZONTAL", "efficiency": 88.88793335124966, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 32, "utilization": 88.88793335124966, "blanksAcross": 8, "leftoverArea": 516850, "leftoverWidth": 165, "material_type": "MS", "primaryBlanks": 32, "leftoverLength": 10, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.982352414225574, "usedArea": 3617600, "direction": "HORIZONTAL", "efficiency": 81.01764758577443, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 28, "utilization": 81.01764758577443, "blanksAcross": 7, "leftoverArea": 847600, "leftoverWidth": 30, "material_type": "MS", "primaryBlanks": 28, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 18.982352414225574, "usedArea": 3617600, "direction": "HORIZONTAL", "efficiency": 81.01764758577443, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 28, "utilization": 81.01764758577443, "blanksAcross": 7, "leftoverArea": 847600, "leftoverWidth": 30, "material_type": "SS", "primaryBlanks": 28, "leftoverLength": 620, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "MS", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "SS", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 8.85514646600376, "usedArea": 2713200, "direction": "HORIZONTAL", "efficiency": 91.14485353399624, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 21, "utilization": 91.14485353399624, "blanksAcross": 7, "leftoverArea": 263600, "leftoverWidth": 30, "material_type": "GI", "primaryBlanks": 21, "leftoverLength": 160, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 2713200, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 21, "sheetLength": 3660, "totalBlanks": 21, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1752000, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 21, "leftoverLength": 90, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 2713200, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 21, "sheetLength": 3660, "totalBlanks": 21, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1752000, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 21, "leftoverLength": 90, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "MS", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "SS", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.23676431066917, "usedArea": 1808800, "direction": "VERTICAL", "efficiency": 60.76323568933083, "sheetWidth": 1220, "blanksAlong": 14, "sheetLength": 2440, "totalBlanks": 14, "utilization": 60.76323568933083, "blanksAcross": 1, "leftoverArea": 1168000, "leftoverWidth": 460, "material_type": "GI", "primaryBlanks": 14, "leftoverLength": 60, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-12-22 18:05:28.169175	current_user
4f5bc967-f44f-4194-8c51-5495bab2182e	3a30bac3-dac4-480d-a7b6-c811a6fc56a6	\N	200	750	2.5	1	2.9437499999999996	2.9437499999999996	VERTICAL	1525	3050	30	0	30	88.31249999999999	96.74818597151304	3.2518140284869617	96.74818597151304	151250	25	50	f	{"scrap": 9.701693093254505, "usedArea": 4200000, "direction": "HORIZONTAL", "efficiency": 90.2983069067455, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 28, "utilization": 90.2983069067455, "blanksAcross": 7, "leftoverArea": 451250, "leftoverWidth": 125, "material_type": "MS", "primaryBlanks": 28, "leftoverLength": 50, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	{"scrap": 3.2518140284869617, "usedArea": 4500000, "direction": "VERTICAL", "efficiency": 96.74818597151304, "sheetWidth": 1525, "blanksAlong": 15, "sheetLength": 3050, "totalBlanks": 30, "utilization": 96.74818597151304, "blanksAcross": 2, "leftoverArea": 151250, "leftoverWidth": 25, "material_type": "MS", "primaryBlanks": 30, "leftoverLength": 50, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}	[{"scrap": 3.2518140284869617, "usedArea": 4500000, "direction": "VERTICAL", "efficiency": 96.74818597151304, "sheetWidth": 1525, "blanksAlong": 15, "sheetLength": 3050, "totalBlanks": 30, "utilization": 96.74818597151304, "blanksAcross": 2, "leftoverArea": 151250, "leftoverWidth": 25, "material_type": "MS", "primaryBlanks": 30, "leftoverLength": 50, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 9.701693093254505, "usedArea": 4200000, "direction": "HORIZONTAL", "efficiency": 90.2983069067455, "sheetWidth": 1525, "blanksAlong": 4, "sheetLength": 3050, "totalBlanks": 28, "utilization": 90.2983069067455, "blanksAcross": 7, "leftoverArea": 451250, "leftoverWidth": 125, "material_type": "MS", "primaryBlanks": 28, "leftoverLength": 50, "totalSheetArea": 4651250, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 19.376511690405806, "usedArea": 3600000, "direction": "HORIZONTAL", "efficiency": 80.6234883095942, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 24, "utilization": 80.6234883095942, "blanksAcross": 6, "leftoverArea": 865200, "leftoverWidth": 20, "material_type": "MS", "primaryBlanks": 24, "leftoverLength": 660, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 19.376511690405806, "usedArea": 3600000, "direction": "HORIZONTAL", "efficiency": 80.6234883095942, "sheetWidth": 1220, "blanksAlong": 4, "sheetLength": 3660, "totalBlanks": 24, "utilization": 80.6234883095942, "blanksAcross": 6, "leftoverArea": 865200, "leftoverWidth": 20, "material_type": "SS", "primaryBlanks": 24, "leftoverLength": 660, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 9.298575651706528, "usedArea": 2700000, "direction": "HORIZONTAL", "efficiency": 90.70142434829347, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 18, "utilization": 90.70142434829347, "blanksAcross": 6, "leftoverArea": 276800, "leftoverWidth": 20, "material_type": "MS", "primaryBlanks": 18, "leftoverLength": 190, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 9.298575651706528, "usedArea": 2700000, "direction": "HORIZONTAL", "efficiency": 90.70142434829347, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 18, "utilization": 90.70142434829347, "blanksAcross": 6, "leftoverArea": 276800, "leftoverWidth": 20, "material_type": "SS", "primaryBlanks": 18, "leftoverLength": 190, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 9.298575651706528, "usedArea": 2700000, "direction": "HORIZONTAL", "efficiency": 90.70142434829347, "sheetWidth": 1220, "blanksAlong": 3, "sheetLength": 2440, "totalBlanks": 18, "utilization": 90.70142434829347, "blanksAcross": 6, "leftoverArea": 276800, "leftoverWidth": 20, "material_type": "GI", "primaryBlanks": 18, "leftoverLength": 190, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.532383767804355, "usedArea": 2700000, "direction": "VERTICAL", "efficiency": 60.467616232195645, "sheetWidth": 1220, "blanksAlong": 18, "sheetLength": 3660, "totalBlanks": 18, "utilization": 60.467616232195645, "blanksAcross": 1, "leftoverArea": 1765200, "leftoverWidth": 470, "material_type": "MS", "primaryBlanks": 18, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.532383767804355, "usedArea": 2700000, "direction": "VERTICAL", "efficiency": 60.467616232195645, "sheetWidth": 1220, "blanksAlong": 18, "sheetLength": 3660, "totalBlanks": 18, "utilization": 60.467616232195645, "blanksAcross": 1, "leftoverArea": 1765200, "leftoverWidth": 470, "material_type": "SS", "primaryBlanks": 18, "leftoverLength": 60, "totalSheetArea": 4465200, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.532383767804355, "usedArea": 1800000, "direction": "VERTICAL", "efficiency": 60.467616232195645, "sheetWidth": 1220, "blanksAlong": 12, "sheetLength": 2440, "totalBlanks": 12, "utilization": 60.467616232195645, "blanksAcross": 1, "leftoverArea": 1176800, "leftoverWidth": 470, "material_type": "MS", "primaryBlanks": 12, "leftoverLength": 40, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.532383767804355, "usedArea": 1800000, "direction": "VERTICAL", "efficiency": 60.467616232195645, "sheetWidth": 1220, "blanksAlong": 12, "sheetLength": 2440, "totalBlanks": 12, "utilization": 60.467616232195645, "blanksAcross": 1, "leftoverArea": 1176800, "leftoverWidth": 470, "material_type": "SS", "primaryBlanks": 12, "leftoverLength": 40, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}, {"scrap": 39.532383767804355, "usedArea": 1800000, "direction": "VERTICAL", "efficiency": 60.467616232195645, "sheetWidth": 1220, "blanksAlong": 12, "sheetLength": 2440, "totalBlanks": 12, "utilization": 60.467616232195645, "blanksAcross": 1, "leftoverArea": 1176800, "leftoverWidth": 470, "material_type": "GI", "primaryBlanks": 12, "leftoverLength": 40, "totalSheetArea": 2976800, "leftoverDetails": [], "extraBlanksFromLeftover": 0}]	MANUAL	2025-12-22 18:06:04.480102	current_user
\.


--
-- Data for Name: blank_spec; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.blank_spec (blank_id, product_id, width_mm, length_mm, thickness_mm, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, created_at, created_by, updated_at, consumption_pct, material_density, quantity, sub_assembly_name, total_blanks, sheet_width_mm, sheet_length_mm, material_type, cutting_direction, efficiency_pct, scrap_pct) FROM stdin;
21f8f97c-bc9c-4192-80f0-d6d06346644c	5cdef655-4cf2-400f-8609-189236cc9a8c	240	1010	2	3.81	11	90	4x8	3.81	2025-10-05 21:42:52.294	current_user	2025-10-05 21:42:52.294	90	7850	1	Main	41	\N	\N	\N	\N	\N	\N
7166b75c-f66f-4f81-8ac0-cfd9a8a86c0e	5cdef655-4cf2-400f-8609-189236cc9a8c	100	200	2.5	\N	\N	85	Steel Sheet	\N	2025-10-23 12:04:45.648	test_user	2025-10-23 12:04:45.648	\N	\N	1	Test Assembly	\N	\N	\N	\N	\N	\N	\N
2f8d572c-7ea4-4302-9be3-350596737668	5cdef655-4cf2-400f-8609-189236cc9a8c	150	300	3	\N	\N	80	Steel Sheet	\N	2025-10-23 12:14:50.825	test_user	2025-10-23 12:14:50.825	\N	\N	1	Main Assembly	\N	\N	\N	\N	\N	\N	\N
22aa10fb-4651-46f0-926a-cd6592e08127	d277d247-b962-4e69-a188-441a99fcab91	305	660	4	6.321	13	87.9	Custom	93.47	2025-10-26 17:28:42.37	current_user	2025-10-26 17:28:42.37	\N	7850	1	Main	75	\N	\N	\N	\N	\N	\N
dfc0cd3f-c8fc-4ba9-91a2-4cce112cffe4	d277d247-b962-4e69-a188-441a99fcab91	30	90	3	0.064	1080	98	Custom	70.1	2025-10-26 17:29:48.082	current_user	2025-10-26 17:29:48.082	\N	7850	1	Horn Bkt 	68	\N	\N	\N	\N	\N	\N
40bdd4ed-3256-48df-8d3d-28bc5719a0b3	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	170	760	2.5	2.536	21	91.1	Custom	58.42	2025-10-27 11:35:53.208	current_user	2025-10-27 11:35:53.208	\N	7850	1	MAIN	53	\N	\N	\N	\N	\N	\N
04c6b03d-d2e6-4c61-a6b7-d669e60d5acf	077b6e4a-a968-45e7-bff7-d3259f88eaea	700	903	3	14.886	3	63.7	Custom	70.1	2025-11-03 08:44:33.813	current_user	2025-11-03 08:44:33.813	\N	7850	1	Shell HRC	44	\N	\N	\N	\N	\N	\N
f80c6f72-fd08-4a9b-8a41-eadff822e9df	077b6e4a-a968-45e7-bff7-d3259f88eaea	358	358	3	3.018	18	77.5	Custom	70.1	2025-11-03 08:48:32.65	current_user	2025-11-03 08:48:32.65	\N	7850	1	Dish HRC	54	\N	\N	\N	\N	\N	\N
735c257a-23a5-4e37-8fc7-95194f0f7d7a	60712846-8225-4ceb-928f-d953792f4a26	299	299	3	1.654	32	75.5	Custom	\N	2025-11-03 11:47:23.59	current_user	2025-11-03 11:47:23.59	75.48	7850	1	Dish HRC	52	\N	\N	\N	\N	\N	\N
c6802e95-80b3-4482-944c-61af536610ee	e43c9a87-1fc4-44c4-a60d-aa469036bb89	170	760	2.5	2.536	21	91.1	Custom	58.42	2025-12-22 18:05:28.13	current_user	2025-12-22 18:05:28.13	\N	7850	1	HRC	53	\N	\N	\N	\N	\N	\N
3a30bac3-dac4-480d-a7b6-c811a6fc56a6	e43c9a87-1fc4-44c4-a60d-aa469036bb89	200	750	2.5	2.944	18	90.7	Custom	58.42	2025-12-22 18:06:04.457	current_user	2025-12-22 18:06:04.457	91	7850	1	Shell HRC	52	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: bom; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.bom (bom_id, product_id, material_id, quantity, created_at, is_optional, step_sequence, sub_assembly_name, uom_id, updated_at, item_type, reference_type, reference_id, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, substitution_priority, cost_impact_pct, quality_impact) FROM stdin;
19defb01-8d93-41a6-8a5b-7adc5f23b6c2	5cdef655-4cf2-400f-8609-189236cc9a8c	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1	2025-10-11 07:36:01.259	f	10	Main Assembly	\N	2025-10-11 07:36:01.259	CUT_PART	blank_spec	21f8f97c-bc9c-4192-80f0-d6d06346644c	Main	t	0.00	\N	v1.0	1	0.00	same
9bf98b89-6d61-4db7-ad8f-da64670f8bdc	5cdef655-4cf2-400f-8609-189236cc9a8c	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	4	2025-10-11 07:36:01.276	f	20	Hardware	\N	2025-10-11 07:36:01.276	BOUGHT_OUT	material	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	Steel Sheet 4x8 (Fastener)	f	0.00	\N	v1.0	1	0.00	same
a9deacbd-768f-4b07-b517-ca37e57ed7d6	5cdef655-4cf2-400f-8609-189236cc9a8c	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	0.05	2025-10-11 07:36:01.287	f	30	Consumables	\N	2025-10-11 07:36:01.287	CONSUMABLE	material	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	Welding Wire	f	0.00	\N	v1.0	1	0.00	same
bab4add5-1dbd-44d6-a9e1-c25cc75f6b76	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	cbd03a02-3157-499e-b763-35a2fe5e2baa	1	2025-10-11 10:57:43.909	f	\N		\N	2025-10-11 10:57:43.909	BOUGHT_OUT	MATERIAL	cbd03a02-3157-499e-b763-35a2fe5e2baa	Symentex Material	f	0.00	\N	v1.0	1	0.00	same
fdf65ac9-d034-4f5b-a675-3690aa6c5d10	5cdef655-4cf2-400f-8609-189236cc9a8c	cbd03a02-3157-499e-b763-35a2fe5e2baa	1	2025-10-23 11:01:45.406	f	10	symmentex	\N	2025-10-23 11:01:45.406	CONSUMABLE	MATERIAL	cbd03a02-3157-499e-b763-35a2fe5e2baa	Symentex Material	f	0.00	\N	v1.0	1	0.00	same
a0a1cd95-26cc-40ff-bc07-d7b4ed5c3a2f	d277d247-b962-4e69-a188-441a99fcab91	\N	1	2025-10-26 17:31:20.006	f	10	Main	\N	2025-10-26 17:31:20.006	CUT_PART	BLANK	22aa10fb-4651-46f0-926a-cd6592e08127	Main	f	0.00	CUT-01	v1.0	1	0.00	same
e9772f43-4ea8-48d1-b362-c17f23487fd4	d277d247-b962-4e69-a188-441a99fcab91	\N	2	2025-10-26 17:32:07.497	f	20	Horn	\N	2025-10-26 17:32:07.497	CUT_PART	BLANK	dfc0cd3f-c8fc-4ba9-91a2-4cce112cffe4	Horn Bkt 	f	0.00	CUT-02	v1.0	1	0.00	same
0c693619-8067-4fbc-8b5c-e6b81e4c4009	077b6e4a-a968-45e7-bff7-d3259f88eaea	509e4501-199b-409b-8fe2-2ff4f29b495c	0.1	2025-11-03 09:42:27.539	f	60	Paint	\N	2025-11-03 09:42:49.112	BOUGHT_OUT	MATERIAL	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	f	0.00	Paint	v1.0	1	0.00	same
be8e10a8-b69d-40b2-b810-24b88fcc1311	077b6e4a-a968-45e7-bff7-d3259f88eaea	c28c0713-ad11-4a51-9d99-2c15196ba76b	0.29	2025-11-07 18:21:26.731	f	60	Welding Wire	\N	2025-11-07 18:21:26.731	BOUGHT_OUT	MATERIAL	c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire Ø1.2	f	0.00	welding	v1.0	1	0.00	same
41a2826d-b594-4ea1-bc2e-9dbc3ab1125e	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	6d389b17-3618-4d85-9c2c-a973a2a62279	2	2025-10-27 11:40:17.043	f	10	Main Assembly 	\N	2025-10-30 17:18:23.17	CUT_PART	BLANK	40bdd4ed-3256-48df-8d3d-28bc5719a0b3	MAIN	f	0.00	CUT	v1.0	1	0.00	same
9d9b3c78-1555-42ec-a36b-0b9980607f8d	077b6e4a-a968-45e7-bff7-d3259f88eaea	6d389b17-3618-4d85-9c2c-a973a2a62279	1	2025-11-03 08:51:44.79	f	10	Shell	\N	2025-11-03 08:51:44.79	CUT_PART	BLANK	04c6b03d-d2e6-4c61-a6b7-d669e60d5acf	Shell HRC	f	0.00	CUT	v1.0	1	0.00	same
92bab038-5e00-4444-8ec5-717a89a3407c	077b6e4a-a968-45e7-bff7-d3259f88eaea	6d389b17-3618-4d85-9c2c-a973a2a62279	3	2025-11-03 08:52:37.786	f	20	Dish	\N	2025-11-03 08:52:37.786	CUT_PART	BLANK	f80c6f72-fd08-4a9b-8a41-eadff822e9df	Dish HRC	f	0.00	CUT	v1.0	1	0.00	same
81cb98bd-db9a-4c37-91c1-8565e71d0f17	077b6e4a-a968-45e7-bff7-d3259f88eaea	dc604e33-9302-4f82-9c81-9afd572a603f	14	2025-11-03 08:56:57.335	f	30	Shaft	\N	2025-11-03 08:56:57.335	BOUGHT_OUT	MATERIAL	dc604e33-9302-4f82-9c81-9afd572a603f	rod	f	0.00	WELD	v1.0	1	0.00	same
aed05fa4-363f-4e37-b952-514c12f92dad	077b6e4a-a968-45e7-bff7-d3259f88eaea	0f126f28-ce5d-48c3-ab33-466a636f34cf	3	2025-11-03 09:36:07.908	f	40	Plastic Cap 1/4	\N	2025-11-03 09:36:07.908	BOUGHT_OUT	MATERIAL	0f126f28-ce5d-48c3-ab33-466a636f34cf	Plastic Cap 1/4	f	0.00	\N	v1.0	1	0.00	same
f456c782-15c1-4d8d-b681-2447ed767c04	077b6e4a-a968-45e7-bff7-d3259f88eaea	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	11	2025-11-03 09:36:41.054	f	50	Plastic Cap 3/8	\N	2025-11-03 09:36:41.054	BOUGHT_OUT	MATERIAL	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	Plastic Cap 3/8	f	0.00	\N	v1.0	1	0.00	same
7e18d793-7afe-4bdd-bccc-8d22914f380f	077b6e4a-a968-45e7-bff7-d3259f88eaea	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	0.2	2025-11-15 12:18:23.88	f	70	fuel	\N	2025-11-15 12:18:23.88	BOUGHT_OUT	MATERIAL	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	FUEL	f	0.00	\N	v1.0	1	0.00	same
ff759c9c-702d-4f4c-96a7-c5158a26eb84	e43c9a87-1fc4-44c4-a60d-aa469036bb89	bcc7d31a-2588-48d1-96a4-1decee97a274	3	2025-12-22 18:11:17.696	f	10	hrc main	\N	2025-12-22 18:11:46.592	CUT_PART	BLANK	3a30bac3-dac4-480d-a7b6-c811a6fc56a6	Shell HRC	f	0.00	\N	v1.0	1	0.00	same
73ff9284-d9bf-48c3-9e6d-4d5d2f58b119	e43c9a87-1fc4-44c4-a60d-aa469036bb89	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	12	2025-12-22 18:12:20.685	f	\N	steel Rod	\N	2025-12-22 18:12:20.685	BOUGHT_OUT	MATERIAL	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	Steel ROd	f	0.00	\N	v1.0	1	0.00	same
\.


--
-- Data for Name: bom_explosion_log; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.bom_explosion_log (explosion_id, sales_order_id, product_id, quantity, explosion_data, total_sheet_count, total_bought_items_count, total_consumables_count, total_material_cost, exploded_by, exploded_at) FROM stdin;
8a1509cb-0d48-4bcb-87a7-6caebc15d2e7	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	500.0000	{"summary": {"critical_items": 0, "total_cut_parts": 0, "total_bought_outs": 1, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 0}, "cut_parts": [], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "a135d85f-a95a-447a-83ef-a72ab3dbc185", "item_name": "Test Component", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 1000, "quantity_per_unit": 2, "required_quantity": 1000, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 500, "explosion_timestamp": "2025-10-11T07:05:39.680Z", "total_material_cost": 0}	0	1	0	0.00	test-user	2025-10-11 07:05:40.116807
000489ed-9f73-4210-b0e9-8eb6b7719598	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	500.0000	{"summary": {"critical_items": 0, "total_cut_parts": 0, "total_bought_outs": 1, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 0}, "cut_parts": [], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "a135d85f-a95a-447a-83ef-a72ab3dbc185", "item_name": "Test Component", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 1000, "quantity_per_unit": 2, "required_quantity": 1000, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 500, "explosion_timestamp": "2025-10-11T07:06:28.811Z", "total_material_cost": 0}	0	1	0	0.00	test-user	2025-10-11 07:06:29.207929
df2841a2-f0e2-4dfd-8762-f4ea7994911e	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	100.0000	{"summary": {"critical_items": 1, "total_cut_parts": 1, "total_bought_outs": 1, "total_consumables": 1, "total_material_cost": 0, "total_sheets_required": 10}, "cut_parts": [{"uom": null, "bom_id": "c08c8060-5c14-43a6-8514-3d474f599d29", "blank_id": "21f8f97c-bc9c-4192-80f0-d6d06346644c", "item_name": "Main", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×2", "total_cost": 0, "is_critical": true, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "extra_blanks": 10, "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "material_type": null, "pcs_per_sheet": 11, "efficiency_pct": 90, "operation_code": null, "scrap_quantity": 0, "total_quantity": 100, "blank_weight_kg": 3.81, "sheets_required": 10, "blank_dimensions": {"width_mm": 240, "length_mm": 1010, "thickness_mm": 2}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 2}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 100, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 110, "estimated_scrap_weight_kg": 0}], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "3ea9bb35-f1e2-47cf-8004-dcb2dc62ef27", "item_name": "Steel Sheet 4x8 (Fastener)", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 400, "quantity_per_unit": 4, "required_quantity": 400, "sub_assembly_name": "Hardware", "scrap_allowance_pct": "0.00"}], "consumables": [{"uom": null, "bom_id": "5360a83a-66b2-4317-b5ed-b2b0e77590ef", "item_name": "Welding Wire", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.05, "required_quantity": 5, "sub_assembly_name": "Consumables", "scrap_allowance_pct": "0.00"}], "sub_assemblies": [], "quantity_requested": 100, "explosion_timestamp": "2025-10-11T07:30:45.606Z", "total_material_cost": 0}	10	1	1	0.00	test-operator	2025-10-11 07:30:45.76697
b1f0ea62-cdeb-4055-98ee-478c7ed48742	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	100.0000	{"summary": {"critical_items": 1, "total_cut_parts": 1, "total_bought_outs": 1, "total_consumables": 1, "total_material_cost": 0, "total_sheets_required": 10}, "cut_parts": [{"uom": null, "bom_id": "537bde4d-a7cf-4d52-bca6-1b63e8c5025d", "blank_id": "21f8f97c-bc9c-4192-80f0-d6d06346644c", "item_name": "Main", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×2", "total_cost": 0, "is_critical": true, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "extra_blanks": 10, "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "material_type": null, "pcs_per_sheet": 11, "efficiency_pct": 90, "operation_code": null, "scrap_quantity": 0, "total_quantity": 100, "blank_weight_kg": 3.81, "sheets_required": 10, "blank_dimensions": {"width_mm": 240, "length_mm": 1010, "thickness_mm": 2}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 2}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 100, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 110, "estimated_scrap_weight_kg": 0}], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "09fce053-965c-4480-acc2-9ccc95a37f43", "item_name": "Steel Sheet 4x8 (Fastener)", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 400, "quantity_per_unit": 4, "required_quantity": 400, "sub_assembly_name": "Hardware", "scrap_allowance_pct": "0.00"}], "consumables": [{"uom": null, "bom_id": "dbcdf19b-518e-4ae0-be98-310c3bfd54b1", "item_name": "Welding Wire", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.05, "required_quantity": 5, "sub_assembly_name": "Consumables", "scrap_allowance_pct": "0.00"}], "sub_assemblies": [], "quantity_requested": 100, "explosion_timestamp": "2025-10-11T07:33:28.072Z", "total_material_cost": 0}	10	1	1	0.00	test-operator	2025-10-11 07:33:28.194135
f3d2a4bc-4bda-4415-8fe9-fdc084550a13	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	100.0000	{"summary": {"critical_items": 1, "total_cut_parts": 1, "total_bought_outs": 1, "total_consumables": 1, "total_material_cost": 0, "total_sheets_required": 10}, "cut_parts": [{"uom": null, "bom_id": "aef388a0-e305-4632-8bcd-23cbda83042d", "blank_id": "21f8f97c-bc9c-4192-80f0-d6d06346644c", "item_name": "Main", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×2", "total_cost": 0, "is_critical": true, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "extra_blanks": 10, "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "material_type": null, "pcs_per_sheet": 11, "efficiency_pct": 90, "operation_code": null, "scrap_quantity": 0, "total_quantity": 100, "blank_weight_kg": 3.81, "sheets_required": 10, "blank_dimensions": {"width_mm": 240, "length_mm": 1010, "thickness_mm": 2}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 2}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 100, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 110, "estimated_scrap_weight_kg": 0}], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "ede01735-9a67-4b81-8e7e-0442ef0c7ea3", "item_name": "Steel Sheet 4x8 (Fastener)", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 400, "quantity_per_unit": 4, "required_quantity": 400, "sub_assembly_name": "Hardware", "scrap_allowance_pct": "0.00"}], "consumables": [{"uom": null, "bom_id": "bf53d493-d214-4b3a-a012-75872b960635", "item_name": "Welding Wire", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.05, "required_quantity": 5, "sub_assembly_name": "Consumables", "scrap_allowance_pct": "0.00"}], "sub_assemblies": [], "quantity_requested": 100, "explosion_timestamp": "2025-10-11T07:34:42.003Z", "total_material_cost": 0}	10	1	1	0.00	test-operator	2025-10-11 07:34:42.038982
0ffc6bd8-9320-4cd2-b061-11524b70d7c8	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	100.0000	{"summary": {"critical_items": 1, "total_cut_parts": 1, "total_bought_outs": 1, "total_consumables": 1, "total_material_cost": 0, "total_sheets_required": 10}, "cut_parts": [{"uom": null, "bom_id": "e1b50cf7-db1a-4820-8a23-543fdbcdd73b", "blank_id": "21f8f97c-bc9c-4192-80f0-d6d06346644c", "item_name": "Main", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×2", "total_cost": 0, "is_critical": true, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "extra_blanks": 10, "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "material_type": null, "pcs_per_sheet": 11, "efficiency_pct": 90, "operation_code": null, "scrap_quantity": 0, "total_quantity": 100, "blank_weight_kg": 3.81, "sheets_required": 10, "blank_dimensions": {"width_mm": 240, "length_mm": 1010, "thickness_mm": 2}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 2}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 100, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 110, "estimated_scrap_weight_kg": 0}], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "28c1b554-525c-4240-b1ba-1c8bdb768449", "item_name": "Steel Sheet 4x8 (Fastener)", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 400, "quantity_per_unit": 4, "required_quantity": 400, "sub_assembly_name": "Hardware", "scrap_allowance_pct": "0.00"}], "consumables": [{"uom": null, "bom_id": "dbd222e3-9139-4262-b035-ddf80b19d716", "item_name": "Welding Wire", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.05, "required_quantity": 5, "sub_assembly_name": "Consumables", "scrap_allowance_pct": "0.00"}], "sub_assemblies": [], "quantity_requested": 100, "explosion_timestamp": "2025-10-11T07:35:15.492Z", "total_material_cost": 0}	10	1	1	0.00	test-operator	2025-10-11 07:35:15.517722
e04bf495-d925-4ac9-8a62-ba22133c84d0	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	100.0000	{"summary": {"critical_items": 1, "total_cut_parts": 1, "total_bought_outs": 1, "total_consumables": 1, "total_material_cost": 0, "total_sheets_required": 10}, "cut_parts": [{"uom": null, "bom_id": "c6793008-75fb-49c5-b19a-80e1075e9252", "blank_id": "21f8f97c-bc9c-4192-80f0-d6d06346644c", "item_name": "Main", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×2", "total_cost": 0, "is_critical": true, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "extra_blanks": 10, "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "material_type": null, "pcs_per_sheet": 11, "efficiency_pct": 90, "operation_code": null, "scrap_quantity": 0, "total_quantity": 100, "blank_weight_kg": 3.81, "sheets_required": 10, "blank_dimensions": {"width_mm": 240, "length_mm": 1010, "thickness_mm": 2}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 2}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 100, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 110, "estimated_scrap_weight_kg": 0}], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "a7bbdf74-ef5e-497c-9dcf-471edbd974b9", "item_name": "Steel Sheet 4x8 (Fastener)", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 400, "quantity_per_unit": 4, "required_quantity": 400, "sub_assembly_name": "Hardware", "scrap_allowance_pct": "0.00"}], "consumables": [{"uom": null, "bom_id": "dfc5a9f2-ea69-419d-a0fc-abfb37b80ac6", "item_name": "Welding Wire", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.05, "required_quantity": 5, "sub_assembly_name": "Consumables", "scrap_allowance_pct": "0.00"}], "sub_assemblies": [], "quantity_requested": 100, "explosion_timestamp": "2025-10-11T07:35:37.232Z", "total_material_cost": 0}	10	1	1	0.00	test-operator	2025-10-11 07:35:37.257864
7ba03970-d17b-4d8d-a09c-4c36ee74889d	\N	5cdef655-4cf2-400f-8609-189236cc9a8c	100.0000	{"summary": {"critical_items": 1, "total_cut_parts": 1, "total_bought_outs": 1, "total_consumables": 1, "total_material_cost": 0, "total_sheets_required": 10}, "cut_parts": [{"uom": null, "bom_id": "19defb01-8d93-41a6-8a5b-7adc5f23b6c2", "blank_id": "21f8f97c-bc9c-4192-80f0-d6d06346644c", "item_name": "Main", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×2", "total_cost": 0, "is_critical": true, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "extra_blanks": 10, "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "material_type": null, "pcs_per_sheet": 11, "efficiency_pct": 90, "operation_code": null, "scrap_quantity": 0, "total_quantity": 100, "blank_weight_kg": 3.81, "sheets_required": 10, "blank_dimensions": {"width_mm": 240, "length_mm": 1010, "thickness_mm": 2}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 2}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 100, "sub_assembly_name": "Main Assembly", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 110, "estimated_scrap_weight_kg": 0}], "product_id": "5cdef655-4cf2-400f-8609-189236cc9a8c", "bought_outs": [{"uom": null, "bom_id": "9bf98b89-6d61-4db7-ad8f-da64670f8bdc", "item_name": "Steel Sheet 4x8 (Fastener)", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 400, "quantity_per_unit": 4, "required_quantity": 400, "sub_assembly_name": "Hardware", "scrap_allowance_pct": "0.00"}], "consumables": [{"uom": null, "bom_id": "a9deacbd-768f-4b07-b517-ca37e57ed7d6", "item_name": "Welding Wire", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0e30fbb7-5302-4ce4-9498-e8db979fd3e1", "material_code": "STEEL-4X8", "material_name": "Steel Sheet 4x8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.05, "required_quantity": 5, "sub_assembly_name": "Consumables", "scrap_allowance_pct": "0.00"}], "sub_assemblies": [], "quantity_requested": 100, "explosion_timestamp": "2025-10-11T07:36:01.318Z", "total_material_cost": 0}	10	1	1	0.00	test-operator	2025-10-11 07:36:01.344537
15ef4976-57fd-4019-9ad5-5579bc4d6da5	\N	077b6e4a-a968-45e7-bff7-d3259f88eaea	50.0000	{"summary": {"critical_items": 0, "total_cut_parts": 2, "total_bought_outs": 4, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 26}, "cut_parts": [{"uom": null, "bom_id": "9d9b3c78-1555-42ec-a36b-0b9980607f8d", "blank_id": "04c6b03d-d2e6-4c61-a6b7-d669e60d5acf", "item_name": "Shell HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 1, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 3, "efficiency_pct": 63.7, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 50, "blank_weight_kg": 14.886, "sheets_required": 17, "blank_dimensions": {"width_mm": 700, "length_mm": 903, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 50, "sub_assembly_name": "Shell", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 51, "estimated_scrap_weight_kg": 0}, {"uom": null, "bom_id": "92bab038-5e00-4444-8ec5-717a89a3407c", "blank_id": "f80c6f72-fd08-4a9b-8a41-eadff822e9df", "item_name": "Dish HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 12, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 18, "efficiency_pct": 77.5, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 150, "blank_weight_kg": 3.018, "sheets_required": 9, "blank_dimensions": {"width_mm": 358, "length_mm": 358, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 3, "required_quantity": 150, "sub_assembly_name": "Dish", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 162, "estimated_scrap_weight_kg": 0}], "product_id": "077b6e4a-a968-45e7-bff7-d3259f88eaea", "bought_outs": [{"uom": null, "bom_id": "81cb98bd-db9a-4c37-91c1-8565e71d0f17", "item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "material_code": "Shaft Ø28", "material_name": "rod", "operation_code": "WELD", "scrap_quantity": 0, "total_quantity": 700, "quantity_per_unit": 14, "required_quantity": 700, "sub_assembly_name": "Shaft", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "aed05fa4-363f-4e37-b952-514c12f92dad", "item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "operation_code": null, "scrap_quantity": 0, "total_quantity": 150, "quantity_per_unit": 3, "required_quantity": 150, "sub_assembly_name": "Plastic Cap 1/4", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "f456c782-15c1-4d8d-b681-2447ed767c04", "item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 550, "quantity_per_unit": 11, "required_quantity": 550, "sub_assembly_name": "Plastic Cap 3/8", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "0c693619-8067-4fbc-8b5c-e6b81e4c4009", "item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "material_code": "Paint", "material_name": "Paint", "operation_code": "Paint", "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.1, "required_quantity": 5, "sub_assembly_name": "Paint", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 50, "explosion_timestamp": "2025-11-05T13:57:26.894Z", "total_material_cost": 0}	26	4	0	0.00	user	2025-11-05 13:57:26.953789
9cc24c9c-088b-401f-a25d-ad8147579d96	\N	077b6e4a-a968-45e7-bff7-d3259f88eaea	20.0000	{"summary": {"critical_items": 0, "total_cut_parts": 2, "total_bought_outs": 6, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 11}, "cut_parts": [{"uom": null, "bom_id": "9d9b3c78-1555-42ec-a36b-0b9980607f8d", "blank_id": "04c6b03d-d2e6-4c61-a6b7-d669e60d5acf", "item_name": "Shell HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 1, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 3, "efficiency_pct": 63.7, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 20, "blank_weight_kg": 14.886, "sheets_required": 7, "blank_dimensions": {"width_mm": 700, "length_mm": 903, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 20, "sub_assembly_name": "Shell", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 21, "estimated_scrap_weight_kg": 0}, {"uom": null, "bom_id": "92bab038-5e00-4444-8ec5-717a89a3407c", "blank_id": "f80c6f72-fd08-4a9b-8a41-eadff822e9df", "item_name": "Dish HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 12, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 18, "efficiency_pct": 77.5, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 60, "blank_weight_kg": 3.018, "sheets_required": 4, "blank_dimensions": {"width_mm": 358, "length_mm": 358, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 3, "required_quantity": 60, "sub_assembly_name": "Dish", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 72, "estimated_scrap_weight_kg": 0}], "product_id": "077b6e4a-a968-45e7-bff7-d3259f88eaea", "bought_outs": [{"uom": null, "bom_id": "81cb98bd-db9a-4c37-91c1-8565e71d0f17", "item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "material_code": "Shaft Ø28", "material_name": "rod", "operation_code": "WELD", "scrap_quantity": 0, "total_quantity": 280, "quantity_per_unit": 14, "required_quantity": 280, "sub_assembly_name": "Shaft", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "aed05fa4-363f-4e37-b952-514c12f92dad", "item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "operation_code": null, "scrap_quantity": 0, "total_quantity": 60, "quantity_per_unit": 3, "required_quantity": 60, "sub_assembly_name": "Plastic Cap 1/4", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "f456c782-15c1-4d8d-b681-2447ed767c04", "item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 220, "quantity_per_unit": 11, "required_quantity": 220, "sub_assembly_name": "Plastic Cap 3/8", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "0c693619-8067-4fbc-8b5c-e6b81e4c4009", "item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "material_code": "Paint", "material_name": "Paint", "operation_code": "Paint", "scrap_quantity": 0, "total_quantity": 2, "quantity_per_unit": 0.1, "required_quantity": 2, "sub_assembly_name": "Paint", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "be8e10a8-b69d-40b2-b810-24b88fcc1311", "item_name": "Welding Wire Ø1.2", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "c28c0713-ad11-4a51-9d99-2c15196ba76b", "material_code": "Welding Wire", "material_name": "Welding Wire Ø1.2", "operation_code": "welding", "scrap_quantity": 0, "total_quantity": 5.8, "quantity_per_unit": 0.29, "required_quantity": 5.8, "sub_assembly_name": "Welding Wire", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "7e18d793-7afe-4bdd-bccc-8d22914f380f", "item_name": "FUEL", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "24b09d8a-8515-4f46-8451-9f8c7cfcfed3", "material_code": "F1", "material_name": "FUEL", "operation_code": null, "scrap_quantity": 0, "total_quantity": 4, "quantity_per_unit": 0.2, "required_quantity": 4, "sub_assembly_name": "fuel", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 20, "explosion_timestamp": "2025-12-06T17:17:09.469Z", "total_material_cost": 0}	11	6	0	0.00	system	2025-12-06 17:17:09.534776
f04905f6-e0f6-43aa-ac87-6f85a7e179b1	\N	077b6e4a-a968-45e7-bff7-d3259f88eaea	10.0000	{"summary": {"critical_items": 0, "total_cut_parts": 2, "total_bought_outs": 6, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 6}, "cut_parts": [{"uom": null, "bom_id": "9d9b3c78-1555-42ec-a36b-0b9980607f8d", "blank_id": "04c6b03d-d2e6-4c61-a6b7-d669e60d5acf", "item_name": "Shell HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 2, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 3, "efficiency_pct": 63.7, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 10, "blank_weight_kg": 14.886, "sheets_required": 4, "blank_dimensions": {"width_mm": 700, "length_mm": 903, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 10, "sub_assembly_name": "Shell", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 12, "estimated_scrap_weight_kg": 0}, {"uom": null, "bom_id": "92bab038-5e00-4444-8ec5-717a89a3407c", "blank_id": "f80c6f72-fd08-4a9b-8a41-eadff822e9df", "item_name": "Dish HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 6, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 18, "efficiency_pct": 77.5, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 30, "blank_weight_kg": 3.018, "sheets_required": 2, "blank_dimensions": {"width_mm": 358, "length_mm": 358, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 3, "required_quantity": 30, "sub_assembly_name": "Dish", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 36, "estimated_scrap_weight_kg": 0}], "product_id": "077b6e4a-a968-45e7-bff7-d3259f88eaea", "bought_outs": [{"uom": null, "bom_id": "81cb98bd-db9a-4c37-91c1-8565e71d0f17", "item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "material_code": "Shaft Ø28", "material_name": "rod", "operation_code": "WELD", "scrap_quantity": 0, "total_quantity": 140, "quantity_per_unit": 14, "required_quantity": 140, "sub_assembly_name": "Shaft", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "aed05fa4-363f-4e37-b952-514c12f92dad", "item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "operation_code": null, "scrap_quantity": 0, "total_quantity": 30, "quantity_per_unit": 3, "required_quantity": 30, "sub_assembly_name": "Plastic Cap 1/4", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "f456c782-15c1-4d8d-b681-2447ed767c04", "item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 110, "quantity_per_unit": 11, "required_quantity": 110, "sub_assembly_name": "Plastic Cap 3/8", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "0c693619-8067-4fbc-8b5c-e6b81e4c4009", "item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "material_code": "Paint", "material_name": "Paint", "operation_code": "Paint", "scrap_quantity": 0, "total_quantity": 1, "quantity_per_unit": 0.1, "required_quantity": 1, "sub_assembly_name": "Paint", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "be8e10a8-b69d-40b2-b810-24b88fcc1311", "item_name": "Welding Wire Ø1.2", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "c28c0713-ad11-4a51-9d99-2c15196ba76b", "material_code": "Welding Wire", "material_name": "Welding Wire Ø1.2", "operation_code": "welding", "scrap_quantity": 0, "total_quantity": 2.9, "quantity_per_unit": 0.29, "required_quantity": 2.9, "sub_assembly_name": "Welding Wire", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "7e18d793-7afe-4bdd-bccc-8d22914f380f", "item_name": "FUEL", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "24b09d8a-8515-4f46-8451-9f8c7cfcfed3", "material_code": "F1", "material_name": "FUEL", "operation_code": null, "scrap_quantity": 0, "total_quantity": 2, "quantity_per_unit": 0.2, "required_quantity": 2, "sub_assembly_name": "fuel", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 10, "explosion_timestamp": "2025-12-22T18:01:39.885Z", "total_material_cost": 0}	6	6	0	0.00	user	2025-12-22 18:01:39.952134
\.


--
-- Data for Name: bom_substitution_rules; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.bom_substitution_rules (id, product_id, sub_assembly_name, primary_material_id, substitute_material_id, priority, uom_factor, min_thickness, min_grade, cost_impact_pct, quality_impact, approval_required, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_ordered_materials; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.client_ordered_materials (id, so_id, material_id, quantity, cost, supplier_id, po_id, expected_delivery, status, created_at) FROM stdin;
fce7caaf-7dbf-45d1-aeaa-a3ce7afd7da6	SO-001	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	30.0000	15000.0000	supplier-001	\N	2025-10-29	pending	2025-10-22 14:22:32.635139
b01d7b29-9b3c-4bea-b4bb-a7472c7e6494	SO-001	crc-3mm-001	30.0000	18000.0000	supplier-002	\N	2025-11-01	pending	2025-10-22 14:22:32.63511
\.


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.customer (customer_id, customer_code, company_name, contact_person, email, phone, mobile, fax, billing_address, shipping_address, city, state, postal_code, country, tax_id, credit_limit, payment_terms, created_at, updated_at) FROM stdin;
CUST-000001	CUST-000001	Ghandhara Automobiles Limited	Ahmed Ali	ahmed.ali@ghandhara.com	021-32556901	\N	\N	F-3 Hub Chowki Road Site Karachi Pakistan	\N	Karachi	\N	\N	Pakistan	0802990	0.00	NET 30	2025-10-13 07:05:43.791723+00	2025-10-13 07:05:43.791723+00
CUST-000002	CUST-000002	Hinopak Motors Limited	Muhammad Hassan	hassan@hinopak.com	021-38709000	\N	\N	Industrial Area, Karachi	\N	Karachi	\N	\N	Pakistan	0816963	0.00	NET 45	2025-10-13 07:05:43.796375+00	2025-10-13 07:05:43.796375+00
CUST-000003	CUST-000003	Enterprising Manufacturing Co.	John Smith	john@enterprising.com	021-35075379	\N	\N	Plot #9, Sector 26, Korangi Industrial Area	\N	Karachi	\N	\N	Pakistan	7268495	0.00	NET 15	2025-10-13 07:05:43.800238+00	2025-10-13 07:05:43.800238+00
\.


--
-- Data for Name: dispatch; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.dispatch (dispatch_id, so_id, so_number, customer_name, product_id, product_name, quantity, dispatched_quantity, dispatch_date, dispatch_method, tracking_number, dispatched_by, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dispatch_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.dispatch_item (di_id, dispatch_id, product_id, qty, uom_id) FROM stdin;
972c6181-8cf1-4b42-84c5-293a7b2d7280	18d4f05a-3182-4add-9629-ac76e446358a	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	bdb9c233-4f88-4867-b657-e756a076b256
34df9bee-8393-450b-8443-adad1a3d1244	d52868c5-8463-49d8-bc7d-cb1c7620a59e	077b6e4a-a968-45e7-bff7-d3259f88eaea	20	bdb9c233-4f88-4867-b657-e756a076b256
f98be1dc-518e-418a-a4bb-944a7fd0db1a	d86c9d83-9117-4a5b-b3eb-77646590dbf8	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	bdb9c233-4f88-4867-b657-e756a076b256
\.


--
-- Data for Name: dispatch_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.dispatch_order (dispatch_id, dispatch_no, so_id, customer_id, location_id, vehicle_no, driver_name, dispatch_date, created_at, created_by, status) FROM stdin;
18d4f05a-3182-4add-9629-ac76e446358a	DISP-1763992388278-CQS5J0	6cb3b6c1-193c-48d2-b173-4ba4ba3be85f	CUST-000001	\N	\N	\N	2025-11-24 13:53:08.274	2025-11-24 13:53:08.274	system	DELIVERED
d52868c5-8463-49d8-bc7d-cb1c7620a59e	DISP2607	15a64808-57ce-4c0d-8e3d-87904c478c22	CUST-000001	\N	ABC-1234	Test Driver	2025-12-06 17:24:35.595	2025-12-06 17:24:35.595	test_user	DISPATCHED
d86c9d83-9117-4a5b-b3eb-77646590dbf8	DISP6440	5edd0225-f7e7-4fa2-8a9c-5e60c67bed78	CUST-000001	\N	\N	\N	2025-12-22 18:25:16.222	2025-12-22 18:25:16.222	system	DELIVERED
\.


--
-- Data for Name: goods_receipt; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.goods_receipt (grn_id, grn_no, po_id, supplier_id, received_date, received_by, location_id, created_at, notes) FROM stdin;
80f96efb-76c8-456b-a407-e568b837f189	GRN-1762165246708-hbsx2s	80e269f7-d2fa-4a63-819e-1f82708ceb5d	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-03 10:20:46.707	System User	main-store-001	2025-11-03 10:20:46.707	
13c2ca11-3138-4439-b0fe-625c7dd3dee9	GRN-1762165250042-x8zapd	9df45b4e-9a45-4d1e-aaa1-0718caeca15f	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-03 10:20:50.041	System User	main-store-001	2025-11-03 10:20:50.041	
0b91e9bf-f86d-4708-ad69-3766ce69735c	GRN-1762165254084-53ybmo	ca9b9ec9-faa4-4f96-9e94-e0ed4c336bc7	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-03 10:20:54.083	System User	main-store-001	2025-11-03 10:20:54.083	
949bef52-b39e-431f-b774-57507c818794	GRN-1762165257008-hum92q	d13cd9ea-5b03-4673-b6ec-5d7773846836	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-03 10:20:57.008	System User	main-store-001	2025-11-03 10:20:57.008	
7156f7d0-ff80-45c8-9c73-4907a6934060	GRN-1762167869094-11xe2o	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-03 11:04:29.093	System User	main-store-001	2025-11-03 11:04:29.093	
6c87a10d-9ec9-47a6-9bc1-b0fe8a641a1e	GRN-1762427100044-4citn5	1f0e7d75-137c-44d6-a752-7fef2484342c	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-06 11:05:00.042	System User	main-store-001	2025-11-06 11:05:00.042	
997cb5f8-dd49-4436-b3fd-1a45a92a36c6	GRN-1762427120167-pajhvm	1f0e7d75-137c-44d6-a752-7fef2484342c	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-06 11:05:20.168	System User	main-store-001	2025-11-06 11:05:20.168	
3dfa42c1-2c7a-4a70-956b-0a27ca62d6ed	GRN-1762427128145-ze6lz7	1f0e7d75-137c-44d6-a752-7fef2484342c	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-06 11:05:28.147	System User	main-store-001	2025-11-06 11:05:28.147	
a19176fe-95a5-46f3-b19d-82c09de08584	GRN-1762428561646-reb5qn	dc81d288-24d7-4421-8233-cc5e68f5163e	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-06 11:29:21.646	System User	main-store-001	2025-11-06 11:29:21.646	
c54f1a2c-8109-4712-87fe-b41203040567	GRN-1762562383814-bzrycw	874ff566-4601-4a23-8273-17fe88ea9f57	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-08 00:39:43.814	System User	main-store-001	2025-11-08 00:39:43.814	
efcf0b1f-3a88-49b5-8783-5087ed238bb6	GRN-1762562875034-cazenh	3ae8046a-8b1d-43c2-ac9c-167b07c3a125	test-supplier-001	2025-11-08 00:47:55.034	System User	main-store-001	2025-11-08 00:47:55.034	
d376c873-3794-41ef-8974-1ea52dc2ece3	GRN-1762562878492-nnntt7	ed89eb52-ae89-45b0-aee7-1de6ae8221f5	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-08 00:47:58.493	System User	main-store-001	2025-11-08 00:47:58.493	
5bc98471-f01e-452b-98cc-8aeba137a12a	GRN-1762562884400-x6z4jm	67fabc2e-95cf-43cc-9aa1-101a8b69e3bd	test-supplier-001	2025-11-08 00:48:04.399	System User	main-store-001	2025-11-08 00:48:04.399	
d8b653c5-aca9-488e-96ac-126eb76f0615	GRN-1762562888089-lcebcr	da0a10e6-ecd2-4627-b508-ceef4ccc3e57	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-08 00:48:08.089	System User	main-store-001	2025-11-08 00:48:08.089	
e8b3b755-5f7d-42e8-a456-633621988fb6	GRN-1762562891852-92b27w	c7561a8e-07cb-4cab-9214-b56c67602071	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-08 00:48:11.852	System User	main-store-001	2025-11-08 00:48:11.852	
226f1ca5-ff02-495f-935b-33ec59a87128	GRN-1760337721895-c42llc	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-10-13 06:42:01.896	System User	\N	2025-10-13 06:42:01.896	
24b9d176-541f-40e3-a839-66703c7c302f	GRN-1760295504808-ho5all	\N	test-supplier-001	2025-10-12 18:58:24.806	System User	\N	2025-10-12 18:58:24.806	Auto-generated GRN for PO-1760294405895-ohjoj4
73bac3ac-9d8d-4406-be68-f9a3a7a53fc6	GRN-1760295505003-filqit	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-10-12 18:58:25.003	System User	\N	2025-10-12 18:58:25.003	Auto-generated GRN for PO-1760294404666-duxd70
911bb13d-5364-4115-b83f-0044c40d1b1f	GRN-1760294300475-e98z1h	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-10-12 18:38:20.476	System User	\N	2025-10-12 18:38:20.476	
bbe7852f-cf66-4f07-bfde-8cd609170a30	GRN-1760294453572-s6m4i8	\N	test-supplier-001	2025-10-12 18:40:53.573	System User	\N	2025-10-12 18:40:53.573	
ff6b4d52-c2e2-422b-b95c-03cdc315b236	GRN-1760295505685-86psms	\N	test-supplier-001	2025-10-12 18:58:25.685	System User	\N	2025-10-12 18:58:25.685	Auto-generated GRN for PO-1760294242996-ymygbc
3c411fa2-7f9d-4f3c-9570-0eab322e24fe	GRN-1760295506578-advtd4	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-10-12 18:58:26.578	System User	\N	2025-10-12 18:58:26.578	Auto-generated GRN for PO-1760293552036-39vjun
8f9a507c-c80c-4941-8edd-a170a48a075d	GRN-1760295506931-gcz1g4	\N	test-supplier-001	2025-10-12 18:58:26.931	System User	\N	2025-10-12 18:58:26.931	Auto-generated GRN for PO-1760293550668-b7ylg4
cb8c04ee-3724-4401-b455-841a2fc8a33e	GRN-1760292512052-c2ychd	\N	test-supplier-001	2025-10-12 18:08:32.045	Test User	\N	2025-10-12 18:08:32.045	Test GRN creation
75102b96-6def-4bb4-bba3-6209820f9cab	GRN-1760292702485-5w7b3v	\N	test-supplier-001	2025-10-12 18:11:42.49	System User	\N	2025-10-12 18:11:42.49	
a28307be-8389-4bc8-b803-75a1c80ec38a	GRN-1760290254929-bb704u	\N	test-supplier-001	2025-10-12 17:30:54.93	Test User	\N	2025-10-12 17:30:54.93	Received Steel Sheet 4x8 from Test Supplier
3323f5ee-c366-402f-ba6e-242cf941fb4d	GRN-TEST-1760288939543	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-10-12 17:08:59.528	Test User	\N	2025-10-12 17:08:59.528	Test GRN for Stock In page
49a2440c-863e-4639-bc34-e0425764395f	GRN-1762164511606-4w27qy	\N	91ef6f5d-6975-416d-a262-0aed7c2f2afb	2025-11-03 10:08:31.607	System User	\N	2025-11-03 10:08:31.607	
b209452c-d276-402c-a4f2-054969e89f57	GRN-1762164499439-mzeftl	\N	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-03 10:08:19.438	System User	\N	2025-11-03 10:08:19.438	
617a5976-1c74-461e-acfe-c173fc2e4dc0	GRN-1762164492666-gw5msv	\N	test-supplier-001	2025-11-03 10:08:12.667	System User	\N	2025-11-03 10:08:12.667	
bf47031f-e0e1-4c42-8208-eeee21cfc6a9	GRN-1762164333001-7ddt2f	\N	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-11-03 10:05:33.003	System User	\N	2025-11-03 10:05:33.003	
4709d441-b5fd-41d0-a864-cf17539f827d	GRN-1763210113988-sg2ngh	516884c5-27a7-4459-8e2f-5a4b5345dd8a	test-supplier-001	2025-11-15 12:35:13.988	System User	main-store-001	2025-11-15 12:35:13.988	
0e4aec9f-49e6-4ca7-928f-fc468b4fdae8	GRN-1763210121171-wxhome	49fcac98-20b4-4da2-97ce-cf4bf8a991d7	test-supplier-001	2025-11-15 12:35:21.171	System User	main-store-001	2025-11-15 12:35:21.171	
dbdeecb8-1e26-4527-b0f4-0f98749cd0dd	GRN-1763210136955-7mq871	ac8a7750-1d77-47f3-82b8-b8fc17828e69	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-15 12:35:36.953	System User	main-store-001	2025-11-15 12:35:36.953	
f5c2b75c-8090-4711-9ecb-49569232b03b	GRN-1763210831233-fus9o1	9672b0d0-cb40-4ed9-b46f-38967eca4229	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-11-15 12:47:11.234	System User	main-store-001	2025-11-15 12:47:11.234	
94b4306b-772d-41df-b084-baeb4fc725d2	GRN-1765041656466-oegn9b	00c1d78e-957f-47c8-84ec-e301cebe2f8b	\N	2025-12-06 17:20:56.464	test_user	main-store-001	2025-12-06 17:20:56.464	\N
485a2e42-1840-4b8e-a2b5-22a030221b06	GRN-1765047600889-j0mzji	841a525e-fdd7-4d27-9497-4e3e77fff027	04cb61b4-59d8-4304-8975-5bbfe526b9dd	2025-12-06 19:00:00.887	System User	main-store-001	2025-12-06 19:00:00.887	
2b39feda-9bb2-482f-99bb-865016d0f5c3	GRN-1765047607295-br0rm8	bdb0c0e5-1e9c-455d-bc90-dd9c4bb8b382	test-supplier-001	2025-12-06 19:00:07.29	System User	main-store-001	2025-12-06 19:00:07.29	
2ba248c7-a596-4cea-8589-faa834aaacec	GRN-1765047631821-kuzc6j	c2801f9e-45b5-49a3-8e5e-a6085f98ace8	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-12-06 19:00:31.82	System User	main-store-001	2025-12-06 19:00:31.82	
b2769b22-70e6-43c5-bfff-085184045476	GRN-1766427334012-oazj8b	9b836c00-548e-46b0-8f07-1e72e229d525	68aba47c-e9dc-4430-9c0a-da454021ee8b	2025-12-22 18:15:34.011	System User	main-store-001	2025-12-22 18:15:34.011	
\.


--
-- Data for Name: goods_receipt_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.goods_receipt_item (gri_id, grn_id, po_item_id, product_id, material_id, qty_received, uom_id) FROM stdin;
d05c069b-d175-4a34-93f2-e7c58cc7a543	80f96efb-76c8-456b-a407-e568b837f189	2a334415-eb07-47c7-b3e6-44f899587ff2	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	50	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
6acf7b60-2fdc-4ee3-878d-d7d7e6d3b96f	13c2ca11-3138-4439-b0fe-625c7dd3dee9	ded6261d-9247-4e14-aa8b-50091ae98df7	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	5500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
d50c66be-b64a-45a8-a793-6b5b9f286170	0b91e9bf-f86d-4708-ad69-3766ce69735c	f6911af4-4c29-4b64-9299-9c6ef901a26e	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	1500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
1e2a3760-d56e-4b97-872e-0d79638f0cb9	226f1ca5-ff02-495f-935b-33ec59a87128	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	91	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
e5ed0589-d45e-498a-9730-24c81e37ac29	24b9d176-541f-40e3-a839-66703c7c302f	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
3c41e89b-c8a5-4f0b-9166-2ea191358853	73bac3ac-9d8d-4406-be68-f9a3a7a53fc6	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
312db96d-29af-4231-b50f-d6b70269c9d9	911bb13d-5364-4115-b83f-0044c40d1b1f	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
61b227aa-1c9f-4f4d-98c4-9d3fae7466b3	bbe7852f-cf66-4f07-bfde-8cd609170a30	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
51ac025b-e79a-4ed6-b188-b155cc183b05	ff6b4d52-c2e2-422b-b95c-03cdc315b236	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
e1e73a54-64da-4f97-a1cf-1bc190f9ca15	3c411fa2-7f9d-4f3c-9570-0eab322e24fe	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
a84f96b7-a2ca-4d35-9efa-f75880eae051	8f9a507c-c80c-4941-8edd-a170a48a075d	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	20	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
da49a18d-89a4-4b58-b0aa-34e283205706	cb8c04ee-3724-4401-b455-841a2fc8a33e	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	10	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
03271294-a5f1-4127-9d8c-1a9462c5a81b	75102b96-6def-4bb4-bba3-6209820f9cab	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	25	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
c68c8222-e8ee-448c-a161-f6999857b542	a28307be-8389-4bc8-b803-75a1c80ec38a	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	10	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
1d1d7f77-11be-46dc-a1f8-693855eeba54	3323f5ee-c366-402f-ba6e-242cf941fb4d	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	500	\N
e85bfcec-5001-414b-a08e-0d225af9fc19	4709d441-b5fd-41d0-a864-cf17539f827d	1913801b-0917-449f-a49f-659c3dd5873f	\N	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	1010	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
fe40cf80-084b-4eb0-8ac2-9bd36693a4da	0e4aec9f-49e6-4ca7-928f-fc468b4fdae8	20c31bc1-796e-4a63-9795-908b5164a696	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	55000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
f4da700d-6926-411a-92d9-07d1c69eced6	dbdeecb8-1e26-4527-b0f4-0f98749cd0dd	010b82cf-249e-445e-a0be-e144061c399f	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	2474	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
d01ce5b0-5a51-47c6-bfda-ca7b478ba8e6	c54f1a2c-8109-4712-87fe-b41203040567	acb6811e-d351-4639-8b8a-b07121e16d93	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	15	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
f4c4eb03-b387-4ccb-935a-aa5423ac9e12	efcf0b1f-3a88-49b5-8783-5087ed238bb6	820e422b-7fcf-4959-b3f5-f8b4f6233c32	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	26	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
46ee2f8c-53f8-41e5-9ea4-53429124f3fd	d376c873-3794-41ef-8974-1ea52dc2ece3	fb044f19-8228-4137-a40a-983653d9b004	\N	dc604e33-9302-4f82-9c81-9afd572a603f	700	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
639e6aa2-1d98-4c09-90c0-4fd398d0b160	5bc98471-f01e-452b-98cc-8aeba137a12a	a009580c-34d3-40c1-ad55-ad4f892e74a4	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
e384022f-e2a7-4b61-886e-f80c90c254f5	49a2440c-863e-4639-bc34-e0425764395f	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	7000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
a9aaea66-240c-4f14-85f4-02a436825ff7	b209452c-d276-402c-a4f2-054969e89f57	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
79d01c8d-f999-4515-9cb5-bd7748ffa61a	617a5976-1c74-461e-acfe-c173fc2e4dc0	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
f6500c49-73ec-4c68-8aef-02757be1ac90	bf47031f-e0e1-4c42-8208-eeee21cfc6a9	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	50	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
4c6eada6-068b-47fc-aef6-97fa0adcc273	dbdeecb8-1e26-4527-b0f4-0f98749cd0dd	1b454a46-f84b-4e65-93bb-f9bc14d6430c	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	1450	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
cb555619-9fca-4afb-af99-7d52c41893ac	dbdeecb8-1e26-4527-b0f4-0f98749cd0dd	9b086177-5c4d-4cc3-ae8f-79ea43c60115	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	15000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
e7394e10-cc88-4724-a4c8-4880eddf5bc9	dbdeecb8-1e26-4527-b0f4-0f98749cd0dd	ecece1b9-7f79-45f2-b9a1-3367b4ee134f	\N	dc604e33-9302-4f82-9c81-9afd572a603f	70000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
585d635f-441c-4247-a05f-82252ddd49d1	d8b653c5-aca9-488e-96ac-126eb76f0615	52a8b880-3933-4cb6-92ef-8fa376ea3e40	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
8485d290-5f06-4e6f-b9e5-54ea2faf3951	e8b3b755-5f7d-42e8-a456-633621988fb6	ce6a5d7e-32e5-45ac-becb-a27b7a0fb1d7	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	5	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
097b1259-e2ea-414e-876a-35fd14cd747c	dbdeecb8-1e26-4527-b0f4-0f98749cd0dd	fcd00766-0e9c-4176-8ad8-5be1a5eed459	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
5aeee4ad-a973-4ffb-8611-f49788f83386	f5c2b75c-8090-4711-9ecb-49569232b03b	8e645ec7-fdb2-4c38-9a5e-037a7a0f545c	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	26	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
8e895c5d-e763-4677-abcf-69357f19033a	94b4306b-772d-41df-b084-baeb4fc725d2	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	50	\N
3a383c78-b4b2-4bf2-8f42-ea8575b4bae4	485a2e42-1840-4b8e-a2b5-22a030221b06	44634a16-887c-4e98-bc75-f9b78946f132	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	5500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
b381a1d2-74e2-4511-ba0e-da7c2cc152c5	2b39feda-9bb2-482f-99bb-865016d0f5c3	5ad8adba-bafa-458f-b289-a4972a9b776e	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	1500	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
3520258d-d72c-4c92-bead-c0c2241f5577	2b39feda-9bb2-482f-99bb-865016d0f5c3	c4e81389-e4f3-4a62-9e14-bf814eedd80d	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	145	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
54879210-9745-4f8c-9c96-530803221bed	2ba248c7-a596-4cea-8589-faa834aaacec	2768fd1a-4b56-44d4-addd-c1513b2f99dc	\N	dc604e33-9302-4f82-9c81-9afd572a603f	7000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
ba6f8046-1bfa-41e4-95e7-39958772af39	2ba248c7-a596-4cea-8589-faa834aaacec	4e887d2e-2218-4993-9734-40ce08a0f7c6	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	50	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
71468125-bbbf-479f-8781-a60a98813d19	2ba248c7-a596-4cea-8589-faa834aaacec	58d5c39e-2439-4088-94e5-55a0c4bec30d	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	148	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
15c2efef-a921-44d9-939a-d45d15789749	b2769b22-70e6-43c5-bfff-085184045476	1c657ee7-ed6c-4198-a45c-194441de8c7c	\N	bcc7d31a-2588-48d1-96a4-1decee97a274	9	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
347bc098-5284-4840-b5b5-2a639d7bceec	b2769b22-70e6-43c5-bfff-085184045476	95c65a35-f792-49ae-b31f-d2a3424425e3	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	600	88ed7640-5f9e-47c3-882c-a9bfbfbe0744
\.


--
-- Data for Name: internal_purchase_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.internal_purchase_order (ipo_id, po_number, supplier_id, supplier_name, contact_person, contact_phone, supplier_address, supplier_email, supplier_ntn, supplier_strn, order_date, expected_date, status, created_by, notes, created_at, updated_at, updated_by) FROM stdin;
1dab924c-567c-4af2-8eba-fbd308fe3999	EMCPL-2025-1760337217305-euwcch	\N	Akhtar & co	akhtar 	03413076524					2025-10-13	2025-10-21	PENDING	current-user		2025-10-13 06:33:37.325392+00	2025-10-13 06:33:37.325392+00	\N
c4b9019c-6ef4-4a41-8159-db9e44e04ecf	EMCPL-2025-1762422784418-plegbj	\N	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-06	2025-11-13	APPROVED	current-user	Generated from Purchase Requisition: PR-1762422584018-oiqo847tq	2025-11-06 09:53:04.472088+00	2025-11-06 10:13:12.955503+00	current-user
6596a7d8-a91e-4e33-b0bb-960e1aa1dba7	EMCPL-2025-1762539891780-1iifgg	\N	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-n5ctaebje	2025-11-07 18:24:51.782089+00	2025-11-07 18:33:11.602089+00	current-user
96efe030-033f-4fde-8576-7e876155fa7e	EMCPL-2025-1762539879040-5anib3	\N	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-ao6r76ie5	2025-11-07 18:24:39.044294+00	2025-11-07 18:33:14.847029+00	current-user
deb96ed1-30d5-4105-a952-99d84b276de4	EMCPL-2025-1762539860329-t5m0dn	\N	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-beacy16tc	2025-11-07 18:24:20.330319+00	2025-11-07 18:33:17.801966+00	current-user
77e74e24-4c85-4070-b1f4-ffdf9d14550a	EMCPL-2025-1762539848327-sio6b2	\N	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-07xi3hezv	2025-11-07 18:24:08.333604+00	2025-11-07 18:33:20.057279+00	current-user
18e45952-7814-4b58-8d2d-45d3fefe88bd	EMCPL-2025-1762539836978-oa8l6h	\N	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-9khjn4uaa	2025-11-07 18:23:56.982217+00	2025-11-07 18:33:23.089461+00	current-user
80528895-226c-4517-8f70-191ee1bf14cf	EMCPL-2025-1762539826124-kd1h6z	\N	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-r0dg4w1wg	2025-11-07 18:23:46.126319+00	2025-11-07 18:33:25.634892+00	current-user
87caf50b-0517-4a8c-8065-6bb9bd21f550	EMCPL-2025-1762539810320-cxg83q	\N	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762539749111-zs6y0y349	2025-11-07 18:23:30.382168+00	2025-11-07 18:33:28.75016+00	current-user
eb768d1f-8f40-43b7-b676-601111ddb23c	EMCPL-2025-1762556067239-4gf9wm	\N	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-07	2025-11-14	PENDING	current-user	Generated from Purchase Requisition: PR-1762556043750-ei1jah1js	2025-11-07 22:54:27.258811+00	2025-11-07 22:54:27.258811+00	\N
eeb37265-d5bf-43d3-8617-3216a1be17ad	EMCPL-2025-1762556861370-u0uotg	\N	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762556843898-9d9y9zmxi	2025-11-07 23:07:41.371373+00	2025-11-07 23:09:23.018935+00	current-user
acf53117-172e-4a0a-8459-bdd60d386e1c	EMCPL-2025-1762560414170-v0jkyu	\N	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-08	2025-11-15	APPROVED	current-user	Generated from Purchase Requisition: PR-1762560399126-c1taj2aha	2025-11-08 00:06:54.175407+00	2025-11-08 00:08:17.014775+00	current-user
1c7c7818-0526-420d-9195-c54af2c6b57e	EMCPL-2025-1762559710491-s83xx4	\N	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-07	2025-11-14	APPROVED	current-user	Generated from Purchase Requisition: PR-1762559677469-dz7qgdy49	2025-11-07 23:55:10.509658+00	2025-11-08 00:08:19.566156+00	current-user
1c884d83-3077-4fd2-b747-362acc7a1a20	EMCPL-2025-1762560742479-w3vh0r	\N	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-08	2025-11-15	PENDING	current-user	Generated from Purchase Requisition: PR-1762560723022-bwko83q0n	2025-11-08 00:12:22.481788+00	2025-11-08 00:12:22.481788+00	\N
31178daf-e7e0-4e00-bd9e-72c5fccf5ccb	EMCPL-2025-1762562320945-fmkchv	04cb61b4-59d8-4304-8975-5bbfe526b9dd	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-08	2025-11-15	APPROVED	current-user	Generated from Purchase Requisition: PR-1762562304761-6db1oft84	2025-11-08 00:38:40.945947+00	2025-11-08 00:40:45.486389+00	current-user
aa9dbaf4-73b9-4367-96d8-57a088c97593	EMCPL-2025-1762562773657-kkuszt	04cb61b4-59d8-4304-8975-5bbfe526b9dd	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-08	2025-11-15	PENDING	current-user	Generated from Purchase Requisition: PR-1762562745450-3u56b5gmy	2025-11-08 00:46:13.659149+00	2025-11-08 00:46:13.659149+00	\N
603d770a-539e-4791-b989-693a3857c6ac	EMCPL-2025-1762562784063-1bwc44	04cb61b4-59d8-4304-8975-5bbfe526b9dd	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-11-08	2025-11-15	PENDING	current-user	Generated from 1 Purchase Requisition(s): PR-1762562745450-3u56b5gmy	2025-11-08 00:46:24.066607+00	2025-11-08 00:46:24.066607+00	\N
da244416-17be-41f9-8bf9-20394a3fdfc3	EMCPL-2025-1762562801407-mr43rn	68aba47c-e9dc-4430-9c0a-da454021ee8b	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-08	2025-11-15	PENDING	current-user	Generated from Purchase Requisition: PR-1762562745440-uojsjudx9	2025-11-08 00:46:41.408509+00	2025-11-08 00:46:41.408509+00	\N
a3950967-5d2c-4bcf-8f37-e12706279c8e	EMCPL-2025-1762562813680-f67lkc	test-supplier-001	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-08	2025-11-15	PENDING	current-user	Generated from Purchase Requisition: PR-1762562745429-5fx7nf4qw	2025-11-08 00:46:53.682123+00	2025-11-08 00:46:53.682123+00	\N
5e69fb0c-d428-4208-8c0c-97d604d6b98d	EMCPL-2025-1762562820977-mez18p	68aba47c-e9dc-4430-9c0a-da454021ee8b	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-08	2025-11-15	PENDING	current-user	Generated from Purchase Requisition: PR-1762562745417-0id9voivx	2025-11-08 00:47:00.978897+00	2025-11-08 00:47:00.978897+00	\N
fb99d4a4-57ae-45e8-b35f-b7ca310e7265	EMCPL-2025-1762771175640-yovgig	68aba47c-e9dc-4430-9c0a-da454021ee8b	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-11-10	2025-11-17	APPROVED	current-user	Generated from Purchase Requisition: PR-1762771158089-2k4i7a0lz	2025-11-10 10:39:35.644903+00	2025-11-15 11:56:54.388792+00	current-user
b07b574a-345c-41e7-89dd-515f8981a672	EMCPL-2025-1763210001606-g3j7sa	68aba47c-e9dc-4430-9c0a-da454021ee8b	ABC Compa	ALI	122313332	abc street	contact@supplier.com			2025-11-15	2025-11-22	PENDING	current-user	Generated from 5 Purchase Requisition(s): PR-1763209931683-uy0h2z584, PR-1763209931691-kv4wepyov, PR-1763209931698-fz5ajxukl, PR-1763209931710-eabmz3l84, PR-1763209931716-v9kaygi8g	2025-11-15 12:33:21.624943+00	2025-11-15 12:33:21.624943+00	\N
51456c60-a6c2-4f5a-b7e2-9a9e4a4871a8	EMCPL-2025-1763210014995-kiq3u6	test-supplier-001	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-15	2025-11-22	PENDING	current-user	Generated from Purchase Requisition: PR-1763209931704-sij0qq3mt	2025-11-15 12:33:34.99478+00	2025-11-15 12:33:34.99478+00	\N
12b28f04-3e19-4cb7-832b-5701ff2b5c86	EMCPL-2025-1765047360874-e36tkk	68aba47c-e9dc-4430-9c0a-da454021ee8b	ABC Company-	ALI	122313332	abc street	contact@supplier.com			2025-12-06	2025-12-13	APPROVED	current-user	Generated from 3 Purchase Requisition(s): PR-1765047256741-dbgky9pnu, PR-1765047256857-tjrtv0dci, PR-1765047256925-x494tt9xr	2025-12-06 18:56:00.941958+00	2025-12-06 18:58:33.44514+00	current-user
744a85fb-3237-4118-ba5b-6e2e925611d7	EMCPL-2025-1765041590889-zqlk0c	test-supplier-001	Test Supplier Ltd	\N	\N	\N	\N	\N	\N	2025-12-06	\N	APPROVED	system	\N	2025-12-06 17:19:50.890527+00	2025-12-06 18:58:36.973974+00	current-user
62e07446-65b7-4e9d-b444-3454fc4cc1a2	EMCPL-2025-1763210025415-wo6sh6	test-supplier-001	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-15	2025-11-22	APPROVED	current-user	Generated from Purchase Requisition: PR-1763209931723-zu4gnxmcq	2025-11-15 12:33:45.416146+00	2025-12-06 18:58:39.68395+00	current-user
46d3408d-6c1f-41eb-b4a4-92a9aaa5038f	EMCPL-2025-1762562831128-fpxhcv	test-supplier-001	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-11-08	2025-11-15	APPROVED	current-user	Generated from Purchase Requisition: PR-1762562745403-gmlzxbhp2	2025-11-08 00:47:11.129162+00	2025-12-06 18:58:47.535308+00	current-user
cde7d5ff-ac70-4023-b6f6-f419b7edff45	EMCPL-2025-1765047485811-pbt30y	04cb61b4-59d8-4304-8975-5bbfe526b9dd	UIT Manufacturing	Azeem	+923162156033		huzaifashamsi836@gmail.com			2025-12-06	2025-12-13	APPROVED	current-user	Generated from Purchase Requisition: PR-1765047256902-8miz6e6cw	2025-12-06 18:58:05.815735+00	2025-12-06 18:58:27.724277+00	current-user
701003b4-eeca-4cba-a11a-8c4213ff6165	EMCPL-2025-1765047471213-v6roji	test-supplier-001	Test Supplier Ltd	John Doe	555-0123		john@testsupplier.com			2025-12-06	2025-12-13	APPROVED	current-user	Generated from 2 Purchase Requisition(s): PR-1765047256880-pcjdbs1mi, PR-1765047256947-g3019quon	2025-12-06 18:57:51.293031+00	2025-12-06 18:58:30.640584+00	current-user
815c0bee-f510-4fea-8f39-c8c5e72d9e0e	EMCPL-2025-1766427299984-nn5moc	68aba47c-e9dc-4430-9c0a-da454021ee8b	ABC Company	ALI	122313332	abc street	contact@supplier.com			2025-12-22	2025-12-29	APPROVED	current-user	Generated from 2 Purchase Requisition(s): PR-1766427262828-376gri33s, PR-1766427262843-62hy90kh3	2025-12-22 18:15:00.008238+00	2025-12-22 18:15:43.184944+00	current-user
\.


--
-- Data for Name: internal_purchase_order_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.internal_purchase_order_item (ipo_item_id, ipo_id, material_id, item_name, description, quantity, unit_price, total_amount, uom_id, created_at) FROM stdin;
dea5d869-4336-4373-8adc-e3108957ed5c	1dab924c-567c-4af2-8eba-fbd308fe3999	\N	steel shee4 t	4 * 8	25.0000	25.0000	625.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-10-13 06:33:37.325392+00
49cc5589-5b32-4f2c-91fd-b802bbd28a8c	c4b9019c-6ef4-4a41-8159-db9e44e04ecf	\N	rod	Material from PR: PR-1762422584018-oiqo847tq	700.0000	100.0000	70000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-06 09:53:04.472088+00
0cf9399f-aee6-403d-9e87-8b976b88247d	87caf50b-0517-4a8c-8065-6bb9bd21f550	\N	HRC Sheet	Material from PR: PR-1762539749111-zs6y0y349	17.0000	1000.0000	17000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:23:30.382168+00
1adb0e70-0abc-4951-be92-a6641de92eb9	80528895-226c-4517-8f70-191ee1bf14cf	\N	HRC Sheet	Material from PR: PR-1762539749111-r0dg4w1wg	9.0000	100.0000	900.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:23:46.126319+00
4c8fa7fa-cb10-4bfc-87e3-c8ef2f00ea31	18e45952-7814-4b58-8d2d-45d3fefe88bd	\N	rod	Material from PR: PR-1762539749111-9khjn4uaa	700.0000	50.0000	35000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:23:56.982217+00
63c4705a-6c38-4161-8ab6-c2ca9f5d4866	77e74e24-4c85-4070-b1f4-ffdf9d14550a	\N	Plastic Cap 1/4	Material from PR: PR-1762539749111-07xi3hezv	150.0000	500.0000	75000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:24:08.333604+00
7e991efe-38f2-44d6-8bb9-4292567d2809	deb96ed1-30d5-4105-a952-99d84b276de4	\N	Plastic Cap 3/8	Material from PR: PR-1762539749111-beacy16tc	550.0000	400.0000	220000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:24:20.330319+00
be607215-da1b-4fc5-a93f-3e5552394036	96efe030-033f-4fde-8576-7e876155fa7e	\N	Paint	Material from PR: PR-1762539749111-ao6r76ie5	5.0000	4000.0000	20000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:24:39.044294+00
e537a3af-87c4-4393-860f-51c0acff6350	6596a7d8-a91e-4e33-b0bb-960e1aa1dba7	\N	Welding Wire Ø1.2	Material from PR: PR-1762539749111-n5ctaebje	15.0000	50.0000	750.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 18:24:51.782089+00
4bfb5014-82ae-4d1b-8238-5c817e42a94e	eb768d1f-8f40-43b7-b676-601111ddb23c	\N	HRC Sheet	Material from PR: PR-1762556043750-ei1jah1js	17.0000	1000.0000	17000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 22:54:27.258811+00
26b3e82a-60b8-4d15-a236-4d6bc13a45b4	eeb37265-d5bf-43d3-8617-3216a1be17ad	\N	HRC Sheet	Material from PR: PR-1762556843898-9d9y9zmxi	17.0000	100.0000	1700.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 23:07:41.371373+00
8890b3f5-7dfe-4ede-b02d-4e81ba38995e	1c7c7818-0526-420d-9195-c54af2c6b57e	\N	Welding Wire Ø1.2	Material from PR: PR-1762559677469-dz7qgdy49	15.0000	100.0000	1500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-07 23:55:10.509658+00
e3db22db-6302-478d-a95b-a7c2b775ad5d	acf53117-172e-4a0a-8459-bdd60d386e1c	\N	Welding Wire Ø1.2	Material from PR: PR-1762560399126-c1taj2aha	15.0000	100.0000	1500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:06:54.175407+00
b4be1d99-abe0-4dda-ae07-9603eceecb32	1c884d83-3077-4fd2-b747-362acc7a1a20	\N	Welding Wire Ø1.2	Material from PR: PR-1762560723022-bwko83q0n	15.0000	100.0000	1500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:12:22.481788+00
5a6e9b96-04dc-4ca6-9305-2f9dabf7c129	31178daf-e7e0-4e00-bd9e-72c5fccf5ccb	c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire Ø1.2	Material from PR: PR-1762562304761-6db1oft84	15.0000	100.0000	1500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:38:40.945947+00
cea26a2f-7a84-4321-9bd6-019421031473	aa9dbaf4-73b9-4367-96d8-57a088c97593	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Material from PR: PR-1762562745450-3u56b5gmy	5.0000	200.0000	1000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:46:13.659149+00
135575d0-cd14-49a1-a4ba-e1157fdffe05	603d770a-539e-4791-b989-693a3857c6ac	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Material from PR: PR-1762562745450-3u56b5gmy	5.0000	100.0000	500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:46:24.066607+00
d793593c-8f65-4686-89c8-a3da5d0e0145	da244416-17be-41f9-8bf9-20394a3fdfc3	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	Plastic Cap 3/8	Material from PR: PR-1762562745440-uojsjudx9	550.0000	100.0000	55000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:46:41.408509+00
7627e6e2-17b7-4588-8a56-a251a27ea1ed	a3950967-5d2c-4bcf-8f37-e12706279c8e	0f126f28-ce5d-48c3-ab33-466a636f34cf	Plastic Cap 1/4	Material from PR: PR-1762562745429-5fx7nf4qw	150.0000	50.0000	7500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:46:53.682123+00
ce23f211-61b5-4e0f-8ed2-2afe562e01c7	5e69fb0c-d428-4208-8c0c-97d604d6b98d	dc604e33-9302-4f82-9c81-9afd572a603f	rod	Material from PR: PR-1762562745417-0id9voivx	700.0000	10.0000	7000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:47:00.978897+00
eedba748-8677-4ddd-a0f9-36e88177420b	46d3408d-6c1f-41eb-b4a4-92a9aaa5038f	6d389b17-3618-4d85-9c2c-a973a2a62279	HRC Sheet	Material from PR: PR-1762562745403-gmlzxbhp2	26.0000	1000.0000	26000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-08 00:47:11.129162+00
2452110e-bf71-4240-b5cd-4b16c5b81289	fb99d4a4-57ae-45e8-b35f-b7ca310e7265	6d389b17-3618-4d85-9c2c-a973a2a62279	HRC Sheet	Material from PR: PR-1762771158089-2k4i7a0lz	26.0000	100.0000	2600.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-10 10:39:35.644903+00
4a2fd8c4-367b-4dce-889b-9fc84058e51b	b07b574a-345c-41e7-89dd-515f8981a672	6d389b17-3618-4d85-9c2c-a973a2a62279	HRC Sheet	Material from PR: PR-1763209931683-uy0h2z584	2474.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:21.624943+00
11cd1db9-8338-4def-84c7-dd0756dbd4f7	b07b574a-345c-41e7-89dd-515f8981a672	dc604e33-9302-4f82-9c81-9afd572a603f	rod	Material from PR: PR-1763209931691-kv4wepyov	70000.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:21.624943+00
69639afc-1232-44ac-8966-7cd120c2302f	b07b574a-345c-41e7-89dd-515f8981a672	0f126f28-ce5d-48c3-ab33-466a636f34cf	Plastic Cap 1/4	Material from PR: PR-1763209931698-fz5ajxukl	15000.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:21.624943+00
700ec195-a9c4-4fd8-9b45-3102993b2d9e	b07b574a-345c-41e7-89dd-515f8981a672	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Material from PR: PR-1763209931710-eabmz3l84	500.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:21.624943+00
35cb97bd-af16-405b-88c0-cfa06d29a7e8	b07b574a-345c-41e7-89dd-515f8981a672	c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire Ø1.2	Material from PR: PR-1763209931716-v9kaygi8g	1450.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:21.624943+00
33136485-390e-4c31-936b-b07bcd39ec3d	51456c60-a6c2-4f5a-b7e2-9a9e4a4871a8	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	Plastic Cap 3/8	Material from PR: PR-1763209931704-sij0qq3mt	55000.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:34.99478+00
ea660897-78f4-4cdb-935e-8f0f281462ce	62e07446-65b7-4e9d-b444-3454fc4cc1a2	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	FUEL	Material from PR: PR-1763209931723-zu4gnxmcq	1010.0000	0.0000	0.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-15 12:33:45.416146+00
83b96ba4-8f6a-4463-9ef0-95577209ddfc	744a85fb-3237-4118-ba5b-6e2e925611d7	6d389b17-3618-4d85-9c2c-a973a2a62279	HRC Sheet		50.0000	7000.0000	350000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 17:19:50.890527+00
4721473c-2a33-4b55-97a7-3c3b40bc7af0	12b28f04-3e19-4cb7-832b-5701ff2b5c86	6d389b17-3618-4d85-9c2c-a973a2a62279	HRC Sheet	Material from PR: PR-1765047256741-dbgky9pnu	148.0000	25.0000	3700.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 18:56:00.941958+00
e1550d08-367c-469a-82ee-9c371bf56f44	12b28f04-3e19-4cb7-832b-5701ff2b5c86	dc604e33-9302-4f82-9c81-9afd572a603f	rod	Material from PR: PR-1765047256857-tjrtv0dci	7000.0000	10.0000	70000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 18:56:00.941958+00
64a9d8a6-4ec0-430e-a5a7-9eaf1ce9c3bd	12b28f04-3e19-4cb7-832b-5701ff2b5c86	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Material from PR: PR-1765047256925-x494tt9xr	50.0000	10.0000	500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 18:56:00.941958+00
dc518d45-d682-44ed-8bfb-067cfeeb8a32	701003b4-eeca-4cba-a11a-8c4213ff6165	0f126f28-ce5d-48c3-ab33-466a636f34cf	Plastic Cap 1/4	Material from PR: PR-1765047256880-pcjdbs1mi	1500.0000	2.0000	3000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 18:57:51.293031+00
5d2cfbb6-2354-4dc2-8442-f50c54cf30a6	701003b4-eeca-4cba-a11a-8c4213ff6165	c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire Ø1.2	Material from PR: PR-1765047256947-g3019quon	145.0000	2.0000	290.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 18:57:51.293031+00
9261bb70-1971-4ee9-a7e6-5deafcb7cc82	cde7d5ff-ac70-4023-b6f6-f419b7edff45	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	Plastic Cap 3/8	Material from PR: PR-1765047256902-8miz6e6cw	5500.0000	1.0000	5500.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-06 18:58:05.815735+00
700b42c5-39b5-4aab-855a-88a8b9e822f8	815c0bee-f510-4fea-8f39-c8c5e72d9e0e	bcc7d31a-2588-48d1-96a4-1decee97a274	CRC Sheet	Material from PR: PR-1766427262828-376gri33s	9.0000	100.0000	900.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-22 18:15:00.008238+00
075e77cf-4cda-4677-a7d8-608b88d1911b	815c0bee-f510-4fea-8f39-c8c5e72d9e0e	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	Steel ROd	Material from PR: PR-1766427262843-62hy90kh3	600.0000	100.0000	60000.0000	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-12-22 18:15:00.008238+00
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory (inventory_id, product_id, material_id, quantity, location_id, batch_no, uom_id, status, updated_at, created_at) FROM stdin;
942a233b-db4b-4a13-8694-2f0ba0d802c3	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 13:46:47.253	2025-12-21 13:36:17.923
3473f83f-f943-4035-8d96-9c7172509689	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	510	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	\N	AVAILABLE	2025-12-22 18:25:16.222	2025-12-06 17:23:12.182
1a491105-814e-4931-a17e-992f38eb90ce	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	50	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	\N	ISSUED	2025-12-22 18:25:16.222	2025-12-22 18:25:16.222
1aee83d7-b61b-4ac3-88d7-e19dec3caa2e	\N	eaa40c7a-201e-48ba-8e10-3b281455201d	2000	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	f929ddc2-77b2-4faf-bd21-8b1924d0a6b4	AVAILABLE	2025-11-15 10:58:43.82	2025-11-15 10:58:43.82
ea1bb2a4-6c78-49df-89f1-bc05d1773d62	\N	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	1010	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-11-15 12:35:13.988	2025-11-15 12:35:13.988
d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:01:23.935	2025-12-21 13:30:34.754
0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:22.708	2025-12-21 15:08:22.517
410a480c-d55e-4eec-8994-6ae3c8820f39	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:01:26.285	2025-12-21 15:01:24.079
b6d2dc4a-5316-4c24-91b4-5ccf574b648e	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	10000	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	\N	AVAILABLE	2025-11-15 12:56:08.594	2025-11-15 12:56:08.587
894ddc7e-20c9-4f01-ad53-c3fa94569947	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:01:28.762	2025-12-21 15:01:26.54
b1500c04-89f4-4670-a6b5-a6d6ed6c147c	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:22.85	2025-12-21 15:08:22.827
1fca37a6-632a-45fe-92b3-856d4ec9d919	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:18.962	2025-12-21 15:07:18.94
dcbb3e40-272b-4645-8fad-9147911ab7bc	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-14 11:11:08.54	2025-12-14 11:11:08.444
5ba6279c-3a71-4ce2-bf13-61c634dc3c85	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-14 11:11:08.559	2025-12-14 11:11:08.553
773ecd7a-a872-4318-a474-efc27063a564	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:22.976	2025-12-21 15:08:22.953
7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 11:30:19.604	2025-11-15 12:57:02.487
09dfd80b-6a4e-4d01-b3f0-d71b18558bde	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	1030	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	\N	AVAILABLE	2025-12-21 11:30:19.671	2025-12-06 17:24:00.642
88b73bfb-55c3-4a8b-9a6c-aa466dcff257	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:56.731	2025-12-21 15:07:56.473
3edff137-70fd-4d21-bc3e-c03b0b9f3bf2	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:56.913	2025-12-21 15:07:56.882
77123db3-c739-4676-903b-dae9cfb273da	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:57.018	2025-12-21 15:07:56.996
eba88b56-8884-496f-a4e5-064c305327fa	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:32.244	2025-12-21 15:08:32.216
0832ae87-e67a-4923-9c7d-314e474a388f	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:32.368	2025-12-21 15:08:32.345
457aeb51-85c7-4e45-a3fc-95dd05499cf9	\N	bcc7d31a-2588-48d1-96a4-1decee97a274	9	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-22 18:15:34.011	2025-12-22 18:15:34.011
3630eac1-a86b-48fd-bcba-1921468c9e3d	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	600	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-22 18:15:34.011	2025-12-22 18:15:34.011
8db2ddbe-2183-4070-bedf-3e784c680369	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	9995	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	\N	AVAILABLE	2025-12-22 18:24:25.202	2025-11-15 12:56:35.32
dee3faaa-b4ad-495b-b5cc-86dcc0fd391b	\N	cec0269f-9ba5-487b-bda2-40bee140c67b	10000	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	f929ddc2-77b2-4faf-bd21-8b1924d0a6b4	AVAILABLE	2025-11-15 11:21:22.139	2025-11-15 11:21:22.139
a1025709-bb6b-48b4-91ae-a78880f19927	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:32.094	2025-12-21 15:08:31.898
abf31ef1-d3f4-462e-9216-a576d480aa69	\N	\N	700	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-11-06 12:05:13.641	2025-11-06 11:29:21.646
73edfea4-8f9f-4c72-b2dc-b6c385a3afd6	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	5000	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	\N	ISSUED	2025-11-24 13:53:08.274	2025-11-15 12:57:22.374
b33d10de-c172-4f09-9098-e4754c29bb8c	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:43.021	2025-12-21 15:07:42.999
029499fc-c346-485d-af9f-f468e227691d	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	9850	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	\N	AVAILABLE	2025-12-22 18:23:33.899	2025-11-15 12:53:35.961
60672bbe-9316-4cd3-a572-19920ac27da4	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	20	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	\N	ISSUED	2025-12-06 17:24:35.595	2025-12-06 17:24:35.595
63d0ea50-9c90-4cbd-84a9-24079ea70aed	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	61050	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-06 19:00:00.887	2025-11-08 00:48:08.089
70f99ddf-edaa-4cd8-9134-d92c2a51acc0	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	16650	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-06 19:00:07.29	2025-11-08 00:48:04.399
1b23ae92-2721-439f-80f8-1fea2f64f0f3	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	1610	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-06 19:00:07.29	2025-11-08 00:39:43.814
76007378-5fdd-4e31-99c9-43a12e1d653d	\N	dc604e33-9302-4f82-9c81-9afd572a603f	77700	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-06 19:00:31.82	2025-11-08 00:47:58.493
f93bbca3-406e-40ed-a8ab-6b49efd9f2a2	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	555	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-06 19:00:31.82	2025-11-08 00:48:11.852
f92bf780-e9a0-4d10-b7c0-2eb109251565	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	2713	main-store-001	\N	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	AVAILABLE	2025-12-06 19:00:31.82	2025-11-08 00:47:55.034
193fa7f3-0bf4-4172-b03c-363ca3202516	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:08.468	2025-12-21 15:08:08.434
a6f687d6-2469-4309-8916-e844c85cddc4	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:26:49.818	2025-12-21 15:26:49.788
94f4ede9-bdb9-4e80-88a5-be4e15c70585	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:42.805	2025-12-21 15:07:42.637
6c339d53-8fa5-40e5-b7f3-26435f111101	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	170	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	\N	AVAILABLE	2025-12-21 15:01:28.777	2025-12-21 13:46:47.277
dd30ba63-54ab-496c-834c-01a363b9420d	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:08.078	2025-12-21 15:08:07.825
6c09cec8-4c96-45d1-a474-bff4f5be799c	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	9450	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	\N	AVAILABLE	2025-12-22 18:23:33.924	2025-11-15 12:53:35.981
ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	320	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	\N	AVAILABLE	2025-12-21 15:26:49.911	2025-12-21 13:30:34.487
ba7d8405-ee18-4243-bef1-5e5b4cc40685	\N	\N	100	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	\N	AVAILABLE	2025-11-23 20:19:37.298	2025-11-23 20:19:37.298
aaee8686-3f6e-477e-b013-b38a1f787720	\N	\N	100	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	\N	AVAILABLE	2025-11-23 20:19:37.344	2025-11-23 20:19:37.344
09c6913f-3b64-47f4-b039-02b27f119776	\N	\N	100	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	\N	AVAILABLE	2025-11-23 20:19:37.37	2025-11-23 20:19:37.37
471e0e31-fb23-4960-a008-d141ebad5a2a	\N	\N	100	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	\N	AVAILABLE	2025-11-23 20:19:37.388	2025-11-23 20:19:37.388
1b60fbeb-c8b1-44d2-a44a-36b63504d3a5	\N	\N	80	81d4615f-c536-4eb2-8c6c-07ba5bce55f5	\N	\N	AVAILABLE	2025-11-23 20:19:37.406	2025-11-23 20:19:37.406
70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:18.838	2025-12-21 15:06:03.653
6fd235ab-7eb8-48d4-8b64-6781cec55209	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:07:42.921	2025-12-21 15:07:42.896
d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:26:49.665	2025-12-21 15:26:49.464
5936ada3-3a4a-4545-9019-49584e733a19	\N	dc604e33-9302-4f82-9c81-9afd572a603f	2300	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	\N	AVAILABLE	2025-12-22 18:24:01.857	2025-11-15 12:54:36.678
9ec03393-ed6f-449a-a81e-97434af292be	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:08:08.294	2025-12-21 15:08:08.253
6b8529f0-c543-4ad5-922f-13af1bf350ca	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	QUARANTINE	2025-12-21 15:26:49.947	2025-12-21 15:26:49.921
b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	2966	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	\N	AVAILABLE	2025-12-22 18:23:12.429	2025-11-15 12:49:42.572
de1147e5-4ef4-4d4b-813f-4b3e6279e0b9	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	0	e4c218cf-b48a-4419-8409-0d532437ef95	\N	\N	AVAILABLE	2025-12-22 18:24:51.438	2025-12-22 18:24:38.973
\.


--
-- Data for Name: inventory_txn; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.inventory_txn (txn_id, inventory_id, product_id, wastage_id, material_id, wo_id, po_id, txn_type, quantity, unit_cost, location_id, batch_no, reference, created_by, created_at, procurement_request_id) FROM stdin;
c7ee11e0-3854-4ae7-bc8f-b3ad53268ba7	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765055211486	system	2025-12-06 21:07:04.914	\N
2ab41861-5466-4f52-af87-add9b87780d7	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	6d8050b6-f6fb-42c7-a07b-b3aad5578d26	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1766310355385	system	2025-12-21 09:46:13.446	\N
85e9b645-f817-492d-aeaf-0c5e801b1eeb	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-500	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-21 11:30:19.657	\N
59d98acb-a6a1-42a8-861e-3ddc1208c002	09dfd80b-6a4e-4d01-b3f0-d71b18558bde	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	500	\N	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	QA-REJECTED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-21 11:30:19.678	\N
b03c9f43-4372-4b9a-be3b-39db6aaa8e87	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	0b16449f-6594-4e26-bbee-5b2cc69ffd92	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-0b16449f-6594-4e26-bbee-5b2cc69ffd92	qa-test	2025-12-21 15:06:03.604	\N
e07b4e47-2430-41dc-acc5-c6be6c21c5be	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-0b16449f-6594-4e26-bbee-5b2cc69ffd92	qa-test	2025-12-21 15:06:03.64	\N
900374ee-9f66-4bd2-b21f-27340f5de09f	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-0b16449f-6594-4e26-bbee-5b2cc69ffd92	qa-test	2025-12-21 15:06:03.666	\N
ba434d48-64a6-4612-badc-a369d95988d9	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-677c859e-5604-4f45-8535-c55511422d64	qa-test	2025-12-21 15:07:18.667	\N
817a3c4e-fe9a-4a30-bf52-3e0a83bfd36c	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	bfb243e2-5d84-4661-8ffd-1c2ccbbf55b9	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-bfb243e2-5d84-4661-8ffd-1c2ccbbf55b9	qa-test	2025-12-21 15:07:18.79	\N
75fb3b48-ed5d-4925-ae7d-a65550851bf1	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-bfb243e2-5d84-4661-8ffd-1c2ccbbf55b9	qa-test	2025-12-21 15:07:18.809	\N
26e59a3d-b93b-4148-8856-92c5650175bf	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-bfb243e2-5d84-4661-8ffd-1c2ccbbf55b9	qa-test	2025-12-21 15:07:18.817	\N
eaef0cb3-de7b-4c50-8d8a-9a9ff6104d0b	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	98970079-4657-45eb-a44a-255a691270b8	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-98970079-4657-45eb-a44a-255a691270b8	qa-test	2025-12-21 15:07:18.915	\N
04e66f13-9813-4bea-ae21-73fc7a4e22c1	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	ISSUE	-10	\N	\N	\N	3c9df3a6-c456-47fb-98f4-ffd17b634db5	test-operator	2025-10-11 07:36:01.423	\N
8c6b226c-f525-4ace-92ce-ae5e0faa1be6	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	ISSUE	-10	\N	\N	\N	0232d152-f611-407b-9d3f-956f0a907225	test-operator	2025-10-11 07:35:37.341	\N
843603ab-22be-473a-96b3-30e0bfc47c9b	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	ISSUE	-10	\N	\N	\N	3fbcd943-6c2a-4913-8814-2736c01a06c0	test-operator	2025-10-11 07:35:15.598	\N
d3a5207f-332a-426b-97b8-7d44014e6c58	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	100	25.5	main-store-001	BATCH-001	INITIAL-STOCK	system	2025-09-23 21:51:44.633	\N
535d4b42-68ff-4bab-b17e-935237c1e0ab	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	500	\N	main-store-001	\N	STOCK-IN-1758666257063	current_user	2025-09-23 22:24:17.078	23bfe5fe-d9d4-40b1-8090-1cf154753da7
ac2b3802-845f-4884-9e77-47229b5f6e67	\N	\N	\N	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	\N	\N	RECEIVE	50	15.75	main-store-001	BATCH-002	INITIAL-STOCK	system	2025-09-23 21:51:58.603	\N
c0a0a00c-d8a3-41a0-adeb-87806041ea90	\N	\N	\N	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	\N	\N	RECEIVE	40	\N	main-store-001	\N	STOCK-IN-1758666220625	current_user	2025-09-23 22:23:40.677	9df3418a-7f17-4bc7-aa54-346c3c12aafd
4aa28dc5-b1c0-434d-8e73-8da4fa510b8d	\N	\N	\N	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	\N	\N	ISSUE	-50	\N	main-store-001	\N	ISSUE-WO-CUTTING-1761563027204	system	2025-10-30 18:12:58.085	\N
d02d36a0-79cd-47de-85d3-74d45bd734cf	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	500	\N	main-store-001	\N	P123	current_user	2025-09-25 16:45:12.794	\N
8adb90c1-b741-44f4-8fc2-33627c19af85	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	200	\N	main-store-001	\N	STOCK-IN-1759080138248	current_user	2025-09-28 17:22:18.369	\N
39216389-25c5-4b1b-8c41-584d857540d5	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	500	\N	\N	\N	Test GRN GRN-TEST-1760288939543 - Material: Steel Sheet 4x8	\N	2025-10-12 17:08:59.528	\N
ca83d3c7-cba3-4f8c-88c9-ce4e7aeefae6	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	10	\N	\N	\N	GRN GRN-1760290254929-bb704u - PO e40d1339-a7d5-4073-905f-4cef3e48537d - Batch: BATCH-001	\N	2025-10-12 17:30:54.93	\N
fc9cc867-dafa-486d-bb8c-a13a5db3bf7e	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	10	\N	\N	\N	GRN GRN-1760292512052-c2ychd - PO 62cb63fc-d1a9-417f-8a88-c46203e8ca0a - Batch: BATCH-001	\N	2025-10-12 18:08:32.045	\N
d263b39e-a16e-4055-a08d-02c10d36b2ef	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	25	\N	\N	\N	GRN GRN-1760292702485-5w7b3v - PO 7c4722a3-072d-494d-b6ac-319e67e0f037 - Batch: BATCH-1760292694618	\N	2025-10-12 18:11:42.49	\N
66991647-824f-48b2-8912-69edafa8b9a3	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	1	\N	\N	\N	GRN GRN-1760294300475-e98z1h - PO a18b9086-c27b-43c7-adc8-66b40ed899ad - Batch: BATCH-1760294295943	\N	2025-10-12 18:38:20.476	\N
a3aecf09-79b1-4aa7-926b-2d26832845ef	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	5	\N	\N	\N	GRN GRN-1760294453572-s6m4i8 - PO a99f6d59-c7bc-4629-a071-2d3320a3c52e - Batch: BATCH-1760294437226	\N	2025-10-12 18:40:53.573	\N
34b4b44a-08ef-4210-be53-1013d1294b36	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	5	\N	\N	\N	GRN GRN-1760295504808-ho5all - PO d18338f4-7121-4be5-bb1f-939d009f493b - Batch: BATCH-1760295504796-lm3z	\N	2025-10-12 18:58:24.806	\N
44f58ba8-19c5-4785-846f-5affb72e48e9	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	5	\N	\N	\N	GRN GRN-1760295505003-filqit - PO 6896a1e8-8112-4b9a-8293-040f63363430 - Batch: BATCH-1760295504994-wvrs	\N	2025-10-12 18:58:25.003	\N
0537b802-4aa5-4840-ad03-8a364b2a3c50	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	5	\N	\N	\N	GRN GRN-1760295505685-86psms - PO 6dabdbf2-0474-46b3-ab0a-29e4be2fdce5 - Batch: BATCH-1760295505635-hebo	\N	2025-10-12 18:58:25.685	\N
959ede39-0cb6-4c36-8196-cc1abcc2cfa7	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	1	\N	\N	\N	GRN GRN-1760295506578-advtd4 - PO 05e9ad89-6a63-426a-8979-4aa7321af69a - Batch: BATCH-1760295506288-b0pg	\N	2025-10-12 18:58:26.578	\N
fa7990b1-76c1-4f7b-a4e7-df9856ca611f	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	14298abe-4484-48b4-9372-25a258247046	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765055439678	system	2025-12-06 21:10:52.833	\N
6adbd944-577c-42e1-9671-d075717a8ca2	5936ada3-3a4a-4545-9019-49584e733a19	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	6c9edea6-6391-49af-811e-27e56b83c15e	\N	ISSUE	-7000	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-BLANKING OF HOOK-1766310355396	system	2025-12-21 09:57:51.302	\N
48375270-5218-4c06-8f39-0f71baa721f7	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-TEST-1766323834508	test-user	2025-12-21 13:30:34.694	\N
d7316d97-665d-4659-b5f3-332f6c105894	d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-TEST-1766323834508	test-user	2025-12-21 13:30:34.787	\N
9cae9208-d5f3-4f26-b367-6933873d4cc4	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-70aabfd6-093c-439a-af1e-73d7c0380ae5	qa-test	2025-12-21 15:06:03.736	\N
bc73b91a-c143-4696-a5db-b6ec10972447	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-70aabfd6-093c-439a-af1e-73d7c0380ae5	qa-test	2025-12-21 15:06:03.753	\N
847e961d-84de-49d5-968c-2f80bc7d9722	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-80	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-70aabfd6-093c-439a-af1e-73d7c0380ae5	qa-test	2025-12-21 15:07:18.845	\N
64608bb4-4f87-46f5-8df9-494e3ba08a98	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-98970079-4657-45eb-a44a-255a691270b8	qa-test	2025-12-21 15:07:18.934	\N
30654d66-ff31-418d-abae-492bd2337fcb	\N	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	\N	\N	RECEIVE	50	\N	main-store-001	\N	GRN GRN-1762165246708-hbsx2s - PO 80e269f7-d2fa-4a63-819e-1f82708ceb5d - Batch: BATCH-1762165238742	\N	2025-11-03 10:20:46.707	\N
d50d143c-8321-47b4-9db2-3d79744dae1c	\N	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	\N	\N	RECEIVE	5500	\N	main-store-001	\N	GRN GRN-1762165250042-x8zapd - PO 9df45b4e-9a45-4d1e-aaa1-0718caeca15f - Batch: BATCH-1762165248412	\N	2025-11-03 10:20:50.041	\N
45cae8f9-40d2-4385-b393-15e640d44d82	\N	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	\N	\N	RECEIVE	1500	\N	main-store-001	\N	GRN GRN-1762165254084-53ybmo - PO ca9b9ec9-faa4-4f96-9e94-e0ed4c336bc7 - Batch: BATCH-1762165251455	\N	2025-11-03 10:20:54.083	\N
a3373051-42d0-4527-b138-73ee07565f09	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	7000	\N	main-store-001	\N	GRN GRN-1762165257008-hum92q - PO d13cd9ea-5b03-4673-b6ec-5d7773846836 - Batch: BATCH-1762165255503	\N	2025-11-03 10:20:57.008	\N
19caed3f-67e5-41b7-b4e4-8ab657e99920	1fca37a6-632a-45fe-92b3-856d4ec9d919	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-98970079-4657-45eb-a44a-255a691270b8	qa-test	2025-12-21 15:07:18.948	\N
040cd84b-5e67-4c65-8377-ced21c2c9cc7	1fca37a6-632a-45fe-92b3-856d4ec9d919	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-1fca37a6-632a-45fe-92b3-856d4ec9d919	qa-test	2025-12-21 15:07:18.971	\N
dd2928d5-f3a0-4e9d-aad8-5836387abc4b	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	700	\N	main-store-001	\N	GRN GRN-1762167869094-11xe2o - PO a6bd00f9-ad05-44c1-8d28-7bc3ff448a3b - Batch: BATCH-1762167847802	\N	2025-11-03 11:04:29.093	\N
c71927e0-0ad1-41c6-9dd4-acd8b5ca7689	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	ff2d6d0f-9ae7-4af3-a789-c57d8e6b0c45	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-ff2d6d0f-9ae7-4af3-a789-c57d8e6b0c45	qa-test	2025-12-21 15:07:42.598	\N
5090037c-6839-4f56-8d2d-461862dfcb78	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-ff2d6d0f-9ae7-4af3-a789-c57d8e6b0c45	qa-test	2025-12-21 15:07:42.628	\N
2a0ce080-5d39-489c-b296-51e230bab352	94f4ede9-bdb9-4e80-88a5-be4e15c70585	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-ff2d6d0f-9ae7-4af3-a789-c57d8e6b0c45	qa-test	2025-12-21 15:07:42.645	\N
b0afe8b6-60c3-4b68-85ba-bc077849d9ee	94f4ede9-bdb9-4e80-88a5-be4e15c70585	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-94f4ede9-bdb9-4e80-88a5-be4e15c70585	qa-test	2025-12-21 15:07:42.703	\N
1882fb3e-b44b-44ec-bde7-cf795ee168e0	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-94f4ede9-bdb9-4e80-88a5-be4e15c70585	qa-test	2025-12-21 15:07:42.717	\N
b87581c1-6adf-4437-bf7f-5f527bef7912	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	100	\N	main-store-001	\N	GRN GRN-1762427100044-4citn5 - PO 1f0e7d75-137c-44d6-a752-7fef2484342c - Batch: BATCH-1762427078275	\N	2025-11-06 11:05:00.042	\N
83dd3a61-912a-438c-9fda-4579e8ccb4fa	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	500	\N	main-store-001	\N	GRN GRN-1762427120167-pajhvm - PO 1f0e7d75-137c-44d6-a752-7fef2484342c - Batch: BATCH-1762427111104	\N	2025-11-06 11:05:20.168	\N
1d8402dd-d996-49bb-8dd8-68e728b556cf	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	100	\N	main-store-001	\N	GRN GRN-1762427128145-ze6lz7 - PO 1f0e7d75-137c-44d6-a752-7fef2484342c - Batch: BATCH-1762427125233	\N	2025-11-06 11:05:28.147	\N
7b799af3-69f9-4ac0-a3ec-c81d99f496f1	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-5	\N	main-store-001	\N	ISSUE-WO-CUTTING-1761849239929	system	2025-10-30 19:29:54.246	\N
970f39e7-21f4-4770-ae0e-59f46116bb5f	\N	\N	\N	cbd03a02-3157-499e-b763-35a2fe5e2baa	\N	\N	RECEIVE	75	8.25	main-store-001	BATCH-003	INITIAL-STOCK	system	2025-09-23 21:52:04.527	\N
a35f22b4-e418-4c85-a780-c2cdf219a451	\N	\N	\N	cbd03a02-3157-499e-b763-35a2fe5e2baa	\N	\N	RECEIVE	50	\N	main-store-001	\N	STOCK-IN-1758664327318	current_user	2025-09-23 21:52:07.34	df583e63-0244-4ce4-971b-a6f44624ba33
0d59c955-bd56-46ae-81d5-cc5bf4575465	\N	\N	\N	cbd03a02-3157-499e-b763-35a2fe5e2baa	\N	\N	ISSUE	-50	\N	main-store-001	\N	ISSUE-WO-CUTTING-1761563027204	system	2025-10-30 18:12:58.06	\N
782a08dd-cb31-4003-b4c9-eb0f98a28618	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	50	\N	\N	\N	GRN GRN-1762164333001-7ddt2f - PO e5b3b95b-13ee-4c5f-856d-e63175f316b2 - Batch: BATCH-1762164301917	\N	2025-11-03 10:05:33.003	\N
7aecce29-852a-4e79-a5af-01973933e871	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	5500	\N	\N	\N	GRN GRN-1762164492666-gw5msv - PO de947cc1-79f1-4139-bf4f-cab04a1923ad - Batch: BATCH-1762164481722	\N	2025-11-03 10:08:12.667	\N
a3896130-100b-4704-9d79-974decb686c5	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	1500	\N	\N	\N	GRN GRN-1762164499439-mzeftl - PO cd7a522f-5e03-4142-9377-7a980b4dda0d - Batch: BATCH-1762164496323	\N	2025-11-03 10:08:19.438	\N
d455d7d8-0ec2-45c4-80c8-f99fe4306ada	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	7000	\N	\N	\N	GRN GRN-1762164511606-4w27qy - PO e98eef77-2198-4b4c-8ffe-22e9c31ca7ec - Batch: BATCH-1762164503110	\N	2025-11-03 10:08:31.607	\N
8d92f77f-116e-43d4-8bac-d31774b1d1c4	\N	\N	\N	cbd03a02-3157-499e-b763-35a2fe5e2baa	\N	\N	ISSUE	-50	\N	main-store-001	\N	ISSUE-WO-CUTTING-1761563027204	system	2025-10-30 18:32:09.956	\N
a9d373d6-e431-469d-ab66-2621b03cba49	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	700	\N	main-store-001	\N	GRN GRN-1762428561646-reb5qn - PO dc81d288-24d7-4421-8233-cc5e68f5163e - Batch: BATCH-1762428557833	\N	2025-11-06 11:29:21.646	\N
315ad34f-2653-49eb-820e-0a1ccd2b651d	\N	\N	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	\N	\N	RECEIVE	15	\N	main-store-001	\N	GRN GRN-1762562383814-bzrycw - PO 874ff566-4601-4a23-8273-17fe88ea9f57 - Batch: BATCH-1762562378992	\N	2025-11-08 00:39:43.814	\N
0372c9bd-ebc5-44ed-a22d-9028691dd436	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	RECEIVE	26	\N	main-store-001	\N	GRN GRN-1762562875034-cazenh - PO 3ae8046a-8b1d-43c2-ac9c-167b07c3a125 - Batch: BATCH-1762562870327	\N	2025-11-08 00:47:55.034	\N
97db40f1-0643-42bd-a387-c2fc76f321f6	\N	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	\N	\N	RECEIVE	700	\N	main-store-001	\N	GRN GRN-1762562878492-nnntt7 - PO ed89eb52-ae89-45b0-aee7-1de6ae8221f5 - Batch: BATCH-1762562876704	\N	2025-11-08 00:47:58.493	\N
5fba620f-3576-4292-ac07-ee48ce5a394e	\N	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	\N	\N	RECEIVE	150	\N	main-store-001	\N	GRN GRN-1762562884400-x6z4jm - PO 67fabc2e-95cf-43cc-9aa1-101a8b69e3bd - Batch: BATCH-1762562882497	\N	2025-11-08 00:48:04.399	\N
9a278300-d1ee-4736-a40b-45df8d94df22	\N	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	\N	\N	RECEIVE	550	\N	main-store-001	\N	GRN GRN-1762562888089-lcebcr - PO da0a10e6-ecd2-4627-b508-ceef4ccc3e57 - Batch: BATCH-1762562886331	\N	2025-11-08 00:48:08.089	\N
7095bbe3-cb0b-416a-bb72-71da74505351	\N	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	\N	\N	RECEIVE	5	\N	main-store-001	\N	GRN GRN-1762562891852-92b27w - PO c7561a8e-07cb-4cab-9214-b56c67602071 - Batch: BATCH-1762562890141	\N	2025-11-08 00:48:11.852	\N
7ae6298c-f1e5-4c8a-95a0-090396a1d4ea	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	9de5c457-90ac-47df-b5f2-56c2e00f9838	\N	RECEIVE	500	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1765055745921	system	2025-12-06 21:15:45.944	\N
c8e904dd-1ef1-49dc-b703-c532ac628e7c	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	\N	RECEIVE	500	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1766311999391	system	2025-12-21 10:13:19.412	\N
5b5fac3e-e532-46b0-98f6-be6cbfbdea6a	942a233b-db4b-4a13-8694-2f0ba0d802c3	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-100	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-942a233b-db4b-4a13-8694-2f0ba0d802c3	system	2025-12-21 13:46:47.264	\N
aa20cf9d-e804-4636-82ac-140347759ed5	6c339d53-8fa5-40e5-b7f3-26435f111101	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	100	\N	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	QA-REJECTED-942a233b-db4b-4a13-8694-2f0ba0d802c3	system	2025-12-21 13:46:47.288	\N
61d2e519-93bf-44c7-8ee1-627d07a53767	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-17	\N	\N	\N	ISSUE-WO-CUTTING-1762168023443	system	2025-11-03 11:07:36.623	\N
8e71c6da-72ac-4c7d-9685-d9e505b08fcc	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-9	\N	\N	\N	ISSUE-WO-CUTTING-1762168023443	system	2025-11-03 11:07:36.709	\N
dd9a01c0-a133-4be5-9956-5e254cad755a	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-167	\N	\N	\N	ISSUE-WO-CUTTING-1762165801983	system	2025-11-03 10:30:19.235	\N
7a1d4fd0-0f25-42cf-a1f9-4bd3cdc10c10	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-84	\N	\N	\N	ISSUE-WO-CUTTING-1762165801983	system	2025-11-03 10:30:19.26	\N
052733c5-6ecb-4665-8400-b45fc402d11c	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	3275e852-7c71-4cc4-a986-03e0833cad72	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-3275e852-7c71-4cc4-a986-03e0833cad72	qa-test	2025-12-21 15:07:18.462	\N
89aee95a-e7df-421c-8b2d-48a0a7518192	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-3275e852-7c71-4cc4-a986-03e0833cad72	qa-test	2025-12-21 15:07:18.489	\N
3f712ae4-e9f0-4208-ac49-c7db59d8a00f	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-3275e852-7c71-4cc4-a986-03e0833cad72	qa-test	2025-12-21 15:07:18.501	\N
231b17f1-ce90-4790-9ed6-17283a938372	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	20	\N	\N	\N	GRN GRN-1760295506931-gcz1g4 - PO b9355f38-441e-439c-b8d9-06ea33386d5e - Batch: BATCH-1760295506823-lhyu	\N	2025-10-12 18:58:26.931	\N
c52dcb9d-0ffb-4a07-975e-27f877a3630e	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	\N	\N	RECEIVE	91	\N	\N	\N	GRN GRN-1760337721895-c42llc - PO 4fe16c02-2bc6-42b3-9d1a-67806767e35e - Batch: BATCH-1760337715502	\N	2025-10-13 06:42:01.896	\N
5eb5b4b0-d124-4941-86fc-31154b1240e1	\N	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	8fb98c3b-9b50-4316-a84a-1aba96213fca	\N	ISSUE	-700	\N	\N	\N	ISSUE-WO-BLANKING OF HOOK-1762452917012	system	2025-11-08 23:25:17.761	\N
21299430-5f94-4f28-aab1-d01901b3cc49	\N	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	8fb98c3b-9b50-4316-a84a-1aba96213fca	\N	ISSUE	-150	\N	\N	\N	ISSUE-WO-BLANKING OF HOOK-1762452917012	system	2025-11-08 23:25:17.832	\N
2499f030-0eea-40f3-980d-aaee79f492b8	\N	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	8fb98c3b-9b50-4316-a84a-1aba96213fca	\N	ISSUE	-550	\N	\N	\N	ISSUE-WO-BLANKING OF HOOK-1762452917012	system	2025-11-08 23:25:17.882	\N
a537750a-d6bf-44f3-bc85-1e06726ad200	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	e5a4abf6-e784-4ee2-a626-e0cdf61e905e	\N	ISSUE	-26	\N	\N	\N	ISSUE-WO-CUTTING-1762440985812	system	2025-11-08 00:49:01.882	\N
90cf2be9-a2fe-4c54-90e6-c786b48aee67	\N	\N	\N	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	\N	\N	RECEIVE	1010	\N	main-store-001	\N	GRN GRN-1763210113988-sg2ngh - PO 516884c5-27a7-4459-8e2f-5a4b5345dd8a - Batch: BATCH-1763210109064	\N	2025-11-15 12:35:13.988	\N
9b6f0004-d80e-4f99-bc8a-3aff57239081	\N	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	\N	\N	RECEIVE	55000	\N	main-store-001	\N	GRN GRN-1763210121171-wxhome - PO 49fcac98-20b4-4da2-97ce-cf4bf8a991d7 - Batch: BATCH-1763210116626	\N	2025-11-15 12:35:21.171	\N
606db5e6-8eef-414a-a2b8-cb00229ae5a9	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	RECEIVE	2474	\N	main-store-001	\N	GRN GRN-1763210136955-7mq871 - PO ac8a7750-1d77-47f3-82b8-b8fc17828e69 - Batch: BATCH-1763210123134	\N	2025-11-15 12:35:36.953	\N
ae988674-384b-41f9-b5de-8035595f1778	\N	\N	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	\N	\N	RECEIVE	1450	\N	main-store-001	\N	GRN GRN-1763210136955-7mq871 - PO ac8a7750-1d77-47f3-82b8-b8fc17828e69 - Batch: BATCH-1763210123134	\N	2025-11-15 12:35:36.953	\N
b6063dff-3529-422c-8ba5-482cb58c0855	\N	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	\N	\N	RECEIVE	15000	\N	main-store-001	\N	GRN GRN-1763210136955-7mq871 - PO ac8a7750-1d77-47f3-82b8-b8fc17828e69 - Batch: BATCH-1763210123134	\N	2025-11-15 12:35:36.953	\N
1f392360-90d8-418f-a750-af0bce7230e1	\N	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	\N	\N	RECEIVE	70000	\N	main-store-001	\N	GRN GRN-1763210136955-7mq871 - PO ac8a7750-1d77-47f3-82b8-b8fc17828e69 - Batch: BATCH-1763210123134	\N	2025-11-15 12:35:36.953	\N
f2bfbf97-2702-4a2f-b88a-d4cbfc09dfef	\N	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	\N	\N	RECEIVE	500	\N	main-store-001	\N	GRN GRN-1763210136955-7mq871 - PO ac8a7750-1d77-47f3-82b8-b8fc17828e69 - Batch: BATCH-1763210123134	\N	2025-11-15 12:35:36.953	\N
5d4a1240-9df7-4d3e-83da-98a575afd07a	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	RECEIVE	26	\N	main-store-001	\N	GRN GRN-1763210831233-fus9o1 - PO 9672b0d0-cb40-4ed9-b46f-38967eca4229 - Batch: BATCH-1763210827037	\N	2025-11-15 12:47:11.234	\N
66d5d105-7f66-4c20-8ee8-6c8627b2dd4b	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	eb27f7bc-d852-4b89-a10d-c95b519e7540	\N	ISSUE	-2501	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1763208794156	system	2025-11-15 12:49:42.6	\N
bea738ba-b451-4d02-a6cc-0258349916e3	029499fc-c346-485d-af9f-f468e227691d	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	efa6a553-5644-41a0-ac8b-f9af2845b83a	\N	ISSUE	-15000	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-BLANKING OF HOOK-1763208794164	system	2025-11-15 12:53:35.966	\N
b7c5e2b7-63c7-4f70-a3e0-1297c71fc026	6c09cec8-4c96-45d1-a474-bff4f5be799c	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	efa6a553-5644-41a0-ac8b-f9af2845b83a	\N	ISSUE	-55000	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-BLANKING OF HOOK-1763208794164	system	2025-11-15 12:53:35.986	\N
283f63d3-3093-44de-91c7-9af8c672bcdf	5936ada3-3a4a-4545-9019-49584e733a19	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	3fe617c4-4ab5-4063-bc2e-907be88e2a66	\N	ISSUE	-70000	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-PARTING OF THREADED SHAFT-1763208794173	system	2025-11-15 12:54:36.684	\N
10c8608c-c992-4650-a4ac-b8e880f6c60f	b6d2dc4a-5316-4c24-91b4-5ccf574b648e	\N	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	4a553e09-7077-423f-b0b3-cf885cc1ba73	\N	ISSUE	-1450	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-WEDING OF HOOK AND THREADED SHAFT-1763208794181	system	2025-11-15 12:56:08.601	\N
a8182191-790a-48bb-85a0-be9bc01a04d4	8db2ddbe-2183-4070-bedf-3e784c680369	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	2568700a-8071-4077-b203-414c54a0a0b6	\N	ISSUE	-500	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-PAINT-1763208794196	system	2025-11-15 12:56:35.325	\N
46ea44f3-ece2-47bf-b685-83ecb3b9b389	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	ea2addcf-462d-46ba-9628-d7405b00fce8	\N	RECEIVE	5000	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1763211422479	system	2025-11-15 12:57:02.493	\N
4581ad1a-6ae0-46d6-ac8f-27e76b932e94	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-5000	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-11-15 12:57:22.366	\N
49022afa-d713-47f4-b97e-01e028000984	73edfea4-8f9f-4c72-b2dc-b6c385a3afd6	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	5000	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-11-15 12:57:22.381	\N
9c575255-4f68-425f-9b5f-69c843a02d55	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-510	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-06 21:16:06.805	\N
dc9dbb68-a8f7-4171-8d32-76e4ccfca4f2	09dfd80b-6a4e-4d01-b3f0-d71b18558bde	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	510	\N	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	QA-REJECTED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-06 21:16:06.825	\N
0e90e907-9c60-4d14-b9e7-acf51bcb97fb	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-500	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-21 10:14:10.407	\N
e73236cd-ed7e-4f40-966a-af2ba5ec5d63	3473f83f-f943-4035-8d96-9c7172509689	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	500	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-21 10:14:10.429	\N
03df85a2-b16c-4650-8678-c8b38a12fa76	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-8de56797-03d1-4c1e-a5b8-bbc1c506bdc0	system	2025-12-21 15:01:19.336	\N
2d250017-91b6-4548-8046-c24325295a15	d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-8de56797-03d1-4c1e-a5b8-bbc1c506bdc0	system	2025-12-21 15:01:19.353	\N
7f283d99-f942-4bdd-8814-73a2571c5acc	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-4721745b-ac7a-43ab-a18e-10d268eb0afe	system	2025-12-21 15:01:21.72	\N
7e8d45c5-2bb7-42ac-8f6f-5ec0d58d4496	d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-4721745b-ac7a-43ab-a18e-10d268eb0afe	system	2025-12-21 15:01:21.732	\N
b9af1de5-6cb7-4e4c-b0aa-b8dcc4555160	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-fe7fa435-1b7d-4bf9-bb85-b8dd9102a340	system	2025-12-21 15:01:24.07	\N
00dde542-3aa9-4e26-8df9-31415dcfaa1c	410a480c-d55e-4eec-8994-6ae3c8820f39	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-fe7fa435-1b7d-4bf9-bb85-b8dd9102a340	system	2025-12-21 15:01:24.089	\N
1533e3bc-c5b3-4821-ae72-6b249f379481	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-edea1d06-2187-46ac-942c-60047e3804d1	system	2025-12-21 15:01:26.528	\N
5d805ab7-abef-4e4b-aabc-b5a1d53de891	894ddc7e-20c9-4f01-ad53-c3fa94569947	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-edea1d06-2187-46ac-942c-60047e3804d1	system	2025-12-21 15:01:26.556	\N
2adc9ce4-1930-488d-90df-1ae07c1aff57	\N	\N	\N	46aba450-31df-4319-a7ed-1a5413f7b963	\N	\N	ISSUE	-10	\N	\N	\N	020633d3-0ac2-4927-bb1b-b744985adc53	test-user	2025-11-23 20:19:37.32	\N
3cd13f7a-2435-4851-90d1-c857556f8961	\N	\N	\N	f0643905-a829-4a7a-9ebf-b2aa306b1a31	\N	\N	ISSUE	-50	\N	\N	\N	a46009ef-eb2c-4925-8e13-0429c106cb3b	test-user	2025-11-23 20:19:37.354	\N
d273a850-fd70-4cb6-b977-477543412593	\N	\N	\N	f004c804-f08c-4310-8fae-d7eb57706e69	\N	\N	ISSUE	-20	\N	\N	\N	30b3e3a5-0239-45f6-9b74-eca1208c617c	test-user	2025-11-23 20:19:37.418	\N
4188c00c-6ca4-4605-9984-242655163a7e	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-70aabfd6-093c-439a-af1e-73d7c0380ae5	qa-test	2025-12-21 15:07:18.56	\N
ef6e9427-39ab-4099-a6be-0265aa60aa42	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-70aabfd6-093c-439a-af1e-73d7c0380ae5	qa-test	2025-12-21 15:07:18.576	\N
018fb46b-1e3d-4028-ab0d-9b8004b4ad8a	73edfea4-8f9f-4c72-b2dc-b6c385a3afd6	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	ISSUE	-5000	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	DISPATCH-DISP-1763992388278-CQS5J0	system	2025-11-24 13:53:08.274	\N
22e9b892-2cad-467d-976c-c6ab335c0dc1	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1b01641d-5110-4794-9c2d-98493aa90f90	\N	ISSUE	-5	\N	\N	\N	1b01641d-5110-4794-9c2d-98493aa90f90	test_user	2025-12-06 17:07:55.744	\N
0826f2bd-46e7-4477-b360-741475045ded	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	47b4b477-80ef-4df9-bc5d-c5f17671770b	\N	RECEIVE	10	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1765040884070	system	2025-12-06 17:08:04.108	\N
fa3548c9-5238-4f16-98a2-7efa9368c735	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	ea6d3e62-b20d-4d1d-a4be-af46c046bd82	\N	ISSUE	-5	\N	\N	\N	ea6d3e62-b20d-4d1d-a4be-af46c046bd82	test_user	2025-12-06 17:10:46.137	\N
f94504ba-b629-4315-8068-1e52b50308be	\N	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	0cb9caad-1b30-4e86-8e16-d55d3723f649	\N	ISSUE	-5	\N	\N	\N	0cb9caad-1b30-4e86-8e16-d55d3723f649	test_user	2025-12-06 17:12:39.231	\N
0b22ec1f-dbb0-46ea-85a3-31b70e2139ca	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	RECEIVE	50	\N	main-store-001	\N	GRN GRN-1765041656466-oegn9b - PO 00c1d78e-957f-47c8-84ec-e301cebe2f8b - Batch: N/A	\N	2025-12-06 17:20:56.464	\N
bf0c4c3a-495d-4fc0-ba30-88b13e1eccff	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	a108dc62-ccd5-447a-a370-e738eb23c66c	\N	ISSUE	-11	\N	\N	\N	a108dc62-ccd5-447a-a370-e738eb23c66c	test_user	2025-12-06 17:21:29.314	\N
5a174a19-7d9b-47bc-a4d6-efa7e542ac27	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	2121efff-dd55-40ff-94ec-dbc5a8979418	\N	RECEIVE	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1765041720919	system	2025-12-06 17:22:00.948	\N
4105f86f-9c23-450b-83c4-26f8250c8fad	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-06 17:23:12.171	\N
5df162de-85fb-42e8-b467-83c220498a27	3473f83f-f943-4035-8d96-9c7172509689	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-06 17:23:12.192	\N
a6a328c0-956d-42a1-99ba-49bb56fe1adf	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	2121efff-dd55-40ff-94ec-dbc5a8979418	\N	RECEIVE	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1765041827406	system	2025-12-06 17:23:47.42	\N
ad9912b1-417c-4273-95f4-ecb6de306849	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-06 17:24:00.636	\N
bf0abfb3-5f67-4306-9ab3-6eaeff3ee59d	09dfd80b-6a4e-4d01-b3f0-d71b18558bde	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	20	\N	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	QA-REJECTED-7804116a-2beb-4e2e-b573-f327fee35172	system	2025-12-06 17:24:00.648	\N
59dc3dad-ede4-4e4d-ae99-0faf8903376e	60672bbe-9316-4cd3-a572-19920ac27da4	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	ISSUE	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	DISPATCH-DISP2607	test_user	2025-12-06 17:24:35.595	\N
22b493d9-1efd-475b-8973-c6a4e785bd30	\N	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	\N	\N	RECEIVE	5500	\N	main-store-001	\N	GRN GRN-1765047600889-j0mzji - PO 841a525e-fdd7-4d27-9497-4e3e77fff027 - Batch: BATCH-1765047586369	\N	2025-12-06 19:00:00.887	\N
0ec55ed5-b4de-4989-9ba7-6815f3a3698c	\N	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	\N	\N	RECEIVE	1500	\N	main-store-001	\N	GRN GRN-1765047607295-br0rm8 - PO bdb0c0e5-1e9c-455d-bc90-dd9c4bb8b382 - Batch: BATCH-1765047603829	\N	2025-12-06 19:00:07.29	\N
902bece6-15cb-4d02-beb1-f3dd99373aa8	\N	\N	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	\N	\N	RECEIVE	145	\N	main-store-001	\N	GRN GRN-1765047607295-br0rm8 - PO bdb0c0e5-1e9c-455d-bc90-dd9c4bb8b382 - Batch: BATCH-1765047603829	\N	2025-12-06 19:00:07.29	\N
7dc48f86-e5ea-48ae-871d-b4214b0f7c78	\N	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	\N	\N	RECEIVE	7000	\N	main-store-001	\N	GRN GRN-1765047631821-kuzc6j - PO c2801f9e-45b5-49a3-8e5e-a6085f98ace8 - Batch: BATCH-1765047612104	\N	2025-12-06 19:00:31.82	\N
455f9deb-8d97-4588-b244-7c1a7ad3d7a0	\N	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	\N	\N	RECEIVE	50	\N	main-store-001	\N	GRN GRN-1765047631821-kuzc6j - PO c2801f9e-45b5-49a3-8e5e-a6085f98ace8 - Batch: BATCH-1765047612104	\N	2025-12-06 19:00:31.82	\N
ff162c78-d721-42a6-9970-9029ec2ec07e	\N	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	RECEIVE	148	\N	main-store-001	\N	GRN GRN-1765047631821-kuzc6j - PO c2801f9e-45b5-49a3-8e5e-a6085f98ace8 - Batch: BATCH-1765047612105	\N	2025-12-06 19:00:31.82	\N
0e281d78-a619-4e2f-b619-4cf14a10ff07	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765052558169	system	2025-12-06 20:22:55.599	\N
d811ed99-44eb-4d46-8c98-8f89d21bdd45	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765047699568	system	2025-12-06 19:15:34.598	\N
2416c6b9-e5ec-4588-8ba5-28502c760343	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	\N	RECEIVE	500	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1766316585659	system	2025-12-21 11:29:45.709	\N
f9d54adf-43c1-4cf7-88dd-4e1dd1a1c0ff	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765049089417	system	2025-12-06 19:25:10.562	\N
a7338f3f-28a9-4eb2-9b3d-869a099dc616	d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-90	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-d98d4e6d-28af-4012-8617-85b9b1ddc036	system	2025-12-21 15:01:21.573	\N
bda2805f-1f5b-4e9a-9619-3872037da15c	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765049662245	system	2025-12-06 19:34:49.638	\N
5b755406-7348-4a29-b0b0-6e05f992fe90	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	90	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-d98d4e6d-28af-4012-8617-85b9b1ddc036	system	2025-12-21 15:01:21.593	\N
be5e9fa7-41af-49d9-8fda-94a10fc28a75	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	47b4b477-80ef-4df9-bc5d-c5f17671770b	\N	RECEIVE	10	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1765052346322	system	2025-12-06 20:19:06.346	\N
e2bc1f13-1052-4aca-9a06-d8d1e5f01a96	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	\N	\N	ISSUE	-251	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1765050948828	system	2025-12-06 19:56:10.464	\N
3e11e898-c28c-4f71-97f4-3055d6b3e796	d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-d98d4e6d-28af-4012-8617-85b9b1ddc036	qa-test	2025-12-21 15:01:23.941	\N
2b58ad3b-9674-452d-84a6-99b6a46497d6	6c339d53-8fa5-40e5-b7f3-26435f111101	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	QA-REJECTED-d98d4e6d-28af-4012-8617-85b9b1ddc036	qa-test	2025-12-21 15:01:23.955	\N
addf461c-ca9f-406c-b9a1-87c0fceff43f	410a480c-d55e-4eec-8994-6ae3c8820f39	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-410a480c-d55e-4eec-8994-6ae3c8820f39	qa-test	2025-12-21 15:01:26.326	\N
50819ece-dfb3-436a-a1f6-0d4d61c6dda4	894ddc7e-20c9-4f01-ad53-c3fa94569947	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-894ddc7e-20c9-4f01-ad53-c3fa94569947	qa-test	2025-12-21 15:01:28.769	\N
72324fb8-3c0b-4757-9468-7434d5305e85	6c339d53-8fa5-40e5-b7f3-26435f111101	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	d76eed8c-9815-4376-911a-ff4a7e08b3e5	\N	QA-REJECTED-894ddc7e-20c9-4f01-ad53-c3fa94569947	qa-test	2025-12-21 15:01:28.783	\N
e0133a68-d845-4d2d-a02b-8664072fa432	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	677c859e-5604-4f45-8535-c55511422d64	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-677c859e-5604-4f45-8535-c55511422d64	qa-test	2025-12-21 15:07:18.64	\N
c7e74db3-928d-416c-84e2-8c45c2b1b540	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-677c859e-5604-4f45-8535-c55511422d64	qa-test	2025-12-21 15:07:18.659	\N
1945ce38-27e3-43af-8797-94ebdc39cd00	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	04bbba68-7922-418c-ab70-c9185614aec4	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-04bbba68-7922-418c-ab70-c9185614aec4	qa-test	2025-12-21 15:07:42.761	\N
5be214b9-fd8d-4589-99d1-1dc1fc4d2a9e	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-04bbba68-7922-418c-ab70-c9185614aec4	qa-test	2025-12-21 15:07:42.778	\N
7b3adc0b-22f4-4ee0-a740-1a3088d4c0c8	94f4ede9-bdb9-4e80-88a5-be4e15c70585	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-04bbba68-7922-418c-ab70-c9185614aec4	qa-test	2025-12-21 15:07:42.788	\N
630f6aac-611c-433f-879f-61c265d4b29b	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	71089eb8-4352-41d6-ab85-5be5f58089cf	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-71089eb8-4352-41d6-ab85-5be5f58089cf	qa-test	2025-12-21 15:07:42.876	\N
7ab44a61-a83c-4a39-b052-fc79060df960	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-71089eb8-4352-41d6-ab85-5be5f58089cf	qa-test	2025-12-21 15:07:42.89	\N
40d2c47f-d2a1-4717-bc9f-aac304a26d6d	6fd235ab-7eb8-48d4-8b64-6781cec55209	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-71089eb8-4352-41d6-ab85-5be5f58089cf	qa-test	2025-12-21 15:07:42.902	\N
4155c99d-aff6-4dd2-992d-a923ee155f64	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	60573166-cf2d-4c47-ae0b-75b9ad37d9b6	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-60573166-cf2d-4c47-ae0b-75b9ad37d9b6	qa-test	2025-12-21 15:07:42.978	\N
2f25c0ef-2c31-47e3-914b-90419a7ecf31	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-60573166-cf2d-4c47-ae0b-75b9ad37d9b6	qa-test	2025-12-21 15:07:42.992	\N
85792eee-9201-44e4-bd4b-e4854c7e9b68	b33d10de-c172-4f09-9098-e4754c29bb8c	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-60573166-cf2d-4c47-ae0b-75b9ad37d9b6	qa-test	2025-12-21 15:07:43.005	\N
f9983c52-9d01-4ff0-96c0-19d00be4d85d	94f4ede9-bdb9-4e80-88a5-be4e15c70585	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-94f4ede9-bdb9-4e80-88a5-be4e15c70585	qa-test	2025-12-21 15:07:42.809	\N
923077ff-34ef-49e1-93f8-100d6b077143	6fd235ab-7eb8-48d4-8b64-6781cec55209	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-6fd235ab-7eb8-48d4-8b64-6781cec55209	qa-test	2025-12-21 15:07:42.925	\N
cbafc6c6-c015-4e3e-844a-4249598c328b	b33d10de-c172-4f09-9098-e4754c29bb8c	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-b33d10de-c172-4f09-9098-e4754c29bb8c	qa-test	2025-12-21 15:07:43.026	\N
3facb86b-428a-4295-9ded-e94ebe3c54e6	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	09311b26-821d-4fc0-bc59-bc20dc34cfb9	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-09311b26-821d-4fc0-bc59-bc20dc34cfb9	qa-test	2025-12-21 15:07:56.439	\N
4af45b90-fa3d-4e4b-8d26-776ad575951f	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-09311b26-821d-4fc0-bc59-bc20dc34cfb9	qa-test	2025-12-21 15:07:56.465	\N
59c4f7da-61ce-4673-bb7b-818a509867a1	88b73bfb-55c3-4a8b-9a6c-aa466dcff257	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-09311b26-821d-4fc0-bc59-bc20dc34cfb9	qa-test	2025-12-21 15:07:56.483	\N
6aaaf2be-3e01-436b-b14e-cf9f96349bb9	88b73bfb-55c3-4a8b-9a6c-aa466dcff257	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-88b73bfb-55c3-4a8b-9a6c-aa466dcff257	qa-test	2025-12-21 15:07:56.565	\N
58177eaa-74fc-402f-b7b2-a17dfc3a3ed2	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-88b73bfb-55c3-4a8b-9a6c-aa466dcff257	qa-test	2025-12-21 15:07:56.587	\N
0f775523-d256-4669-8d3c-7738013c2dbf	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	94ea9bdf-0842-4b1b-918f-257a8bfc9e86	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-94ea9bdf-0842-4b1b-918f-257a8bfc9e86	qa-test	2025-12-21 15:07:56.67	\N
51d301f4-2649-4c16-8245-21ae7c0ff153	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-94ea9bdf-0842-4b1b-918f-257a8bfc9e86	qa-test	2025-12-21 15:07:56.693	\N
1c978ba3-8016-4550-8409-ffc5844af3ce	88b73bfb-55c3-4a8b-9a6c-aa466dcff257	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-94ea9bdf-0842-4b1b-918f-257a8bfc9e86	qa-test	2025-12-21 15:07:56.708	\N
855c8cee-5851-403e-8436-667fb90d72de	88b73bfb-55c3-4a8b-9a6c-aa466dcff257	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-88b73bfb-55c3-4a8b-9a6c-aa466dcff257	qa-test	2025-12-21 15:07:56.737	\N
5cfa7969-e34d-49e3-a9b4-7ccdeff50e82	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	804d2e04-bc2e-46d5-9b79-c984e44c89d0	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-804d2e04-bc2e-46d5-9b79-c984e44c89d0	qa-test	2025-12-21 15:07:56.842	\N
f45102a6-59c2-4ec0-bea2-e23f5ed625db	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-804d2e04-bc2e-46d5-9b79-c984e44c89d0	qa-test	2025-12-21 15:07:56.869	\N
b4487072-eaed-4f2a-905b-f29ec76cab4a	3edff137-70fd-4d21-bc3e-c03b0b9f3bf2	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-804d2e04-bc2e-46d5-9b79-c984e44c89d0	qa-test	2025-12-21 15:07:56.89	\N
30528968-6ffa-48ec-a611-cf31b8a9d0ce	3edff137-70fd-4d21-bc3e-c03b0b9f3bf2	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-3edff137-70fd-4d21-bc3e-c03b0b9f3bf2	qa-test	2025-12-21 15:07:56.917	\N
695c307d-dcf0-48fc-9e83-9592978362ab	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	9488faaa-2f7b-4bb9-b278-5fb9b9e81baa	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-9488faaa-2f7b-4bb9-b278-5fb9b9e81baa	qa-test	2025-12-21 15:07:56.972	\N
e1548691-d0d0-4d3f-966a-0f353f3dc8dd	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-9488faaa-2f7b-4bb9-b278-5fb9b9e81baa	qa-test	2025-12-21 15:07:56.989	\N
1064c2ae-af06-47ed-82db-0c3b3f4ee85c	77123db3-c739-4676-903b-dae9cfb273da	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-9488faaa-2f7b-4bb9-b278-5fb9b9e81baa	qa-test	2025-12-21 15:07:57.003	\N
82755341-3ac8-4162-a00b-565887bcd22a	77123db3-c739-4676-903b-dae9cfb273da	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-77123db3-c739-4676-903b-dae9cfb273da	qa-test	2025-12-21 15:07:57.022	\N
14c12d53-e9e0-44fa-9370-d9aca60e9997	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	ae32ac48-6c96-490c-9984-d2e14459d0f9	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-ae32ac48-6c96-490c-9984-d2e14459d0f9	qa-test	2025-12-21 15:08:07.772	\N
9eb8736a-6e1c-4807-877c-e55c5ce05969	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-ae32ac48-6c96-490c-9984-d2e14459d0f9	qa-test	2025-12-21 15:08:07.808	\N
2d993632-e072-4a6f-bd9a-b0118c51fab7	dd30ba63-54ab-496c-834c-01a363b9420d	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-ae32ac48-6c96-490c-9984-d2e14459d0f9	qa-test	2025-12-21 15:08:07.838	\N
9c9cb766-25b7-41c0-8d9a-3f5a07592935	dd30ba63-54ab-496c-834c-01a363b9420d	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-dd30ba63-54ab-496c-834c-01a363b9420d	qa-test	2025-12-21 15:08:07.927	\N
bf1f2e16-ebba-4db2-a2a8-15e7c7024353	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-dd30ba63-54ab-496c-834c-01a363b9420d	qa-test	2025-12-21 15:08:07.95	\N
fa00b676-01ab-4f04-8b30-5479b2865797	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	b9f094c5-3125-421e-bfbb-dd97a1caca89	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-b9f094c5-3125-421e-bfbb-dd97a1caca89	qa-test	2025-12-21 15:08:08.022	\N
37f5e529-fa7d-422a-a6f0-74bdc6e75c5b	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-b9f094c5-3125-421e-bfbb-dd97a1caca89	qa-test	2025-12-21 15:08:08.044	\N
9b0564c0-292e-4895-839b-6c65aa0376bb	dd30ba63-54ab-496c-834c-01a363b9420d	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-b9f094c5-3125-421e-bfbb-dd97a1caca89	qa-test	2025-12-21 15:08:08.058	\N
e7ae8e15-1bdc-441c-8c3e-06a2fe711c86	dd30ba63-54ab-496c-834c-01a363b9420d	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-dd30ba63-54ab-496c-834c-01a363b9420d	qa-test	2025-12-21 15:08:08.09	\N
2dd7b6e1-af2a-4696-87f8-18e9cd5f97a4	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	8b36cc83-3981-4ad8-8dba-e913699af13e	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-8b36cc83-3981-4ad8-8dba-e913699af13e	qa-test	2025-12-21 15:08:08.207	\N
67ac5da1-20ec-4f75-be92-6ad48b262f47	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-8b36cc83-3981-4ad8-8dba-e913699af13e	qa-test	2025-12-21 15:08:08.24	\N
97f1b8f4-5a46-4e87-a8a3-7d889856ca8d	9ec03393-ed6f-449a-a81e-97434af292be	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-8b36cc83-3981-4ad8-8dba-e913699af13e	qa-test	2025-12-21 15:08:08.267	\N
8f09fb3a-347d-4b05-99b7-a269d7e65e0a	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	437bb55e-6ea2-41e9-ab70-63a36be49df7	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-437bb55e-6ea2-41e9-ab70-63a36be49df7	qa-test	2025-12-21 15:08:08.397	\N
ad0f92a0-d2d3-4ffc-8bf0-4550ca581bb4	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-437bb55e-6ea2-41e9-ab70-63a36be49df7	qa-test	2025-12-21 15:08:08.423	\N
5281b4fc-0f20-450a-a0f3-4027d24c7677	193fa7f3-0bf4-4172-b03c-363ca3202516	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-437bb55e-6ea2-41e9-ab70-63a36be49df7	qa-test	2025-12-21 15:08:08.446	\N
7c086b95-d185-46ba-9696-223325e415fa	9ec03393-ed6f-449a-a81e-97434af292be	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-9ec03393-ed6f-449a-a81e-97434af292be	qa-test	2025-12-21 15:08:08.307	\N
6984f28e-33c9-43a7-ad07-c5858472d3a5	193fa7f3-0bf4-4172-b03c-363ca3202516	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-193fa7f3-0bf4-4172-b03c-363ca3202516	qa-test	2025-12-21 15:08:08.482	\N
94ec00e3-67a3-449d-a873-77fe09519d53	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	df774ecc-68ac-4203-9eb3-77d1fa4a68a6	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-df774ecc-68ac-4203-9eb3-77d1fa4a68a6	qa-test	2025-12-21 15:08:22.486	\N
bcbcda72-3929-4348-b5f0-910971b89040	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-df774ecc-68ac-4203-9eb3-77d1fa4a68a6	qa-test	2025-12-21 15:08:22.51	\N
be50043b-8cd8-4c73-a172-510fe4a89b8a	0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-df774ecc-68ac-4203-9eb3-77d1fa4a68a6	qa-test	2025-12-21 15:08:22.525	\N
3763db47-74ea-4844-8be8-590d0b9a0fb0	0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	qa-test	2025-12-21 15:08:22.581	\N
a9321b59-915e-4cd7-8569-7ca437afcca8	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	qa-test	2025-12-21 15:08:22.595	\N
ae134396-b9db-4e1d-960d-22b5bbe483f3	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	d7d3a4ef-f72d-47b1-8b92-eaf8a3881786	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-d7d3a4ef-f72d-47b1-8b92-eaf8a3881786	qa-test	2025-12-21 15:08:22.661	\N
7fc747ba-750c-46df-9438-f7abc5eb70a2	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-d7d3a4ef-f72d-47b1-8b92-eaf8a3881786	qa-test	2025-12-21 15:08:22.681	\N
65cd62be-928d-481d-88e9-0d43e87521cb	0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-d7d3a4ef-f72d-47b1-8b92-eaf8a3881786	qa-test	2025-12-21 15:08:22.691	\N
13804108-76c3-415f-ba90-d3501495d2d5	0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	qa-test	2025-12-21 15:08:22.715	\N
b8de003b-0f4f-420b-9637-cd1889eaf159	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	049ffcd7-9348-457b-adfe-781245a9a455	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-049ffcd7-9348-457b-adfe-781245a9a455	qa-test	2025-12-21 15:08:22.803	\N
afe7eb3a-d734-4d6f-9dfa-263acca7f1ad	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-049ffcd7-9348-457b-adfe-781245a9a455	qa-test	2025-12-21 15:08:22.821	\N
906be836-fd03-4560-a9d1-d3066cf9e259	b1500c04-89f4-4670-a6b5-a6d6ed6c147c	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-049ffcd7-9348-457b-adfe-781245a9a455	qa-test	2025-12-21 15:08:22.833	\N
78721de3-05bb-42fc-b56f-64b25e55158a	b1500c04-89f4-4670-a6b5-a6d6ed6c147c	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-b1500c04-89f4-4670-a6b5-a6d6ed6c147c	qa-test	2025-12-21 15:08:22.857	\N
56f78516-ff19-4517-af1c-e49122bdff60	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	90286941-a43c-4ac0-a138-22ac102d444d	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-90286941-a43c-4ac0-a138-22ac102d444d	qa-test	2025-12-21 15:08:22.929	\N
2dff0f58-3499-4141-878f-23f6789c9e55	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-90286941-a43c-4ac0-a138-22ac102d444d	qa-test	2025-12-21 15:08:22.948	\N
21bf55d5-9623-44e7-aae3-e3e387aad52e	773ecd7a-a872-4318-a474-efc27063a564	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-90286941-a43c-4ac0-a138-22ac102d444d	qa-test	2025-12-21 15:08:22.96	\N
e6adf079-6fdc-4805-8d3e-b7639a120420	773ecd7a-a872-4318-a474-efc27063a564	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-773ecd7a-a872-4318-a474-efc27063a564	qa-test	2025-12-21 15:08:22.983	\N
69433a9f-7bea-4f4a-9df2-451b866f905d	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	679d5772-edf1-4a0c-8c2d-475582434635	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-679d5772-edf1-4a0c-8c2d-475582434635	qa-test	2025-12-21 15:08:31.864	\N
0c30f88e-badf-4108-9d59-1b1cf0e802ec	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-679d5772-edf1-4a0c-8c2d-475582434635	qa-test	2025-12-21 15:08:31.89	\N
ad011356-4b5b-4b8d-8ad3-e42bd0532e54	a1025709-bb6b-48b4-91ae-a78880f19927	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-679d5772-edf1-4a0c-8c2d-475582434635	qa-test	2025-12-21 15:08:31.906	\N
9e155dcb-a012-41f0-b222-723e159a2ff3	a1025709-bb6b-48b4-91ae-a78880f19927	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-a1025709-bb6b-48b4-91ae-a78880f19927	qa-test	2025-12-21 15:08:31.963	\N
3ed4f5aa-2593-475b-84b5-2e25885bd4c3	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-a1025709-bb6b-48b4-91ae-a78880f19927	qa-test	2025-12-21 15:08:31.979	\N
4aed715e-7c0b-4024-b828-df201bf878a9	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	056d5bd5-8f3d-44de-bb2c-9e6ee5c82919	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-056d5bd5-8f3d-44de-bb2c-9e6ee5c82919	qa-test	2025-12-21 15:08:32.049	\N
d256b587-9ae2-47ca-8798-ae54da692684	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-056d5bd5-8f3d-44de-bb2c-9e6ee5c82919	qa-test	2025-12-21 15:08:32.066	\N
95ca97b5-d7c2-492b-a801-9c30052f8055	a1025709-bb6b-48b4-91ae-a78880f19927	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-056d5bd5-8f3d-44de-bb2c-9e6ee5c82919	qa-test	2025-12-21 15:08:32.075	\N
070e51e4-a578-46a9-944e-c3227253985c	a1025709-bb6b-48b4-91ae-a78880f19927	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-a1025709-bb6b-48b4-91ae-a78880f19927	qa-test	2025-12-21 15:08:32.098	\N
cb2295e2-026f-495f-88b3-75c2ae616a07	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	b329a525-a559-4267-ba5a-8856e828db96	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-b329a525-a559-4267-ba5a-8856e828db96	qa-test	2025-12-21 15:08:32.189	\N
0b31d626-01c5-424a-99bb-8cf77f1d64db	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-b329a525-a559-4267-ba5a-8856e828db96	qa-test	2025-12-21 15:08:32.21	\N
abbb31aa-bf17-4184-a68a-531d047f796f	eba88b56-8884-496f-a4e5-064c305327fa	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-b329a525-a559-4267-ba5a-8856e828db96	qa-test	2025-12-21 15:08:32.222	\N
ac95f41c-ef9a-4305-8fd2-57184d0f42b9	eba88b56-8884-496f-a4e5-064c305327fa	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-eba88b56-8884-496f-a4e5-064c305327fa	qa-test	2025-12-21 15:08:32.248	\N
e0f50f72-62ae-45a0-bf15-429707169fad	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	eaa78602-5049-4b56-89c2-0fc894775962	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-eaa78602-5049-4b56-89c2-0fc894775962	qa-test	2025-12-21 15:08:32.319	\N
990cd830-c6ba-4100-95ed-4000b53e0cd3	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-eaa78602-5049-4b56-89c2-0fc894775962	qa-test	2025-12-21 15:08:32.338	\N
76116b6c-c8ee-4c8f-a09c-1c22649ef3c9	0832ae87-e67a-4923-9c7d-314e474a388f	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-eaa78602-5049-4b56-89c2-0fc894775962	qa-test	2025-12-21 15:08:32.351	\N
e4af6f3c-41ed-4da5-b108-d84458b1b6d6	0832ae87-e67a-4923-9c7d-314e474a388f	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-0832ae87-e67a-4923-9c7d-314e474a388f	qa-test	2025-12-21 15:08:32.373	\N
9bd87c3d-4d55-484d-a98c-8c18beede042	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	ba05140f-80f6-4fc7-9f72-23311258962b	\N	RECEIVE	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-ba05140f-80f6-4fc7-9f72-23311258962b	qa-test	2025-12-21 15:26:49.431	\N
08af3cbb-cc28-4a06-9026-293c191c6276	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-ba05140f-80f6-4fc7-9f72-23311258962b	qa-test	2025-12-21 15:26:49.455	\N
eb978398-e48e-4a28-acef-e0556cd4e85f	d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-ba05140f-80f6-4fc7-9f72-23311258962b	qa-test	2025-12-21 15:26:49.473	\N
14004192-ccad-43b1-b17e-38aff3cd7e5a	d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-40	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	qa-test	2025-12-21 15:26:49.54	\N
944a23f2-c88f-4d0e-98fe-1539b87ebe80	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	40	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	qa-test	2025-12-21 15:26:49.555	\N
29ec5f9d-3936-439a-abac-5c291f808ac6	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	746c9bdf-a530-472e-af5d-96b9b0916a81	\N	RECEIVE	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-746c9bdf-a530-472e-af5d-96b9b0916a81	qa-test	2025-12-21 15:26:49.618	\N
57664275-4d16-4055-9f56-e3a6cc5ea5f0	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-746c9bdf-a530-472e-af5d-96b9b0916a81	qa-test	2025-12-21 15:26:49.636	\N
841184ab-7eb4-4a77-b7c5-f0d2342f9e4c	d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-746c9bdf-a530-472e-af5d-96b9b0916a81	qa-test	2025-12-21 15:26:49.646	\N
7bd8a4e4-280e-4e2d-884a-57cbd4648a21	d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	qa-test	2025-12-21 15:26:49.669	\N
971ad067-b529-46eb-8517-fc5f349fdae0	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	ef4745b9-46da-4458-8395-71abd61952c6	\N	RECEIVE	30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-ef4745b9-46da-4458-8395-71abd61952c6	qa-test	2025-12-21 15:26:49.765	\N
9a72f0ce-64a1-4995-a2d5-6fc81ff6582d	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-ef4745b9-46da-4458-8395-71abd61952c6	qa-test	2025-12-21 15:26:49.783	\N
a25eaf5e-7328-4fd6-9fb0-bde4ee68cf31	a6f687d6-2469-4309-8916-e844c85cddc4	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-ef4745b9-46da-4458-8395-71abd61952c6	qa-test	2025-12-21 15:26:49.795	\N
c8b0e359-5ee8-4353-80af-4bdeb0ad14ba	a6f687d6-2469-4309-8916-e844c85cddc4	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-30	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-a6f687d6-2469-4309-8916-e844c85cddc4	qa-test	2025-12-21 15:26:49.823	\N
57a13891-fb41-4bcb-aea5-55f8f37cc663	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	8083a5c4-6470-4541-b224-63a921339698	\N	RECEIVE	20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	WO-COMPLETE-8083a5c4-6470-4541-b224-63a921339698	qa-test	2025-12-21 15:26:49.896	\N
7eeb68c0-8f98-4401-9ebb-0ec51802715e	ad53c043-a037-4906-92bd-da567342a002	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-TRANSFER-8083a5c4-6470-4541-b224-63a921339698	qa-test	2025-12-21 15:26:49.915	\N
54397006-0fd7-4eb9-9b0e-111e0f7afdc6	6b8529f0-c543-4ad5-922f-13af1bf350ca	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-TRANSFER-8083a5c4-6470-4541-b224-63a921339698	qa-test	2025-12-21 15:26:49.928	\N
80e36816-904e-42c1-b8bc-f858c64f82f4	6b8529f0-c543-4ad5-922f-13af1bf350ca	5cdef655-4cf2-400f-8609-189236cc9a8c	\N	\N	\N	\N	TRANSFER	-20	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-REJECTED-6b8529f0-c543-4ad5-922f-13af1bf350ca	qa-test	2025-12-21 15:26:49.952	\N
1f3b9a62-8a63-46ae-b936-9c3620914631	\N	\N	\N	bcc7d31a-2588-48d1-96a4-1decee97a274	\N	\N	RECEIVE	9	\N	main-store-001	\N	GRN GRN-1766427334012-oazj8b - PO 9b836c00-548e-46b0-8f07-1e72e229d525 - Batch: BATCH-1766427329001	\N	2025-12-22 18:15:34.011	\N
ba00c162-e97e-4126-a2c3-05b5306e082a	\N	\N	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	\N	\N	RECEIVE	600	\N	main-store-001	\N	GRN GRN-1766427334012-oazj8b - PO 9b836c00-548e-46b0-8f07-1e72e229d525 - Batch: BATCH-1766427329001	\N	2025-12-22 18:15:34.011	\N
97cb7139-1758-4d5e-9507-bece10a3436d	b08d1e03-371a-4f84-9d49-daa4ea58c2b3	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	050833d7-28f4-4132-b2b7-c91199b4f52a	\N	ISSUE	-26	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-CUTTING-1766427728232	system	2025-12-22 18:23:12.454	\N
5408ca62-7a4d-4735-8cad-5763e10240e2	029499fc-c346-485d-af9f-f468e227691d	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	b5c67730-c871-4fe8-b844-4707672eee42	\N	ISSUE	-150	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-BLANKING OF HOOK-1766427728248	system	2025-12-22 18:23:33.904	\N
8cac8265-5bf6-4240-bacb-ad102fa053e3	6c09cec8-4c96-45d1-a474-bff4f5be799c	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	b5c67730-c871-4fe8-b844-4707672eee42	\N	ISSUE	-550	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-BLANKING OF HOOK-1766427728248	system	2025-12-22 18:23:33.93	\N
418532f9-dbb8-419e-bbca-5f3325d25f18	5936ada3-3a4a-4545-9019-49584e733a19	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	ab075d86-8870-4fb3-8d5d-b6b48db96215	\N	ISSUE	-700	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-PARTING OF THREADED SHAFT-1766427728260	system	2025-12-22 18:24:01.861	\N
9b037bb1-04e2-4717-acb8-ec776c3bae9c	8db2ddbe-2183-4070-bedf-3e784c680369	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	a9575657-ac0f-466f-991b-ebd62315e738	\N	ISSUE	-5	\N	3e40d427-2704-49ae-a819-da9585c9b7f3	\N	ISSUE-WO-PAINT-1766427728307	system	2025-12-22 18:24:25.207	\N
19a3d282-13dd-4452-a890-331d118c476a	de1147e5-4ef4-4d4b-813f-4b3e6279e0b9	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	8f52c159-8d96-42a6-9e91-82587a827106	\N	RECEIVE	50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	FINISHED-GOODS-1766427878963	system	2025-12-22 18:24:38.981	\N
c56afb46-3907-42ee-8ec8-fc576580e9d9	de1147e5-4ef4-4d4b-813f-4b3e6279e0b9	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	-50	\N	e4c218cf-b48a-4419-8409-0d532437ef95	\N	QA-APPROVED-de1147e5-4ef4-4d4b-813f-4b3e6279e0b9	system	2025-12-22 18:24:51.446	\N
1562028e-bbc7-41d5-98c7-41a36aa1830d	3473f83f-f943-4035-8d96-9c7172509689	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	TRANSFER	50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	QA-APPROVED-de1147e5-4ef4-4d4b-813f-4b3e6279e0b9	system	2025-12-22 18:24:51.462	\N
680e1ee4-5e8b-4973-b539-ea0cecbfb185	1a491105-814e-4931-a17e-992f38eb90ce	077b6e4a-a968-45e7-bff7-d3259f88eaea	\N	\N	\N	\N	ISSUE	-50	\N	542562c8-4460-4e02-8e08-cc8c041fbdad	\N	DISPATCH-DISP6440	system	2025-12-22 18:25:16.222	\N
\.


--
-- Data for Name: invoice; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.invoice (invoice_id, invoice_no, po_id, supplier_id, invoice_date, due_date, total_amount, status, payment_terms, payment_method, approved_by, approved_amount, approved_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: invoice_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.invoice_item (invoice_item_id, invoice_id, po_item_id, material_id, product_id, quantity, unit_price, total_price) FROM stdin;
\.


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.location (location_id, code, name, type, created_at) FROM stdin;
3e40d427-2704-49ae-a819-da9585c9b7f3	PF	Production Floor	PRODUCTION	2025-09-23 14:36:02.943
f0ced9d0-1766-40c6-b075-49b60554b647	FGS	Finished Goods Store	STORAGE	2025-09-23 14:36:02.946
0776b603-2caa-4c3f-8384-624dbaf72b1f	SY	Scrap Yard	SCRAP	2025-09-23 14:36:02.952
main-store-001	MAIN_STORE	Main Store	STORAGE	2025-09-23 18:17:05.115
e4c218cf-b48a-4419-8409-0d532437ef95	QA-SECTION	Quality Assurance Section	QA	2025-10-31 23:51:51.458
542562c8-4460-4e02-8e08-cc8c041fbdad	FINISHED-GOODS	Finished Goods Warehouse	FINISHED_GOODS	2025-11-01 11:14:59.669
81d4615f-c536-4eb2-8c6c-07ba5bce55f5	MAIN-STORE	Main Store	STORAGE	2025-11-15 10:57:58.366
d76eed8c-9815-4376-911a-ff4a7e08b3e5	REJECTION	Rejection/Quarantine Area	REJECTED	2025-12-06 17:24:00.621
\.


--
-- Data for Name: manual_opening_stock; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.manual_opening_stock (id, period_key, product_id, opening_quantity, created_at, updated_at) FROM stdin;
2	2025-09	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	64.00	2025-10-06 08:26:47.40752	2025-10-06 08:26:47.40752
3	2025-09	d277d247-b962-4e69-a188-441a99fcab91	45.00	2025-10-06 08:26:47.412639	2025-10-06 08:26:47.412639
\.


--
-- Data for Name: material; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.material (material_id, material_code, name, description, category, uom_id, min_stock, max_stock, material_type, unit_weight_kg, unit_cost, supplier_id, reorder_level, sheet_width_mm, sheet_length_mm, sheet_thickness_mm) FROM stdin;
0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	4x8 Steel Sheet	RAW_MATERIAL	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	\N	\N	RAW_MATERIAL	\N	\N	\N	\N	\N	\N	\N
c87cc789-6fcd-4b9a-bb94-c2e8804e568f	RUBBER-SHEET	Rubber Sheet	Rubber Sheet Material	RAW_MATERIAL	54c52a65-8b9e-49ed-a538-72a33bb7a25a	\N	\N	RAW_MATERIAL	\N	\N	\N	\N	\N	\N	\N
cbd03a02-3157-499e-b763-35a2fe5e2baa	SYMENTEX	Symentex Material	Symentex Composite Material	RAW_MATERIAL	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	\N	\N	RAW_MATERIAL	\N	\N	\N	\N	\N	\N	\N
eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	Rm002	Steel ROd		RAW_MATERIAL	54c52a65-8b9e-49ed-a538-72a33bb7a25a	\N	\N	RAW_MATERIAL	\N	\N	\N	\N	\N	\N	\N
6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	HRC 1220x2440x2.0	RAW_MATERIAL	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
006880ba-a975-4879-b688-e2b2a161ec5d	EMCM001	Galvanized Sheet	GI 1220x2440x1.2	RAW_MATERIAL	584391f3-3bb8-40f7-b68a-88b917d44c40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6ec64434-57a0-4117-9fe7-003811aa7847	EMCM002	Galvanized Sheet	GI 1220x2440x1.5	RAW_MATERIAL	584391f3-3bb8-40f7-b68a-88b917d44c40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bcc7d31a-2588-48d1-96a4-1decee97a274	EMCM003	CRC Sheet	CRC 1220x2440x0.8	RAW_MATERIAL	584391f3-3bb8-40f7-b68a-88b917d44c40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dc604e33-9302-4f82-9c81-9afd572a603f	Shaft Ø28	rod		RAW_MATERIAL	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	PC-2	Plastic Cap 3/8	Plastic Cap 3/8	RAW_MATERIAL	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f126f28-ce5d-48c3-ab33-466a636f34cf	PC-1	Plastic Cap 1/4	Plastic Cap 1/4	RAW_MATERIAL	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7f2e0562-290d-41f7-854c-113cd12e540d	Polythene	Polythene 20x30	Polythene 20x30	RAW_MATERIAL	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Paint	Black Paint	RAW_MATERIAL	cf26d042-d62b-429e-8f3d-f85aae6916f1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire	Welding Wire Ø1.2	Welding Wire Ø1.2 (kg)	RAW_MATERIAL	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eaa40c7a-201e-48ba-8e10-3b281455201d	SYMENTEX_LEFTOVER_1763204323824	Symentex Material_leftover	\N	RAW_MATERIAL	f929ddc2-77b2-4faf-bd21-8b1924d0a6b4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cec0269f-9ba5-487b-bda2-40bee140c67b	EMCM003_LEFTOVER_1763205682143	CRC Sheet_leftover	\N	RAW_MATERIAL	f929ddc2-77b2-4faf-bd21-8b1924d0a6b4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4f824a09-5924-45a7-83a3-a934fbb55a4d	RT	rodtyre		RAW_MATERIAL	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24b09d8a-8515-4f46-8451-9f8c7cfcfed3	F1	FUEL	FUEL	RAW_MATERIAL	cf26d042-d62b-429e-8f3d-f85aae6916f1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4ebe4883-86fd-4fc7-8c4c-3de0cbba4792	STEEL-001	Steel Sheet	High grade steel sheet	RAW_MATERIAL	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: material_allocations; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.material_allocations (id, so_id, material_id, allocation_type, quantity, cost, delivery_date, status, created_at) FROM stdin;
bd60920e-8e50-49a7-84a3-ff87174f41b9	SO-001	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	strategic	20.0000	1000.0000	2025-10-22	allocated	2025-10-22 14:33:55.131159
ff3fbdbc-e4ba-449c-8dcd-3ea6596574f4	SO-001	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	new_purchase	100.0000	2500.0000	2025-10-29	allocated	2025-10-22 14:33:55.131144
8a5c0018-dc44-46fe-b4f7-b726ee94172f	SO-001	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	client_ordered	30.0000	1800.0000	2025-11-01	allocated	2025-10-22 14:33:55.134866
7e211310-c513-4118-9ad3-11ee7c50ef5b	SO-001	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	new_purchase	5.0000	3000.0000	2025-10-29	allocated	2025-10-22 14:33:55.135626
4ee1f342-bdbc-42b2-9701-97c70f2eaacd	SO-001	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	client_ordered	30.0000	1500.0000	2025-10-29	allocated	2025-10-22 14:33:55.130563
\.


--
-- Data for Name: material_availability_cache; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.material_availability_cache (material_id, current_stock, reserved_quantity, available_quantity, incoming_quantity, last_updated, cache_expiry) FROM stdin;
0e30fbb7-5302-4ce4-9498-e8db979fd3e1	120.0000	0.0000	120.0000	0.0000	2025-10-22 14:22:32.642213	2025-10-22 15:22:32.642213
paint-001	5.0000	0.0000	5.0000	0.0000	2025-10-22 14:22:32.642344	2025-10-22 15:22:32.642344
fastener-001	100.0000	0.0000	100.0000	0.0000	2025-10-22 14:22:32.642217	2025-10-22 15:22:32.642217
\.


--
-- Data for Name: material_consumption; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.material_consumption (consumption_id, product_id, material_id, sub_assembly_name, sheet_type, sheet_width_mm, sheet_length_mm, sheet_weight_kg, blank_width_mm, blank_length_mm, blank_thickness_mm, blank_weight_kg, pieces_per_sheet, utilization_pct, total_blanks, consumption_pct, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: material_requisition; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.material_requisition (requisition_id, sales_order_id, work_order_id, material_id, material_code, material_name, material_type, quantity_required, quantity_available, quantity_shortage, unit_cost, total_cost, status, priority, required_by_date, created_at, created_by, approved_at, approved_by) FROM stdin;
ae3cf425-1f17-4935-9d5b-2b261bea5af2	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	1000.0000	0.0000	1000.0000	0.00	0.00	PENDING	NORMAL	2025-10-30 00:00:00	2025-10-11 07:05:39.97659	test-user	\N	\N
5ab757cb-71b0-4a76-a84f-33492fa8006a	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	1000.0000	0.0000	1000.0000	0.00	0.00	PENDING	NORMAL	2025-10-30 00:00:00	2025-10-11 07:06:29.093356	test-user	\N	\N
cd1d9c7f-5aa3-4157-8b47-8c37c5f6d278	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	SHEET	10.0000	0.0000	10.0000	0.00	0.00	PENDING	HIGH	2025-10-30 00:00:00	2025-10-11 07:30:45.741472	test-operator	\N	\N
4a8a9336-14c1-4940-af5d-8958c13c0342	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	400.0000	0.0000	400.0000	0.00	0.00	PENDING	NORMAL	2025-10-30 00:00:00	2025-10-11 07:30:45.741472	test-operator	\N	\N
e42bd449-7b4a-474e-bc3a-1d86b8d530b1	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	CONSUMABLE	5.0000	0.0000	5.0000	0.00	0.00	PENDING	NORMAL	2025-10-30 00:00:00	2025-10-11 07:30:45.741472	test-operator	\N	\N
7be746fc-e26d-48f4-837e-6c60c8cf4f82	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	SHEET	10.0000	0.0000	10.0000	0.00	0.00	PENDING	HIGH	2025-10-30 00:00:00	2025-10-11 07:33:28.16786	test-operator	\N	\N
83a2cf61-acd0-415a-a884-d1940e673425	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	400.0000	0.0000	400.0000	0.00	0.00	PENDING	NORMAL	2025-10-30 00:00:00	2025-10-11 07:33:28.16786	test-operator	\N	\N
4f6db20c-f472-4961-80ac-e5c926c86a37	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	CONSUMABLE	5.0000	0.0000	5.0000	0.00	0.00	PENDING	NORMAL	2025-10-30 00:00:00	2025-10-11 07:33:28.16786	test-operator	\N	\N
f8c4b6a7-95eb-4dac-9314-a57975862dab	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	SHEET	10.0000	600.0000	0.0000	0.00	0.00	FULFILLED	HIGH	2025-10-30 00:00:00	2025-10-11 07:34:42.020867	test-operator	\N	\N
c228c3f9-0751-4957-b19a-76598a94543c	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	400.0000	600.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:34:42.020867	test-operator	\N	\N
8bd41243-e9f7-4fab-8c09-75c1ed4ae78a	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	CONSUMABLE	5.0000	600.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:34:42.020867	test-operator	\N	\N
dc926fc0-8dc0-4c81-a61e-b96941a5e98e	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	SHEET	10.0000	600.0000	0.0000	0.00	0.00	FULFILLED	HIGH	2025-10-30 00:00:00	2025-10-11 07:35:15.501694	test-operator	\N	\N
37ea7493-3fe3-4030-92ed-e41c5c0cacd4	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	400.0000	600.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:35:15.501694	test-operator	\N	\N
e477ceda-c8f2-4ef6-9730-30a433033087	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	CONSUMABLE	5.0000	600.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:35:15.501694	test-operator	\N	\N
390fed41-d99c-4cf1-bcde-00a6111d3d38	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	SHEET	10.0000	590.0000	0.0000	0.00	0.00	FULFILLED	HIGH	2025-10-30 00:00:00	2025-10-11 07:35:37.244844	test-operator	\N	\N
2a42c158-dc2d-4255-83d3-637ae0e27d3c	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	400.0000	590.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:35:37.244844	test-operator	\N	\N
20bd93c7-51cf-4c87-85f3-cbd1802f1b66	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	CONSUMABLE	5.0000	590.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:35:37.244844	test-operator	\N	\N
27baf3f7-5bf5-4d34-a18a-2f5ae38b6249	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	SHEET	10.0000	580.0000	0.0000	0.00	0.00	FULFILLED	HIGH	2025-10-30 00:00:00	2025-10-11 07:36:01.328227	test-operator	\N	\N
1e73def7-adf0-436e-a7bc-f3d7a07b920f	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	BOUGHT_OUT	400.0000	580.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:36:01.328227	test-operator	\N	\N
bdaefc90-aab0-40ce-a6ba-e219b36592d3	\N	\N	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	STEEL-4X8	Steel Sheet 4x8	CONSUMABLE	5.0000	580.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-10-30 00:00:00	2025-10-11 07:36:01.328227	test-operator	\N	\N
d6502c60-7fa0-4696-af23-396a6f849f24	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	SHEET	17.0000	-282.0000	299.0000	0.00	0.00	PENDING	NORMAL	2025-11-05 00:00:00	2025-11-05 13:57:26.926476	user	\N	\N
99506fdd-6fdf-499f-87d0-2dab33853487	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	SHEET	9.0000	-282.0000	291.0000	0.00	0.00	PENDING	NORMAL	2025-11-05 00:00:00	2025-11-05 13:57:26.926476	user	\N	\N
5951698e-ae7e-45f1-9af5-be1c70b0923c	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	Shaft Ø28	rod	BOUGHT_OUT	700.0000	0.0000	700.0000	0.00	0.00	PENDING	NORMAL	2025-11-05 00:00:00	2025-11-05 13:57:26.926476	user	\N	\N
39b3928a-8dcf-4782-a94d-d1f7a644f3af	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	PC-1	Plastic Cap 1/4	BOUGHT_OUT	150.0000	1500.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-11-05 00:00:00	2025-11-05 13:57:26.926476	user	\N	\N
6e7b294b-8f88-47e4-9062-4245249f7767	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	PC-2	Plastic Cap 3/8	BOUGHT_OUT	550.0000	5500.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-11-05 00:00:00	2025-11-05 13:57:26.926476	user	\N	\N
6c008fe3-2fae-41c9-8876-f1c22397ec5f	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Paint	BOUGHT_OUT	5.0000	50.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-11-05 00:00:00	2025-11-05 13:57:26.926476	user	\N	\N
8c374322-6921-4875-a390-fb69b426e99c	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	SHEET	7.0000	25.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
6892be1d-a0a6-41c0-9cd0-c11b69be1801	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	SHEET	4.0000	25.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
9f4f16c1-9136-4f01-8702-958b1fc39e2d	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	Shaft Ø28	rod	BOUGHT_OUT	280.0000	700.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
eb956500-af16-4d89-b8ad-7ce3c45ccb02	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	PC-1	Plastic Cap 1/4	BOUGHT_OUT	60.0000	150.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
0f6294c1-350d-4a90-9722-79b855b20e42	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	PC-2	Plastic Cap 3/8	BOUGHT_OUT	220.0000	550.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
00a4ae65-d9e9-4365-9f7f-e71fa8b35a1b	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Paint	BOUGHT_OUT	2.0000	5.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
7f999604-2cf4-4af5-bfea-176e19e270d4	\N	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire	Welding Wire Ø1.2	BOUGHT_OUT	5.8000	15.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
930b81be-6abb-4f4a-8c87-708c4eaa2c8d	\N	\N	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	F1	FUEL	BOUGHT_OUT	4.0000	1010.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	\N	2025-12-06 17:17:09.501739	system	\N	\N
f889a420-7ff4-4f89-b546-97b1f3bf32ee	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	SHEET	4.0000	5705.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
cdb8c6cb-683f-4052-9c13-7c2d2884a016	\N	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	EMCM009	HRC Sheet	SHEET	2.0000	5705.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
a51f90a7-f69e-4395-9069-7c1c6b9f7143	\N	\N	dc604e33-9302-4f82-9c81-9afd572a603f	Shaft Ø28	rod	BOUGHT_OUT	140.0000	80700.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
fb708b3c-0724-4c86-b2ef-0a7f92c3e665	\N	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	PC-1	Plastic Cap 1/4	BOUGHT_OUT	30.0000	26650.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
38b634c7-9d35-45a2-89a5-524fb3d195ed	\N	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	PC-2	Plastic Cap 3/8	BOUGHT_OUT	110.0000	71050.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
928fb018-2576-4de3-b2ce-a9015146463d	\N	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	Paint	Paint	BOUGHT_OUT	1.0000	10555.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
03319b17-421f-46ee-8dbb-28aee8399617	\N	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	Welding Wire	Welding Wire Ø1.2	BOUGHT_OUT	2.9000	11610.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
80c0c16d-466c-419d-8c11-d564450aead8	\N	\N	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	F1	FUEL	BOUGHT_OUT	2.0000	1010.0000	0.0000	0.00	0.00	FULFILLED	NORMAL	2025-12-22 00:00:00	2025-12-22 18:01:39.91983	user	\N	\N
\.


--
-- Data for Name: material_reservation; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.material_reservation (reservation_id, work_order_id, material_id, quantity, priority, status, created_by, reserved_at, released_at, released_by) FROM stdin;
\.


--
-- Data for Name: model; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.model (model_id, oem_id, model_name, model_year, created_at) FROM stdin;
511c88c4-b9e5-4336-b7b8-943811f76580	afcc3db8-b40d-4f0e-9df4-0bab4b365222	NMR	2024	2025-09-23 14:36:02.876
6bf7cb94-6bd5-455c-9a5b-f4095c973af3	afcc3db8-b40d-4f0e-9df4-0bab4b365222	NLR	2024	2025-09-23 14:36:02.884
4ed83583-6a19-4971-8af5-4feb532686a8	afcc3db8-b40d-4f0e-9df4-0bab4b365222	NPR 71	2024	2025-09-23 14:36:02.891
2731ef77-13e1-4f1b-95cb-93b20fe3c77c	afcc3db8-b40d-4f0e-9df4-0bab4b365222	FXZ	2024	2025-09-23 14:36:02.895
be07037c-2d3e-4f7c-94ca-ba05e1f22feb	649bc929-1e21-4ee9-aa79-7a4d856d66c3	FG8J	\N	2025-10-13 10:21:32.647
6cee7e9f-9f6d-4475-978e-2fb9953a3a97	96a24e31-0685-4330-b35a-c73ee5f9b0c6	pknsuzi	\N	2025-11-15 11:47:14.659
\.


--
-- Data for Name: oem; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.oem (oem_id, oem_name, created_at) FROM stdin;
afcc3db8-b40d-4f0e-9df4-0bab4b365222	Ghandhara Industries Ltd	2025-09-23 14:36:02.87
adeb6cad-2089-40c0-ac11-0dbad50f0fc4	Ghandara Automobiles Ltd	2025-10-13 04:13:48.692
649bc929-1e21-4ee9-aa79-7a4d856d66c3	Hinopak	2025-10-13 10:20:31.822
96a24e31-0685-4330-b35a-c73ee5f9b0c6	pak suzuki	2025-11-15 11:46:13.829
\.


--
-- Data for Name: operation; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.operation (operation_id, code, name, description, created_at) FROM stdin;
ff5e0696-caa0-4803-8225-2c693d4d53ab	CUT	Cutting/Shearing	Cutting and shearing operations	2025-09-23 14:36:02.985
929ff85f-d7ba-46a8-bda7-f3082e329627	FORM	Forming	Metal forming operations	2025-09-23 14:36:02.99
f185c249-8cfb-4a2c-980e-eb01781a9d32	DRILL1	Piercing 1	Initial piercing operations	2025-09-23 14:36:02.994
11dddae3-1688-4e23-8cf1-fd51ac6e2546	DRILL2	Piercing 2	Secondary piercing operations	2025-09-23 14:36:02.997
d971102b-0708-47ba-abf5-d075d0c2666d	CLEAN	Cleaning	Cleaning and preparation	2025-09-23 14:36:03.002
07d8f85c-f49a-4676-9c74-afcc54a7db11	PAINT	Painting	Painting operations	2025-09-23 14:36:03.006
e14bcaa1-7992-444e-ada9-2e03823515fd	ASSY	Assembly	Assembly operations	2025-09-23 14:36:03.009
1bc96503-1008-4bcf-8923-14049a33b938	WELD	Welding	Welding operations	2025-09-23 14:36:03.013
d0330947-036c-4c38-95b6-1e80f0253c48	RUBBER	Rubber Assembly	Rubber component assembly	2025-09-23 14:36:03.017
\.


--
-- Data for Name: packaging_priority; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.packaging_priority (id, product_id, carton_size, priority_order, active, created_at) FROM stdin;
f8d5aea7-b4aa-4e31-a1d5-216e52440c68	5cdef655-4cf2-400f-8609-189236cc9a8c	20"	1	t	2025-10-22 13:25:02.301285
a6594819-7910-4d02-a161-908fa2016f41	5cdef655-4cf2-400f-8609-189236cc9a8c	24"	2	t	2025-10-22 13:25:02.301285
db375b41-b8c0-4402-9c24-cac66f23592a	5cdef655-4cf2-400f-8609-189236cc9a8c	30"	3	t	2025-10-22 13:25:02.301285
6ca72aa3-fee9-43d2-b300-8ed6dd5d6f07	d277d247-b962-4e69-a188-441a99fcab91	20"	1	t	2025-10-22 13:25:02.32327
4226f44d-b9d8-4aac-a370-86152b33641d	d277d247-b962-4e69-a188-441a99fcab91	24"	2	t	2025-10-22 13:25:02.32327
9ddd259b-8870-4c84-9538-4d14665965e7	d277d247-b962-4e69-a188-441a99fcab91	30"	3	t	2025-10-22 13:25:02.32327
dcb515c0-692b-4d26-84e4-4ac99a37038b	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	20"	1	t	2025-10-22 13:25:02.338073
760190a1-f9e2-441a-8d02-beab59a673c4	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	24"	2	t	2025-10-22 13:25:02.338073
b347b0c6-402f-4f22-b293-3689a5626efe	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	30"	3	t	2025-10-22 13:25:02.338073
ad87cd01-bdeb-4867-aa8d-42850df31158	60712846-8225-4ceb-928f-d953792f4a26	20"	1	t	2025-10-22 13:25:02.389824
958beede-5976-4462-90b7-5fa6b36a5282	60712846-8225-4ceb-928f-d953792f4a26	24"	2	t	2025-10-22 13:25:02.389824
5f4c6545-5d90-4521-8dca-d2862c9c034e	60712846-8225-4ceb-928f-d953792f4a26	30"	3	t	2025-10-22 13:25:02.389824
97b2f363-bace-414b-a9e6-83e7c017252f	e43c9a87-1fc4-44c4-a60d-aa469036bb89	20"	1	t	2025-10-22 13:25:02.407117
f853b4a8-86c2-42ec-b533-9dd089259385	e43c9a87-1fc4-44c4-a60d-aa469036bb89	24"	2	t	2025-10-22 13:25:02.407117
79e504ea-2800-4a21-ba84-8f0df04625e2	e43c9a87-1fc4-44c4-a60d-aa469036bb89	30"	3	t	2025-10-22 13:25:02.407117
\.


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.payment (payment_id, invoice_id, amount, payment_method, payment_status, due_date, paid_date, reference, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: planned_production; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.planned_production (planned_production_id, plan_number, product_id, quantity_planned, uom_id, forecast_method, start_date, end_date, delivery_date, status, priority, created_by, created_at, updated_at, forecast_data, material_requirements) FROM stdin;
e31a5dae-be70-4eb3-927a-5340fcf29323	PP-20251105-001	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	MANUAL	2025-11-05	\N	\N	IN_PROGRESS	1	system	2025-11-05 13:57:22.141665	2025-11-06 14:35:07.71619	{"summary": {"total_cost": 0, "can_proceed": false, "shortage_cost": 0, "total_shortages": 3, "critical_shortages": 0, "total_requirements": 6}, "bom_explosion": {"summary": {"critical_items": 0, "total_cut_parts": 2, "total_bought_outs": 4, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 26}, "cut_parts": [{"uom": null, "bom_id": "9d9b3c78-1555-42ec-a36b-0b9980607f8d", "blank_id": "04c6b03d-d2e6-4c61-a6b7-d669e60d5acf", "item_name": "Shell HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 1, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 3, "efficiency_pct": 63.7, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 50, "blank_weight_kg": 14.886, "sheets_required": 17, "blank_dimensions": {"width_mm": 700, "length_mm": 903, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 50, "sub_assembly_name": "Shell", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 51, "estimated_scrap_weight_kg": 0}, {"uom": null, "bom_id": "92bab038-5e00-4444-8ec5-717a89a3407c", "blank_id": "f80c6f72-fd08-4a9b-8a41-eadff822e9df", "item_name": "Dish HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 12, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 18, "efficiency_pct": 77.5, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 150, "blank_weight_kg": 3.018, "sheets_required": 9, "blank_dimensions": {"width_mm": 358, "length_mm": 358, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 3, "required_quantity": 150, "sub_assembly_name": "Dish", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 162, "estimated_scrap_weight_kg": 0}], "product_id": "077b6e4a-a968-45e7-bff7-d3259f88eaea", "bought_outs": [{"uom": null, "bom_id": "81cb98bd-db9a-4c37-91c1-8565e71d0f17", "item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "material_code": "Shaft Ø28", "material_name": "rod", "operation_code": "WELD", "scrap_quantity": 0, "total_quantity": 700, "quantity_per_unit": 14, "required_quantity": 700, "sub_assembly_name": "Shaft", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "aed05fa4-363f-4e37-b952-514c12f92dad", "item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "operation_code": null, "scrap_quantity": 0, "total_quantity": 150, "quantity_per_unit": 3, "required_quantity": 150, "sub_assembly_name": "Plastic Cap 1/4", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "f456c782-15c1-4d8d-b681-2447ed767c04", "item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 550, "quantity_per_unit": 11, "required_quantity": 550, "sub_assembly_name": "Plastic Cap 3/8", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "0c693619-8067-4fbc-8b5c-e6b81e4c4009", "item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "material_code": "Paint", "material_name": "Paint", "operation_code": "Paint", "scrap_quantity": 0, "total_quantity": 5, "quantity_per_unit": 0.1, "required_quantity": 5, "sub_assembly_name": "Paint", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 50, "explosion_timestamp": "2025-11-05T13:57:26.894Z", "total_material_cost": 0}, "mrp_run_timestamp": "2025-11-05T13:57:26.962Z"}	[{"item_name": "Shell HRC", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "has_shortage": true, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": "SHEET", "sheet_dimensions": "null×null×3", "quantity_required": 17, "quantity_shortage": 299, "quantity_available": -282}, {"item_name": "Dish HRC", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "has_shortage": true, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": "SHEET", "sheet_dimensions": "null×null×3", "quantity_required": 9, "quantity_shortage": 291, "quantity_available": -282}, {"item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "has_shortage": true, "material_code": "Shaft Ø28", "material_name": "rod", "material_type": "BOUGHT_OUT", "quantity_required": 700, "quantity_shortage": 700, "quantity_available": 0}, {"item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "has_shortage": false, "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "material_type": "BOUGHT_OUT", "quantity_required": 150, "quantity_shortage": 0, "quantity_available": 1500}, {"item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "has_shortage": false, "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "material_type": "BOUGHT_OUT", "quantity_required": 550, "quantity_shortage": 0, "quantity_available": 5500}, {"item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "has_shortage": false, "material_code": "Paint", "material_name": "Paint", "material_type": "BOUGHT_OUT", "quantity_required": 5, "quantity_shortage": 0, "quantity_available": 50}]
abca4cf7-f9f0-4acb-a5d9-d9c427f70699	PP-20251222-001	077b6e4a-a968-45e7-bff7-d3259f88eaea	10	\N	MRP_BASED	2025-12-22	\N	\N	MRP_PLANNED	1	system	2025-12-22 18:01:33.647707	2025-12-22 18:01:39.848788	{"summary": {"total_cost": 0, "can_proceed": true, "shortage_cost": 0, "total_shortages": 0, "critical_shortages": 0, "total_requirements": 8}, "bom_explosion": {"summary": {"critical_items": 0, "total_cut_parts": 2, "total_bought_outs": 6, "total_consumables": 0, "total_material_cost": 0, "total_sheets_required": 6}, "cut_parts": [{"uom": null, "bom_id": "9d9b3c78-1555-42ec-a36b-0b9980607f8d", "blank_id": "04c6b03d-d2e6-4c61-a6b7-d669e60d5acf", "item_name": "Shell HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 2, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 3, "efficiency_pct": 63.7, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 10, "blank_weight_kg": 14.886, "sheets_required": 4, "blank_dimensions": {"width_mm": 700, "length_mm": 903, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 1, "required_quantity": 10, "sub_assembly_name": "Shell", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 12, "estimated_scrap_weight_kg": 0}, {"uom": null, "bom_id": "92bab038-5e00-4444-8ec5-717a89a3407c", "blank_id": "f80c6f72-fd08-4a9b-8a41-eadff822e9df", "item_name": "Dish HRC", "scrap_pct": null, "unit_cost": 0, "sheet_size": "null×null×3", "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "extra_blanks": 6, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": null, "pcs_per_sheet": 18, "efficiency_pct": 77.5, "operation_code": "CUT", "scrap_quantity": 0, "total_quantity": 30, "blank_weight_kg": 3.018, "sheets_required": 2, "blank_dimensions": {"width_mm": 358, "length_mm": 358, "thickness_mm": 3}, "sheet_dimensions": {"width_mm": null, "length_mm": null, "thickness_mm": 3}, "cutting_direction": null, "quantity_per_unit": 3, "required_quantity": 30, "sub_assembly_name": "Dish", "scrap_allowance_pct": "0.00", "actual_blanks_produced": 36, "estimated_scrap_weight_kg": 0}], "product_id": "077b6e4a-a968-45e7-bff7-d3259f88eaea", "bought_outs": [{"uom": null, "bom_id": "81cb98bd-db9a-4c37-91c1-8565e71d0f17", "item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "material_code": "Shaft Ø28", "material_name": "rod", "operation_code": "WELD", "scrap_quantity": 0, "total_quantity": 140, "quantity_per_unit": 14, "required_quantity": 140, "sub_assembly_name": "Shaft", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "aed05fa4-363f-4e37-b952-514c12f92dad", "item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "operation_code": null, "scrap_quantity": 0, "total_quantity": 30, "quantity_per_unit": 3, "required_quantity": 30, "sub_assembly_name": "Plastic Cap 1/4", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "f456c782-15c1-4d8d-b681-2447ed767c04", "item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "operation_code": null, "scrap_quantity": 0, "total_quantity": 110, "quantity_per_unit": 11, "required_quantity": 110, "sub_assembly_name": "Plastic Cap 3/8", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "0c693619-8067-4fbc-8b5c-e6b81e4c4009", "item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "material_code": "Paint", "material_name": "Paint", "operation_code": "Paint", "scrap_quantity": 0, "total_quantity": 1, "quantity_per_unit": 0.1, "required_quantity": 1, "sub_assembly_name": "Paint", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "be8e10a8-b69d-40b2-b810-24b88fcc1311", "item_name": "Welding Wire Ø1.2", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "c28c0713-ad11-4a51-9d99-2c15196ba76b", "material_code": "Welding Wire", "material_name": "Welding Wire Ø1.2", "operation_code": "welding", "scrap_quantity": 0, "total_quantity": 2.9, "quantity_per_unit": 0.29, "required_quantity": 2.9, "sub_assembly_name": "Welding Wire", "scrap_allowance_pct": "0.00"}, {"uom": null, "bom_id": "7e18d793-7afe-4bdd-bccc-8d22914f380f", "item_name": "FUEL", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "24b09d8a-8515-4f46-8451-9f8c7cfcfed3", "material_code": "F1", "material_name": "FUEL", "operation_code": null, "scrap_quantity": 0, "total_quantity": 2, "quantity_per_unit": 0.2, "required_quantity": 2, "sub_assembly_name": "fuel", "scrap_allowance_pct": "0.00"}], "consumables": [], "sub_assemblies": [], "quantity_requested": 10, "explosion_timestamp": "2025-12-22T18:01:39.885Z", "total_material_cost": 0}, "mrp_run_timestamp": "2025-12-22T18:01:39.961Z"}	[{"item_name": "Shell HRC", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "has_shortage": false, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": "SHEET", "sheet_dimensions": "null×null×3", "quantity_required": 4, "quantity_shortage": 0, "quantity_available": 5705}, {"item_name": "Dish HRC", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "6d389b17-3618-4d85-9c2c-a973a2a62279", "has_shortage": false, "material_code": "EMCM009", "material_name": "HRC Sheet", "material_type": "SHEET", "sheet_dimensions": "null×null×3", "quantity_required": 2, "quantity_shortage": 0, "quantity_available": 5705}, {"item_name": "rod", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "dc604e33-9302-4f82-9c81-9afd572a603f", "has_shortage": false, "material_code": "Shaft Ø28", "material_name": "rod", "material_type": "BOUGHT_OUT", "quantity_required": 140, "quantity_shortage": 0, "quantity_available": 80700}, {"item_name": "Plastic Cap 1/4", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "0f126f28-ce5d-48c3-ab33-466a636f34cf", "has_shortage": false, "material_code": "PC-1", "material_name": "Plastic Cap 1/4", "material_type": "BOUGHT_OUT", "quantity_required": 30, "quantity_shortage": 0, "quantity_available": 26650}, {"item_name": "Plastic Cap 3/8", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "2fb8c1d0-380a-4d05-89ae-fd30bad51b0f", "has_shortage": false, "material_code": "PC-2", "material_name": "Plastic Cap 3/8", "material_type": "BOUGHT_OUT", "quantity_required": 110, "quantity_shortage": 0, "quantity_available": 71050}, {"item_name": "Paint", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "509e4501-199b-409b-8fe2-2ff4f29b495c", "has_shortage": false, "material_code": "Paint", "material_name": "Paint", "material_type": "BOUGHT_OUT", "quantity_required": 1, "quantity_shortage": 0, "quantity_available": 10555}, {"item_name": "Welding Wire Ø1.2", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "c28c0713-ad11-4a51-9d99-2c15196ba76b", "has_shortage": false, "material_code": "Welding Wire", "material_name": "Welding Wire Ø1.2", "material_type": "BOUGHT_OUT", "quantity_required": 2.9, "quantity_shortage": 0, "quantity_available": 11610}, {"item_name": "FUEL", "unit_cost": 0, "total_cost": 0, "is_critical": false, "material_id": "24b09d8a-8515-4f46-8451-9f8c7cfcfed3", "has_shortage": false, "material_code": "F1", "material_name": "FUEL", "material_type": "BOUGHT_OUT", "quantity_required": 2, "quantity_shortage": 0, "quantity_available": 1010}]
\.


--
-- Data for Name: procurement_request; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.procurement_request (id, material_id, quantity, status, requested_by, approved_by, received_by, notes, reference_po, created_at, updated_at, rejection_reason) FROM stdin;
dc9aea23-d779-4652-8e64-2e415595577d	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Welding Wire (fallback material). PR ID: PR-1760294231710-3a5y3264n. PO will be: PO-1760294245756-k84f3y	PO-1760294245756-k84f3y	2025-10-12 18:37:25.765	2025-10-12 18:38:20.476	\N
2da8de68-be4b-4a97-b3b4-36e64edecb2d	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	25	RECEIVED	MRP System	current_user	current_user	Auto-generated from MRP Planning for Welding Wire (fallback material). PR ID: PR-1760290834263-6spf72uyi. PO will be: PO-1760290844482-d83si2	PO-1760290844482-d83si2	2025-10-12 17:40:44.497	2025-10-12 17:44:25.853	\N
f773c91d-e795-4b9f-98ac-495a6d67294d	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	25	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Welding Wire (fallback material). PR ID: PR-1760290419015-2ux4y03vh. PO will be: PO-1760290428694-8c4ssx	PO-1760290428694-8c4ssx	2025-10-12 17:33:48.704	2025-10-12 18:11:42.49	\N
11b708fa-cf66-42a9-b0dc-29f781f77b7c	cbd03a02-3157-499e-b763-35a2fe5e2baa	50	FULFILLED	test_user	procurement_team	procurement_team	Test procurement request for Symentex Material	\N	2025-09-23 16:48:59.155	2025-09-23 17:30:38.718	\N
5134931d-2552-45f3-9db6-fce1c649e11a	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	PENDING	MRP System	\N	\N	Auto-generated from MRP Planning for Main (fallback material). PR ID: PR-1760293534440-su42nyogm. PO will be: PO-1760293549016-6l4s6f	PO-1760293549016-6l4s6f	2025-10-12 18:25:49.043	2025-10-12 18:25:49.043	\N
df583e63-0244-4ce4-971b-a6f44624ba33	cbd03a02-3157-499e-b763-35a2fe5e2baa	25	FULFILLED	test-user	procurement-manager	warehouse-staff	Test procurement for workflow integration	\N	2025-09-23 19:04:15.935	2025-09-23 21:52:07.428	\N
9df3418a-7f17-4bc7-aa54-346c3c12aafd	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	40	FULFILLED	current_user	\N	current_user	\N	\N	2025-09-23 17:25:41.41	2025-09-23 22:23:40.739	\N
23bfe5fe-d9d4-40b1-8090-1cf154753da7	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	500	FULFILLED	current_user	\N	current_user	\N	\N	2025-09-23 21:39:18.217	2025-09-23 22:24:17.098	\N
522a39dd-7cf2-4578-aff2-99aeab44f5f0	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Main (fallback material). PR ID: PR-1760294231709-5an216zpl. PO will be: PO-1760294242996-ymygbc	PO-1760294242996-ymygbc	2025-10-12 18:37:23.005	2025-10-12 18:58:25.685	\N
fb74ff80-9c81-42ba-98b7-b21b1933901c	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	25	RECEIVED	MRP System	current_user	current_user	Auto-generated from MRP Planning for Welding Wire (fallback material). PR ID: PR-1760287308158-f2k089fgq. PO will be: PO-1760287317174-19bqvi	PO-1760287317174-19bqvi	2025-10-12 16:41:57.181	2025-10-12 16:44:04.781	\N
2b72f3f2-4856-4fb3-a5f9-198e6876cf3e	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	20	PENDING	MRP System	\N	\N	Auto-generated from MRP Planning for Rubber Sheet. PR ID: PR-1760289613804-n4owh6upo. PO will be: PO-1760289625713-7tyelw	PO-1760289625713-7tyelw	2025-10-12 17:20:25.72	2025-10-12 17:20:25.72	\N
4bc0775f-6534-4a9f-aae6-f35084f86e20	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	5	PENDING	MRP System	\N	\N	Auto-generated from MRP Planning for Steel Sheet 4x8. PR ID: PR-1760290067124-fyyov8fm1. PO will be: PO-1760290072380-89oyjs	PO-1760290072380-89oyjs	2025-10-12 17:27:52.386	2025-10-12 17:27:52.386	\N
a99df938-fc53-4859-9ca7-ac25140c3ab1	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	100	PENDING	MRP System	\N	\N	Auto-generated from MRP Planning for Rubber Sheet. PR ID: PR-1760290098957-0qnfac8sj. PO will be: PO-1760290104279-diui9r	PO-1760290104279-diui9r	2025-10-12 17:28:24.29	2025-10-12 17:28:24.29	\N
3eb93779-e151-4182-9d86-01339d18ef68	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	10	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Steel Sheet 4x8. PR ID: PR-1760290130818-n7zr6f0jd. PO will be: PO-1760290136004-6clfwk	PO-1760290136004-6clfwk	2025-10-12 17:28:56.014	2025-10-12 17:30:54.93	\N
1584341e-12fc-4881-8459-0d0cbc75f0c9	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	91	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Steel Sheet 4x8 (Fastener) (fallback material). PR ID: PR-1760297882750-d5zh8os6x. PO will be: PO-1760297891028-a8mda0	PO-1760297891028-a8mda0	2025-10-12 19:38:11.061	2025-10-13 06:42:01.896	\N
23681d11-b282-4258-93a7-e7b7c79d5a68	c87cc789-6fcd-4b9a-bb94-c2e8804e568f	5	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Rubber Sheet. PR ID: PR-1760294379264-xh4zzhw9h. PO will be: PO-1760294405895-ohjoj4	PO-1760294405895-ohjoj4	2025-10-12 18:40:05.9	2025-10-12 18:58:24.806	\N
53390ac6-9be2-4773-88cb-81adbe137700	cbd03a02-3157-499e-b763-35a2fe5e2baa	5	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Symentex Material. PR ID: PR-1760294379264-s9e6v1x5z. PO will be: PO-1760294404666-duxd70	PO-1760294404666-duxd70	2025-10-12 18:40:04.671	2025-10-12 18:58:25.003	\N
95c4e5eb-a1d5-40de-9417-ea488680788d	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	1	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Welding Wire (fallback material). PR ID: PR-1760293534440-dg3bopqgk. PO will be: PO-1760293552036-39vjun	PO-1760293552036-39vjun	2025-10-12 18:25:52.073	2025-10-12 18:58:26.578	\N
5b1e4d02-2541-4f93-9cb4-c19e03a3d526	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	20	FULFILLED	MRP System	\N	\N	Auto-generated from MRP Planning for Steel Sheet 4x8 (Fastener) (fallback material). PR ID: PR-1760293534440-svyqbbsnq. PO will be: PO-1760293550668-b7ylg4	PO-1760293550668-b7ylg4	2025-10-12 18:25:50.688	2025-10-12 18:58:26.931	\N
d7985884-9967-4d6d-8f1f-5e6da96db004	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	20	RECEIVED	MRP System	current_user	\N	Auto-generated from MRP Planning for Steel Sheet 4x8 (Fastener) (fallback material). PR ID: PR-1760294231709-zthvgbg87. PO will be: PO-1760294244587-mfvw5e	PO-1760294244587-mfvw5e	2025-10-12 18:37:24.595	2025-10-12 18:59:29.877	\N
bba308b2-a3ed-493b-846d-50d3ed2dbdc6	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	5500	APPROVED	MRP System	current_user	\N	Auto-generated from MRP Planning for Plastic Cap 3/8. PR ID: PR-1762163311927-34f0pz3g5. PO will be: PO-1762163340544-5yxgmf	PO-1762163340544-5yxgmf	2025-11-03 09:49:00.554	2025-11-03 09:56:00.394	\N
8d1980d1-2552-4b72-b2c4-8bcb3e20f151	0f126f28-ce5d-48c3-ab33-466a636f34cf	1500	APPROVED	MRP System	current_user	\N	Auto-generated from MRP Planning for Plastic Cap 1/4. PR ID: PR-1762163311927-1vvr9xk3p. PO will be: PO-1762163339370-bzgaqw	PO-1762163339370-bzgaqw	2025-11-03 09:48:59.378	2025-11-03 09:56:17.648	\N
2f919f3d-a34b-440f-accf-213d3d5676bb	509e4501-199b-409b-8fe2-2ff4f29b495c	5	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for Paint (PR PR-1762560399115-vth652drf)	\N	2025-11-08 00:06:39.121	2025-11-08 00:07:44.345	\N
0980e309-2b69-460a-b1f7-15e3e83b29d8	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for Plastic Cap 3/8 (PR PR-1762560399105-q00kj2lnt)	\N	2025-11-08 00:06:39.11	2025-11-08 00:07:47.921	\N
13ed5946-74dc-4677-8721-ecd2caccd607	509e4501-199b-409b-8fe2-2ff4f29b495c	50	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Paint. PR ID: PR-1762163555017-q89dlh1wp. PO will be: PO-1762163587887-amdpbp	PO-1762163587887-amdpbp	2025-11-03 09:53:07.893	2025-11-03 10:05:33.003	\N
3e827954-d6ce-49af-8b4b-423c28f138c0	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	5500	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Plastic Cap 3/8. PR ID: PR-1762163555017-hbfqj93z8. PO will be: PO-1762163577701-vanlfz	PO-1762163577701-vanlfz	2025-11-03 09:52:57.707	2025-11-03 10:08:12.667	\N
d5ed808f-e3a1-4aa2-bea1-4430ecf62ec0	0f126f28-ce5d-48c3-ab33-466a636f34cf	1500	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Plastic Cap 1/4. PR ID: PR-1762163555017-h4v7d7wx8. PO will be: PO-1762163576203-zlnngl	PO-1762163576203-zlnngl	2025-11-03 09:52:56.208	2025-11-03 10:08:19.438	\N
306f5a61-736a-458b-b3aa-bd2b5299e18f	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for Plastic Cap 1/4 (PR PR-1762560399095-j5m9je5bz)	\N	2025-11-08 00:06:39.1	2025-11-08 00:07:51.012	\N
90c2977d-8f7a-4218-9c0f-b9e1bcb14cc3	dc604e33-9302-4f82-9c81-9afd572a603f	700	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for rod (PR PR-1762560399084-ku8yyg914)	\N	2025-11-08 00:06:39.089	2025-11-08 00:07:53.629	\N
ffa28ec3-2715-4a7d-9cf0-acec50724c95	6d389b17-3618-4d85-9c2c-a973a2a62279	9	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560399073-lhmtfv5bz)	\N	2025-11-08 00:06:39.078	2025-11-08 00:07:56.67	\N
208c2f75-b59e-406a-987b-382a2d4c1785	6d389b17-3618-4d85-9c2c-a973a2a62279	17	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560399061-gt8bnnto5)	\N	2025-11-08 00:06:39.067	2025-11-08 00:08:00.165	\N
dbd530e7-6cdf-4489-b677-bdb107075be3	509e4501-199b-409b-8fe2-2ff4f29b495c	50	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Paint. PR ID: PR-1762165184551-7sqjozkql. PO will be: PO-1762165210001-oooedt	PO-1762165210001-oooedt	2025-11-03 10:20:10.006	2025-11-03 10:20:46.707	\N
883546bd-a6ac-4002-ac58-a96238bd798a	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	5500	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Plastic Cap 3/8. PR ID: PR-1762165184551-z32n3ydcn. PO will be: PO-1762165203165-n5fa83	PO-1762165203165-n5fa83	2025-11-03 10:20:03.17	2025-11-03 10:20:50.041	\N
8cdedcb2-cd19-49b8-9cab-6f2fee96cb39	0f126f28-ce5d-48c3-ab33-466a636f34cf	1500	FULFILLED	MRP System	current_user	\N	Auto-generated from MRP Planning for Plastic Cap 1/4. PR ID: PR-1762165184551-eiqfvlre3. PO will be: PO-1762165202100-rz98il	PO-1762165202100-rz98il	2025-11-03 10:20:02.104	2025-11-03 10:20:54.083	\N
08c541e2-3903-4e13-854b-4f9539446574	6d389b17-3618-4d85-9c2c-a973a2a62279	5	APPROVED	Test Runner	current_user	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560116967-wb09k02km)	\N	2025-11-08 00:01:57.02	2025-11-08 00:08:03.441	\N
58433d2e-75bc-4941-97f0-55c24b1a40df	6d389b17-3618-4d85-9c2c-a973a2a62279	17	PENDING	MRP System	\N	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560692225-iy4ti8irt)	\N	2025-11-08 00:11:32.227	2025-11-08 00:11:32.227	\N
0bbe66b5-bb33-4dbd-beeb-67ed6a5a4c4a	c28c0713-ad11-4a51-9d99-2c15196ba76b	15	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for Welding Wire Ø1.2 (PR PR-1762560399126-c1taj2aha)	\N	2025-11-08 00:06:39.131	2025-11-08 00:07:38.789	\N
841c35d6-1ccc-4b7c-b5d5-42540c5c2d04	6d389b17-3618-4d85-9c2c-a973a2a62279	9	PENDING	MRP System	\N	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560692233-mo5nlgk0r)	\N	2025-11-08 00:11:32.235	2025-11-08 00:11:32.235	\N
18dfb36b-e7da-4564-9b17-b7f0a81a76b5	dc604e33-9302-4f82-9c81-9afd572a603f	700	PENDING	MRP System	\N	\N	MRP shortage auto-generated for rod (PR PR-1762560692245-8c16l7eyt)	\N	2025-11-08 00:11:32.247	2025-11-08 00:11:32.247	\N
c03c9b1a-eadd-4a6b-9638-93ef731651cb	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Plastic Cap 1/4 (PR PR-1762560692256-drvv1nbdo)	\N	2025-11-08 00:11:32.258	2025-11-08 00:11:32.258	\N
1896fd72-38aa-4bfa-8906-02fdfa910ce0	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Plastic Cap 3/8 (PR PR-1762560692267-z53yrwgko)	\N	2025-11-08 00:11:32.269	2025-11-08 00:11:32.269	\N
9b602399-2b0e-4575-abfe-cbbd33275a8d	509e4501-199b-409b-8fe2-2ff4f29b495c	5	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Paint (PR PR-1762560692278-bhzjht0bo)	\N	2025-11-08 00:11:32.281	2025-11-08 00:11:32.281	\N
ac1a6672-474b-4edb-a3c2-88ddf7c29dd2	c28c0713-ad11-4a51-9d99-2c15196ba76b	15	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Welding Wire Ø1.2 (PR PR-1762560692291-roi73spdh)	\N	2025-11-08 00:11:32.294	2025-11-08 00:11:32.294	\N
7a3834ca-1c41-4004-99c5-f4a85096974e	6d389b17-3618-4d85-9c2c-a973a2a62279	17	PENDING	MRP System	\N	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560722955-kf4lyl6on)	\N	2025-11-08 00:12:02.958	2025-11-08 00:12:02.958	\N
43d8024d-9ccb-4cf3-b37e-af63cfc89548	6d389b17-3618-4d85-9c2c-a973a2a62279	9	PENDING	MRP System	\N	\N	MRP shortage auto-generated for HRC Sheet (PR PR-1762560722969-3zomonbne)	\N	2025-11-08 00:12:02.973	2025-11-08 00:12:02.973	\N
6c3cb281-d761-4999-aafd-26d1be4bf578	dc604e33-9302-4f82-9c81-9afd572a603f	700	PENDING	MRP System	\N	\N	MRP shortage auto-generated for rod (PR PR-1762560722977-0pv7bedbw)	\N	2025-11-08 00:12:02.98	2025-11-08 00:12:02.98	\N
33a84d02-b0bd-45ea-9109-fae9e4789ee7	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Plastic Cap 1/4 (PR PR-1762560722989-nq6zxt2e2)	\N	2025-11-08 00:12:02.991	2025-11-08 00:12:02.991	\N
1bf77313-76fb-4bf5-aa9d-916ab7cc4f87	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Plastic Cap 3/8 (PR PR-1762560723000-1os2kig99)	\N	2025-11-08 00:12:03.002	2025-11-08 00:12:03.002	\N
f445ff3c-b8c7-4428-9c78-b6ffb500d265	509e4501-199b-409b-8fe2-2ff4f29b495c	5	PENDING	MRP System	\N	\N	MRP shortage auto-generated for Paint (PR PR-1762560723010-jsk0smlfd)	\N	2025-11-08 00:12:03.013	2025-11-08 00:12:03.013	\N
1fef7afe-fd85-49b3-bdb2-e3a6952bf070	6d389b17-3618-4d85-9c2c-a973a2a62279	26	PENDING	MRP System	\N	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-11-08 00:38:24.704	2025-11-08 00:38:24.704	\N
e4733d23-3020-4744-9f98-157763864039	dc604e33-9302-4f82-9c81-9afd572a603f	700	PENDING	MRP System	\N	\N	MRP auto-generated shortage for rod.	\N	2025-11-08 00:38:24.717	2025-11-08 00:38:24.717	\N
a9c82b0f-ecba-4f98-a5fa-41fe11e94be0	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-11-08 00:38:24.725	2025-11-08 00:38:24.725	\N
9ef81cd3-0c46-48c4-a39b-39699f0433e7	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-11-08 00:38:24.737	2025-11-08 00:38:24.737	\N
65093b6e-0a2f-44f8-966c-6c6cad52e8e0	509e4501-199b-409b-8fe2-2ff4f29b495c	5	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Paint.	\N	2025-11-08 00:38:24.754	2025-11-08 00:38:24.754	\N
361ca715-a8a5-4cdf-8e66-7dfdb5d2cc56	c28c0713-ad11-4a51-9d99-2c15196ba76b	15	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Welding Wire Ø1.2.	\N	2025-11-08 00:38:24.765	2025-11-08 00:38:24.765	\N
f8bcea56-114d-47f1-831a-be9e0c6a059f	c28c0713-ad11-4a51-9d99-2c15196ba76b	15	APPROVED	MRP System	current_user	\N	MRP shortage auto-generated for Welding Wire Ø1.2 (PR PR-1762560723022-bwko83q0n)	\N	2025-11-08 00:12:03.024	2025-11-08 00:39:32.236	\N
d67f171d-f20e-4771-bd75-ea13a8c3be0b	509e4501-199b-409b-8fe2-2ff4f29b495c	5	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Paint.	\N	2025-11-08 00:45:45.454	2025-11-08 00:47:27.831	\N
9c60f87a-8774-48eb-889c-4b92b3b24858	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-11-08 00:45:45.443	2025-11-08 00:47:30.587	\N
0de300af-a27f-466e-a18d-e319dc37eb49	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-11-08 00:45:45.432	2025-11-08 00:47:35.085	\N
29f1abc0-fb07-4ff6-8fed-21cf582664b3	dc604e33-9302-4f82-9c81-9afd572a603f	700	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for rod.	\N	2025-11-08 00:45:45.421	2025-11-08 00:47:38.199	\N
cd0b301e-3d05-4aec-89fd-5cc505f391d1	6d389b17-3618-4d85-9c2c-a973a2a62279	26	APPROVED	MRP System	current_user	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-11-08 00:45:45.408	2025-11-08 00:47:41.992	\N
e17c91cd-dc12-4c83-b60a-1ea0134370e9	6d389b17-3618-4d85-9c2c-a973a2a62279	26	PENDING	MRP System	\N	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-11-10 10:39:18.094	2025-11-10 10:39:18.094	\N
a5c879da-4bc5-4c03-83b7-f596165bcdd1	dc604e33-9302-4f82-9c81-9afd572a603f	700	PENDING	MRP System	\N	\N	MRP auto-generated shortage for rod.	\N	2025-11-10 10:39:18.103	2025-11-10 10:39:18.103	\N
61eabe18-06bd-410b-9ab0-c1f06c1953cf	0f126f28-ce5d-48c3-ab33-466a636f34cf	150	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-11-10 10:39:18.116	2025-11-10 10:39:18.116	\N
5126bdb9-8aa7-48f6-91d5-6fe79f58a1aa	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	550	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-11-10 10:39:18.128	2025-11-10 10:39:18.128	\N
07e594c7-7830-4220-864b-2f67ee0f690c	6d389b17-3618-4d85-9c2c-a973a2a62279	2449	PENDING	MRP System	\N	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-11-15 12:21:14.464	2025-11-15 12:21:14.464	\N
4f01c512-686d-4507-83a0-6ec7a7612f9a	dc604e33-9302-4f82-9c81-9afd572a603f	69300	PENDING	MRP System	\N	\N	MRP auto-generated shortage for rod.	\N	2025-11-15 12:21:14.478	2025-11-15 12:21:14.478	\N
85afa488-d98f-485f-bc80-79ce44e6e6c9	0f126f28-ce5d-48c3-ab33-466a636f34cf	14850	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-11-15 12:21:14.485	2025-11-15 12:21:14.485	\N
c8e2de19-9a75-4048-b8ca-3e611328237d	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	54450	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-11-15 12:21:14.492	2025-11-15 12:21:14.492	\N
6f85e95f-5e74-4b00-96d6-730490bcef63	509e4501-199b-409b-8fe2-2ff4f29b495c	495	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Paint.	\N	2025-11-15 12:21:14.499	2025-11-15 12:21:14.499	\N
e23a32ea-f2b2-4780-a75e-35b53e624b2b	c28c0713-ad11-4a51-9d99-2c15196ba76b	1435	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Welding Wire Ø1.2.	\N	2025-11-15 12:21:14.505	2025-11-15 12:21:14.505	\N
9d43e0e9-5c9d-4f68-8f49-211e0b332b23	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	1000	PENDING	MRP System	\N	\N	MRP auto-generated shortage for FUEL.	\N	2025-11-15 12:21:14.511	2025-11-15 12:21:14.511	\N
e0026150-174e-4073-902f-401db53b3e22	6d389b17-3618-4d85-9c2c-a973a2a62279	2474	PENDING	MRP System	\N	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-11-15 12:26:32.904	2025-11-15 12:26:32.904	\N
d45cd743-e8e5-4def-b0f1-0111c8f34c73	dc604e33-9302-4f82-9c81-9afd572a603f	70000	PENDING	MRP System	\N	\N	MRP auto-generated shortage for rod.	\N	2025-11-15 12:26:32.919	2025-11-15 12:26:32.919	\N
fe1c9d90-c45b-4aa5-a428-95554b2db86f	0f126f28-ce5d-48c3-ab33-466a636f34cf	15000	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-11-15 12:26:32.93	2025-11-15 12:26:32.93	\N
d64c2f0e-91b3-487f-9cc6-734b17cba5b7	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	55000	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-11-15 12:26:32.943	2025-11-15 12:26:32.943	\N
ba581228-167b-4b29-aba2-afb91b78a495	509e4501-199b-409b-8fe2-2ff4f29b495c	500	PENDING	MRP System	\N	\N	MRP auto-generated shortage for Paint.	\N	2025-11-15 12:26:32.955	2025-11-15 12:26:32.955	\N
38b175d0-744a-4855-a98b-52b6d024aa40	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	1010	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for FUEL.	\N	2025-11-15 12:32:11.724	2025-11-15 12:33:55.344	\N
9bbd2b58-c789-49d5-9379-b01985cfd1aa	c28c0713-ad11-4a51-9d99-2c15196ba76b	1450	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Welding Wire Ø1.2.	\N	2025-11-15 12:32:11.719	2025-11-15 12:33:58.511	\N
bbbb01b1-3cf9-444a-b67a-a8be6cc983b7	509e4501-199b-409b-8fe2-2ff4f29b495c	500	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Paint.	\N	2025-11-15 12:32:11.712	2025-11-15 12:34:01.795	\N
09a85e78-8892-4916-b8ba-232659d33a84	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	55000	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-11-15 12:32:11.706	2025-11-15 12:34:06.126	\N
fc23b0c5-63f1-4a2d-bf89-26115b386b6f	0f126f28-ce5d-48c3-ab33-466a636f34cf	15000	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-11-15 12:32:11.7	2025-11-15 12:34:10.137	\N
231f42bd-df3d-4910-bf87-a966131b4a83	dc604e33-9302-4f82-9c81-9afd572a603f	70000	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for rod.	\N	2025-11-15 12:32:11.693	2025-11-15 12:34:16.028	\N
2b435f1a-4abb-41eb-b80d-2fa2dac80a55	6d389b17-3618-4d85-9c2c-a973a2a62279	2474	APPROVED	MRP System	current_user	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-11-15 12:32:11.686	2025-11-15 12:34:41.272	\N
73ee404b-6596-4fe8-8346-6593945ba0a0	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	1010	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for FUEL.	\N	2025-11-15 12:26:32.979	2025-11-15 12:34:44.053	\N
bb7e1b59-f0b5-4b3a-b731-5aa3aba8309d	c28c0713-ad11-4a51-9d99-2c15196ba76b	1450	APPROVED	MRP System	current_user	\N	MRP auto-generated shortage for Welding Wire Ø1.2.	\N	2025-11-15 12:26:32.967	2025-11-15 12:34:58.633	\N
87657511-505b-46dd-bf7f-d7adfcb6f071	dc604e33-9302-4f82-9c81-9afd572a603f	7000	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for rod.	\N	2025-12-06 18:54:16.864	2025-12-06 18:59:25.578	\N
f405dc98-b986-473e-9622-133cdd3ddbe8	6d389b17-3618-4d85-9c2c-a973a2a62279	148	APPROVED	MRP System	admin	\N	MRP auto-generated. Aggregated from 2 shortage items for HRC Sheet.	\N	2025-12-06 18:54:16.829	2025-12-06 18:59:34.289	\N
7ea80267-b275-4a19-8003-09bb43c60e0e	c28c0713-ad11-4a51-9d99-2c15196ba76b	145	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for Welding Wire Ø1.2.	\N	2025-12-06 18:54:16.954	2025-12-06 18:59:05.417	\N
18e0fe8c-ffef-4680-a356-9ded390bb5ba	509e4501-199b-409b-8fe2-2ff4f29b495c	50	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for Paint.	\N	2025-12-06 18:54:16.931	2025-12-06 18:59:10.279	\N
dbdcf0e2-01b0-4972-ae22-a6fab126e7e7	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	5500	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for Plastic Cap 3/8.	\N	2025-12-06 18:54:16.908	2025-12-06 18:59:15.009	\N
3ca85532-f14e-42e2-b891-322b977d26b8	0f126f28-ce5d-48c3-ab33-466a636f34cf	1500	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for Plastic Cap 1/4.	\N	2025-12-06 18:54:16.886	2025-12-06 18:59:20.366	\N
88a7bcea-0071-4750-8c76-04b6e193a2ef	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	600	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for Steel ROd.	\N	2025-12-22 18:14:22.847	2025-12-22 18:15:17.623	\N
69d06d6b-610a-475e-a668-c1e4c0081d37	bcc7d31a-2588-48d1-96a4-1decee97a274	9	APPROVED	MRP System	admin	\N	MRP auto-generated shortage for CRC Sheet.	\N	2025-12-22 18:14:22.838	2025-12-22 18:15:20.397	\N
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.product (product_id, product_code, part_name, description, standard_cost, category, created_at, oem_id, model_id, uom_id, min_stock, max_stock, reorder_qty) FROM stdin;
5cdef655-4cf2-400f-8609-189236cc9a8c	89806273NM	Base Plate	\N	\N	FINISHED_GOOD	2025-10-05 16:49:36.204	afcc3db8-b40d-4f0e-9df4-0bab4b365222	511c88c4-b9e5-4336-b7b8-943811f76580	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N
d277d247-b962-4e69-a188-441a99fcab91	898486-3830 / 897924-3392	CM 1st	\N	\N	FINISHED_GOOD	2025-10-06 07:19:37.119	afcc3db8-b40d-4f0e-9df4-0bab4b365222	511c88c4-b9e5-4336-b7b8-943811f76580	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N
01b6e1c7-aa9c-4b05-9445-72c17b4d6500	898344-6020	CM 2nd	\N	\N	FINISHED_GOOD	2025-10-06 07:20:45.821	afcc3db8-b40d-4f0e-9df4-0bab4b365222	511c88c4-b9e5-4336-b7b8-943811f76580	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N
60712846-8225-4ceb-928f-d953792f4a26	898035-8253	CM Spr	\N	\N	FINISHED_GOOD	2025-10-11 07:51:59.496	afcc3db8-b40d-4f0e-9df4-0bab4b365222	511c88c4-b9e5-4336-b7b8-943811f76580	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	\N	\N	\N
e43c9a87-1fc4-44c4-a60d-aa469036bb89	10-1305	air tank	\N	\N	FINISHED_GOOD	2025-10-13 10:25:50.515	649bc929-1e21-4ee9-aa79-7a4d856d66c3	be07037c-2d3e-4f7c-94ca-ba05e1f22feb	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N
077b6e4a-a968-45e7-bff7-d3259f88eaea	88486-0580	Large Tank	\N	100	FINISHED_GOOD	2025-11-03 08:39:36.556	afcc3db8-b40d-4f0e-9df4-0bab4b365222	2731ef77-13e1-4f1b-95cb-93b20fe3c77c	bdb9c233-4f88-4867-b657-e756a076b256	\N	\N	\N
a86b3e19-c850-41ba-b958-6d08d6034bc9	newpeo	newpeons	\N	0.03	FINISHED_GOOD	2025-11-15 11:48:00.17	96a24e31-0685-4330-b35a-c73ee5f9b0c6	6cee7e9f-9f6d-4475-978e-2fb9953a3a97	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	\N	\N	\N
\.


--
-- Data for Name: production_material_consumption; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.production_material_consumption (consumption_id, production_order_id, product_id, blank_spec_id, sub_assembly_name, material_id, planned_quantity, consumed_quantity, scrap_quantity, consumption_type, created_by, created_at, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: production_material_usage; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.production_material_usage (usage_id, production_id, product_id, material_id, scrap_id, qty_required, qty_issued, uom_id, created_at) FROM stdin;
\.


--
-- Data for Name: production_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.production_order (po_id, po_no, product_id, qty_ordered, qty_completed, uom_id, priority, planned_start, planned_end, status, created_by, created_at, produced_inventory_id) FROM stdin;
\.


--
-- Data for Name: production_output; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.production_output (output_id, work_order_id, item_id, item_type, item_name, quantity_planned, quantity_good, quantity_rejected, quantity_rework, rejection_reason, recorded_at, recorded_by) FROM stdin;
\.


--
-- Data for Name: production_recipe_snapshots; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.production_recipe_snapshots (id, work_order_id, product_id, material_id, substitute_material_id, chosen_quantity, substitution_reason, cost_impact, sheet_size, cutting_layout, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: production_step; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.production_step (ps_id, production_id, step_no, operation, planned_qty, completed_qty, status, start_time, end_time, remarks) FROM stdin;
\.


--
-- Data for Name: purchase_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_order (po_id, po_no, supplier_id, pr_id, order_date, expected_date, status, created_by, created_at, "purchaseRequisitionItemId") FROM stdin;
74205ae8-698c-4883-ba76-0fe52284244f	EMCPL-2025-1762562773657-kkuszt	04cb61b4-59d8-4304-8975-5bbfe526b9dd	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	OPEN	current-user	2025-11-08 00:46:13.659	\N
3ae8046a-8b1d-43c2-ac9c-167b07c3a125	EMCPL-2025-1762562831128-fpxhcv	test-supplier-001	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	RECEIVED	current-user	2025-11-08 00:47:11.129	\N
ed89eb52-ae89-45b0-aee7-1de6ae8221f5	EMCPL-2025-1762562820977-mez18p	68aba47c-e9dc-4430-9c0a-da454021ee8b	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	RECEIVED	current-user	2025-11-08 00:47:00.979	\N
67fabc2e-95cf-43cc-9aa1-101a8b69e3bd	EMCPL-2025-1762562813680-f67lkc	test-supplier-001	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	RECEIVED	current-user	2025-11-08 00:46:53.682	\N
da0a10e6-ecd2-4627-b508-ceef4ccc3e57	EMCPL-2025-1762562801407-mr43rn	68aba47c-e9dc-4430-9c0a-da454021ee8b	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	RECEIVED	current-user	2025-11-08 00:46:41.409	\N
c7561a8e-07cb-4cab-9214-b56c67602071	EMCPL-2025-1762562784063-1bwc44	04cb61b4-59d8-4304-8975-5bbfe526b9dd	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	RECEIVED	current-user	2025-11-08 00:46:24.067	\N
c3a9a4db-94f2-466d-b748-160a57b47af6	P0124	04cb61b4-59d8-4304-8975-5bbfe526b9dd	\N	2025-11-15 05:00:00	2025-11-22 05:00:00	OPEN	\N	2025-11-15 11:56:21.749	\N
9672b0d0-cb40-4ed9-b46f-38967eca4229	EMCPL-2025-1762771175640-yovgig	68aba47c-e9dc-4430-9c0a-da454021ee8b	\N	2025-11-10 05:00:00	2025-11-17 05:00:00	RECEIVED	current-user	2025-11-10 10:39:35.645	\N
00c1d78e-957f-47c8-84ec-e301cebe2f8b	EMCPL-2025-1765041590889-zqlk0c	test-supplier-001	\N	2025-12-06 05:00:00	\N	PARTIALLY_RECEIVED	system	2025-12-06 17:19:50.891	\N
841a525e-fdd7-4d27-9497-4e3e77fff027	EMCPL-2025-1765047485811-pbt30y	04cb61b4-59d8-4304-8975-5bbfe526b9dd	\N	2025-12-06 05:00:00	2025-12-13 05:00:00	RECEIVED	current-user	2025-12-06 18:58:05.816	\N
bdb0c0e5-1e9c-455d-bc90-dd9c4bb8b382	EMCPL-2025-1765047471213-v6roji	test-supplier-001	\N	2025-12-06 05:00:00	2025-12-13 05:00:00	RECEIVED	current-user	2025-12-06 18:57:51.293	\N
9b836c00-548e-46b0-8f07-1e72e229d525	EMCPL-2025-1766427299984-nn5moc	68aba47c-e9dc-4430-9c0a-da454021ee8b	\N	2025-12-22 05:00:00	2025-12-29 05:00:00	RECEIVED	current-user	2025-12-22 18:15:00.008	\N
80e269f7-d2fa-4a63-819e-1f82708ceb5d	PO-1762165210001-oooedt	04cb61b4-59d8-4304-8975-5bbfe526b9dd	PR-1762165184551-7sqjozkql	2025-11-03 15:20:10.01	2025-11-10 05:00:00	RECEIVED	system	2025-11-03 10:20:10.012	\N
9df45b4e-9a45-4d1e-aaa1-0718caeca15f	PO-1762165203165-n5fa83	04cb61b4-59d8-4304-8975-5bbfe526b9dd	PR-1762165184551-z32n3ydcn	2025-11-03 15:20:03.174	2025-11-10 05:00:00	RECEIVED	system	2025-11-03 10:20:03.176	\N
ca9b9ec9-faa4-4f96-9e94-e0ed4c336bc7	PO-1762165202100-rz98il	04cb61b4-59d8-4304-8975-5bbfe526b9dd	PR-1762165184551-eiqfvlre3	2025-11-03 15:20:02.108	2025-11-10 05:00:00	RECEIVED	system	2025-11-03 10:20:02.11	\N
d13cd9ea-5b03-4673-b6ec-5d7773846836	PO-1762165200867-vh5pk2	04cb61b4-59d8-4304-8975-5bbfe526b9dd	PR-1762165184551-o9gs7ehbw	2025-11-03 15:20:00.878	2025-11-10 05:00:00	RECEIVED	system	2025-11-03 10:20:00.879	\N
1f0e7d75-137c-44d6-a752-7fef2484342c	PO-1762421404936-2v1ig4	68aba47c-e9dc-4430-9c0a-da454021ee8b	PR-1762421380030-b7lovj6ae	2025-11-06 14:30:04.971	2025-11-13 05:00:00	OPEN	system	2025-11-06 09:30:04.973	\N
dc81d288-24d7-4421-8233-cc5e68f5163e	PO-1762419833372-17tayy	68aba47c-e9dc-4430-9c0a-da454021ee8b	PR-1762419820157-ciohhleab	2025-11-06 14:03:53.412	2025-11-13 05:00:00	OPEN	system	2025-11-06 09:03:53.417	\N
874ff566-4601-4a23-8273-17fe88ea9f57	EMCPL-2025-1762562320945-fmkchv	04cb61b4-59d8-4304-8975-5bbfe526b9dd	\N	2025-11-08 05:00:00	2025-11-15 05:00:00	RECEIVED	current-user	2025-11-08 00:38:40.946	\N
516884c5-27a7-4459-8e2f-5a4b5345dd8a	EMCPL-2025-1763210025415-wo6sh6	test-supplier-001	\N	2025-11-15 05:00:00	2025-11-22 05:00:00	RECEIVED	current-user	2025-11-15 12:33:45.416	\N
49fcac98-20b4-4da2-97ce-cf4bf8a991d7	EMCPL-2025-1763210014995-kiq3u6	test-supplier-001	\N	2025-11-15 05:00:00	2025-11-22 05:00:00	RECEIVED	current-user	2025-11-15 12:33:34.995	\N
ac8a7750-1d77-47f3-82b8-b8fc17828e69	EMCPL-2025-1763210001606-g3j7sa	68aba47c-e9dc-4430-9c0a-da454021ee8b	\N	2025-11-15 05:00:00	2025-11-22 05:00:00	RECEIVED	current-user	2025-11-15 12:33:21.625	\N
c2801f9e-45b5-49a3-8e5e-a6085f98ace8	EMCPL-2025-1765047360874-e36tkk	68aba47c-e9dc-4430-9c0a-da454021ee8b	\N	2025-12-06 05:00:00	2025-12-13 05:00:00	RECEIVED	current-user	2025-12-06 18:56:00.942	\N
\.


--
-- Data for Name: purchase_order_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_order_item (po_item_id, po_id, product_id, material_id, uom_id, quantity, received_qty, unit_price, created_at) FROM stdin;
acb6811e-d351-4639-8b8a-b07121e16d93	874ff566-4601-4a23-8273-17fe88ea9f57	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	15	15	100	2025-11-08 00:38:40.946
2261212b-76ca-43f7-9144-450a0abd1639	74205ae8-698c-4883-ba76-0fe52284244f	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	5	0	200	2025-11-08 00:46:13.659
820e422b-7fcf-4959-b3f5-f8b4f6233c32	3ae8046a-8b1d-43c2-ac9c-167b07c3a125	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	26	26	1000	2025-11-08 00:47:11.129
fb044f19-8228-4137-a40a-983653d9b004	ed89eb52-ae89-45b0-aee7-1de6ae8221f5	\N	dc604e33-9302-4f82-9c81-9afd572a603f	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	700	700	10	2025-11-08 00:47:00.979
a009580c-34d3-40c1-ad55-ad4f892e74a4	67fabc2e-95cf-43cc-9aa1-101a8b69e3bd	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	150	150	50	2025-11-08 00:46:53.682
52a8b880-3933-4cb6-92ef-8fa376ea3e40	da0a10e6-ecd2-4627-b508-ceef4ccc3e57	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	550	550	100	2025-11-08 00:46:41.409
ce6a5d7e-32e5-45ac-becb-a27b7a0fb1d7	c7561a8e-07cb-4cab-9214-b56c67602071	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	5	5	100	2025-11-08 00:46:24.067
1913801b-0917-449f-a49f-659c3dd5873f	516884c5-27a7-4459-8e2f-5a4b5345dd8a	\N	24b09d8a-8515-4f46-8451-9f8c7cfcfed3	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	1010	1010	0	2025-11-15 12:33:45.416
20c31bc1-796e-4a63-9795-908b5164a696	49fcac98-20b4-4da2-97ce-cf4bf8a991d7	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	55000	55000	0	2025-11-15 12:33:34.995
010b82cf-249e-445e-a0be-e144061c399f	ac8a7750-1d77-47f3-82b8-b8fc17828e69	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2474	2474	0	2025-11-15 12:33:21.625
1b454a46-f84b-4e65-93bb-f9bc14d6430c	ac8a7750-1d77-47f3-82b8-b8fc17828e69	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	1450	1450	0	2025-11-15 12:33:21.625
9b086177-5c4d-4cc3-ae8f-79ea43c60115	ac8a7750-1d77-47f3-82b8-b8fc17828e69	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	15000	15000	0	2025-11-15 12:33:21.625
ecece1b9-7f79-45f2-b9a1-3367b4ee134f	ac8a7750-1d77-47f3-82b8-b8fc17828e69	\N	dc604e33-9302-4f82-9c81-9afd572a603f	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	70000	70000	0	2025-11-15 12:33:21.625
fcd00766-0e9c-4176-8ad8-5be1a5eed459	ac8a7750-1d77-47f3-82b8-b8fc17828e69	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	500	500	0	2025-11-15 12:33:21.625
8e645ec7-fdb2-4c38-9a5e-037a7a0f545c	9672b0d0-cb40-4ed9-b46f-38967eca4229	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	26	26	100	2025-11-10 10:39:35.645
1f952b43-0f30-4c73-bb2b-eb9aee4f6dad	00c1d78e-957f-47c8-84ec-e301cebe2f8b	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	50	0	7000	2025-12-06 17:19:50.891
5ad8adba-bafa-458f-b289-a4972a9b776e	bdb0c0e5-1e9c-455d-bc90-dd9c4bb8b382	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	1500	1500	2	2025-12-06 18:57:51.293
2768fd1a-4b56-44d4-addd-c1513b2f99dc	c2801f9e-45b5-49a3-8e5e-a6085f98ace8	\N	dc604e33-9302-4f82-9c81-9afd572a603f	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	7000	7000	10	2025-12-06 18:56:00.942
4e887d2e-2218-4993-9734-40ce08a0f7c6	c2801f9e-45b5-49a3-8e5e-a6085f98ace8	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	50	50	10	2025-12-06 18:56:00.942
58d5c39e-2439-4088-94e5-55a0c4bec30d	c2801f9e-45b5-49a3-8e5e-a6085f98ace8	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	148	148	25	2025-12-06 18:56:00.942
2a334415-eb07-47c7-b3e6-44f899587ff2	80e269f7-d2fa-4a63-819e-1f82708ceb5d	\N	509e4501-199b-409b-8fe2-2ff4f29b495c	\N	50	50	0	2025-11-03 10:20:10.016
ded6261d-9247-4e14-aa8b-50091ae98df7	9df45b4e-9a45-4d1e-aaa1-0718caeca15f	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	\N	5500	5500	0	2025-11-03 10:20:03.179
f6911af4-4c29-4b64-9299-9c6ef901a26e	ca9b9ec9-faa4-4f96-9e94-e0ed4c336bc7	\N	0f126f28-ce5d-48c3-ab33-466a636f34cf	\N	1500	1500	0	2025-11-03 10:20:02.117
44634a16-887c-4e98-bc75-f9b78946f132	841a525e-fdd7-4d27-9497-4e3e77fff027	\N	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	5500	5500	1	2025-12-06 18:58:05.816
c4e81389-e4f3-4a62-9e14-bf814eedd80d	bdb0c0e5-1e9c-455d-bc90-dd9c4bb8b382	\N	c28c0713-ad11-4a51-9d99-2c15196ba76b	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	145	145	2	2025-12-06 18:57:51.293
1c657ee7-ed6c-4198-a45c-194441de8c7c	9b836c00-548e-46b0-8f07-1e72e229d525	\N	bcc7d31a-2588-48d1-96a4-1decee97a274	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	9	9	100	2025-12-22 18:15:00.008
95c65a35-f792-49ae-b31f-d2a3424425e3	9b836c00-548e-46b0-8f07-1e72e229d525	\N	eb4de48b-b67d-41b5-b9b3-1a4ba5b064d6	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	600	600	100	2025-12-22 18:15:00.008
\.


--
-- Data for Name: purchase_requisition; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_requisition (pr_id, pr_no, requested_by, created_at, status, notes) FROM stdin;
PR-1760186335851-epfxd0plo	PR-1760186342602-h3omqn	system	2025-10-11 12:39:02.648	OPEN	Material: Main, Quantity: 500 Pieces
PR-1760187657591-0u5trvi8k	PR-1760187675783-j9d19u	system	2025-10-11 13:01:15.785	OPEN	Material: Main, Quantity: 500 Pieces
PR-1760187657591-esuyqphv1	PR-1760187678045-ed2xod	system	2025-10-11 13:01:18.047	OPEN	Material: Steel Sheet 4x8 (Fastener), Quantity: 2000 Pieces
PR-1760188672551-yp50e7zt0	PR-1760188682240-g4uurs	system	2025-10-11 13:18:02.243	OPEN	Material: Main, Quantity: 500 Pieces
PR-1760188698217-6zc9oga4c	PR-1760188705079-dtax39	system	2025-10-11 13:18:25.082	OPEN	Material: hsc (170×760×2.5mm), Quantity: 24 Sheet
PR-1760189096354-i1yl4pd2i	PR-1760189103170-ok8t41	system	2025-10-11 13:25:03.173	OPEN	Material: Main, Quantity: 500 Pieces
PR-1760189995193-bajhd56e2	PR-1760190002415-vdf2xg	system	2025-10-11 13:40:02.417	OPEN	Material: Main, Quantity: 500 Pieces
PR-1760190232367-p262z4era	PR-1760190263574-qj4v7a	system	2025-10-11 13:44:23.64	OPEN	Material: hsc (170×760×2.5mm), Quantity: 20 Sheet
PR-1760287308158-f2k089fgq	PR-1760287317164-h4fq8g	system	2025-10-12 16:41:57.165	OPEN	Material: Welding Wire, Quantity: 25 Pieces
PR-1760289613804-n4owh6upo	PR-1760289625707-s0v0gh	system	2025-10-12 17:20:25.71	OPEN	Material: Rubber Sheet, Quantity: 20 Pieces
PR-1760290067124-fyyov8fm1	PR-1760290072351-b5ljak	system	2025-10-12 17:27:52.373	OPEN	Material: Steel Sheet 4x8, Quantity: 5 Sheet
PR-1760290098957-0qnfac8sj	PR-1760290104248-ap4npu	system	2025-10-12 17:28:24.271	OPEN	Material: Rubber Sheet, Quantity: 100 Pieces
PR-1760290130818-n7zr6f0jd	PR-1760290135968-9oc1xk	system	2025-10-12 17:28:55.991	OPEN	Material: Steel Sheet 4x8, Quantity: 10 Sheet
PR-1760290419015-2ux4y03vh	PR-1760290428685-d1w4gg	system	2025-10-12 17:33:48.687	OPEN	Material: Welding Wire, Quantity: 25 Pieces
PR-1760290834263-6spf72uyi	PR-1760290844477-qm057n	system	2025-10-12 17:40:44.486	OPEN	Material: Welding Wire, Quantity: 25 Pieces
PR-1760293534440-su42nyogm	PR-1760293549004-pub0a7	system	2025-10-12 18:25:49.01	OPEN	Material: Main, Quantity: 5 Pieces
PR-1760293534440-svyqbbsnq	PR-1760293550659-peaa2m	system	2025-10-12 18:25:50.664	OPEN	Material: Steel Sheet 4x8 (Fastener), Quantity: 20 Pieces
PR-1760293534440-dg3bopqgk	PR-1760293552015-w88ysj	system	2025-10-12 18:25:52.02	OPEN	Material: Welding Wire, Quantity: 1 Pieces
PR-1760294231709-5an216zpl	PR-1760294242988-vt5b3q	system	2025-10-12 18:37:22.992	OPEN	Material: Main, Quantity: 5 Pieces
PR-1760294231709-zthvgbg87	PR-1760294244581-cq92i1	system	2025-10-12 18:37:24.585	OPEN	Material: Steel Sheet 4x8 (Fastener), Quantity: 20 Pieces
PR-1760294231710-3a5y3264n	PR-1760294245749-wdyqy9	system	2025-10-12 18:37:25.752	OPEN	Material: Welding Wire, Quantity: 1 Pieces
PR-1760294379264-s9e6v1x5z	PR-1760294404646-y1mmpa	system	2025-10-12 18:40:04.663	OPEN	Material: Symentex Material, Quantity: 5 Pieces
PR-1760294379264-xh4zzhw9h	PR-1760294405886-g1hsil	system	2025-10-12 18:40:05.887	OPEN	Material: Rubber Sheet, Quantity: 5 Pieces
PR-1760297882750-d5zh8os6x	PR-1760297890957-bec672	system	2025-10-12 19:38:11.016	OPEN	Material: Steel Sheet 4x8 (Fastener), Quantity: 91 Pieces
PR-1762163311927-wglmm1305	PR-1762163337051-xgyk9v	system	2025-11-03 09:48:57.101	OPEN	Material: rod, Quantity: 7000 Pieces
PR-1762163311927-1vvr9xk3p	PR-1762163339365-3lap63	system	2025-11-03 09:48:59.37	OPEN	Material: Plastic Cap 1/4, Quantity: 1500 Pieces
PR-1762163311927-34f0pz3g5	PR-1762163340536-88t7r0	system	2025-11-03 09:49:00.542	OPEN	Material: Plastic Cap 3/8, Quantity: 5500 Pieces
PR-1762163555017-76eoclf69	PR-1762163574998-alp9ni	system	2025-11-03 09:52:55	OPEN	Material: rod, Quantity: 7000 Pieces
PR-1762163555017-h4v7d7wx8	PR-1762163576195-dmtvs1	system	2025-11-03 09:52:56.197	OPEN	Material: Plastic Cap 1/4, Quantity: 1500 Pieces
PR-1762163555017-hbfqj93z8	PR-1762163577697-rs6aup	system	2025-11-03 09:52:57.699	OPEN	Material: Plastic Cap 3/8, Quantity: 5500 Pieces
PR-1762163555017-q89dlh1wp	PR-1762163587879-ec1l0j	system	2025-11-03 09:53:07.882	OPEN	Material: Paint, Quantity: 50 Pieces
PR-1762165184551-o9gs7ehbw	PR-1762165200843-0zjfb0	system	2025-11-03 10:20:00.86	OPEN	Material: rod, Quantity: 7000 Pieces
PR-1762165184551-eiqfvlre3	PR-1762165202091-ztilr4	system	2025-11-03 10:20:02.093	OPEN	Material: Plastic Cap 1/4, Quantity: 1500 Pieces
PR-1762165184551-z32n3ydcn	PR-1762165203156-k067u7	system	2025-11-03 10:20:03.158	OPEN	Material: Plastic Cap 3/8, Quantity: 5500 Pieces
PR-1762165184551-7sqjozkql	PR-1762165209996-xnps5k	system	2025-11-03 10:20:09.999	OPEN	Material: Paint, Quantity: 50 Pieces
PR-1762167770150-npce84sdn	PR-1762167796825-zrbkmh	system	2025-11-03 11:03:16.875	OPEN	Material: rod, Quantity: 700 Pieces
PR-1762419820157-ciohhleab	PR-1762419833352-xscikx	system	2025-11-06 09:03:53.356	OPEN	Material: rod, Quantity: 700 Pieces
PR-1762421380030-b7lovj6ae	PR-1762421404852-huzjjp	system	2025-11-06 09:30:04.923	OPEN	Material: rod, Quantity: 700 Pieces
\.


--
-- Data for Name: purchase_requisition_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.purchase_requisition_item (id, pr_id, product_id, material_id, uom_id, qty_requested, qty_approved) FROM stdin;
\.


--
-- Data for Name: qa_rejection; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.qa_rejection (rejection_id, inventory_id, product_id, rejection_reason, disposition, rejected_by, rejected_at, root_cause, corrective_action, rework_wo_id, scrap_id, disposal_date, notes, created_at, updated_at) FROM stdin;
2172b831-1e3c-405f-a2cb-a61f60496bd4	7804116a-2beb-4e2e-b573-f327fee35172	077b6e4a-a968-45e7-bff7-d3259f88eaea	this is not worked well 	REWORK	system	2025-12-21 11:30:19.682	\N	\N	52a35c41-3e0d-4bbf-8238-18cd558cb214	\N	\N	\N	2025-12-21 11:30:19.605	2025-12-21 11:30:19.605
47d4bd34-6c4e-4c43-b5e1-0fffd6d4e652	942a233b-db4b-4a13-8694-2f0ba0d802c3	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection for linking	REWORK	test-user	2025-12-21 13:36:17.938	\N	\N	1e456799-6328-4b5a-8da0-b46820abe3c8	\N	\N	\N	2025-12-21 13:36:17.938	2025-12-21 13:36:51.184
c1db9d83-8e11-45ab-91b9-fdac68a1834c	942a233b-db4b-4a13-8694-2f0ba0d802c3	5cdef655-4cf2-400f-8609-189236cc9a8c	there is an isuue 	REWORK	system	2025-12-21 13:46:47.292	\N	\N	\N	\N	\N	\N	2025-12-21 13:46:47.251	2025-12-21 13:46:47.251
2dbc5ffb-114e-45dd-91f3-d6864c25b14c	d98d4e6d-28af-4012-8617-85b9b1ddc036	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:01:23.959	Root cause: Quality issue	Corrective action: Create rework order	\N	\N	\N	QA workflow test	2025-12-21 15:01:23.934	2025-12-21 15:01:23.934
d938ce92-789a-4839-8325-1b149d7c0f10	410a480c-d55e-4eec-8994-6ae3c8820f39	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:01:26.333	\N	\N	\N	29875444-782e-4a06-9c46-f03f7f1c6e1e	\N	\N	2025-12-21 15:01:26.284	2025-12-21 15:01:26.284
57b430c1-1e2e-4d5f-9b8f-3d951fc6aa6f	894ddc7e-20c9-4f01-ad53-c3fa94569947	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:01:28.786	\N	\N	\N	\N	2025-12-21 15:01:28.767	\N	2025-12-21 15:01:28.761	2025-12-21 15:01:28.761
9be33e91-6851-47c5-912d-6ec97500b84c	70aabfd6-093c-439a-af1e-73d7c0380ae5	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:07:18.849	\N	\N	\N	35d1dbee-39b8-49a4-bb87-6473592b50c0	\N	\N	2025-12-21 15:07:18.84	2025-12-21 15:07:18.84
713f1d23-4607-4ea9-bae4-d04a63aa625a	1fca37a6-632a-45fe-92b3-856d4ec9d919	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:07:18.97	\N	\N	\N	\N	2025-12-21 15:07:18.96	\N	2025-12-21 15:07:18.965	2025-12-21 15:07:18.965
40f808de-ecd1-45a4-b69a-8473d1475236	94f4ede9-bdb9-4e80-88a5-be4e15c70585	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:07:42.811	Root cause: Quality issue	Corrective action: Create rework order	a048d1e5-a516-40ab-b020-e98d7022a318	\N	\N	QA workflow test	2025-12-21 15:07:42.807	2025-12-21 15:07:42.807
30f8f0e3-29fc-4aeb-96df-276294da3946	6fd235ab-7eb8-48d4-8b64-6781cec55209	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:07:42.932	\N	\N	\N	0fd2095e-b063-44c2-9e24-c369298738ec	\N	\N	2025-12-21 15:07:42.924	2025-12-21 15:07:42.924
21de71c6-d12a-493f-978d-9030f550da8a	b33d10de-c172-4f09-9098-e4754c29bb8c	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:07:43.028	\N	\N	\N	\N	2025-12-21 15:07:43.019	\N	2025-12-21 15:07:43.024	2025-12-21 15:07:43.024
eff365c1-42c0-48b4-903f-73fa87ccb1da	88b73bfb-55c3-4a8b-9a6c-aa466dcff257	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:07:56.74	Root cause: Quality issue	Corrective action: Create rework order	4b2abf1b-e971-4bf4-9d76-37d61b73c1f7	\N	\N	QA workflow test	2025-12-21 15:07:56.729	2025-12-21 15:07:56.729
cf273e52-f0fd-4b05-b14c-5a291653a7ed	3edff137-70fd-4d21-bc3e-c03b0b9f3bf2	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:07:56.921	\N	\N	\N	8eabe6fe-1fe6-4670-8758-41ecaaa731ca	\N	\N	2025-12-21 15:07:56.912	2025-12-21 15:07:56.912
a964933a-1da6-4694-93fc-5cb2bf602f7c	77123db3-c739-4676-903b-dae9cfb273da	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:07:57.023	\N	\N	\N	\N	2025-12-21 15:07:57.017	\N	2025-12-21 15:07:57.018	2025-12-21 15:07:57.018
7c7af245-5dfc-40a3-bdbc-c213e8444368	dd30ba63-54ab-496c-834c-01a363b9420d	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:08:08.089	Root cause: Quality issue	Corrective action: Create rework order	8c929b4f-926f-407b-9be6-e58778d149ab	\N	\N	QA workflow test	2025-12-21 15:08:08.083	2025-12-21 15:08:08.083
ce19296b-e914-47a2-8d6e-c35b597df00e	9ec03393-ed6f-449a-a81e-97434af292be	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:08:08.314	\N	\N	\N	8998bd83-5741-4e28-904a-ae0e0a99bcb1	\N	\N	2025-12-21 15:08:08.299	2025-12-21 15:08:08.299
c36209d8-6538-4a3c-8fc1-42108bbd89bb	193fa7f3-0bf4-4172-b03c-363ca3202516	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:08:08.481	\N	\N	\N	\N	2025-12-21 15:08:08.465	\N	2025-12-21 15:08:08.474	2025-12-21 15:08:08.474
c317ae29-7026-4d26-97f9-1edb99159594	0b9ed0fa-b9ad-4faf-95d3-1d9a80166411	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:08:22.715	Root cause: Quality issue	Corrective action: Create rework order	2568fb0c-43ee-48b1-a204-4852ecd9db35	\N	\N	QA workflow test	2025-12-21 15:08:22.709	2025-12-21 15:08:22.709
79e7fc66-68c1-4166-84a1-3f0f02354c3b	b1500c04-89f4-4670-a6b5-a6d6ed6c147c	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:08:22.862	\N	\N	\N	70ef304d-82ef-4d92-bf6b-567c238e17df	\N	\N	2025-12-21 15:08:22.851	2025-12-21 15:08:22.851
0dd4c31e-5f06-4df6-87e0-b43548015ff8	773ecd7a-a872-4318-a474-efc27063a564	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:08:22.982	\N	\N	\N	\N	2025-12-21 15:08:22.974	\N	2025-12-21 15:08:22.977	2025-12-21 15:08:22.977
0e93e08b-aa18-43ea-9cd3-38147d54f522	a1025709-bb6b-48b4-91ae-a78880f19927	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:08:32.099	Root cause: Quality issue	Corrective action: Create rework order	90c26fe0-14ac-44ee-a315-4cf47ff8b737	\N	\N	QA workflow test	2025-12-21 15:08:32.094	2025-12-21 15:08:32.094
7598d8a7-ecd2-499b-a119-7d424235974b	eba88b56-8884-496f-a4e5-064c305327fa	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:08:32.255	\N	\N	\N	c09b6599-b5d6-44fb-8900-97b7dd99805a	\N	\N	2025-12-21 15:08:32.244	2025-12-21 15:08:32.244
f5201e6e-6550-4e0c-95d9-a018a432037d	0832ae87-e67a-4923-9c7d-314e474a388f	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:08:32.375	\N	\N	\N	\N	2025-12-21 15:08:32.366	\N	2025-12-21 15:08:32.369	2025-12-21 15:08:32.369
3cab99e8-b6c4-494f-9237-c6d55ecd1823	d3ccd8ed-700b-4bd1-9620-9be8ff1b9248	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - REWORK workflow	REWORK	qa-test	2025-12-21 15:26:49.671	Root cause: Quality issue	Corrective action: Create rework order	3b3eaf26-51f2-4d15-badf-3886e402d6f2	\N	\N	QA workflow test	2025-12-21 15:26:49.665	2025-12-21 15:26:49.701
891cba35-f6f7-45f2-b1db-283cde6818a4	a6f687d6-2469-4309-8916-e844c85cddc4	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - SCRAP workflow	SCRAP	qa-test	2025-12-21 15:26:49.83	\N	\N	\N	aab7abc5-9561-4d0c-984a-2fffb3d38126	\N	\N	2025-12-21 15:26:49.818	2025-12-21 15:26:49.818
e1c47824-5983-4270-bf6a-b31ca590d1a8	6b8529f0-c543-4ad5-922f-13af1bf350ca	5cdef655-4cf2-400f-8609-189236cc9a8c	Test rejection - DISPOSAL workflow	DISPOSAL	qa-test	2025-12-21 15:26:49.953	\N	\N	\N	\N	2025-12-21 15:26:49.945	\N	2025-12-21 15:26:49.947	2025-12-21 15:26:49.947
\.


--
-- Data for Name: raw_material; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.raw_material (raw_material_id, material_code, name, description, uom_id, created_at, updated_at) FROM stdin;
1c485b6a-baba-46b8-aa94-126749d73f56	Rm002	Steel ROd		54c52a65-8b9e-49ed-a538-72a33bb7a25a	2025-09-25 16:20:49.757	2025-09-25 16:20:49.757
ef15ec34-0c45-402e-ae31-32551dcb5ade	EMCM009	HRC Sheet	HRC 1220x2440x2.0	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-10-27 11:33:12.951	2025-10-27 11:33:12.951
e9c55d0d-b5c5-4195-81bc-4808fdf8e128	EMCM001	Galvanized Sheet	GI 1220x2440x1.2	584391f3-3bb8-40f7-b68a-88b917d44c40	2025-11-03 08:26:33.528	2025-11-03 08:26:33.528
75779822-2f5a-41fa-b36a-0bd714d2a54c	EMCM002	Galvanized Sheet	GI 1220x2440x1.5	584391f3-3bb8-40f7-b68a-88b917d44c40	2025-11-03 08:29:08.861	2025-11-03 08:29:08.861
eee8a68c-6466-4370-83ed-adbd6e1aa35d	EMCM003	CRC Sheet	CRC 1220x2440x0.8	584391f3-3bb8-40f7-b68a-88b917d44c40	2025-11-03 08:29:55.899	2025-11-03 08:29:55.899
4969ade5-9cf2-4baa-9775-a15df1467082	Shaft Ø28	rod		bdb9c233-4f88-4867-b657-e756a076b256	2025-11-03 08:55:43.779	2025-11-03 08:55:43.779
793a739a-c817-4d25-801b-8eb9514f20c5	PC-2	Plastic Cap 3/8	Plastic Cap 3/8	bdb9c233-4f88-4867-b657-e756a076b256	2025-11-03 09:27:59.296	2025-11-03 09:27:59.296
0ac4df93-490b-4c81-8307-41bfeb985841	PC-1	Plastic Cap 1/4	Plastic Cap 1/4	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	2025-11-03 09:25:42.357	2025-11-03 09:25:42.357
331e33e2-a3de-48bf-9cb2-159f27813d11	Polythene	Polythene 20x30	Polythene 20x30	88ed7640-5f9e-47c3-882c-a9bfbfbe0744	2025-11-03 09:32:33.906	2025-11-03 09:32:33.906
9509345f-f57e-4212-b574-92d80f84c3f6	Paint	Paint	Black Paint	cf26d042-d62b-429e-8f3d-f85aae6916f1	2025-11-03 09:37:50.885	2025-11-03 09:37:50.885
5e915d31-8157-4fb5-922b-513f9a1bd6f4	Welding Wire	Welding Wire Ø1.2	Welding Wire Ø1.2 (kg)	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	2025-11-07 18:19:49.265	2025-11-07 18:19:49.265
30236be1-22ec-4186-8980-1b66d9eb5ac0	RT	rodtyre		5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	2025-11-15 11:52:16.162	2025-11-15 11:52:16.162
8b54dd86-505a-40ed-902c-a36e28edc653	F1	FUEL	FUEL	cf26d042-d62b-429e-8f3d-f85aae6916f1	2025-11-15 12:16:49.255	2025-11-15 12:16:49.255
0863a437-192a-4e5b-ba89-eeadcdac9f73	STEEL-001	Steel Sheet	High grade steel sheet	5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	2025-11-21 14:42:38.177	2025-11-21 14:42:38.177
\.


--
-- Data for Name: report_schedule; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.report_schedule (report_id, name, cron_expr, last_run, created_at, created_by, params) FROM stdin;
\.


--
-- Data for Name: routing; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, alternative_path_id, created_at, description, is_primary_path, updated_at) FROM stdin;
343a530d-bcb1-4632-a199-4df20941a216	d277d247-b962-4e69-a188-441a99fcab91	1	cutting	\N	\N	\N	\N	2025-10-30 16:25:20.834	\N	t	2025-10-30 16:25:20.834
4ef7edbe-793d-436a-bde7-e2e22ebcb315	d277d247-b962-4e69-a188-441a99fcab91	2	piercing	\N	\N	\N	\N	2025-10-30 16:25:20.847	\N	t	2025-10-30 16:25:20.847
970af589-caef-44e7-ac0a-e76f7b85f951	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	1	CUTTING		0	0	\N	2025-10-30 16:52:21.786	\N	t	2025-10-30 16:52:21.786
c09b1be0-0d79-4d94-ac2d-5874d29ff02e	01b6e1c7-aa9c-4b05-9445-72c17b4d6500	2	FORMING		0	0	\N	2025-10-30 16:52:21.796	\N	t	2025-10-30 16:52:21.796
8538a87a-0a6b-4000-8178-f5f79c224d10	077b6e4a-a968-45e7-bff7-d3259f88eaea	1	CUTTING		0	0	\N	2025-11-15 12:14:14.853	\N	t	2025-11-15 12:14:14.853
0069df27-107a-43e4-961e-5600dde69868	077b6e4a-a968-45e7-bff7-d3259f88eaea	2	BLANKING OF HOOK		0	0	\N	2025-11-15 12:14:14.857	\N	t	2025-11-15 12:14:14.857
aa760a34-71fb-4750-9587-e96da523c4f4	077b6e4a-a968-45e7-bff7-d3259f88eaea	3	PARTING OF THREADED SHAFT		0	0	\N	2025-11-15 12:14:14.862	\N	t	2025-11-15 12:14:14.862
ef678a57-fbaa-4b7e-934e-8d3a1331fe2a	077b6e4a-a968-45e7-bff7-d3259f88eaea	4	WEDING OF HOOK AND THREADED SHAFT		0	0	\N	2025-11-15 12:14:14.867	\N	t	2025-11-15 12:14:14.867
0a38f82a-8ffd-444c-8ba0-cf9ec94b8318	077b6e4a-a968-45e7-bff7-d3259f88eaea	5	CHIPPING / CLEANING		0	0	\N	2025-11-15 12:14:14.871	\N	t	2025-11-15 12:14:14.871
a8c83458-ac7c-4b7b-99fa-599e787d1946	077b6e4a-a968-45e7-bff7-d3259f88eaea	6	PAINT		0	0	\N	2025-11-15 12:14:14.875	\N	t	2025-11-15 12:14:14.875
3a090ca8-889a-48fb-8560-32a39b1f96a7	077b6e4a-a968-45e7-bff7-d3259f88eaea	7	FUEL		0	0	\N	2025-11-15 12:14:14.883	\N	t	2025-11-15 12:14:14.883
\.


--
-- Data for Name: sales_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.sales_order (sales_order_id, order_number, customer_id, order_date, required_date, delivery_date, status, priority, order_type, order_source, reference_number, customer_po_date, currency, subtotal, tax_rate, tax_amount, discount_amount, shipping_cost, total_amount, shipping_method, shipping_address, delivery_instructions, payment_terms, warranty_terms, special_instructions, salesperson_id, created_by, approved_by, approved_at, created_at, updated_at, linked_po_id) FROM stdin;
6cb3b6c1-193c-48d2-b173-4ba4ba3be85f	SO-20251115-PO-222233	CUST-000001	2025-11-15	2025-11-19	\N	DELIVERED	NORMAL	STANDARD	MANUAL	PO-222233	\N	PKR	525000.0000	18.00	94500.0000	0.0000	0.0000	619500.0000		\N	\N	NET 30	\N	\N	\N	system	\N	\N	2025-11-15 12:12:43.221459+00	2025-11-15 12:12:59.799403+00	\N
82b5d215-f145-4bd7-85cd-b397870683b0	SO-20251206-1765040853736-NXTOFV	CUST-000001	2025-12-06	\N	2025-12-20	DRAFT	NORMAL	STANDARD	MANUAL	\N	\N	PKR	50000.0000	18.00	9000.0000	0.0000	0.0000	59000.0000	\N	\N	\N	\N	\N	\N	\N	system	\N	\N	2025-12-06 17:07:33.736947+00	2025-12-06 17:07:33.736947+00	\N
15a64808-57ce-4c0d-8e3d-87904c478c22	SO-20251206-1765041407115-XJN9TL	CUST-000001	2025-12-06	\N	2025-12-25	DISPATCHED	NORMAL	STANDARD	MANUAL	\N	\N	PKR	100000.0000	18.00	18000.0000	0.0000	0.0000	118000.0000	\N	\N	\N	\N	\N	\N	\N	system	\N	\N	2025-12-06 17:16:47.116085+00	2025-12-06 17:16:47.116085+00	\N
7c6be524-4d78-4aa2-9072-e4fa2e065110	SO-20251206-PO-2224455	CUST-000001	2025-12-06	2025-12-11	\N	APPROVED	NORMAL	STANDARD	MANUAL	po-2224455	\N	PKR	5000000.0000	18.00	900000.0000	0.0000	0.0000	5900000.0000		\N	\N	NET 30	\N	\N	\N	system	\N	\N	2025-12-06 18:37:41.763401+00	2025-12-06 18:48:22.1511+00	\N
d33b8ab8-7436-4ba0-b833-a78d4c863e48	SO-20251222-PO-122656	CUST-000001	2025-12-22	2025-12-11	2025-12-11	APPROVED	NORMAL	STANDARD	MANUAL	PO-122656	\N	PKR	500000.0000	18.00	90000.0000	0.0000	0.0000	590000.0000		\N	\N	NET 30	\N	\N	\N	system	\N	\N	2025-12-22 17:52:05.48395+00	2025-12-22 17:52:14.219688+00	\N
5edd0225-f7e7-4fa2-8a9c-5e60c67bed78	SO-20251222-PO-12234	CUST-000001	2025-12-22	2025-12-29	2026-01-15	DELIVERED	HIGH	STANDARD	MANUAL	po-12234	\N	PKR	25000.0000	18.00	4500.0000	0.0000	0.0000	29500.0000		\N	\N	NET 30	\N	\N	\N	system	\N	\N	2025-12-22 18:22:00.045458+00	2025-12-22 18:22:06.039262+00	\N
\.


--
-- Data for Name: sales_order_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.sales_order_item (item_id, sales_order_id, product_id, item_code, item_name, description, specification, quantity, unit_of_measure, unit_price, discount_percent, discount_amount, line_total, production_required, bom_id, estimated_production_time, production_start_date, production_end_date, delivery_required, delivery_date, delivery_status, created_at, updated_at, qty_allocated_from_stock, qty_to_produce) FROM stdin;
f754b0ea-334e-42ea-90ba-5d0a1a986d41	6cb3b6c1-193c-48d2-b173-4ba4ba3be85f	077b6e4a-a968-45e7-bff7-d3259f88eaea	88486-0580	Large Tank			5000.0000	PCS	105.0000	0.00	0.0000	525000.0000	t	\N	\N	\N	\N	t	\N	PENDING	2025-11-15 12:12:43.221459+00	2025-11-15 12:12:43.221459+00	0	0
a7ce9fe2-1fd2-436c-aa13-72e40d827a8c	82b5d215-f145-4bd7-85cd-b397870683b0	\N		Large Tank			10.0000	PCS	5000.0000	0.00	0.0000	50000.0000	t	\N	\N	\N	\N	t	\N	PENDING	2025-12-06 17:07:33.736947+00	2025-12-06 17:07:33.736947+00	0	0
d023955d-ada5-4765-8d4b-77278a55a3cf	15a64808-57ce-4c0d-8e3d-87904c478c22	077b6e4a-a968-45e7-bff7-d3259f88eaea		Large Tank			20.0000	PCS	5000.0000	0.00	0.0000	100000.0000	t	\N	\N	\N	\N	t	\N	PENDING	2025-12-06 17:16:47.116085+00	2025-12-06 17:16:47.116085+00	0	0
fd428a49-c33d-4083-b908-5d9b51714d9a	7c6be524-4d78-4aa2-9072-e4fa2e065110	\N	88486-0580	Large Tank			500.0000	PCS	10000.0000	0.00	0.0000	5000000.0000	t	\N	\N	\N	\N	t	\N	PENDING	2025-12-06 18:37:41.763401+00	2025-12-06 18:37:41.763401+00	0	0
8ec6a709-22b6-4dd1-abe7-208ad328bad3	d33b8ab8-7436-4ba0-b833-a78d4c863e48	\N	10-1305	air tank			50.0000	PCS	10000.0000	0.00	0.0000	500000.0000	t	\N	\N	\N	\N	t	\N	PENDING	2025-12-22 17:52:05.48395+00	2025-12-22 17:52:05.48395+00	0	0
5e6aa6b3-7630-401b-9f8e-f7b999d7abea	5edd0225-f7e7-4fa2-8a9c-5e60c67bed78	077b6e4a-a968-45e7-bff7-d3259f88eaea	88486-0580	Large Tank			50.0000	PCS	500.0000	0.00	0.0000	25000.0000	t	\N	\N	\N	\N	t	\N	PENDING	2025-12-22 18:22:00.045458+00	2025-12-22 18:22:00.045458+00	0	0
\.


--
-- Data for Name: sales_order_work_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.sales_order_work_order (id, sales_order_id, sales_order_item_id, work_order_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: scrap_inventory; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.scrap_inventory (scrap_id, blank_id, material_id, width_mm, length_mm, thickness_mm, weight_kg, location_id, status, created_at, created_by, reference, consumed_by_po, material_name, leftover_area_mm2, orientation, sheet_original_size, blank_size, efficiency_percentage, scrap_percentage, unit) FROM stdin;
bbd5e7e6-7a03-4f00-a0ff-7621300d48b1	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	1220	2440	3	5574.83	\N	AVAILABLE	2025-12-06 21:10:56.713	\N	14298abe-4484-48b4-9372-25a258247046	\N	HRC Sheet	\N	HORIZONTAL	\N	\N	\N	\N	kg
f6b9bc65-876b-4bc3-b798-1023160f4365	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	1220	2440	3	5574.83	\N	AVAILABLE	2025-12-21 09:46:49.995	\N	6d8050b6-f6fb-42c7-a07b-b3aad5578d26	\N	HRC Sheet	\N	HORIZONTAL	\N	\N	\N	\N	kg
29875444-782e-4a06-9c46-f03f7f1c6e1e	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:01:26.284	qa-test	QA-REJECTED-410a480c-d55e-4eec-8994-6ae3c8820f39	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
35d1dbee-39b8-49a4-bb87-6473592b50c0	\N	\N	\N	\N	\N	80	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:07:18.84	qa-test	QA-REJECTED-70aabfd6-093c-439a-af1e-73d7c0380ae5	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
0fd2095e-b063-44c2-9e24-c369298738ec	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:07:42.924	qa-test	QA-REJECTED-6fd235ab-7eb8-48d4-8b64-6781cec55209	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
8eabe6fe-1fe6-4670-8758-41ecaaa731ca	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:07:56.912	qa-test	QA-REJECTED-3edff137-70fd-4d21-bc3e-c03b0b9f3bf2	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
8998bd83-5741-4e28-904a-ae0e0a99bcb1	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:08:08.299	qa-test	QA-REJECTED-9ec03393-ed6f-449a-a81e-97434af292be	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
70ef304d-82ef-4d92-bf6b-567c238e17df	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:08:22.851	qa-test	QA-REJECTED-b1500c04-89f4-4670-a6b5-a6d6ed6c147c	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
c09b6599-b5d6-44fb-8900-97b7dd99805a	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:08:32.244	qa-test	QA-REJECTED-eba88b56-8884-496f-a4e5-064c305327fa	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
aab7abc5-9561-4d0c-984a-2fffb3d38126	\N	\N	\N	\N	\N	30	d76eed8c-9815-4376-911a-ff4a7e08b3e5	AVAILABLE	2025-12-21 15:26:49.818	qa-test	QA-REJECTED-a6f687d6-2469-4309-8916-e844c85cddc4	\N	Base Plate	\N	\N	\N	\N	\N	\N	PCS
1fa5c20a-eb97-47e2-b947-e3fa19142379	\N	6d389b17-3618-4d85-9c2c-a973a2a62279	1220	2440	3	574.58	\N	AVAILABLE	2025-12-22 18:23:19.18	\N	050833d7-28f4-4132-b2b7-c91199b4f52a	\N	HRC Sheet	\N	HORIZONTAL	\N	\N	\N	\N	kg
\.


--
-- Data for Name: scrap_movement; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.scrap_movement (movement_id, scrap_id, movement_type, quantity, reason, reference, created_by, created_at) FROM stdin;
062b0878-eb07-4633-8804-1098efbf0da2	d0f7878d-7afa-4892-9f33-13b9ebc1446d	RESTORE	2	Test restoration	Restored to inventory (in grams)	test-user	2025-11-15 10:58:43.819747
23f61218-11d2-46e6-b201-6fa2160560aa	7ef92d34-18f1-4b53-8966-e41295e220a9	RESTORE	10	reuse for material	Restored to inventory (in grams)	current_user	2025-11-15 11:21:22.139255
f9c100f1-0c66-4fd9-93d7-dc1fdcc7b101	1b98d389-1112-4b19-bb1e-e7294373571b	REUSE	10	Issued to Work Order: 020633d3-0ac2-4927-bb1b-b744985adc53	WO-020633d3-0ac2-4927-bb1b-b744985adc53	test-user	2025-11-23 20:19:37.320308
8fba7af4-d8ab-46b4-8993-c7c50be0c103	1c944c30-14e1-4bd4-ac3c-58716655e322	REUSE	50	Issued to Work Order: a46009ef-eb2c-4925-8e13-0429c106cb3b	WO-a46009ef-eb2c-4925-8e13-0429c106cb3b	test-user	2025-11-23 20:19:37.354478
\.


--
-- Data for Name: scrap_origin; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.scrap_origin (origin_id, scrap_id, source_type, source_reference, product_id, blank_id, process_step, operator_id, bom_efficiency, sheet_dimensions, blank_dimensions, leftover_width, leftover_length, cutting_direction, created_at, created_by) FROM stdin;
79e95d7a-ea38-487b-91f0-f4e4f8d5e8c8	bbd5e7e6-7a03-4f00-a0ff-7621300d48b1	PRODUCTION	14298abe-4484-48b4-9372-25a258247046	077b6e4a-a968-45e7-bff7-d3259f88eaea	f80c6f72-fd08-4a9b-8a41-eadff822e9df	\N	\N	77.5	1220×2440	358×358	\N	\N	HORIZONTAL	2025-12-06 21:10:56.713343	\N
fd62293f-a50e-46c1-ab31-6ca9593b68af	f6b9bc65-876b-4bc3-b798-1023160f4365	PRODUCTION	6d8050b6-f6fb-42c7-a07b-b3aad5578d26	077b6e4a-a968-45e7-bff7-d3259f88eaea	f80c6f72-fd08-4a9b-8a41-eadff822e9df	\N	\N	77.5	1220×2440	358×358	\N	\N	HORIZONTAL	2025-12-21 09:46:49.994527	\N
6932341d-95b9-4ef8-922d-58e2a31811ab	1fa5c20a-eb97-47e2-b947-e3fa19142379	PRODUCTION	050833d7-28f4-4132-b2b7-c91199b4f52a	077b6e4a-a968-45e7-bff7-d3259f88eaea	f80c6f72-fd08-4a9b-8a41-eadff822e9df	\N	\N	77.5	1220×2440	358×358	\N	\N	HORIZONTAL	2025-12-22 18:23:19.17953	\N
\.


--
-- Data for Name: scrap_transaction; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.scrap_transaction (txn_id, scrap_id, txn_type, qty_used, weight_kg, reference, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: scrap_transaction_log; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.scrap_transaction_log (log_id, scrap_id, transaction_type, quantity_before, quantity_after, quantity_changed, reason, reference, destination, performed_by, performed_at, notes) FROM stdin;
\.


--
-- Data for Name: sheet_sizes; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.sheet_sizes (sheet_size_id, width_mm, length_mm, material_type, sheet_weight_kg, cost_per_kg, active, created_at, updated_at, created_by, thickness_mm) FROM stdin;
77fa7b02-9026-42cd-a923-9505b0810e0b	1220	2440	MS	46.73576	80	t	2025-10-07 10:43:46.386619	2025-10-07 10:43:46.386619	system	2
584d1f60-851e-403d-995c-910e56e6cd98	1220	3660	MS	70.10364	80	t	2025-10-07 10:43:46.386619	2025-10-07 10:43:46.386619	system	2
6325161b-e75b-495c-873f-739da1cc3a4e	1525	3050	MS	73.024625	80	t	2025-10-07 10:43:46.386619	2025-10-07 10:43:46.386619	system	2
3826cd3d-36c0-44c0-9fe0-e109294989a6	1220	2440	MS	46.73576	80	t	2025-10-07 10:46:03.914616	2025-10-07 10:46:03.914616	system	2
7bd02a1d-c73e-4e06-ade3-090474b89644	1220	3660	MS	70.10364	80	t	2025-10-07 10:46:03.914616	2025-10-07 10:46:03.914616	system	2
494c395b-6cb4-4d69-a2c3-f44b4fb1479b	1525	3050	MS	73.024625	80	t	2025-10-07 10:46:03.914616	2025-10-07 10:46:03.914616	system	2
5fd58a77-3532-4956-b2ba-f5975e23056c	1220	2440	SS	46.73576	250	t	2025-10-07 10:43:46.386619	2025-10-07 10:43:46.386619	system	2
f983be92-7e31-413c-b450-cbc3a8ad9e65	1220	3660	SS	70.10364	250	t	2025-10-07 10:43:46.386619	2025-10-07 10:43:46.386619	system	2
62f95939-90c8-46eb-8fdb-f5ac21c28efc	1220	2440	SS	46.73576	250	t	2025-10-07 10:46:03.914616	2025-10-07 10:46:03.914616	system	2
8b15689b-5a21-4e4b-9eff-730219cabba6	1220	3660	SS	70.10364	250	t	2025-10-07 10:46:03.914616	2025-10-07 10:46:03.914616	system	2
f759e101-e6ac-4009-90b6-30704ffcf3f5	1220	2440	GI	46.73576	120	t	2025-10-07 10:43:46.386619	2025-10-07 10:43:46.386619	system	2
8d81209b-a881-4403-b0dd-6bafa0c614e8	1220	2440	GI	46.73576	120	t	2025-10-07 10:46:03.914616	2025-10-07 10:46:03.914616	system	2
\.


--
-- Data for Name: shortage_alerts; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.shortage_alerts (id, po_id, product_id, alert_type, severity, message, details, status, resolved_at, resolved_by, created_at) FROM stdin;
\.


--
-- Data for Name: stock_in; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.stock_in (stock_in_id, material_id, material_name, quantity, unit, location, supplier, purchase_order_ref, cost_per_unit, total_cost, received_by, received_date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_ledger; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.stock_ledger (ledger_id, item_type, product_id, material_id, scrap_id, txn_id, txn_type, quantity, unit_cost, total_cost, location_id, reference, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: strategic_inventory; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.strategic_inventory (material_id, current_stock, safety_stock, reorder_point, economic_order_qty, last_updated) FROM stdin;
paint-001	5.0000	2.0000	3.0000	10.0000	2025-10-22 14:22:32.61914
fastener-001	100.0000	50.0000	75.0000	200.0000	2025-10-22 14:22:32.617962
0e30fbb7-5302-4ce4-9498-e8db979fd3e1	120.0000	10.0000	15.0000	50.0000	2025-10-22 14:22:32.618615
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.supplier (supplier_id, code, name, contact, phone, email, address, lead_time_days, created_at) FROM stdin;
test-supplier-001	SUP-001	Test Supplier Ltd	John Doe	555-0123	john@testsupplier.com	\N	\N	2025-09-23 19:12:59.13
91ef6f5d-6975-416d-a262-0aed7c2f2afb	SUP-002	ABC Company	ALI	122313332	contact@supplier.com	123 Business St, City, State 12345	7	2025-09-24 08:16:28.869
68aba47c-e9dc-4430-9c0a-da454021ee8b	sup-002	ABC Company	ALI	122313332	contact@supplier.com	abc street	7	2025-09-24 08:16:58.482
04cb61b4-59d8-4304-8975-5bbfe526b9dd	sup-003	UIT Manufacturing	Azeem	+923162156033	huzaifashamsi836@gmail.com	\N	\N	2025-11-03 08:36:15.581
\.


--
-- Data for Name: three_way_match; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.three_way_match (matching_id, po_id, grn_id, invoice_id, po_item_id, grn_item_id, invoice_item_id, po_quantity, po_unit_price, po_total, grn_quantity, grn_unit_price, grn_total, invoice_quantity, invoice_unit_price, invoice_total, quantity_variance, price_variance, total_variance, quantity_variance_percent, price_variance_percent, total_variance_percent, match_status, exceptions, created_by, matched_at) FROM stdin;
\.


--
-- Data for Name: uom; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.uom (uom_id, code, name) FROM stdin;
bdb9c233-4f88-4867-b657-e756a076b256	PCS	Pieces
5ef8e910-f60b-4b47-9bfb-d8f2d78100c0	KG	Kilograms
88ed7640-5f9e-47c3-882c-a9bfbfbe0744	MM	Millimeters
54c52a65-8b9e-49ed-a538-72a33bb7a25a	INCH	Inches
584391f3-3bb8-40f7-b68a-88b917d44c40	SHEET	Sheet
cf26d042-d62b-429e-8f3d-f85aae6916f1	LITRE	Litre
f929ddc2-77b2-4faf-bd21-8b1924d0a6b4	GR	Grams
\.


--
-- Data for Name: wastage; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.wastage (wastage_id, wo_id, step_id, material_id, reentry_txn_id, quantity, uom_id, location_id, reason, created_at) FROM stdin;
\.


--
-- Data for Name: work_center; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.work_center (work_center_id, code, name, description, created_at) FROM stdin;
b2c68d9f-acad-4262-a232-b35a116693af	CUT-001	Cutting Center	Shearing and Cutting Operations	2025-09-23 14:36:02.958
a342902a-4224-427c-973c-b83dff74c0c5	FORM-001	Forming Center	Metal Forming Operations	2025-09-23 14:36:02.965
fe26ed11-c9ad-45e6-a935-37b88b5e678d	DRILL-001	Drilling Center	Drilling and Piercing Operations	2025-09-23 14:36:02.97
87e3442a-c52d-4a22-ac06-3416ba8724e7	CLEAN-001	Cleaning Center	Cleaning and Preparation	2025-09-23 14:36:02.974
46899113-7732-4dbe-878d-f5dfc9ecfe31	PAINT-001	Painting Center	Painting Operations	2025-09-23 14:36:02.977
b1ae27ea-1d7b-4c44-a4c3-2c671265920b	ASSY-001	Assembly Center	Final Assembly Operations	2025-09-23 14:36:02.98
\.


--
-- Data for Name: work_order; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.work_order (wo_id, wo_no, product_id, quantity, uom_id, priority, scheduled_start, scheduled_end, status, created_by, created_at, parent_wo_id, operation_type, sheets_allocated, dependency_status, depends_on_wo_id, customer, sales_order_ref, purchase_order_ref) FROM stdin;
47b4b477-80ef-4df9-bc5d-c5f17671770b	MWO-1765040860658	077b6e4a-a968-45e7-bff7-d3259f88eaea	10	\N	1	\N	2025-12-20 05:00:00	PLANNED	test_user	2025-12-06 17:07:40.66	\N	\N	\N	READY	\N	CUST-000001	SO-20251206-1765040853736-NXTOFV	\N
52a35c41-3e0d-4bbf-8238-18cd558cb214	MWO-1766316619639	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-21 16:30:19.61	2025-12-28 16:30:19.61	PLANNED	system	2025-12-21 11:30:19.64	\N	\N	\N	READY	\N	\N	\N	\N
e8dedd40-fcd8-4d52-98b2-0fdc42464628	MWO-1762265163249	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.246	\N	\N	\N	READY	\N	\N	\N	\N
a9c53dda-a8eb-4205-be73-351b3daf5418	WO-CUTTING-1762265163302	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.293	e8dedd40-fcd8-4d52-98b2-0fdc42464628	CUTTING	\N	READY	\N	\N	\N	\N
39ce1a2a-e9a6-4073-8ce3-149517bebaa2	WO-BLANKING OF HOOK-1762265163328	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.319	e8dedd40-fcd8-4d52-98b2-0fdc42464628	BLANKING OF HOOK	\N	READY	\N	\N	\N	\N
ded2435c-a09c-4c63-8074-f5b24a1b98cf	WO-PARTING OF THREADED SHAFT-1762265163354	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.346	e8dedd40-fcd8-4d52-98b2-0fdc42464628	PARTING OF THREADED SHAFT	\N	READY	\N	\N	\N	\N
7ed05f08-eed1-446a-9373-99f9ab27e0c1	WO-WEDING OF HOOK AND THREADED SHAFT-1762265163380	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.371	e8dedd40-fcd8-4d52-98b2-0fdc42464628	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	\N	\N	\N
64286a9b-25d8-4951-8530-c94022ac32dd	WO-CHIPPING / CLEANING-1762265163405	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.397	e8dedd40-fcd8-4d52-98b2-0fdc42464628	CHIPPING / CLEANING	\N	READY	\N	\N	\N	\N
848e64ca-6c3a-43d2-b698-41cb0490b229	WO-PAINT-1762265163430	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-11-11 00:00:00	2025-11-11 00:00:00	PLANNED	system	2025-11-04 14:06:03.422	e8dedd40-fcd8-4d52-98b2-0fdc42464628	PAINT	\N	READY	\N	\N	\N	\N
5cf0153f-198e-4ebc-86bf-f0a79272176f	MWO-1762439707789	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-11-05 00:00:00	\N	PLANNED	user	2025-11-06 14:35:07.788	\N	\N	\N	READY	\N	Planned Production	PP-20251105-001	\N
e5a4abf6-e784-4ee2-a626-e0cdf61e905e	WO-CUTTING-1762440985812	077b6e4a-a968-45e7-bff7-d3259f88eaea	200	\N	1	2025-11-05 00:00:00	\N	COMPLETED	system	2025-11-06 14:56:25.803	5cf0153f-198e-4ebc-86bf-f0a79272176f	CUTTING	\N	READY	\N	Planned Production	PP-20251105-001	\N
8fb98c3b-9b50-4316-a84a-1aba96213fca	WO-BLANKING OF HOOK-1762452917012	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-11-05 00:00:00	\N	COMPLETED	system	2025-11-06 18:15:16.999	5cf0153f-198e-4ebc-86bf-f0a79272176f	BLANKING OF HOOK	\N	READY	\N	Planned Production	PP-20251105-001	\N
c1b44b25-dd51-4123-8780-2baac3c2eaa9	WO-CUTTING-1763206987955	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:07.952	be840f1a-41a8-4627-84fd-a9c798807526	CUTTING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	\N
ac1881a0-c6af-40e3-a39c-c3b5f416fdb1	WO-BLANKING OF HOOK-1763206987966	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:07.964	be840f1a-41a8-4627-84fd-a9c798807526	BLANKING OF HOOK	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	\N
be840f1a-41a8-4627-84fd-a9c798807526	MWO-1763206987939	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:07.939	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	PO-10122
f26cd9ce-c340-4cc2-b64a-2a83d2635438	WO-PARTING OF THREADED SHAFT-1763206987978	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:07.976	be840f1a-41a8-4627-84fd-a9c798807526	PARTING OF THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	\N
2ff34b84-bff4-4c2e-9f9c-15b32c7651b5	WO-WEDING OF HOOK AND THREADED SHAFT-1763206987988	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:07.987	be840f1a-41a8-4627-84fd-a9c798807526	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	\N
e568f538-5000-4bbb-a54e-ba312a2b657d	WO-CHIPPING / CLEANING-1763206988000	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:07.998	be840f1a-41a8-4627-84fd-a9c798807526	CHIPPING / CLEANING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	\N
d59e3546-8339-4663-b0a4-c1322ae27cc5	WO-PAINT-1763206988012	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-28 00:00:00	2025-11-28 00:00:00	PLANNED	user	2025-11-15 11:43:08.011	be840f1a-41a8-4627-84fd-a9c798807526	PAINT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-10122	\N
ea2addcf-462d-46ba-9628-d7405b00fce8	MWO-1763208794140	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-19 00:00:00	PLANNED	user	2025-11-15 12:13:14.144	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	PO-222233
eb27f7bc-d852-4b89-a10d-c95b519e7540	WO-CUTTING-1763208794156	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-15 12:49:48.354	COMPLETED	user	2025-11-15 12:13:14.158	ea2addcf-462d-46ba-9628-d7405b00fce8	CUTTING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
efa6a553-5644-41a0-ac8b-f9af2845b83a	WO-BLANKING OF HOOK-1763208794164	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-15 12:54:07.704	COMPLETED	user	2025-11-15 12:13:14.166	ea2addcf-462d-46ba-9628-d7405b00fce8	BLANKING OF HOOK	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
3fe617c4-4ab5-4063-bc2e-907be88e2a66	WO-PARTING OF THREADED SHAFT-1763208794173	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-15 12:54:45.571	COMPLETED	user	2025-11-15 12:13:14.174	ea2addcf-462d-46ba-9628-d7405b00fce8	PARTING OF THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
4a553e09-7077-423f-b0b3-cf885cc1ba73	WO-WEDING OF HOOK AND THREADED SHAFT-1763208794181	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-15 12:56:15.955	COMPLETED	user	2025-11-15 12:13:14.182	ea2addcf-462d-46ba-9628-d7405b00fce8	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
dcd21d07-5073-4631-9c46-9ada09fa65d3	WO-CHIPPING / CLEANING-1763208794189	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-15 12:56:22.068	COMPLETED	user	2025-11-15 12:13:14.191	ea2addcf-462d-46ba-9628-d7405b00fce8	CHIPPING / CLEANING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
2568700a-8071-4077-b203-414c54a0a0b6	WO-PAINT-1763208794196	077b6e4a-a968-45e7-bff7-d3259f88eaea	5000	\N	1	2025-11-19 00:00:00	2025-11-15 12:56:37.568	COMPLETED	user	2025-11-15 12:13:14.198	ea2addcf-462d-46ba-9628-d7405b00fce8	PAINT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
722f4bb0-7450-4801-b5da-37954ebf2524	WO-FUEL-1763209210522	077b6e4a-a968-45e7-bff7-d3259f88eaea	1000	\N	1	2025-11-19 00:00:00	2025-11-15 12:56:56.328	COMPLETED	system	2025-11-15 12:20:10.518	ea2addcf-462d-46ba-9628-d7405b00fce8	FUEL	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
1d937dc2-3ebb-41ce-b2ce-18af1f7733f7	WO-FUEL-1763209210546	077b6e4a-a968-45e7-bff7-d3259f88eaea	1000	\N	1	2025-11-19 00:00:00	2025-11-15 12:57:02.46	COMPLETED	system	2025-11-15 12:20:10.543	ea2addcf-462d-46ba-9628-d7405b00fce8	FUEL	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251115-PO-222233	\N
1b01641d-5110-4794-9c2d-98493aa90f90	WO-CUTTING-1765040866684	077b6e4a-a968-45e7-bff7-d3259f88eaea	10	\N	1	2025-12-06 17:07:55.744	2025-12-06 17:08:04.022	COMPLETED	test_user	2025-12-06 17:07:46.685	47b4b477-80ef-4df9-bc5d-c5f17671770b	CUTTING	\N	READY	\N	CUST-000001	SO-20251206-1765040853736-NXTOFV	\N
b61995f9-dacd-426c-b1ac-f41c17dbf7c2	MWO-1766329372008	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:02:52.005	2025-12-21 15:02:52.175	COMPLETED	qa-test	2025-12-21 15:02:52.007	\N	\N	\N	READY	\N	\N	\N	\N
ea6d3e62-b20d-4d1d-a4be-af46c046bd82	WO-CUTTING-1765041039840	077b6e4a-a968-45e7-bff7-d3259f88eaea	10	\N	1	2025-12-06 17:10:46.137	2025-12-06 17:10:55.428	COMPLETED	test_user	2025-12-06 17:10:39.838	47b4b477-80ef-4df9-bc5d-c5f17671770b	CUTTING	\N	READY	\N	CUST-000001	SO-20251206-1765040853736-NXTOFV	\N
3c7a9a92-465e-4451-b9a9-1cbe4e14ea65	MWO-1766329487558	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:04:47.552	2025-12-28 20:04:47.552	PLANNED	qa-test	2025-12-21 15:04:47.557	\N	\N	\N	READY	\N	\N	\N	\N
0cb9caad-1b30-4e86-8e16-d55d3723f649	WO-CUTTING-1765041146726	077b6e4a-a968-45e7-bff7-d3259f88eaea	10	\N	1	2025-12-06 17:12:39.231	2025-12-06 17:12:51.888	COMPLETED	test_user	2025-12-06 17:12:26.735	47b4b477-80ef-4df9-bc5d-c5f17671770b	CUTTING	\N	READY	\N	CUST-000001	\N	\N
2121efff-dd55-40ff-94ec-dbc5a8979418	MWO-1765041672630	077b6e4a-a968-45e7-bff7-d3259f88eaea	20	\N	1	\N	2025-12-25 05:00:00	PLANNED	test_user	2025-12-06 17:21:12.63	\N	\N	\N	READY	\N	CUST-000001	SO-20251206-1765041407115-XJN9TL	\N
a108dc62-ccd5-447a-a370-e738eb23c66c	WO-CUTTING-1765041680032	077b6e4a-a968-45e7-bff7-d3259f88eaea	20	\N	1	2025-12-06 17:21:29.314	2025-12-06 17:22:00.82	COMPLETED	test_user	2025-12-06 17:21:20.029	2121efff-dd55-40ff-94ec-dbc5a8979418	CUTTING	\N	READY	\N	CUST-000001	\N	\N
6647204b-5b9f-4444-911c-7bea60e4457b	WO-FORMING-1765041822381	077b6e4a-a968-45e7-bff7-d3259f88eaea	5	\N	1	\N	2025-12-06 17:23:47.387	COMPLETED	test_user	2025-12-06 17:23:42.379	2121efff-dd55-40ff-94ec-dbc5a8979418	FORMING	\N	READY	\N	CUST-000001	\N	\N
4d89114c-d440-4f17-aff1-465cf12a852f	WO-CUTTING-1765040958682	077b6e4a-a968-45e7-bff7-d3259f88eaea	10	\N	1	\N	2025-12-06 20:19:06.241	COMPLETED	test_user	2025-12-06 17:09:18.679	47b4b477-80ef-4df9-bc5d-c5f17671770b	CUTTING	\N	READY	\N	CUST-000001	SO-20251206-1765040853736-NXTOFV	\N
49aff86c-7663-418a-ad55-28194cec7a97	WO-CHIPPING / CLEANING-1765055439722	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:15:38.65	COMPLETED	user	2025-12-06 21:10:39.73	9de5c457-90ac-47df-b5f2-56c2e00f9838	CHIPPING / CLEANING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
9de5c457-90ac-47df-b5f2-56c2e00f9838	MWO-1765055439657	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-11 00:00:00	PLANNED	user	2025-12-06 21:10:39.665	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	po-2224455
14298abe-4484-48b4-9372-25a258247046	WO-CUTTING-1765055439678	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:10:56.687	COMPLETED	user	2025-12-06 21:10:39.685	9de5c457-90ac-47df-b5f2-56c2e00f9838	CUTTING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
774ce490-1c04-42e6-b171-45005df67548	WO-BLANKING OF HOOK-1765055439688	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:15:26.007	COMPLETED	user	2025-12-06 21:10:39.695	9de5c457-90ac-47df-b5f2-56c2e00f9838	BLANKING OF HOOK	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
ff34a9ee-7481-4cbb-b04a-d485ef051bfc	WO-PAINT-1765055439736	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:15:42.367	COMPLETED	user	2025-12-06 21:10:39.744	9de5c457-90ac-47df-b5f2-56c2e00f9838	PAINT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
6f5b6709-4e9e-4352-beff-8675c177307f	WO-PARTING OF THREADED SHAFT-1765055439698	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:15:30.895	COMPLETED	user	2025-12-06 21:10:39.704	9de5c457-90ac-47df-b5f2-56c2e00f9838	PARTING OF THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
5bc38d0f-40db-4bad-96b2-64b8178c8db1	WO-WEDING OF HOOK AND THREADED SHAFT-1765055439709	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:15:35.076	COMPLETED	user	2025-12-06 21:10:39.716	9de5c457-90ac-47df-b5f2-56c2e00f9838	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
6591292e-5616-44c7-abec-f62ebb66c0e0	WO-FUEL-1765055439747	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-06 21:15:45.875	COMPLETED	user	2025-12-06 21:10:39.754	9de5c457-90ac-47df-b5f2-56c2e00f9838	FUEL	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	MWO-1766310355353	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-11 00:00:00	PLANNED	user	2025-12-21 09:45:55.352	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	po-2224455
ecd51277-d9a9-4cb7-9281-e77d16b8cd95	MWO-1766316558136	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-11 00:00:00	PLANNED	user	2025-12-21 11:29:18.137	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	po-2224455
6d8050b6-f6fb-42c7-a07b-b3aad5578d26	WO-CUTTING-1766310355385	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 09:46:49.976	COMPLETED	user	2025-12-21 09:45:55.381	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	CUTTING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
6c9edea6-6391-49af-811e-27e56b83c15e	WO-BLANKING OF HOOK-1766310355396	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 10:06:20.64	COMPLETED	user	2025-12-21 09:45:55.393	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	BLANKING OF HOOK	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
dd7f1c67-6acf-4169-86ad-3c1f090d993f	WO-PARTING OF THREADED SHAFT-1766310355406	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 10:13:06.022	COMPLETED	user	2025-12-21 09:45:55.403	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	PARTING OF THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
d0715076-5af4-467c-a02b-6d861066e576	WO-WEDING OF HOOK AND THREADED SHAFT-1766310355417	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 10:13:09.777	COMPLETED	user	2025-12-21 09:45:55.414	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
f114c50a-201d-41cb-8b93-a09942b88523	WO-CHIPPING / CLEANING-1766310355428	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 10:13:13.245	COMPLETED	user	2025-12-21 09:45:55.424	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	CHIPPING / CLEANING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
bd85167d-4d04-47aa-920d-76fbf725a0cb	WO-FUEL-1766310355451	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 10:13:19.347	COMPLETED	user	2025-12-21 09:45:55.447	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	FUEL	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
d5882229-edcf-4a79-8660-7296e1f89a55	WO-PAINT-1766310355439	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 10:13:18.118	COMPLETED	user	2025-12-21 09:45:55.436	7e921c80-c1e1-4c92-bc08-cfd4d1963ab6	PAINT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
60fd13bb-d528-428f-b7f8-082b6b97f8d4	WO-BLANKING OF HOOK-1766316558184	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:29.789	COMPLETED	user	2025-12-21 11:29:18.184	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	BLANKING OF HOOK	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
a906933d-baad-4b69-9112-d2a2145e1adc	WO-CUTTING-1766316558172	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:26.632	COMPLETED	user	2025-12-21 11:29:18.169	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	CUTTING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
f602fda5-8e74-4891-b9ea-d96b28e04e3c	WO-PARTING OF THREADED SHAFT-1766316558196	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:33.495	COMPLETED	user	2025-12-21 11:29:18.195	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	PARTING OF THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
756e8c5a-fac0-48a2-9aaf-3e9b42b61130	WO-CUTTING-1766329372039	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:02:52.005	2025-12-21 15:02:52.108	COMPLETED	qa-test	2025-12-21 15:02:52.035	b61995f9-dacd-426c-b1ac-f41c17dbf7c2	CUTTING	\N	READY	\N	\N	\N	\N
148c5f42-4a83-42a2-ab5b-9981416246a3	WO-WEDING OF HOOK AND THREADED SHAFT-1766316558210	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:37.16	COMPLETED	user	2025-12-21 11:29:18.208	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
6f309d8b-690e-4977-9579-c8cec16c8de2	WO-CUTTING-1766329487578	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:04:47.552	2025-12-28 20:04:47.552	PLANNED	qa-test	2025-12-21 15:04:47.574	3c7a9a92-465e-4451-b9a9-1cbe4e14ea65	CUTTING	\N	READY	\N	\N	\N	\N
7feac14e-c5bf-49bb-81de-43b999bb617d	WO-CHIPPING / CLEANING-1766316558222	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:40.776	COMPLETED	user	2025-12-21 11:29:18.22	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	CHIPPING / CLEANING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
7f0b5c92-f3b6-42c8-b57e-fe2f136a7276	MWO-1766329487615	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:04:47.612	2025-12-28 20:04:47.612	PLANNED	qa-test	2025-12-21 15:04:47.616	\N	\N	\N	READY	\N	\N	\N	\N
b1795feb-8bf8-48af-91fd-29f87e109e50	WO-PAINT-1766316558234	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:43.03	COMPLETED	user	2025-12-21 11:29:18.234	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	PAINT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
94a0c94c-64cb-4945-8206-ca18823b00de	WO-CUTTING-1766329487628	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:04:47.612	2025-12-28 20:04:47.612	PLANNED	qa-test	2025-12-21 15:04:47.627	7f0b5c92-f3b6-42c8-b57e-fe2f136a7276	CUTTING	\N	READY	\N	\N	\N	\N
e7e61b68-a7c5-495e-8b5a-0250bf262f0a	WO-FUEL-1766316558251	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-11 00:00:00	2025-12-21 11:29:45.536	COMPLETED	user	2025-12-21 11:29:18.25	ecd51277-d9a9-4cb7-9281-e77d16b8cd95	FUEL	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
ee44d929-7a07-4907-a909-ca2180811b6f	MWO-1766329487641	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:04:47.639	2025-12-28 20:04:47.639	PLANNED	qa-test	2025-12-21 15:04:47.642	\N	\N	\N	READY	\N	\N	\N	\N
53557976-d6b1-4dc6-a79c-7f763ae49764	WO-CUTTING-1766329487654	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:04:47.639	2025-12-28 20:04:47.639	PLANNED	qa-test	2025-12-21 15:04:47.654	ee44d929-7a07-4907-a909-ca2180811b6f	CUTTING	\N	READY	\N	\N	\N	\N
28ea5571-8960-4c4a-9870-c48a322866b3	MWO-1766329487669	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:04:47.667	2025-12-28 20:04:47.667	PLANNED	qa-test	2025-12-21 15:04:47.67	\N	\N	\N	READY	\N	\N	\N	\N
d4ff4e9a-5786-4d6d-859c-2fe19e7bb10d	WO-CUTTING-1766329487682	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:04:47.667	2025-12-28 20:04:47.667	PLANNED	qa-test	2025-12-21 15:04:47.681	28ea5571-8960-4c4a-9870-c48a322866b3	CUTTING	\N	READY	\N	\N	\N	\N
7e1d7c76-4e14-4351-96df-9644397783bc	WO-CUTTING-1766329638407	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:07:18.386	2025-12-21 15:07:18.421	COMPLETED	qa-test	2025-12-21 15:07:18.407	3275e852-7c71-4cc4-a986-03e0833cad72	CUTTING	\N	READY	\N	\N	\N	\N
3275e852-7c71-4cc4-a986-03e0833cad72	MWO-1766329638390	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:07:18.386	2025-12-21 15:07:18.429	COMPLETED	qa-test	2025-12-21 15:07:18.391	\N	\N	\N	READY	\N	\N	\N	\N
acbca1d4-f674-473b-a522-1cbd06c6b1cb	WO-CUTTING-1766329638600	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:18.584	2025-12-21 15:07:18.613	COMPLETED	qa-test	2025-12-21 15:07:18.599	677c859e-5604-4f45-8535-c55511422d64	CUTTING	\N	READY	\N	\N	\N	\N
677c859e-5604-4f45-8535-c55511422d64	MWO-1766329638586	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:18.584	2025-12-21 15:07:18.62	COMPLETED	qa-test	2025-12-21 15:07:18.589	\N	\N	\N	READY	\N	\N	\N	\N
b3b2f85b-32c4-49b0-890b-9fedd70b755e	MWO-1766329638702	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:18.7	2025-12-28 20:07:18.7	PLANNED	qa-test	2025-12-21 15:07:18.705	\N	\N	\N	READY	\N	\N	\N	\N
d4175a07-7b5c-4a68-8b2c-d1629122f0ed	WO-CUTTING-1766329638749	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:07:18.734	2025-12-21 15:07:18.763	COMPLETED	qa-test	2025-12-21 15:07:18.749	bfb243e2-5d84-4661-8ffd-1c2ccbbf55b9	CUTTING	\N	READY	\N	\N	\N	\N
bfb243e2-5d84-4661-8ffd-1c2ccbbf55b9	MWO-1766329638736	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:07:18.734	2025-12-21 15:07:18.77	COMPLETED	qa-test	2025-12-21 15:07:18.738	\N	\N	\N	READY	\N	\N	\N	\N
584b3482-63ee-4354-9f31-b696402a99f1	WO-CUTTING-1766329638874	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:07:18.86	2025-12-21 15:07:18.887	COMPLETED	qa-test	2025-12-21 15:07:18.875	98970079-4657-45eb-a44a-255a691270b8	CUTTING	\N	READY	\N	\N	\N	\N
98970079-4657-45eb-a44a-255a691270b8	MWO-1766329638862	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:07:18.86	2025-12-21 15:07:18.896	COMPLETED	qa-test	2025-12-21 15:07:18.864	\N	\N	\N	READY	\N	\N	\N	\N
f60876ab-8a98-4aea-bbf2-d9ef5d35fe88	WO-CUTTING-1766329676404	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:07:56.383	2025-12-21 15:07:56.412	COMPLETED	qa-test	2025-12-21 15:07:56.402	09311b26-821d-4fc0-bc59-bc20dc34cfb9	CUTTING	\N	READY	\N	\N	\N	\N
09311b26-821d-4fc0-bc59-bc20dc34cfb9	MWO-1766329676386	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:07:56.383	2025-12-21 15:07:56.416	COMPLETED	qa-test	2025-12-21 15:07:56.384	\N	\N	\N	READY	\N	\N	\N	\N
899a2fb0-4fa0-48b1-9109-f07a9225db34	WO-CUTTING-1766329676623	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:56.6	2025-12-21 15:07:56.638	COMPLETED	qa-test	2025-12-21 15:07:56.616	94ea9bdf-0842-4b1b-918f-257a8bfc9e86	CUTTING	\N	READY	\N	\N	\N	\N
94ea9bdf-0842-4b1b-918f-257a8bfc9e86	MWO-1766329676602	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:56.6	2025-12-21 15:07:56.646	COMPLETED	qa-test	2025-12-21 15:07:56.601	\N	\N	\N	READY	\N	\N	\N	\N
4b2abf1b-e971-4bf4-9d76-37d61b73c1f7	MWO-1766329676751	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:56.749	2025-12-28 20:07:56.749	PLANNED	qa-test	2025-12-21 15:07:56.75	\N	\N	\N	READY	\N	\N	\N	\N
668a4df7-1737-48eb-b010-240a87e17584	WO-CUTTING-1766329676794	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:07:56.774	2025-12-21 15:07:56.806	COMPLETED	qa-test	2025-12-21 15:07:56.788	804d2e04-bc2e-46d5-9b79-c984e44c89d0	CUTTING	\N	READY	\N	\N	\N	\N
804d2e04-bc2e-46d5-9b79-c984e44c89d0	MWO-1766329676777	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:07:56.774	2025-12-21 15:07:56.816	COMPLETED	qa-test	2025-12-21 15:07:56.776	\N	\N	\N	READY	\N	\N	\N	\N
6252f739-a002-4d9f-a133-5776ccf6e38f	WO-CUTTING-1766329676941	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:07:56.931	2025-12-21 15:07:56.95	COMPLETED	qa-test	2025-12-21 15:07:56.94	9488faaa-2f7b-4bb9-b278-5fb9b9e81baa	CUTTING	\N	READY	\N	\N	\N	\N
9488faaa-2f7b-4bb9-b278-5fb9b9e81baa	MWO-1766329676932	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:07:56.931	2025-12-21 15:07:56.956	COMPLETED	qa-test	2025-12-21 15:07:56.932	\N	\N	\N	READY	\N	\N	\N	\N
1d3f77fb-f34d-4701-bd6d-0897838cabdc	MWO-1766324177966	5cdef655-4cf2-400f-8609-189236cc9a8c	100	\N	1	2025-12-21 18:36:17.956	2025-12-28 18:36:17.956	PLANNED	test-user	2025-12-21 13:36:17.961	\N	\N	\N	READY	\N	\N	\N	\N
9a73722f-71e5-403f-901d-0fd90e9adce7	MWO-1766324195137	5cdef655-4cf2-400f-8609-189236cc9a8c	100	\N	1	2025-12-21 18:36:35.132	2025-12-28 18:36:35.132	PLANNED	test-user	2025-12-21 13:36:35.137	\N	\N	\N	READY	\N	\N	\N	\N
1e456799-6328-4b5a-8da0-b46820abe3c8	MWO-1766324211033	5cdef655-4cf2-400f-8609-189236cc9a8c	100	\N	1	2025-12-21 18:36:51.029	2025-12-28 18:36:51.029	PLANNED	test-user	2025-12-21 13:36:51.03	\N	\N	\N	READY	\N	\N	\N	\N
013ee0f3-7542-43fb-826b-c565c2fd2f66	WO-CUTTING-1766329279196	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:01:19.169	2025-12-21 15:01:19.255	COMPLETED	qa-test	2025-12-21 15:01:19.192	8de56797-03d1-4c1e-a5b8-bbc1c506bdc0	CUTTING	\N	READY	\N	\N	\N	\N
8de56797-03d1-4c1e-a5b8-bbc1c506bdc0	MWO-1766329279173	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:01:19.169	2025-12-21 15:01:19.373	COMPLETED	qa-test	2025-12-21 15:01:19.171	\N	\N	\N	READY	\N	\N	\N	\N
935d469e-2e52-4ca6-bb00-d75709a9ffe9	WO-CUTTING-1766329281668	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:01:21.651	2025-12-21 15:01:21.685	COMPLETED	qa-test	2025-12-21 15:01:21.666	4721745b-ac7a-43ab-a18e-10d268eb0afe	CUTTING	\N	READY	\N	\N	\N	\N
4721745b-ac7a-43ab-a18e-10d268eb0afe	MWO-1766329281654	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:01:21.651	2025-12-21 15:01:21.753	COMPLETED	qa-test	2025-12-21 15:01:21.653	\N	\N	\N	READY	\N	\N	\N	\N
68ce8d8b-4887-4379-8384-3bc52c4058fa	MWO-1766329283981	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:01:23.978	2025-12-28 20:01:23.978	PLANNED	qa-test	2025-12-21 15:01:23.98	\N	\N	\N	READY	\N	\N	\N	\N
ef00d585-5f44-4107-9685-9de4451c5013	WO-CUTTING-1766329284018	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:01:24.001	2025-12-21 15:01:24.036	COMPLETED	qa-test	2025-12-21 15:01:24.016	fe7fa435-1b7d-4bf9-bb85-b8dd9102a340	CUTTING	\N	READY	\N	\N	\N	\N
fe7fa435-1b7d-4bf9-bb85-b8dd9102a340	MWO-1766329284003	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:01:24.001	2025-12-21 15:01:24.104	COMPLETED	qa-test	2025-12-21 15:01:24.003	\N	\N	\N	READY	\N	\N	\N	\N
91e5d1f6-d957-4c10-85d5-5d789ca5f43f	WO-CUTTING-1766329286401	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:01:26.366	2025-12-21 15:01:26.434	COMPLETED	qa-test	2025-12-21 15:01:26.397	edea1d06-2187-46ac-942c-60047e3804d1	CUTTING	\N	READY	\N	\N	\N	\N
edea1d06-2187-46ac-942c-60047e3804d1	MWO-1766329286369	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:01:26.366	2025-12-21 15:01:26.589	COMPLETED	qa-test	2025-12-21 15:01:26.368	\N	\N	\N	READY	\N	\N	\N	\N
ef20902e-5afa-44d1-8f86-b4a939e6320b	WO-CUTTING-1766329338643	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:02:18.605	2025-12-21 15:02:18.717	COMPLETED	qa-test	2025-12-21 15:02:18.643	0eb59a52-7e55-4299-84ed-b2749c8b480c	CUTTING	\N	READY	\N	\N	\N	\N
0eb59a52-7e55-4299-84ed-b2749c8b480c	MWO-1766329338612	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:02:18.605	2025-12-21 15:02:18.803	COMPLETED	qa-test	2025-12-21 15:02:18.613	\N	\N	\N	READY	\N	\N	\N	\N
769e66f6-64fb-4142-bdc6-d342d51e3c5f	WO-CUTTING-1766329411994	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:03:31.969	2025-12-21 15:03:32.033	COMPLETED	qa-test	2025-12-21 15:03:31.991	e9fb3c97-683b-4b44-b685-45e0494eaff2	CUTTING	\N	READY	\N	\N	\N	\N
e9fb3c97-683b-4b44-b685-45e0494eaff2	MWO-1766329411973	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:03:31.969	2025-12-21 15:03:32.092	COMPLETED	qa-test	2025-12-21 15:03:31.971	\N	\N	\N	READY	\N	\N	\N	\N
97fae741-cea6-42a6-b52e-bfc2e3236d91	WO-CUTTING-1766329563504	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:06:03.479	2025-12-21 15:06:03.519	COMPLETED	qa-test	2025-12-21 15:06:03.502	0b16449f-6594-4e26-bbee-5b2cc69ffd92	CUTTING	\N	READY	\N	\N	\N	\N
0b16449f-6594-4e26-bbee-5b2cc69ffd92	MWO-1766329563485	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:06:03.479	2025-12-21 15:06:03.527	COMPLETED	qa-test	2025-12-21 15:06:03.484	\N	\N	\N	READY	\N	\N	\N	\N
d01f4ec7-ae9f-4e49-89c8-271d64fa1cac	WO-CUTTING-1766329563776	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:06:03.762	2025-12-21 15:06:03.792	COMPLETED	qa-test	2025-12-21 15:06:03.776	657da72f-cfd9-444a-9760-681e22d673d0	CUTTING	\N	READY	\N	\N	\N	\N
657da72f-cfd9-444a-9760-681e22d673d0	MWO-1766329563765	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:06:03.762	2025-12-21 15:06:03.8	COMPLETED	qa-test	2025-12-21 15:06:03.766	\N	\N	\N	READY	\N	\N	\N	\N
19cd2336-3007-49dc-b22b-0f00871adc06	WO-CUTTING-1766329563823	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:06:03.805	2025-12-21 15:06:03.835	COMPLETED	qa-test	2025-12-21 15:06:03.823	fa8f67a7-d9c7-4856-a74f-006d926b1fea	CUTTING	\N	READY	\N	\N	\N	\N
fa8f67a7-d9c7-4856-a74f-006d926b1fea	MWO-1766329563806	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:06:03.805	2025-12-21 15:06:03.842	COMPLETED	qa-test	2025-12-21 15:06:03.808	\N	\N	\N	READY	\N	\N	\N	\N
43262a9d-b64f-460e-b7a9-f2f6d5fab333	WO-CUTTING-1766329563861	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:06:03.847	2025-12-21 15:06:03.877	COMPLETED	qa-test	2025-12-21 15:06:03.86	af3c5fbc-77f7-4107-b159-642f3bb6e182	CUTTING	\N	READY	\N	\N	\N	\N
af3c5fbc-77f7-4107-b159-642f3bb6e182	MWO-1766329563849	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:06:03.847	2025-12-21 15:06:03.884	COMPLETED	qa-test	2025-12-21 15:06:03.851	\N	\N	\N	READY	\N	\N	\N	\N
86af547b-b048-45d1-b62c-7388609187d9	WO-CUTTING-1766329662545	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:07:42.522	2025-12-21 15:07:42.56	COMPLETED	qa-test	2025-12-21 15:07:42.545	ff2d6d0f-9ae7-4af3-a789-c57d8e6b0c45	CUTTING	\N	READY	\N	\N	\N	\N
ff2d6d0f-9ae7-4af3-a789-c57d8e6b0c45	MWO-1766329662526	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:07:42.522	2025-12-21 15:07:42.569	COMPLETED	qa-test	2025-12-21 15:07:42.528	\N	\N	\N	READY	\N	\N	\N	\N
46841e50-02bb-48bd-a185-eb061b6aeb32	WO-CUTTING-1766329662735	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:42.724	2025-12-21 15:07:42.745	COMPLETED	qa-test	2025-12-21 15:07:42.735	04bbba68-7922-418c-ab70-c9185614aec4	CUTTING	\N	READY	\N	\N	\N	\N
04bbba68-7922-418c-ab70-c9185614aec4	MWO-1766329662725	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:42.724	2025-12-21 15:07:42.749	COMPLETED	qa-test	2025-12-21 15:07:42.728	\N	\N	\N	READY	\N	\N	\N	\N
a048d1e5-a516-40ab-b020-e98d7022a318	MWO-1766329662819	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:07:42.818	2025-12-28 20:07:42.818	PLANNED	qa-test	2025-12-21 15:07:42.822	\N	\N	\N	READY	\N	\N	\N	\N
021c36af-6e14-4340-9aa4-29865c916bc4	WO-CUTTING-1766329662849	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:07:42.837	2025-12-21 15:07:42.859	COMPLETED	qa-test	2025-12-21 15:07:42.85	71089eb8-4352-41d6-ab85-5be5f58089cf	CUTTING	\N	READY	\N	\N	\N	\N
71089eb8-4352-41d6-ab85-5be5f58089cf	MWO-1766329662839	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:07:42.837	2025-12-21 15:07:42.862	COMPLETED	qa-test	2025-12-21 15:07:42.842	\N	\N	\N	READY	\N	\N	\N	\N
91dd9bc6-7f12-4dad-8d76-b7dc4946d88e	WO-CUTTING-1766329662951	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:07:42.941	2025-12-21 15:07:42.962	COMPLETED	qa-test	2025-12-21 15:07:42.953	60573166-cf2d-4c47-ae0b-75b9ad37d9b6	CUTTING	\N	READY	\N	\N	\N	\N
60573166-cf2d-4c47-ae0b-75b9ad37d9b6	MWO-1766329662943	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:07:42.941	2025-12-21 15:07:42.967	COMPLETED	qa-test	2025-12-21 15:07:42.946	\N	\N	\N	READY	\N	\N	\N	\N
fdc2494d-aaf6-4a45-9dc5-fffd4aec6a98	WO-CUTTING-1766329687691	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:08:07.654	2025-12-21 15:08:07.712	COMPLETED	qa-test	2025-12-21 15:08:07.692	ae32ac48-6c96-490c-9984-d2e14459d0f9	CUTTING	\N	READY	\N	\N	\N	\N
ae32ac48-6c96-490c-9984-d2e14459d0f9	MWO-1766329687660	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:08:07.654	2025-12-21 15:08:07.723	COMPLETED	qa-test	2025-12-21 15:08:07.664	\N	\N	\N	READY	\N	\N	\N	\N
b13d118e-ea81-4198-81d7-c5d044ac23a0	WO-CUTTING-1766329687975	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:07.958	2025-12-21 15:08:07.992	COMPLETED	qa-test	2025-12-21 15:08:07.977	b9f094c5-3125-421e-bfbb-dd97a1caca89	CUTTING	\N	READY	\N	\N	\N	\N
b9f094c5-3125-421e-bfbb-dd97a1caca89	MWO-1766329687960	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:07.958	2025-12-21 15:08:07.999	COMPLETED	qa-test	2025-12-21 15:08:07.967	\N	\N	\N	READY	\N	\N	\N	\N
8c929b4f-926f-407b-9be6-e58778d149ab	MWO-1766329688105	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:08.101	2025-12-28 20:08:08.101	PLANNED	qa-test	2025-12-21 15:08:08.111	\N	\N	\N	READY	\N	\N	\N	\N
8d845ab7-1278-4b74-9bb6-21326db05277	WO-CUTTING-1766329688150	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:08:08.13	2025-12-21 15:08:08.17	COMPLETED	qa-test	2025-12-21 15:08:08.153	8b36cc83-3981-4ad8-8dba-e913699af13e	CUTTING	\N	READY	\N	\N	\N	\N
8b36cc83-3981-4ad8-8dba-e913699af13e	MWO-1766329688133	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:08:08.13	2025-12-21 15:08:08.176	COMPLETED	qa-test	2025-12-21 15:08:08.139	\N	\N	\N	READY	\N	\N	\N	\N
5e252240-4104-4caa-b34a-b35f58f41819	WO-CUTTING-1766329688346	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:08:08.328	2025-12-21 15:08:08.365	COMPLETED	qa-test	2025-12-21 15:08:08.349	437bb55e-6ea2-41e9-ab70-63a36be49df7	CUTTING	\N	READY	\N	\N	\N	\N
437bb55e-6ea2-41e9-ab70-63a36be49df7	MWO-1766329688331	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:08:08.328	2025-12-21 15:08:08.37	COMPLETED	qa-test	2025-12-21 15:08:08.337	\N	\N	\N	READY	\N	\N	\N	\N
b69a4ef2-e701-4d29-b514-e7eefa88e672	WO-CUTTING-1766329702443	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:08:22.423	2025-12-21 15:08:22.452	COMPLETED	qa-test	2025-12-21 15:08:22.442	df774ecc-68ac-4203-9eb3-77d1fa4a68a6	CUTTING	\N	READY	\N	\N	\N	\N
df774ecc-68ac-4203-9eb3-77d1fa4a68a6	MWO-1766329702426	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:08:22.423	2025-12-21 15:08:22.459	COMPLETED	qa-test	2025-12-21 15:08:22.426	\N	\N	\N	READY	\N	\N	\N	\N
8d728a74-854a-4704-b25c-0f4878776d47	WO-CUTTING-1766329702619	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:22.604	2025-12-21 15:08:22.632	COMPLETED	qa-test	2025-12-21 15:08:22.618	d7d3a4ef-f72d-47b1-8b92-eaf8a3881786	CUTTING	\N	READY	\N	\N	\N	\N
d7d3a4ef-f72d-47b1-8b92-eaf8a3881786	MWO-1766329702606	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:22.604	2025-12-21 15:08:22.64	COMPLETED	qa-test	2025-12-21 15:08:22.607	\N	\N	\N	READY	\N	\N	\N	\N
2568fb0c-43ee-48b1-a204-4852ecd9db35	MWO-1766329702724	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:22.722	2025-12-28 20:08:22.722	PLANNED	qa-test	2025-12-21 15:08:22.725	\N	\N	\N	READY	\N	\N	\N	\N
ec1a3e42-5e1d-4aef-a070-b9b72f9192c8	WO-CUTTING-1766329702763	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:08:22.749	2025-12-21 15:08:22.775	COMPLETED	qa-test	2025-12-21 15:08:22.762	049ffcd7-9348-457b-adfe-781245a9a455	CUTTING	\N	READY	\N	\N	\N	\N
049ffcd7-9348-457b-adfe-781245a9a455	MWO-1766329702750	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:08:22.749	2025-12-21 15:08:22.783	COMPLETED	qa-test	2025-12-21 15:08:22.752	\N	\N	\N	READY	\N	\N	\N	\N
b6966d78-549e-4f32-b87b-201d79e186ae	WO-CUTTING-1766329702889	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:08:22.873	2025-12-21 15:08:22.902	COMPLETED	qa-test	2025-12-21 15:08:22.888	90286941-a43c-4ac0-a138-22ac102d444d	CUTTING	\N	READY	\N	\N	\N	\N
90286941-a43c-4ac0-a138-22ac102d444d	MWO-1766329702875	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:08:22.873	2025-12-21 15:08:22.91	COMPLETED	qa-test	2025-12-21 15:08:22.876	\N	\N	\N	READY	\N	\N	\N	\N
f88cd165-27bf-4350-bcf1-1b1b7aebb061	WO-CUTTING-1766329711812	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:08:31.788	2025-12-21 15:08:31.823	COMPLETED	qa-test	2025-12-21 15:08:31.809	679d5772-edf1-4a0c-8c2d-475582434635	CUTTING	\N	READY	\N	\N	\N	\N
679d5772-edf1-4a0c-8c2d-475582434635	MWO-1766329711793	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:08:31.788	2025-12-21 15:08:31.835	COMPLETED	qa-test	2025-12-21 15:08:31.792	\N	\N	\N	READY	\N	\N	\N	\N
28f22f53-123b-4b9b-ba3e-b03d5654b823	WO-CUTTING-1766329712010	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:31.991	2025-12-21 15:08:32.022	COMPLETED	qa-test	2025-12-21 15:08:32.008	056d5bd5-8f3d-44de-bb2c-9e6ee5c82919	CUTTING	\N	READY	\N	\N	\N	\N
056d5bd5-8f3d-44de-bb2c-9e6ee5c82919	MWO-1766329711993	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:31.991	2025-12-21 15:08:32.03	COMPLETED	qa-test	2025-12-21 15:08:31.994	\N	\N	\N	READY	\N	\N	\N	\N
90c26fe0-14ac-44ee-a315-4cf47ff8b737	MWO-1766329712108	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:08:32.107	2025-12-28 20:08:32.107	PLANNED	qa-test	2025-12-21 15:08:32.109	\N	\N	\N	READY	\N	\N	\N	\N
cc65608e-92b4-4c02-a5d2-8e32d3501aa2	WO-CUTTING-1766329712152	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:08:32.137	2025-12-21 15:08:32.163	COMPLETED	qa-test	2025-12-21 15:08:32.151	b329a525-a559-4267-ba5a-8856e828db96	CUTTING	\N	READY	\N	\N	\N	\N
b329a525-a559-4267-ba5a-8856e828db96	MWO-1766329712140	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:08:32.137	2025-12-21 15:08:32.171	COMPLETED	qa-test	2025-12-21 15:08:32.14	\N	\N	\N	READY	\N	\N	\N	\N
905da073-29d6-430f-be4a-d610493eb8a5	WO-CUTTING-1766329712283	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:08:32.268	2025-12-21 15:08:32.294	COMPLETED	qa-test	2025-12-21 15:08:32.282	eaa78602-5049-4b56-89c2-0fc894775962	CUTTING	\N	READY	\N	\N	\N	\N
eaa78602-5049-4b56-89c2-0fc894775962	MWO-1766329712269	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:08:32.268	2025-12-21 15:08:32.301	COMPLETED	qa-test	2025-12-21 15:08:32.27	\N	\N	\N	READY	\N	\N	\N	\N
e3a50e5c-2749-4a58-94c1-56469fbbb690	WO-CUTTING-1766330809380	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:26:49.359	2025-12-21 15:26:49.391	COMPLETED	qa-test	2025-12-21 15:26:49.378	ba05140f-80f6-4fc7-9f72-23311258962b	CUTTING	\N	READY	\N	\N	\N	\N
ba05140f-80f6-4fc7-9f72-23311258962b	MWO-1766330809362	5cdef655-4cf2-400f-8609-189236cc9a8c	40	\N	1	2025-12-21 20:26:49.359	2025-12-21 15:26:49.4	COMPLETED	qa-test	2025-12-21 15:26:49.362	\N	\N	\N	READY	\N	\N	\N	\N
3feae2e1-f561-46b8-ac87-31f1de272e55	WO-CUTTING-1766330809580	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:26:49.566	2025-12-21 15:26:49.591	COMPLETED	qa-test	2025-12-21 15:26:49.578	746c9bdf-a530-472e-af5d-96b9b0916a81	CUTTING	\N	READY	\N	\N	\N	\N
746c9bdf-a530-472e-af5d-96b9b0916a81	MWO-1766330809567	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:26:49.566	2025-12-21 15:26:49.6	COMPLETED	qa-test	2025-12-21 15:26:49.568	\N	\N	\N	READY	\N	\N	\N	\N
3b3eaf26-51f2-4d15-badf-3886e402d6f2	MWO-1766330809688	5cdef655-4cf2-400f-8609-189236cc9a8c	50	\N	1	2025-12-21 20:26:49.686	2025-12-28 20:26:49.686	PLANNED	qa-test	2025-12-21 15:26:49.688	\N	\N	\N	READY	\N	\N	\N	\N
0de42e28-24f0-4cae-bea3-dffeeed7120e	WO-CUTTING-1766330809726	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:26:49.71	2025-12-21 15:26:49.737	COMPLETED	qa-test	2025-12-21 15:26:49.723	ef4745b9-46da-4458-8395-71abd61952c6	CUTTING	\N	READY	\N	\N	\N	\N
ef4745b9-46da-4458-8395-71abd61952c6	MWO-1766330809712	5cdef655-4cf2-400f-8609-189236cc9a8c	30	\N	1	2025-12-21 20:26:49.71	2025-12-21 15:26:49.745	COMPLETED	qa-test	2025-12-21 15:26:49.712	\N	\N	\N	READY	\N	\N	\N	\N
1daa018a-1eba-4825-9fc6-9150bc30b5a2	WO-CUTTING-1766330809857	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:26:49.842	2025-12-21 15:26:49.869	COMPLETED	qa-test	2025-12-21 15:26:49.855	8083a5c4-6470-4541-b224-63a921339698	CUTTING	\N	READY	\N	\N	\N	\N
8083a5c4-6470-4541-b224-63a921339698	MWO-1766330809844	5cdef655-4cf2-400f-8609-189236cc9a8c	20	\N	1	2025-12-21 20:26:49.842	2025-12-21 15:26:49.876	COMPLETED	qa-test	2025-12-21 15:26:49.844	\N	\N	\N	READY	\N	\N	\N	\N
3ff7eab7-5692-4cf2-80ab-867975b69186	MWO-1766425512220	077b6e4a-a968-45e7-bff7-d3259f88eaea	500	\N	1	2025-12-22 05:00:00	2025-12-29 05:00:00	PLANNED	system	2025-12-22 17:45:12.22	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251206-PO-2224455	\N
8f52c159-8d96-42a6-9e91-82587a827106	MWO-1766427728210	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2026-01-15 00:00:00	PLANNED	user	2025-12-22 18:22:08.209	\N	\N	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	po-12234
050833d7-28f4-4132-b2b7-c91199b4f52a	WO-CUTTING-1766427728232	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:23:19.152	COMPLETED	user	2025-12-22 18:22:08.227	8f52c159-8d96-42a6-9e91-82587a827106	CUTTING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
b5c67730-c871-4fe8-b844-4707672eee42	WO-BLANKING OF HOOK-1766427728248	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:23:39.31	COMPLETED	user	2025-12-22 18:22:08.244	8f52c159-8d96-42a6-9e91-82587a827106	BLANKING OF HOOK	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
ab075d86-8870-4fb3-8d5d-b6b48db96215	WO-PARTING OF THREADED SHAFT-1766427728260	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:24:06.737	COMPLETED	user	2025-12-22 18:22:08.257	8f52c159-8d96-42a6-9e91-82587a827106	PARTING OF THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
31929898-0ce0-4699-8615-e8a38aedb006	WO-WEDING OF HOOK AND THREADED SHAFT-1766427728274	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:24:12.452	COMPLETED	user	2025-12-22 18:22:08.272	8f52c159-8d96-42a6-9e91-82587a827106	WEDING OF HOOK AND THREADED SHAFT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
042faa7b-31e9-47ae-a375-0ab6fab113ee	WO-CHIPPING / CLEANING-1766427728292	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:24:16.749	COMPLETED	user	2025-12-22 18:22:08.289	8f52c159-8d96-42a6-9e91-82587a827106	CHIPPING / CLEANING	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
a9575657-ac0f-466f-991b-ebd62315e738	WO-PAINT-1766427728307	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:24:30.078	COMPLETED	user	2025-12-22 18:22:08.304	8f52c159-8d96-42a6-9e91-82587a827106	PAINT	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
118fbd14-327e-431f-b0c7-3b26aa16e475	WO-FUEL-1766427728320	077b6e4a-a968-45e7-bff7-d3259f88eaea	50	\N	1	2025-12-29 00:00:00	2025-12-22 18:24:38.941	COMPLETED	user	2025-12-22 18:22:08.317	8f52c159-8d96-42a6-9e91-82587a827106	FUEL	\N	READY	\N	Ghandhara Automobiles Limited	SO-20251222-PO-12234	\N
\.


--
-- Data for Name: work_order_item; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.work_order_item (id, wo_id, product_id, quantity) FROM stdin;
\.


--
-- Data for Name: work_order_material_issue; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.work_order_material_issue (issue_id, work_order_id, material_id, material_type, quantity_planned, quantity_issued, quantity_consumed, quantity_returned, unit_cost, total_cost, issued_at, issued_by, status) FROM stdin;
fe301ad0-4324-48eb-bcf1-2413f024f2b1	1b01641d-5110-4794-9c2d-98493aa90f90	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	SHEET	\N	5.0000	\N	0.0000	7000.00	35000.00	2025-12-06 17:07:55.743539	test_user	ISSUED
9560f003-861e-4789-9256-9b43955d2354	ea6d3e62-b20d-4d1d-a4be-af46c046bd82	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	SHEET	\N	5.0000	\N	0.0000	7000.00	35000.00	2025-12-06 17:10:46.137268	test_user	ISSUED
d2f06ef5-7f94-48eb-abbe-33bdc3cfa1f3	0cb9caad-1b30-4e86-8e16-d55d3723f649	0e30fbb7-5302-4ce4-9498-e8db979fd3e1	SHEET	\N	5.0000	\N	0.0000	7000.00	35000.00	2025-12-06 17:12:39.231298	test_user	ISSUED
9b3e2c86-c5e4-4aca-b57a-dbc45949f83b	a108dc62-ccd5-447a-a370-e738eb23c66c	6d389b17-3618-4d85-9c2c-a973a2a62279	SHEET	\N	11.0000	\N	0.0000	7000.00	77000.00	2025-12-06 17:21:29.313587	test_user	ISSUED
42621040-5f51-42a2-81cd-4704ae3fbd95	4d89114c-d440-4f17-aff1-465cf12a852f	dc604e33-9302-4f82-9c81-9afd572a603f	SHEET	10.0000	10.0000	\N	0.0000	\N	\N	2025-12-06 20:18:03.858886	\N	ISSUED
2596d078-7ead-4d7d-aa7c-8019af486f02	14298abe-4484-48b4-9372-25a258247046	6d389b17-3618-4d85-9c2c-a973a2a62279	SHEET	251.0000	251.0000	\N	0.0000	0.00	0.00	2025-12-06 21:10:52.84473	system	ISSUED
f74fd80d-a5fb-4428-b875-1d9204ee0eb2	6d8050b6-f6fb-42c7-a07b-b3aad5578d26	6d389b17-3618-4d85-9c2c-a973a2a62279	SHEET	251.0000	251.0000	\N	0.0000	0.00	0.00	2025-12-21 09:46:13.461499	system	ISSUED
a1f6ace4-9925-4452-953d-18a0df907068	6c9edea6-6391-49af-811e-27e56b83c15e	dc604e33-9302-4f82-9c81-9afd572a603f	SHEET	7000.0000	7000.0000	\N	0.0000	0.00	0.00	2025-12-21 09:57:51.314288	system	ISSUED
f42452c0-faf1-4c43-8ddd-1177b9737bb7	050833d7-28f4-4132-b2b7-c91199b4f52a	6d389b17-3618-4d85-9c2c-a973a2a62279	SHEET	26.0000	26.0000	\N	0.0000	0.00	0.00	2025-12-22 18:23:12.466244	system	ISSUED
696461d3-d245-4c2e-9d1b-c9053516fc38	b5c67730-c871-4fe8-b844-4707672eee42	0f126f28-ce5d-48c3-ab33-466a636f34cf	SHEET	150.0000	150.0000	\N	0.0000	0.00	0.00	2025-12-22 18:23:33.911792	system	ISSUED
d7f6db58-05a8-489d-b0d6-6bf456738314	b5c67730-c871-4fe8-b844-4707672eee42	2fb8c1d0-380a-4d05-89ae-fd30bad51b0f	SHEET	550.0000	550.0000	\N	0.0000	0.00	0.00	2025-12-22 18:23:33.941646	system	ISSUED
424636f9-ee65-4119-9dc9-243643141598	ab075d86-8870-4fb3-8d5d-b6b48db96215	dc604e33-9302-4f82-9c81-9afd572a603f	SHEET	700.0000	700.0000	\N	0.0000	0.00	0.00	2025-12-22 18:24:01.873762	system	ISSUED
5ce2528a-b253-41f2-9336-2003072e396b	a9575657-ac0f-466f-991b-ebd62315e738	509e4501-199b-409b-8fe2-2ff4f29b495c	SHEET	5.0000	5.0000	\N	0.0000	0.00	0.00	2025-12-22 18:24:25.217834	system	ISSUED
\.


--
-- Data for Name: work_order_step; Type: TABLE DATA; Schema: public; Owner: erp_user
--

COPY public.work_order_step (step_id, wo_id, step_no, routing_id, operation, work_center, assigned_to, planned_qty, start_time, end_time, status, remarks, created_at) FROM stdin;
\.


--
-- Name: customer_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.customer_seq', 3, true);


--
-- Name: manual_opening_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: erp_user
--

SELECT pg_catalog.setval('public.manual_opening_stock_id_seq', 3, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: batch_consumption batch_consumption_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.batch_consumption
    ADD CONSTRAINT batch_consumption_pkey PRIMARY KEY (consumption_id);


--
-- Name: batch batch_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.batch
    ADD CONSTRAINT batch_pkey PRIMARY KEY (batch_id);


--
-- Name: blank_optimization blank_optimization_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.blank_optimization
    ADD CONSTRAINT blank_optimization_pkey PRIMARY KEY (optimization_id);


--
-- Name: blank_spec blank_spec_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.blank_spec
    ADD CONSTRAINT blank_spec_pkey PRIMARY KEY (blank_id);


--
-- Name: bom_explosion_log bom_explosion_log_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_explosion_log
    ADD CONSTRAINT bom_explosion_log_pkey PRIMARY KEY (explosion_id);


--
-- Name: bom bom_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_pkey PRIMARY KEY (bom_id);


--
-- Name: bom_substitution_rules bom_substitution_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_substitution_rules
    ADD CONSTRAINT bom_substitution_rules_pkey PRIMARY KEY (id);


--
-- Name: bom_substitution_rules bom_substitution_rules_product_id_sub_assembly_name_primary_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_substitution_rules
    ADD CONSTRAINT bom_substitution_rules_product_id_sub_assembly_name_primary_key UNIQUE (product_id, sub_assembly_name, primary_material_id, substitute_material_id);


--
-- Name: client_ordered_materials client_ordered_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.client_ordered_materials
    ADD CONSTRAINT client_ordered_materials_pkey PRIMARY KEY (id);


--
-- Name: customer customer_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_customer_code_key UNIQUE (customer_code);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);


--
-- Name: dispatch_item dispatch_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch_item
    ADD CONSTRAINT dispatch_item_pkey PRIMARY KEY (di_id);


--
-- Name: dispatch_order dispatch_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch_order
    ADD CONSTRAINT dispatch_order_pkey PRIMARY KEY (dispatch_id);


--
-- Name: dispatch dispatch_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch
    ADD CONSTRAINT dispatch_pkey PRIMARY KEY (dispatch_id);


--
-- Name: goods_receipt_item goods_receipt_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_pkey PRIMARY KEY (gri_id);


--
-- Name: goods_receipt goods_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_pkey PRIMARY KEY (grn_id);


--
-- Name: internal_purchase_order_item internal_purchase_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.internal_purchase_order_item
    ADD CONSTRAINT internal_purchase_order_item_pkey PRIMARY KEY (ipo_item_id);


--
-- Name: internal_purchase_order internal_purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.internal_purchase_order
    ADD CONSTRAINT internal_purchase_order_pkey PRIMARY KEY (ipo_id);


--
-- Name: internal_purchase_order internal_purchase_order_po_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.internal_purchase_order
    ADD CONSTRAINT internal_purchase_order_po_number_key UNIQUE (po_number);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- Name: inventory_txn inventory_txn_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_pkey PRIMARY KEY (txn_id);


--
-- Name: invoice_item invoice_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice_item
    ADD CONSTRAINT invoice_item_pkey PRIMARY KEY (invoice_item_id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (location_id);


--
-- Name: manual_opening_stock manual_opening_stock_period_key_product_id_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.manual_opening_stock
    ADD CONSTRAINT manual_opening_stock_period_key_product_id_key UNIQUE (period_key, product_id);


--
-- Name: manual_opening_stock manual_opening_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.manual_opening_stock
    ADD CONSTRAINT manual_opening_stock_pkey PRIMARY KEY (id);


--
-- Name: material_allocations material_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_allocations
    ADD CONSTRAINT material_allocations_pkey PRIMARY KEY (id);


--
-- Name: material_availability_cache material_availability_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_availability_cache
    ADD CONSTRAINT material_availability_cache_pkey PRIMARY KEY (material_id);


--
-- Name: material_consumption material_consumption_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_consumption
    ADD CONSTRAINT material_consumption_pkey PRIMARY KEY (consumption_id);


--
-- Name: material material_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_pkey PRIMARY KEY (material_id);


--
-- Name: material_requisition material_requisition_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_requisition
    ADD CONSTRAINT material_requisition_pkey PRIMARY KEY (requisition_id);


--
-- Name: material_reservation material_reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_reservation
    ADD CONSTRAINT material_reservation_pkey PRIMARY KEY (reservation_id);


--
-- Name: model model_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.model
    ADD CONSTRAINT model_pkey PRIMARY KEY (model_id);


--
-- Name: oem oem_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.oem
    ADD CONSTRAINT oem_pkey PRIMARY KEY (oem_id);


--
-- Name: operation operation_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.operation
    ADD CONSTRAINT operation_pkey PRIMARY KEY (operation_id);


--
-- Name: packaging_priority packaging_priority_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.packaging_priority
    ADD CONSTRAINT packaging_priority_pkey PRIMARY KEY (id);


--
-- Name: packaging_priority packaging_priority_product_id_carton_size_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.packaging_priority
    ADD CONSTRAINT packaging_priority_product_id_carton_size_key UNIQUE (product_id, carton_size);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: planned_production planned_production_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.planned_production
    ADD CONSTRAINT planned_production_pkey PRIMARY KEY (planned_production_id);


--
-- Name: planned_production planned_production_plan_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.planned_production
    ADD CONSTRAINT planned_production_plan_number_key UNIQUE (plan_number);


--
-- Name: procurement_request procurement_request_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.procurement_request
    ADD CONSTRAINT procurement_request_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- Name: production_material_consumption production_material_consumption_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_consumption
    ADD CONSTRAINT production_material_consumption_pkey PRIMARY KEY (consumption_id);


--
-- Name: production_material_usage production_material_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_usage
    ADD CONSTRAINT production_material_usage_pkey PRIMARY KEY (usage_id);


--
-- Name: production_order production_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_order
    ADD CONSTRAINT production_order_pkey PRIMARY KEY (po_id);


--
-- Name: production_output production_output_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_output
    ADD CONSTRAINT production_output_pkey PRIMARY KEY (output_id);


--
-- Name: production_recipe_snapshots production_recipe_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_recipe_snapshots
    ADD CONSTRAINT production_recipe_snapshots_pkey PRIMARY KEY (id);


--
-- Name: production_step production_step_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_step
    ADD CONSTRAINT production_step_pkey PRIMARY KEY (ps_id);


--
-- Name: purchase_order_item purchase_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_pkey PRIMARY KEY (po_item_id);


--
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (po_id);


--
-- Name: purchase_requisition_item purchase_requisition_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_item
    ADD CONSTRAINT purchase_requisition_item_pkey PRIMARY KEY (id);


--
-- Name: purchase_requisition purchase_requisition_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition
    ADD CONSTRAINT purchase_requisition_pkey PRIMARY KEY (pr_id);


--
-- Name: qa_rejection qa_rejection_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.qa_rejection
    ADD CONSTRAINT qa_rejection_pkey PRIMARY KEY (rejection_id);


--
-- Name: raw_material raw_material_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.raw_material
    ADD CONSTRAINT raw_material_pkey PRIMARY KEY (raw_material_id);


--
-- Name: report_schedule report_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.report_schedule
    ADD CONSTRAINT report_schedule_pkey PRIMARY KEY (report_id);


--
-- Name: routing routing_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.routing
    ADD CONSTRAINT routing_pkey PRIMARY KEY (routing_id);


--
-- Name: sales_order_item sales_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order_item
    ADD CONSTRAINT sales_order_item_pkey PRIMARY KEY (item_id);


--
-- Name: sales_order sales_order_order_number_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order
    ADD CONSTRAINT sales_order_order_number_key UNIQUE (order_number);


--
-- Name: sales_order sales_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order
    ADD CONSTRAINT sales_order_pkey PRIMARY KEY (sales_order_id);


--
-- Name: sales_order_work_order sales_order_work_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order_work_order
    ADD CONSTRAINT sales_order_work_order_pkey PRIMARY KEY (id);


--
-- Name: scrap_inventory scrap_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_inventory
    ADD CONSTRAINT scrap_inventory_pkey PRIMARY KEY (scrap_id);


--
-- Name: scrap_movement scrap_movement_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_movement
    ADD CONSTRAINT scrap_movement_pkey PRIMARY KEY (movement_id);


--
-- Name: scrap_origin scrap_origin_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_origin
    ADD CONSTRAINT scrap_origin_pkey PRIMARY KEY (origin_id);


--
-- Name: scrap_origin scrap_origin_scrap_id_key; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_origin
    ADD CONSTRAINT scrap_origin_scrap_id_key UNIQUE (scrap_id);


--
-- Name: scrap_transaction_log scrap_transaction_log_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_transaction_log
    ADD CONSTRAINT scrap_transaction_log_pkey PRIMARY KEY (log_id);


--
-- Name: scrap_transaction scrap_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_transaction
    ADD CONSTRAINT scrap_transaction_pkey PRIMARY KEY (txn_id);


--
-- Name: sheet_sizes sheet_sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sheet_sizes
    ADD CONSTRAINT sheet_sizes_pkey PRIMARY KEY (sheet_size_id);


--
-- Name: shortage_alerts shortage_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.shortage_alerts
    ADD CONSTRAINT shortage_alerts_pkey PRIMARY KEY (id);


--
-- Name: stock_in stock_in_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.stock_in
    ADD CONSTRAINT stock_in_pkey PRIMARY KEY (stock_in_id);


--
-- Name: stock_ledger stock_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_pkey PRIMARY KEY (ledger_id);


--
-- Name: strategic_inventory strategic_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.strategic_inventory
    ADD CONSTRAINT strategic_inventory_pkey PRIMARY KEY (material_id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (supplier_id);


--
-- Name: three_way_match three_way_match_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.three_way_match
    ADD CONSTRAINT three_way_match_pkey PRIMARY KEY (matching_id);


--
-- Name: uom uom_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uom_pkey PRIMARY KEY (uom_id);


--
-- Name: wastage wastage_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_pkey PRIMARY KEY (wastage_id);


--
-- Name: work_center work_center_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_center
    ADD CONSTRAINT work_center_pkey PRIMARY KEY (work_center_id);


--
-- Name: work_order_item work_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_item
    ADD CONSTRAINT work_order_item_pkey PRIMARY KEY (id);


--
-- Name: work_order_material_issue work_order_material_issue_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_material_issue
    ADD CONSTRAINT work_order_material_issue_pkey PRIMARY KEY (issue_id);


--
-- Name: work_order work_order_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT work_order_pkey PRIMARY KEY (wo_id);


--
-- Name: work_order_step work_order_step_pkey; Type: CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_step
    ADD CONSTRAINT work_order_step_pkey PRIMARY KEY (step_id);


--
-- Name: blank_spec_product_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX blank_spec_product_id_idx ON public.blank_spec USING btree (product_id);


--
-- Name: blank_spec_product_id_sub_assembly_name_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX blank_spec_product_id_sub_assembly_name_idx ON public.blank_spec USING btree (product_id, sub_assembly_name);


--
-- Name: bom_product_id_material_id_sub_assembly_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX bom_product_id_material_id_sub_assembly_name_key ON public.bom USING btree (product_id, material_id, sub_assembly_name);


--
-- Name: dispatch_order_dispatch_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX dispatch_order_dispatch_no_key ON public.dispatch_order USING btree (dispatch_no);


--
-- Name: dispatch_order_so_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX dispatch_order_so_id_idx ON public.dispatch_order USING btree (so_id);


--
-- Name: goods_receipt_grn_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX goods_receipt_grn_no_key ON public.goods_receipt USING btree (grn_no);


--
-- Name: idx_blank_optimization_blank_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_blank_optimization_blank_id ON public.blank_optimization USING btree (blank_id);


--
-- Name: idx_blank_optimization_calculated_at; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_blank_optimization_calculated_at ON public.blank_optimization USING btree (calculated_at);


--
-- Name: idx_bom_explosion_product; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_explosion_product ON public.bom_explosion_log USING btree (product_id);


--
-- Name: idx_bom_explosion_sales_order; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_explosion_sales_order ON public.bom_explosion_log USING btree (sales_order_id);


--
-- Name: idx_bom_item_type; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_item_type ON public.bom USING btree (product_id, item_type);


--
-- Name: idx_bom_reference; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_reference ON public.bom USING btree (reference_type, reference_id);


--
-- Name: idx_bom_substitution_rules_primary_material; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_substitution_rules_primary_material ON public.bom_substitution_rules USING btree (primary_material_id);


--
-- Name: idx_bom_substitution_rules_product_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_substitution_rules_product_id ON public.bom_substitution_rules USING btree (product_id);


--
-- Name: idx_bom_substitution_rules_substitute_material; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_bom_substitution_rules_substitute_material ON public.bom_substitution_rules USING btree (substitute_material_id);


--
-- Name: idx_customer_code; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_customer_code ON public.customer USING btree (customer_code);


--
-- Name: idx_customer_company; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_customer_company ON public.customer USING btree (company_name);


--
-- Name: idx_ipo_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ipo_date ON public.internal_purchase_order USING btree (order_date);


--
-- Name: idx_ipo_item_ipo; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ipo_item_ipo ON public.internal_purchase_order_item USING btree (ipo_id);


--
-- Name: idx_ipo_item_material; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ipo_item_material ON public.internal_purchase_order_item USING btree (material_id);


--
-- Name: idx_ipo_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ipo_status ON public.internal_purchase_order USING btree (status);


--
-- Name: idx_ipo_supplier; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_ipo_supplier ON public.internal_purchase_order USING btree (supplier_id);


--
-- Name: idx_manual_opening_stock_period; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_manual_opening_stock_period ON public.manual_opening_stock USING btree (period_key);


--
-- Name: idx_manual_opening_stock_product; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_manual_opening_stock_product ON public.manual_opening_stock USING btree (product_id);


--
-- Name: idx_mat_req_priority; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_mat_req_priority ON public.material_requisition USING btree (priority);


--
-- Name: idx_mat_req_sales_order; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_mat_req_sales_order ON public.material_requisition USING btree (sales_order_id);


--
-- Name: idx_mat_req_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_mat_req_status ON public.material_requisition USING btree (status);


--
-- Name: idx_mat_req_work_order; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_mat_req_work_order ON public.material_requisition USING btree (work_order_id);


--
-- Name: idx_material_supplier; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_material_supplier ON public.material USING btree (supplier_id);


--
-- Name: idx_material_type; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_material_type ON public.material USING btree (material_type);


--
-- Name: idx_packaging_priority_product_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_packaging_priority_product_id ON public.packaging_priority USING btree (product_id);


--
-- Name: idx_planned_production_product; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_planned_production_product ON public.planned_production USING btree (product_id);


--
-- Name: idx_planned_production_start_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_planned_production_start_date ON public.planned_production USING btree (start_date);


--
-- Name: idx_planned_production_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_planned_production_status ON public.planned_production USING btree (status);


--
-- Name: idx_prod_output_item; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_prod_output_item ON public.production_output USING btree (item_id, item_type);


--
-- Name: idx_prod_output_wo; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_prod_output_wo ON public.production_output USING btree (work_order_id);


--
-- Name: idx_production_consumption_created_at; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_production_consumption_created_at ON public.production_material_consumption USING btree (created_at);


--
-- Name: idx_production_consumption_product_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_production_consumption_product_id ON public.production_material_consumption USING btree (product_id);


--
-- Name: idx_production_consumption_production_order; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_production_consumption_production_order ON public.production_material_consumption USING btree (production_order_id);


--
-- Name: idx_production_recipe_snapshots_product_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_production_recipe_snapshots_product_id ON public.production_recipe_snapshots USING btree (product_id);


--
-- Name: idx_production_recipe_snapshots_work_order_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_production_recipe_snapshots_work_order_id ON public.production_recipe_snapshots USING btree (work_order_id);


--
-- Name: idx_sales_order_customer; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_customer ON public.sales_order USING btree (customer_id);


--
-- Name: idx_sales_order_date; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_date ON public.sales_order USING btree (order_date);


--
-- Name: idx_sales_order_item_order; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_item_order ON public.sales_order_item USING btree (sales_order_id);


--
-- Name: idx_sales_order_item_product; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_item_product ON public.sales_order_item USING btree (product_id);


--
-- Name: idx_sales_order_number; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_number ON public.sales_order USING btree (order_number);


--
-- Name: idx_sales_order_reference; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_reference ON public.sales_order USING btree (reference_number);


--
-- Name: idx_sales_order_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sales_order_status ON public.sales_order USING btree (status);


--
-- Name: idx_scrap_leftover_area; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_leftover_area ON public.scrap_inventory USING btree (leftover_area_mm2);


--
-- Name: idx_scrap_log_performed_at; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_log_performed_at ON public.scrap_transaction_log USING btree (performed_at);


--
-- Name: idx_scrap_log_scrap_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_log_scrap_id ON public.scrap_transaction_log USING btree (scrap_id);


--
-- Name: idx_scrap_log_transaction_type; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_log_transaction_type ON public.scrap_transaction_log USING btree (transaction_type);


--
-- Name: idx_scrap_material_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_material_id ON public.scrap_inventory USING btree (material_id);


--
-- Name: idx_scrap_movement_created_at; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_movement_created_at ON public.scrap_movement USING btree (created_at);


--
-- Name: idx_scrap_movement_scrap_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_movement_scrap_id ON public.scrap_movement USING btree (scrap_id);


--
-- Name: idx_scrap_origin_product_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_origin_product_id ON public.scrap_origin USING btree (product_id);


--
-- Name: idx_scrap_origin_source_type; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_scrap_origin_source_type ON public.scrap_origin USING btree (source_type);


--
-- Name: idx_sheet_sizes_active; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_sheet_sizes_active ON public.sheet_sizes USING btree (active, material_type);


--
-- Name: idx_shortage_alerts_product_id; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_shortage_alerts_product_id ON public.shortage_alerts USING btree (product_id);


--
-- Name: idx_shortage_alerts_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_shortage_alerts_status ON public.shortage_alerts USING btree (status);


--
-- Name: idx_wo_mat_issue_material; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_wo_mat_issue_material ON public.work_order_material_issue USING btree (material_id);


--
-- Name: idx_wo_mat_issue_status; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_wo_mat_issue_status ON public.work_order_material_issue USING btree (status);


--
-- Name: idx_wo_mat_issue_wo; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_wo_mat_issue_wo ON public.work_order_material_issue USING btree (work_order_id);


--
-- Name: idx_work_order_customer; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_work_order_customer ON public.work_order USING btree (customer);


--
-- Name: idx_work_order_dependency; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_work_order_dependency ON public.work_order USING btree (depends_on_wo_id);


--
-- Name: idx_work_order_operation; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_work_order_operation ON public.work_order USING btree (operation_type);


--
-- Name: idx_work_order_parent; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_work_order_parent ON public.work_order USING btree (parent_wo_id);


--
-- Name: idx_work_order_sales_order_ref; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX idx_work_order_sales_order_ref ON public.work_order USING btree (sales_order_ref);


--
-- Name: inventory_location_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX inventory_location_id_idx ON public.inventory USING btree (location_id);


--
-- Name: inventory_material_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX inventory_material_id_idx ON public.inventory USING btree (material_id);


--
-- Name: inventory_product_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX inventory_product_id_idx ON public.inventory USING btree (product_id);


--
-- Name: inventory_txn_product_id_material_id_po_id_wo_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX inventory_txn_product_id_material_id_po_id_wo_id_idx ON public.inventory_txn USING btree (product_id, material_id, po_id, wo_id);


--
-- Name: invoice_invoice_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX invoice_invoice_no_key ON public.invoice USING btree (invoice_no);


--
-- Name: location_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX location_code_key ON public.location USING btree (code);


--
-- Name: material_consumption_product_id_material_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX material_consumption_product_id_material_id_idx ON public.material_consumption USING btree (product_id, material_id);


--
-- Name: material_material_code_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX material_material_code_idx ON public.material USING btree (material_code);


--
-- Name: material_material_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX material_material_code_key ON public.material USING btree (material_code);


--
-- Name: model_oem_id_model_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX model_oem_id_model_name_key ON public.model USING btree (oem_id, model_name);


--
-- Name: oem_oem_name_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX oem_oem_name_key ON public.oem USING btree (oem_name);


--
-- Name: operation_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX operation_code_key ON public.operation USING btree (code);


--
-- Name: product_product_code_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX product_product_code_idx ON public.product USING btree (product_code);


--
-- Name: product_product_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX product_product_code_key ON public.product USING btree (product_code);


--
-- Name: production_material_usage_production_id_material_id_scrap_i_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX production_material_usage_production_id_material_id_scrap_i_idx ON public.production_material_usage USING btree (production_id, material_id, scrap_id);


--
-- Name: production_order_po_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX production_order_po_no_key ON public.production_order USING btree (po_no);


--
-- Name: production_order_produced_inventory_id_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX production_order_produced_inventory_id_key ON public.production_order USING btree (produced_inventory_id);


--
-- Name: production_order_product_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX production_order_product_id_idx ON public.production_order USING btree (product_id);


--
-- Name: production_step_production_id_step_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX production_step_production_id_step_no_key ON public.production_step USING btree (production_id, step_no);


--
-- Name: purchase_order_item_product_id_material_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX purchase_order_item_product_id_material_id_idx ON public.purchase_order_item USING btree (product_id, material_id);


--
-- Name: purchase_order_po_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX purchase_order_po_no_key ON public.purchase_order USING btree (po_no);


--
-- Name: purchase_order_supplier_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX purchase_order_supplier_id_idx ON public.purchase_order USING btree (supplier_id);


--
-- Name: purchase_requisition_pr_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX purchase_requisition_pr_no_key ON public.purchase_requisition USING btree (pr_no);


--
-- Name: qa_rejection_disposition_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX qa_rejection_disposition_idx ON public.qa_rejection USING btree (disposition);


--
-- Name: qa_rejection_inventory_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX qa_rejection_inventory_id_idx ON public.qa_rejection USING btree (inventory_id);


--
-- Name: qa_rejection_product_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX qa_rejection_product_id_idx ON public.qa_rejection USING btree (product_id);


--
-- Name: qa_rejection_rejected_at_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX qa_rejection_rejected_at_idx ON public.qa_rejection USING btree (rejected_at);


--
-- Name: raw_material_material_code_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX raw_material_material_code_idx ON public.raw_material USING btree (material_code);


--
-- Name: raw_material_material_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX raw_material_material_code_key ON public.raw_material USING btree (material_code);


--
-- Name: routing_product_id_step_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX routing_product_id_step_no_key ON public.routing USING btree (product_id, step_no);


--
-- Name: scrap_inventory_location_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX scrap_inventory_location_id_idx ON public.scrap_inventory USING btree (location_id);


--
-- Name: scrap_inventory_status_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX scrap_inventory_status_idx ON public.scrap_inventory USING btree (status);


--
-- Name: scrap_transaction_txn_type_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX scrap_transaction_txn_type_idx ON public.scrap_transaction USING btree (txn_type);


--
-- Name: stock_ledger_created_at_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX stock_ledger_created_at_idx ON public.stock_ledger USING btree (created_at);


--
-- Name: stock_ledger_product_id_material_id_scrap_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX stock_ledger_product_id_material_id_scrap_id_idx ON public.stock_ledger USING btree (product_id, material_id, scrap_id);


--
-- Name: supplier_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX supplier_code_key ON public.supplier USING btree (code);


--
-- Name: uom_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX uom_code_key ON public.uom USING btree (code);


--
-- Name: wastage_reentry_txn_id_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX wastage_reentry_txn_id_key ON public.wastage USING btree (reentry_txn_id);


--
-- Name: work_center_code_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX work_center_code_key ON public.work_center USING btree (code);


--
-- Name: work_order_product_id_idx; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE INDEX work_order_product_id_idx ON public.work_order USING btree (product_id);


--
-- Name: work_order_step_wo_id_step_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX work_order_step_wo_id_step_no_key ON public.work_order_step USING btree (wo_id, step_no);


--
-- Name: work_order_wo_no_key; Type: INDEX; Schema: public; Owner: erp_user
--

CREATE UNIQUE INDEX work_order_wo_no_key ON public.work_order USING btree (wo_no);


--
-- Name: batch_consumption batch_consumption_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.batch_consumption
    ADD CONSTRAINT batch_consumption_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batch(batch_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: batch batch_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.batch
    ADD CONSTRAINT batch_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: batch batch_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.batch
    ADD CONSTRAINT batch_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: blank_spec blank_spec_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.blank_spec
    ADD CONSTRAINT blank_spec_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bom bom_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bom bom_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bom_substitution_rules bom_substitution_rules_primary_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_substitution_rules
    ADD CONSTRAINT bom_substitution_rules_primary_material_id_fkey FOREIGN KEY (primary_material_id) REFERENCES public.material(material_id) ON DELETE CASCADE;


--
-- Name: bom_substitution_rules bom_substitution_rules_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_substitution_rules
    ADD CONSTRAINT bom_substitution_rules_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: bom_substitution_rules bom_substitution_rules_substitute_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_substitution_rules
    ADD CONSTRAINT bom_substitution_rules_substitute_material_id_fkey FOREIGN KEY (substitute_material_id) REFERENCES public.material(material_id) ON DELETE CASCADE;


--
-- Name: bom bom_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dispatch_item dispatch_item_dispatch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch_item
    ADD CONSTRAINT dispatch_item_dispatch_id_fkey FOREIGN KEY (dispatch_id) REFERENCES public.dispatch_order(dispatch_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: dispatch_item dispatch_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch_item
    ADD CONSTRAINT dispatch_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: dispatch_item dispatch_item_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch_item
    ADD CONSTRAINT dispatch_item_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dispatch_order dispatch_order_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.dispatch_order
    ADD CONSTRAINT dispatch_order_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bom_explosion_log fk_bom_explosion_product; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.bom_explosion_log
    ADD CONSTRAINT fk_bom_explosion_product FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: material_requisition fk_material_requisition_material; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_requisition
    ADD CONSTRAINT fk_material_requisition_material FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON DELETE CASCADE;


--
-- Name: material_requisition fk_material_requisition_work_order; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_requisition
    ADD CONSTRAINT fk_material_requisition_work_order FOREIGN KEY (work_order_id) REFERENCES public.work_order(wo_id) ON DELETE CASCADE;


--
-- Name: production_output fk_production_output_wo; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_output
    ADD CONSTRAINT fk_production_output_wo FOREIGN KEY (work_order_id) REFERENCES public.work_order(wo_id) ON DELETE CASCADE;


--
-- Name: sales_order fk_sales_order_customer; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order
    ADD CONSTRAINT fk_sales_order_customer FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id);


--
-- Name: sales_order_item fk_sales_order_item_sales_order; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order_item
    ADD CONSTRAINT fk_sales_order_item_sales_order FOREIGN KEY (sales_order_id) REFERENCES public.sales_order(sales_order_id) ON DELETE CASCADE;


--
-- Name: sales_order fk_sales_order_purchase_order; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order
    ADD CONSTRAINT fk_sales_order_purchase_order FOREIGN KEY (linked_po_id) REFERENCES public.purchase_order(po_id) ON DELETE SET NULL;


--
-- Name: scrap_transaction_log fk_scrap_log_scrap; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_transaction_log
    ADD CONSTRAINT fk_scrap_log_scrap FOREIGN KEY (scrap_id) REFERENCES public.scrap_inventory(scrap_id) ON DELETE CASCADE;


--
-- Name: scrap_origin fk_scrap_origin_blank; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_origin
    ADD CONSTRAINT fk_scrap_origin_blank FOREIGN KEY (blank_id) REFERENCES public.blank_spec(blank_id) ON DELETE SET NULL;


--
-- Name: scrap_origin fk_scrap_origin_product; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_origin
    ADD CONSTRAINT fk_scrap_origin_product FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE SET NULL;


--
-- Name: scrap_origin fk_scrap_origin_scrap; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_origin
    ADD CONSTRAINT fk_scrap_origin_scrap FOREIGN KEY (scrap_id) REFERENCES public.scrap_inventory(scrap_id) ON DELETE CASCADE;


--
-- Name: work_order_material_issue fk_wo_material_issue_material; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_material_issue
    ADD CONSTRAINT fk_wo_material_issue_material FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON DELETE CASCADE;


--
-- Name: work_order_material_issue fk_wo_material_issue_wo; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_material_issue
    ADD CONSTRAINT fk_wo_material_issue_wo FOREIGN KEY (work_order_id) REFERENCES public.work_order(wo_id) ON DELETE CASCADE;


--
-- Name: work_order fk_work_order_parent; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT fk_work_order_parent FOREIGN KEY (parent_wo_id) REFERENCES public.work_order(wo_id) ON DELETE CASCADE;


--
-- Name: goods_receipt_item goods_receipt_item_grn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.goods_receipt(grn_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: goods_receipt_item goods_receipt_item_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: goods_receipt_item goods_receipt_item_po_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_po_item_id_fkey FOREIGN KEY (po_item_id) REFERENCES public.purchase_order_item(po_item_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: goods_receipt_item goods_receipt_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: goods_receipt_item goods_receipt_item_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt_item
    ADD CONSTRAINT goods_receipt_item_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: goods_receipt goods_receipt_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: goods_receipt goods_receipt_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_order(po_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: goods_receipt goods_receipt_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.goods_receipt
    ADD CONSTRAINT goods_receipt_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: internal_purchase_order_item internal_purchase_order_item_ipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.internal_purchase_order_item
    ADD CONSTRAINT internal_purchase_order_item_ipo_id_fkey FOREIGN KEY (ipo_id) REFERENCES public.internal_purchase_order(ipo_id) ON DELETE CASCADE;


--
-- Name: internal_purchase_order_item internal_purchase_order_item_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.internal_purchase_order_item
    ADD CONSTRAINT internal_purchase_order_item_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id);


--
-- Name: internal_purchase_order internal_purchase_order_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.internal_purchase_order
    ADD CONSTRAINT internal_purchase_order_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id);


--
-- Name: inventory inventory_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory inventory_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_txn inventory_txn_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_txn inventory_txn_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_txn inventory_txn_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_order(po_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_txn inventory_txn_procurement_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_procurement_request_id_fkey FOREIGN KEY (procurement_request_id) REFERENCES public.procurement_request(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_txn inventory_txn_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_txn inventory_txn_wo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory_txn
    ADD CONSTRAINT inventory_txn_wo_id_fkey FOREIGN KEY (wo_id) REFERENCES public.work_order(wo_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory inventory_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_item invoice_item_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice_item
    ADD CONSTRAINT invoice_item_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_item invoice_item_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice_item
    ADD CONSTRAINT invoice_item_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_item invoice_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice_item
    ADD CONSTRAINT invoice_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice invoice_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_order(po_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice invoice_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: manual_opening_stock manual_opening_stock_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.manual_opening_stock
    ADD CONSTRAINT manual_opening_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: material_consumption material_consumption_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_consumption
    ADD CONSTRAINT material_consumption_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_consumption material_consumption_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_consumption
    ADD CONSTRAINT material_consumption_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: material_reservation material_reservation_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_reservation
    ADD CONSTRAINT material_reservation_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_reservation material_reservation_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material_reservation
    ADD CONSTRAINT material_reservation_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_order(wo_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material material_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.material
    ADD CONSTRAINT material_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: model model_oem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.model
    ADD CONSTRAINT model_oem_id_fkey FOREIGN KEY (oem_id) REFERENCES public.oem(oem_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: packaging_priority packaging_priority_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.packaging_priority
    ADD CONSTRAINT packaging_priority_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: payment payment_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planned_production planned_production_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.planned_production
    ADD CONSTRAINT planned_production_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: planned_production planned_production_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.planned_production
    ADD CONSTRAINT planned_production_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id);


--
-- Name: procurement_request procurement_request_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.procurement_request
    ADD CONSTRAINT procurement_request_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product product_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.model(model_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product product_oem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_oem_id_fkey FOREIGN KEY (oem_id) REFERENCES public.oem(oem_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product product_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_material_usage production_material_usage_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_usage
    ADD CONSTRAINT production_material_usage_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_material_usage production_material_usage_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_usage
    ADD CONSTRAINT production_material_usage_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_material_usage production_material_usage_production_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_usage
    ADD CONSTRAINT production_material_usage_production_id_fkey FOREIGN KEY (production_id) REFERENCES public.production_order(po_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: production_material_usage production_material_usage_scrap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_usage
    ADD CONSTRAINT production_material_usage_scrap_id_fkey FOREIGN KEY (scrap_id) REFERENCES public.scrap_inventory(scrap_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_material_usage production_material_usage_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_material_usage
    ADD CONSTRAINT production_material_usage_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_order production_order_produced_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_order
    ADD CONSTRAINT production_order_produced_inventory_id_fkey FOREIGN KEY (produced_inventory_id) REFERENCES public.inventory(inventory_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_order production_order_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_order
    ADD CONSTRAINT production_order_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: production_order production_order_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_order
    ADD CONSTRAINT production_order_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_recipe_snapshots production_recipe_snapshots_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_recipe_snapshots
    ADD CONSTRAINT production_recipe_snapshots_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON DELETE CASCADE;


--
-- Name: production_recipe_snapshots production_recipe_snapshots_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_recipe_snapshots
    ADD CONSTRAINT production_recipe_snapshots_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: production_recipe_snapshots production_recipe_snapshots_substitute_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_recipe_snapshots
    ADD CONSTRAINT production_recipe_snapshots_substitute_material_id_fkey FOREIGN KEY (substitute_material_id) REFERENCES public.material(material_id) ON DELETE SET NULL;


--
-- Name: production_step production_step_production_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.production_step
    ADD CONSTRAINT production_step_production_id_fkey FOREIGN KEY (production_id) REFERENCES public.production_order(po_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_order_item purchase_order_item_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_order_item purchase_order_item_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_order(po_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_order_item purchase_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_order_item purchase_order_item_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order_item
    ADD CONSTRAINT purchase_order_item_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_order purchase_order_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pr_id_fkey FOREIGN KEY (pr_id) REFERENCES public.purchase_requisition(pr_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_order purchase_order_purchaseRequisitionItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT "purchase_order_purchaseRequisitionItemId_fkey" FOREIGN KEY ("purchaseRequisitionItemId") REFERENCES public.purchase_requisition_item(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_order purchase_order_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_requisition_item purchase_requisition_item_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_item
    ADD CONSTRAINT purchase_requisition_item_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_requisition_item purchase_requisition_item_pr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_item
    ADD CONSTRAINT purchase_requisition_item_pr_id_fkey FOREIGN KEY (pr_id) REFERENCES public.purchase_requisition(pr_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_requisition_item purchase_requisition_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_item
    ADD CONSTRAINT purchase_requisition_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_requisition_item purchase_requisition_item_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.purchase_requisition_item
    ADD CONSTRAINT purchase_requisition_item_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: qa_rejection qa_rejection_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.qa_rejection
    ADD CONSTRAINT qa_rejection_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: qa_rejection qa_rejection_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.qa_rejection
    ADD CONSTRAINT qa_rejection_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: qa_rejection qa_rejection_rework_wo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.qa_rejection
    ADD CONSTRAINT qa_rejection_rework_wo_id_fkey FOREIGN KEY (rework_wo_id) REFERENCES public.work_order(wo_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: qa_rejection qa_rejection_scrap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.qa_rejection
    ADD CONSTRAINT qa_rejection_scrap_id_fkey FOREIGN KEY (scrap_id) REFERENCES public.scrap_inventory(scrap_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: raw_material raw_material_material_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.raw_material
    ADD CONSTRAINT raw_material_material_code_fkey FOREIGN KEY (material_code) REFERENCES public.material(material_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: raw_material raw_material_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.raw_material
    ADD CONSTRAINT raw_material_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: routing routing_alternative_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.routing
    ADD CONSTRAINT routing_alternative_path_id_fkey FOREIGN KEY (alternative_path_id) REFERENCES public.routing(routing_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: routing routing_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.routing
    ADD CONSTRAINT routing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_order_work_order sales_order_work_order_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order_work_order
    ADD CONSTRAINT sales_order_work_order_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_order(sales_order_id) ON DELETE CASCADE;


--
-- Name: sales_order_work_order sales_order_work_order_sales_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.sales_order_work_order
    ADD CONSTRAINT sales_order_work_order_sales_order_item_id_fkey FOREIGN KEY (sales_order_item_id) REFERENCES public.sales_order_item(item_id) ON DELETE CASCADE;


--
-- Name: scrap_inventory scrap_inventory_blank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_inventory
    ADD CONSTRAINT scrap_inventory_blank_id_fkey FOREIGN KEY (blank_id) REFERENCES public.blank_spec(blank_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scrap_inventory scrap_inventory_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_inventory
    ADD CONSTRAINT scrap_inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scrap_inventory scrap_inventory_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_inventory
    ADD CONSTRAINT scrap_inventory_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scrap_transaction scrap_transaction_scrap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.scrap_transaction
    ADD CONSTRAINT scrap_transaction_scrap_id_fkey FOREIGN KEY (scrap_id) REFERENCES public.scrap_inventory(scrap_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shortage_alerts shortage_alerts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.shortage_alerts
    ADD CONSTRAINT shortage_alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: stock_ledger stock_ledger_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_ledger stock_ledger_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_ledger stock_ledger_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_ledger stock_ledger_scrap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_scrap_id_fkey FOREIGN KEY (scrap_id) REFERENCES public.scrap_inventory(scrap_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: three_way_match three_way_match_grn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.three_way_match
    ADD CONSTRAINT three_way_match_grn_id_fkey FOREIGN KEY (grn_id) REFERENCES public.goods_receipt(grn_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: three_way_match three_way_match_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.three_way_match
    ADD CONSTRAINT three_way_match_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: three_way_match three_way_match_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.three_way_match
    ADD CONSTRAINT three_way_match_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_order(po_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wastage wastage_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(location_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wastage wastage_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material(material_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: wastage wastage_reentry_txn_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_reentry_txn_id_fkey FOREIGN KEY (reentry_txn_id) REFERENCES public.inventory_txn(txn_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wastage wastage_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.work_order_step(step_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wastage wastage_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wastage wastage_wo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.wastage
    ADD CONSTRAINT wastage_wo_id_fkey FOREIGN KEY (wo_id) REFERENCES public.work_order(wo_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_order_item work_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_item
    ADD CONSTRAINT work_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_order_item work_order_item_wo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_item
    ADD CONSTRAINT work_order_item_wo_id_fkey FOREIGN KEY (wo_id) REFERENCES public.work_order(wo_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_order work_order_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT work_order_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_order_step work_order_step_routing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_step
    ADD CONSTRAINT work_order_step_routing_id_fkey FOREIGN KEY (routing_id) REFERENCES public.routing(routing_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_order_step work_order_step_wo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order_step
    ADD CONSTRAINT work_order_step_wo_id_fkey FOREIGN KEY (wo_id) REFERENCES public.work_order(wo_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: work_order work_order_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: erp_user
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT work_order_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(uom_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: erp_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Ww3sFw7cLZcgGtWTaWOhGBjov0e5W3hECCdyCXZOO3hIxbd0M0iryfPrRwUl8KU

