import React, { useState, useEffect, useCallback } from 'react';
import { customerApi } from '@/services/api';
import { toast } from 'sonner';

interface Customer {
  customer_id: string;
  customer_code?: string;
  name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  country?: string;
  ntn?: string;
  strn?: string;
  cnic?: string;
  payment_terms?: string;
  credit_limit?: number | string;
  address?: string;
  billing_address?: string;
  shipping_address?: string;
  state?: string;
  postal_code?: string;
  created_at?: string;
}

const emptyForm = (): Partial<Customer> => ({
  customer_code: '', name: '', company_name: '', contact_person: '',
  email: '', phone: '', mobile: '', address: '', billing_address: '',
  shipping_address: '', city: '', state: '', postal_code: '',
  country: 'Pakistan', ntn: '', strn: '', cnic: '', payment_terms: 'NET 30',
  credit_limit: '' as any,
});

const PAYMENT_TERMS = ['NET 15', 'NET 30', 'NET 45', 'NET 60', 'COD', 'ADVANCE'];

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Customer>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'finance'>('basic');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerApi.getAll({ search, limit: 200 });
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditId(c.customer_id);
    setForm({ ...c });
    setActiveTab('basic');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await customerApi.update(editId, form);
        toast.success('Customer updated successfully!');
      } else {
        await customerApi.create(form as any);
        toast.success('Customer created successfully!');
      }
      closeModal();
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await customerApi.delete(deleteId);
      toast.success('Customer deleted.');
      setDeleteId(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete customer.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', padding: '28px 24px', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>
            Customer Master
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '4px 0 0' }}>
            Manage customer profiles, NTN/STRN, credit limits & payment terms
          </p>
        </div>
        <button
          id="create-customer-btn"
          onClick={openCreate}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '10px 22px', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(102,126,234,0.5)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
        >
          + New Customer
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          id="customer-search"
          type="text"
          placeholder="Search by name, code, city, email, NTN, STRN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 480, padding: '10px 16px',
            borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.07)', color: '#fff',
            fontSize: 14, outline: 'none', backdropFilter: 'blur(8px)',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Customers', value: customers.length, color: '#667eea' },
          { label: 'With NTN', value: customers.filter(c => c.ntn).length, color: '#11998e' },
          { label: 'With STRN', value: customers.filter(c => c.strn).length, color: '#f7971e' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.07)', borderRadius: 12,
            padding: '14px 24px', border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)', minWidth: 140
          }}>
            <div style={{ color: stat.color, fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            No customers found. Click <strong style={{ color: '#667eea' }}>+ New Customer</strong> to add one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Code', 'Name / Company', 'City', 'Phone', 'NTN', 'STRN', 'Payment Terms', 'Credit Limit', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr
                    key={c.customer_id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(102,126,234,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)')}
                  >
                    <td style={{ padding: '11px 16px', color: '#a78bfa', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {c.customer_code || '—'}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#fff', fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{c.name || '—'}</div>
                      {c.company_name && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{c.company_name}</div>}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{c.city || '—'}</td>
                    <td style={{ padding: '11px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{c.phone || c.mobile || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#11998e', fontSize: 12, fontWeight: 500 }}>{c.ntn || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#f7971e', fontSize: 12, fontWeight: 500 }}>{c.strn || '—'}</td>
                    <td style={{ padding: '11px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{c.payment_terms || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#6ee7b7', fontSize: 13, fontWeight: 500 }}>
                      {c.credit_limit ? `PKR ${Number(c.credit_limit).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => openEdit(c)}
                        style={{ background: 'rgba(102,126,234,0.2)', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 6, color: '#a78bfa', padding: '4px 12px', fontSize: 12, cursor: 'pointer', marginRight: 6 }}
                      >Edit</button>
                      <button
                        onClick={() => setDeleteId(c.customer_id)}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#f87171', padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.12)', width: '100%', maxWidth: 680,
            maxHeight: '90vh', overflow: 'auto', padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>
                {editId ? 'Edit Customer' : 'New Customer'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
              {(['basic', 'address', 'finance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                    background: activeTab === tab ? 'rgba(102,126,234,0.4)' : 'transparent',
                    color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontSize: 13,
                    textTransform: 'capitalize', transition: 'all 0.2s'
                  }}
                >
                  {tab === 'basic' ? 'Basic Info' : tab === 'address' ? 'Address' : 'Finance & Tax'}
                </button>
              ))}
            </div>

            <form id="customer-form" onSubmit={handleSave}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Customer Code" name="customer_code" value={form.customer_code} onChange={handleChange} />
                  <Field label="Customer Name *" name="name" value={form.name} onChange={handleChange} required />
                  <Field label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} />
                  <Field label="Contact Person" name="contact_person" value={form.contact_person} onChange={handleChange} />
                  <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
                  <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                  <Field label="Mobile" name="mobile" value={form.mobile} onChange={handleChange} />
                </div>
              )}

              {activeTab === 'address' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Address" name="address" value={form.address} onChange={handleChange} textarea />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Billing Address" name="billing_address" value={form.billing_address} onChange={handleChange} textarea />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Shipping Address" name="shipping_address" value={form.shipping_address} onChange={handleChange} textarea />
                  </div>
                  <Field label="City" name="city" value={form.city} onChange={handleChange} />
                  <Field label="State / Province" name="state" value={form.state} onChange={handleChange} />
                  <Field label="Postal Code" name="postal_code" value={form.postal_code} onChange={handleChange} />
                  <Field label="Country" name="country" value={form.country} onChange={handleChange} />
                </div>
              )}

              {activeTab === 'finance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="NTN Number" name="ntn" value={form.ntn} onChange={handleChange} />
                  <Field label="STRN / GST Number" name="strn" value={form.strn} onChange={handleChange} />
                  <Field label="CNIC" name="cnic" value={form.cnic} onChange={handleChange} />
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>Payment Terms</label>
                    <select
                      name="payment_terms"
                      value={form.payment_terms || 'NET 30'}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13 }}
                    >
                      {PAYMENT_TERMS.map(t => <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t}</option>)}
                    </select>
                  </div>
                  <Field label="Credit Limit (PKR)" name="credit_limit" type="number" value={form.credit_limit as any} onChange={handleChange} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1a2e', borderRadius: 16, border: '1px solid rgba(239,68,68,0.3)', padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Delete Customer?</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 24 }}>This action cannot be undone. All linked records may be affected.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '9px 22px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FieldProps {
  label: string;
  name: string;
  value?: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, name, value, onChange, type = 'text', required, textarea }) => (
  <div>
    <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
      {label}
    </label>
    {textarea ? (
      <textarea
        name={name}
        value={value as string || ''}
        onChange={onChange}
        rows={3}
        required={required}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.07)', color: '#fff',
          fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box'
        }}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value as string || ''}
        onChange={onChange}
        required={required}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.07)', color: '#fff',
          fontSize: 13, outline: 'none', boxSizing: 'border-box'
        }}
      />
    )}
  </div>
);

export default CustomerManagement;
