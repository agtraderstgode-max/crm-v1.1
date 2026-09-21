-- ==============================================================================
-- TILES CRM - COMPLETE SUPABASE DATABASE SETUP SCHEMA
-- ==============================================================================
-- Run this entire script in your Supabase Dashboard:
-- SQL Editor -> "+ New query" -> Paste this script -> Click "Run"
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    date DATE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT,
    lat NUMERIC,
    lng NUMERIC,
    km NUMERIC,
    source TEXT,
    size TEXT,
    budget TEXT,
    housetype TEXT,
    custtype TEXT,
    stage TEXT,
    expectedamt TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'New Entry',
    nextdate TEXT,
    withindays TEXT,
    remarks TEXT,
    attendedby TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    custtype TEXT,
    expectedamt TEXT,
    attendedby TEXT,
    remarks TEXT,
    source TEXT,
    size TEXT,
    housetype TEXT,
    stage TEXT,
    budget TEXT,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2B. CONTACTS TABLE (Tile Layers, Builders, Contractors, Architects, Suppliers, Customers)
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Tile Layer',
    category TEXT DEFAULT 'Tile Layer',
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    company TEXT,
    location TEXT,
    address TEXT,
    experience TEXT,
    specialization TEXT,
    quote TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    totalreferrals INTEGER DEFAULT 0,
    totalsales NUMERIC DEFAULT 0,
    totalcommission NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    avatarcolor TEXT,
    referrals JSONB DEFAULT '[]'::jsonb,
    commissionhistory JSONB DEFAULT '[]'::jsonb,
    bonushistory JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    phone TEXT,
    date DATE,
    items INTEGER DEFAULT 0,
    total TEXT,
    status TEXT DEFAULT 'Processing',
    delivery DATE,
    deliverytype TEXT,
    transport TEXT,
    vehicleinfo TEXT,
    handleby TEXT,
    confirmedat TIMESTAMPTZ,
    dispatchedat TIMESTAMPTZ,
    deliveredat TIMESTAMPTZ,
    splitpayments JSONB DEFAULT '[]'::jsonb,
    balancemode TEXT,
    paymentnotes TEXT,
    itemsdetails JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category_id TEXT,
    size TEXT,
    finish TEXT,
    price TEXT,
    stock INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    available INTEGER DEFAULT 0,
    min INTEGER DEFAULT 10,
    unit TEXT DEFAULT 'boxes',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRICE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    size TEXT,
    name TEXT,
    type TEXT,
    sqft_per_box NUMERIC,
    pcs_per_box INTEGER,
    mrp NUMERIC,
    online_price NUMERIC,
    sqft_price NUMERIC,
    discount_pct NUMERIC,
    weight_per_box NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STAFF MEMBERS & ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    telegram TEXT,
    email TEXT,
    aadhaar TEXT,
    username TEXT,
    passcode TEXT,
    status TEXT DEFAULT 'Active',
    workinghours TEXT,
    shifthours INTEGER DEFAULT 10,
    workingdays TEXT,
    joindate DATE,
    attendance JSONB DEFAULT '[]'::jsonb,
    incentives JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SALES RETURNS TABLE
CREATE TABLE IF NOT EXISTS public.returns (
    id TEXT PRIMARY KEY,
    billno TEXT NOT NULL,
    customername TEXT,
    date DATE,
    returnreason TEXT NOT NULL,
    stockrestocked BOOLEAN DEFAULT FALSE,
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    totalrefund NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REFERRALS & COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    phone TEXT,
    whatsapp TEXT,
    location TEXT,
    commissiontype TEXT DEFAULT 'Percentage',
    commissionvalue NUMERIC DEFAULT 3,
    upiid TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    createddate DATE,
    payouts JSONB DEFAULT '[]'::jsonb,
    referredorders JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SHOWROOM CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    senderid TEXT NOT NULL,
    sendername TEXT NOT NULL,
    recipientid TEXT DEFAULT 'group',
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PURCHASE INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
    id TEXT PRIMARY KEY,
    invoice_no TEXT,
    date DATE,
    supplier_name TEXT,
    supplier_gstin TEXT,
    supplier_phone TEXT,
    buyer_name TEXT,
    buyer_gstin TEXT,
    gross_amount NUMERIC,
    tax_percent NUMERIC,
    gst_amount NUMERIC,
    total_amount NUMERIC,
    total_qty NUMERIC,
    total_items INTEGER,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. GENERAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing settings
INSERT INTO public.settings (key, value)
VALUES ('pricing', '{"discount_percentage": 15}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Disable Row Level Security (RLS) for internal CRM backend operations,
-- or grant full access to authenticated & service_role
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SETUP COMPLETE!
-- ==============================================================================
