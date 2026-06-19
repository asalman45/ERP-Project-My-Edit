import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ArrowRight, Package, Layers, ShoppingCart,
  FileText, Users, Factory, Warehouse, BarChart3, Database,
  TrendingUp, Settings, Wrench, Activity, Calculator, ChevronRight,
  Loader2, Ship
} from 'lucide-react';
import {
  productApi,
  supplierApi,
  rawMaterialApi,
  customerApi,
  workOrderApi,
  purchaseOrderApi,
  api as genericApi,
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  category: string;
  categoryIcon: React.ReactNode;
  path: string;
}

interface ModuleShortcut {
  label: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

// ─── Module shortcuts ─────────────────────────────────────────────────────────
const MODULE_SHORTCUTS: ModuleShortcut[] = [
  { label: 'Dashboard',            path: '/',                       icon: <BarChart3 size={16} />,    color: 'text-blue-600 bg-blue-50',      category: 'Core' },
  { label: 'Sales Orders',         path: '/sales-orders',           icon: <ShoppingCart size={16} />, color: 'text-emerald-600 bg-emerald-50',category: 'CRM & Sales' },
  { label: 'Dispatch',             path: '/sales/dispatch',         icon: <Ship size={16} />,         color: 'text-teal-600 bg-teal-50',      category: 'CRM & Sales' },
  { label: 'Work Orders',          path: '/work-orders-management', icon: <Factory size={16} />,      color: 'text-orange-600 bg-orange-50',  category: 'Production' },
  { label: 'Planned Production',   path: '/planned-production',     icon: <Activity size={16} />,     color: 'text-purple-600 bg-purple-50',  category: 'Production' },
  { label: 'Current Stock',        path: '/inventory',              icon: <Warehouse size={16} />,    color: 'text-cyan-600 bg-cyan-50',      category: 'Inventory' },
  { label: 'Products',             path: '/master-data',            icon: <Package size={16} />,      color: 'text-indigo-600 bg-indigo-50',  category: 'Master Data' },
  { label: 'Raw Materials',        path: '/raw-materials',          icon: <Database size={16} />,     color: 'text-rose-600 bg-rose-50',      category: 'Master Data' },
  { label: 'Suppliers',            path: '/suppliers',              icon: <Users size={16} />,        color: 'text-amber-600 bg-amber-50',    category: 'Master Data' },
  { label: 'Customers',            path: '/master-data/customers',  icon: <Users size={16} />,        color: 'text-pink-600 bg-pink-50',      category: 'Master Data' },
  { label: 'Purchase Orders',      path: '/purchase-orders',        icon: <FileText size={16} />,     color: 'text-slate-600 bg-slate-50',    category: 'Procurement' },
  { label: 'BOM Standard Display', path: '/bom/standard-display',   icon: <Layers size={16} />,       color: 'text-violet-600 bg-violet-50',  category: 'BOM' },
  { label: 'Finance Dashboard',    path: '/finance',                icon: <Calculator size={16} />,   color: 'text-green-600 bg-green-50',    category: 'Finance' },
  { label: 'P&L Statement',        path: '/reports/p-and-l',        icon: <TrendingUp size={16} />,   color: 'text-lime-600 bg-lime-50',      category: 'Reports' },
  { label: 'Employee Registry',    path: '/hr/employees',           icon: <Users size={16} />,        color: 'text-sky-600 bg-sky-50',        category: 'HR & Payroll' },
  { label: 'QC Inspections',       path: '/qc/inspections',         icon: <Wrench size={16} />,       color: 'text-red-600 bg-red-50',        category: 'Quality' },
  { label: 'Asset Maintenance',    path: '/assets/maintenance',     icon: <Wrench size={16} />,       color: 'text-stone-600 bg-stone-50',    category: 'Assets' },
  { label: 'Audit Logs',           path: '/settings/audit-logs',    icon: <Settings size={16} />,     color: 'text-gray-600 bg-gray-100',     category: 'Settings' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5 not-italic">{part}</mark>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 350);

  // Focus & reset when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Search on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    const lq = debouncedQuery.toLowerCase();

    Promise.allSettled([
      productApi.getAll({ limit: 200 }),
      rawMaterialApi.getAll(),
      supplierApi.getAll(),
      customerApi.getAll({ limit: 200 }),
      workOrderApi.getAll({ limit: 100 }),
      purchaseOrderApi.getAll({ limit: 100 }),
      genericApi.get<any[]>('/sales-orders?limit=100'),
    ]).then((settled) => {
      if (cancelled) return;
      const [products, materials, suppliers, customers, workOrders, purchaseOrders, salesOrders] = settled;
      const found: SearchResult[] = [];

      // ── Products ──────────────────────────────────────────────────────────
      if (products.status === 'fulfilled') {
        const items: any[] = Array.isArray(products.value) ? products.value : [];
        items
          .filter(p =>
            p.product_code?.toLowerCase().includes(lq) ||
            p.part_name?.toLowerCase().includes(lq) ||
            p.empcl_no?.toLowerCase().includes(lq) ||
            p.hs_code?.toLowerCase().includes(lq)
          )
          .slice(0, 6)
          .forEach(p => found.push({
            id: `prod-${p.product_id}`,
            title: p.part_name || p.product_code,
            subtitle: `${p.product_code}${p.empcl_no ? ' • EMPCL: ' + p.empcl_no : ''}`,
            badge: p.category || 'Product',
            badgeColor: 'bg-blue-100 text-blue-700',
            category: 'Products',
            categoryIcon: <Package size={14} />,
            path: '/master-data',
          }));
      }

      // ── Raw Materials ─────────────────────────────────────────────────────
      if (materials.status === 'fulfilled') {
        const items: any[] = Array.isArray(materials.value) ? materials.value : [];
        items
          .filter(m =>
            m.material_code?.toLowerCase().includes(lq) ||
            m.name?.toLowerCase().includes(lq) ||
            m.description?.toLowerCase().includes(lq) ||
            m.hs_code?.toLowerCase().includes(lq)
          )
          .slice(0, 6)
          .forEach(m => found.push({
            id: `mat-${m.material_id}`,
            title: m.name || m.material_code,
            subtitle: `Code: ${m.material_code}${m.category ? ' • ' + m.category : ''}`,
            badge: 'Material',
            badgeColor: 'bg-rose-100 text-rose-700',
            category: 'Raw Materials',
            categoryIcon: <Database size={14} />,
            path: '/raw-materials',
          }));
      }

      // ── Suppliers ─────────────────────────────────────────────────────────
      if (suppliers.status === 'fulfilled') {
        const items: any[] = Array.isArray(suppliers.value) ? suppliers.value : [];
        items
          .filter(s =>
            s.name?.toLowerCase().includes(lq) ||
            s.code?.toLowerCase().includes(lq) ||
            s.contact?.toLowerCase().includes(lq) ||
            s.email?.toLowerCase().includes(lq)
          )
          .slice(0, 6)
          .forEach(s => found.push({
            id: `sup-${s.supplier_id}`,
            title: s.name,
            subtitle: `Code: ${s.code || '-'}${s.email ? ' • ' + s.email : ''}`,
            badge: 'Supplier',
            badgeColor: 'bg-amber-100 text-amber-700',
            category: 'Suppliers',
            categoryIcon: <Users size={14} />,
            path: '/suppliers',
          }));
      }

      // ── Customers ─────────────────────────────────────────────────────────
      if (customers.status === 'fulfilled') {
        const items: any[] = Array.isArray(customers.value) ? customers.value : [];
        items
          .filter(c =>
            c.name?.toLowerCase().includes(lq) ||
            c.customer_code?.toLowerCase().includes(lq) ||
            c.company_name?.toLowerCase().includes(lq) ||
            c.email?.toLowerCase().includes(lq)
          )
          .slice(0, 6)
          .forEach(c => found.push({
            id: `cust-${c.customer_id}`,
            title: c.name,
            subtitle: `${c.company_name ? c.company_name + ' • ' : ''}Code: ${c.customer_code || '-'}`,
            badge: 'Customer',
            badgeColor: 'bg-pink-100 text-pink-700',
            category: 'Customers',
            categoryIcon: <Users size={14} />,
            path: '/master-data/customers',
          }));
      }

      // ── Work Orders ───────────────────────────────────────────────────────
      if (workOrders.status === 'fulfilled') {
        const items: any[] = Array.isArray(workOrders.value) ? workOrders.value : [];
        items
          .filter(w =>
            w.wo_no?.toLowerCase().includes(lq) ||
            w.product_code?.toLowerCase().includes(lq) ||
            w.part_name?.toLowerCase().includes(lq)
          )
          .slice(0, 5)
          .forEach(w => found.push({
            id: `wo-${w.wo_id}`,
            title: w.wo_no || `WO #${String(w.wo_id).slice(-6)}`,
            subtitle: [w.part_name, w.product_code, w.status].filter(Boolean).join(' • '),
            badge: w.status || 'WO',
            badgeColor: w.status === 'COMPLETED' ? 'bg-green-100 text-green-700'
              : w.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600',
            category: 'Work Orders',
            categoryIcon: <Factory size={14} />,
            path: '/work-orders-management',
          }));
      }

      // ── Purchase Orders ───────────────────────────────────────────────────
      if (purchaseOrders.status === 'fulfilled') {
        const items: any[] = Array.isArray(purchaseOrders.value) ? purchaseOrders.value : [];
        items
          .filter(p =>
            p.po_no?.toLowerCase().includes(lq) ||
            p.supplier_name?.toLowerCase().includes(lq)
          )
          .slice(0, 5)
          .forEach(p => found.push({
            id: `po-${p.po_id}`,
            title: p.po_no || `PO #${String(p.po_id).slice(-6)}`,
            subtitle: [p.supplier_name, p.status].filter(Boolean).join(' • '),
            badge: p.status || 'PO',
            badgeColor: p.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600',
            category: 'Purchase Orders',
            categoryIcon: <FileText size={14} />,
            path: '/purchase-orders',
          }));
      }

      // ── Sales Orders ──────────────────────────────────────────────────────
      if (salesOrders.status === 'fulfilled') {
        const raw = (salesOrders.value as any).data;
        const items: any[] = Array.isArray(raw) ? raw : (Array.isArray(salesOrders.value) ? salesOrders.value as any[] : []);
        items
          .filter((s: any) =>
            s.so_number?.toLowerCase().includes(lq) ||
            s.customer_name?.toLowerCase().includes(lq) ||
            s.order_no?.toLowerCase().includes(lq)
          )
          .slice(0, 5)
          .forEach((s: any) => found.push({
            id: `so-${s.so_id || s.id}`,
            title: s.so_number || s.order_no || `SO #${String(s.so_id || s.id).slice(-6)}`,
            subtitle: [s.customer_name, s.status].filter(Boolean).join(' • '),
            badge: s.status || 'SO',
            badgeColor: 'bg-emerald-100 text-emerald-700',
            category: 'Sales Orders',
            categoryIcon: <ShoppingCart size={14} />,
            path: '/sales-orders',
          }));
      }

      setResults(found);
      setActiveIndex(0);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const totalItems = debouncedQuery ? results.length : MODULE_SHORTCUTS.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, totalItems - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      const dest = debouncedQuery
        ? results[activeIndex]?.path
        : MODULE_SHORTCUTS[activeIndex]?.path;
      if (dest) { navigate(dest); onOpenChange(false); }
    }
  };

  // Auto-scroll active item
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r); return acc;
  }, {});

  // Group shortcuts
  const groupedShortcuts = MODULE_SHORTCUTS.reduce<Record<string, ModuleShortcut[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s); return acc;
  }, {});

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
        style={{ animation: 'searchFadeIn 0.15s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          {loading
            ? <Loader2 size={20} className="text-blue-500 animate-spin flex-shrink-0" />
            : <Search size={20} className="text-gray-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            id="global-search-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setLoading(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Search products, materials, orders, suppliers, customers..."
            className="flex-1 bg-transparent text-gray-800 text-base placeholder-gray-400 outline-none"
            autoComplete="off"
          />
          {query
            ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )
            : null
          }
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-400 text-xs font-mono">ESC</kbd>
        </div>

        {/* Body */}
        <div ref={listRef} className="overflow-y-auto max-h-[60vh] scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>

          {/* ── No query: module shortcuts ─────────────────────────────── */}
          {!debouncedQuery && (
            <div className="p-3 space-y-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-2">Quick Navigation</p>
              {Object.entries(groupedShortcuts).map(([group, shortcuts]) => (
                <div key={group}>
                  <p className="text-[11px] text-gray-400 font-medium px-2 pb-1">{group}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {shortcuts.map(shortcut => {
                      const gi = MODULE_SHORTCUTS.indexOf(shortcut);
                      return (
                        <button
                          key={shortcut.path}
                          data-idx={gi}
                          onClick={() => { navigate(shortcut.path); onOpenChange(false); }}
                          onMouseEnter={() => setActiveIndex(gi)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-150 ${activeIndex === gi ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}
                        >
                          <span className={`p-1.5 rounded-lg flex-shrink-0 ${shortcut.color}`}>{shortcut.icon}</span>
                          <span className="text-gray-700 truncate font-medium text-[13px]">{shortcut.label}</span>
                          <ChevronRight size={13} className="ml-auto text-gray-300 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Query: results ─────────────────────────────────────────── */}
          {debouncedQuery && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No results for "{debouncedQuery}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a product code, material name, order number, or supplier name</p>
            </div>
          )}

          {debouncedQuery && results.length > 0 && (
            <div className="p-3 space-y-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 px-2 mb-1">
                    <span className="text-gray-400">{items[0].categoryIcon}</span>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{category}</span>
                    <span className="ml-auto text-xs text-gray-300 font-mono">{items.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {items.map(result => {
                      const idx = results.indexOf(result);
                      return (
                        <button
                          key={result.id}
                          data-idx={idx}
                          onClick={() => { navigate(result.path); onOpenChange(false); }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${activeIndex === idx ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800 truncate">
                                <Highlight text={result.title} query={debouncedQuery} />
                              </span>
                              {result.badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${result.badgeColor}`}>
                                  {result.badge}
                                </span>
                              )}
                            </div>
                            {result.subtitle && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                <Highlight text={result.subtitle} query={debouncedQuery} />
                              </p>
                            )}
                          </div>
                          <ArrowRight size={14} className={`flex-shrink-0 transition-all ${activeIndex === idx ? 'text-blue-400 opacity-100 translate-x-0' : 'text-gray-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 text-[11px] text-gray-400 select-none">
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">↵</kbd> Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">⌘K</kbd> Toggle
          </span>
          {results.length > 0 && debouncedQuery && (
            <span className="ml-auto text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Animation keyframe injected inline */}
      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; transform: scale(0.97) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Trigger button (used in Header) ─────────────────────────────────────────
export function GlobalSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      id="global-search-trigger"
      onClick={onClick}
      className="w-full flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white/60 border border-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm hover:bg-white/80 hover:shadow-md hover:border-blue-200/50 shadow-sm group text-left"
    >
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0 transition-colors duration-300 group-hover:text-blue-500" />
      <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-500">Search across all modules...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/70 border border-gray-200/80 text-[10px] font-mono text-gray-400 flex-shrink-0">
        ⌘K
      </kbd>
    </button>
  );
}
