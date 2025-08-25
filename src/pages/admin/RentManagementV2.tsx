import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, RefreshCw, Search, Download, CreditCard, Edit, Trash2 } from 'lucide-react';
import { useAdminView } from '../../context/AdminViewContext';
import { apiService } from '../../services/apiService';

type Status = 'paid' | 'pending' | 'overdue' | 'partial';

interface PaymentRow {
  _id?: string;
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  month: string;
  year: number;
  monthName: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: Status;
  paymentMethod?: string;
  transactionId?: string;
  wing?: 'A' | 'B';
}

const DUE_DAY = 5;

const RentManagementV2: React.FC = () => {
  const { view } = useAdminView();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [form, setForm] = useState({
    tenantId: '',
    amount: 0,
    paidAmount: 0,
    paidDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    transactionId: '',
    notes: '',
  });

  const computeStatus = (amount: number, paidAmount: number, dueDate: Date): Status => {
    const total = Number(amount) || 0;
    const paid = Number(paidAmount) || 0;
    if (paid > 0 && paid >= total) return 'paid';
    if (paid > 0 && paid < total) return 'partial';
    return new Date() > new Date(dueDate) ? 'overdue' : 'pending';
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [pRes, tRes, sRes] = await Promise.all([
        apiService.getRentPayments({
          month: selectedMonth,
          wing: view === 'wingA' ? 'A' : view === 'wingB' ? 'B' : undefined,
          status: statusFilter,
          search: searchTerm || undefined,
        }),
        apiService.getTenants(),
        apiService.getRentPaymentStats(selectedMonth),
      ]);

      if (pRes?.success) {
        const normalized: PaymentRow[] = pRes.data.map((p: any) => ({
          ...p,
          tenantId: typeof p.tenantId === 'object' ? (p.tenantId?._id || p.tenantId?.id) : p.tenantId,
          id: p._id || `${typeof p.tenantId === 'object' ? (p.tenantId?._id || p.tenantId?.id) : p.tenantId}-${p.month}`,
          tenantName: p.tenantId?.name || 'Unknown',
          roomNumber: p.roomId?.roomNumber || 'Unknown',
          paidAmount: p.paidAmount ?? 0,
          dueDate: p.dueDate ? new Date(p.dueDate) : new Date(`${p.month}-${String(DUE_DAY).padStart(2, '0')}`),
          paidDate: p.paidDate ? new Date(p.paidDate) : undefined,
        }));
        setPayments(normalized);
      } else {
        setError('Failed to fetch payments');
      }

      if (tRes?.success) setTenants(tRes.data);
      // sRes can be surfaced later in a summary card if needed
      void sRes;
    } catch (e) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [selectedMonth, statusFilter, view]);

  const filtered = useMemo(() => {
    // Build per-tenant monthly view: show all tenants for the selected wing and month,
    // merge with existing payment if found; else synthesize a pending row.
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const dueDateStr = `${selectedMonth}-${String(DUE_DAY).padStart(2, '0')}`;

    const isWingMatch = (t: any) =>
      view === 'dashboard' ||
      (view === 'wingA' && (t.wing === 'A' || t.roomId?.wing === 'A')) ||
      (view === 'wingB' && (t.wing === 'B' || t.roomId?.wing === 'B'));

    const baseTenants = tenants.filter(isWingMatch);

    const merged: PaymentRow[] = baseTenants.map((t) => {
      const tenantId = t._id;
      const pay = payments.find((p) => p.tenantId === tenantId && p.month === selectedMonth) || null;

      const amount = pay?.amount ?? (t.rent || 0);
      const paidAmount = pay?.paidAmount ?? 0;
      const status: Status = computeStatus(amount, paidAmount, dueDate);
      const dueDate = pay?.dueDate ? new Date(pay.dueDate) : new Date(dueDateStr);
      const paidDate = pay?.paidDate ? new Date(pay.paidDate) : undefined;
      const tenantName = t.name;
      const roomNumber = typeof t.roomId === 'object' ? (t.roomId?.roomNumber || 'Unknown') : t.roomId;
      const wing: 'A' | 'B' | undefined = pay?.wing || t.wing || t.roomId?.wing;

      return {
        _id: pay?._id,
        id: pay?._id || `${tenantId}-${selectedMonth}`,
        tenantId,
        tenantName,
        roomNumber,
        month: selectedMonth,
        year: yr,
        monthName: format(new Date(`${selectedMonth}-01`), 'MMMM'),
        amount,
        paidAmount,
        dueDate,
        paidDate,
        status,
        paymentMethod: pay?.paymentMethod,
        transactionId: pay?.transactionId,
        wing,
      } as PaymentRow;
    });

    // Apply search and status filtering
    const searchLower = (searchTerm || '').toLowerCase();
    const afterSearch = merged.filter((p) =>
      p.tenantName.toLowerCase().includes(searchLower) || String(p.roomNumber).includes(searchTerm)
    );

    const afterStatus = statusFilter === 'all' ? afterSearch : afterSearch.filter((p) => p.status === statusFilter);

    return afterStatus;
  }, [payments, tenants, selectedMonth, statusFilter, searchTerm, view]);

  const openAdd = () => {
    setEditing(null);
    setForm({ tenantId: '', amount: 0, paidAmount: 0, paidDate: format(new Date(), 'yyyy-MM-dd'), paymentMethod: 'cash', transactionId: '', notes: '' });
    setModalOpen(true);
  };
  const openEdit = (p: PaymentRow) => {
    if (p._id) {
      setEditing(p);
    } else {
      // No existing payment for this tenant-month: open as Add with prefilled tenant
      setEditing(null);
    }
    setForm({
      tenantId: p.tenantId,
      amount: p.amount,
      paidAmount: p.paidAmount,
      paidDate: format(p.paidDate || new Date(), 'yyyy-MM-dd'),
      paymentMethod: p.paymentMethod || 'cash',
      transactionId: p.transactionId || '',
      notes: '',
    });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const paidDateObj = new Date(form.paidDate);
      let res;
      if (editing?._id) {
        res = await apiService.updateRentPayment(editing._id, {
          amount: form.amount,
          paidAmount: form.paidAmount,
          paidDate: paidDateObj,
          paymentMethod: form.paymentMethod,
          transactionId: form.transactionId,
          notes: form.notes,
        });
      } else {
        const tenant = tenants.find(t => t._id === form.tenantId);
        if (!tenant) {
          setError('Tenant not found');
          setSaving(false);
          return;
        }
        const roomId = typeof tenant.roomId === 'object' ? tenant.roomId._id : tenant.roomId;
        const paymentMonth = selectedMonth;
        res = await apiService.createRentPayment({
          tenantId: tenant._id,
          roomId,
          month: paymentMonth,
          year: Number(paymentMonth.split('-')[0]),
          monthName: format(new Date(paymentMonth + '-01'), 'MMMM'),
          amount: form.amount,
          paidAmount: form.paidAmount,
          dueDate: new Date(`${paymentMonth}-${String(DUE_DAY).padStart(2, '0')}`),
          paidDate: paidDateObj,
          paymentMethod: form.paymentMethod,
          transactionId: form.transactionId,
          wing: tenant.wing || (tenant.roomId && tenant.roomId.wing) || 'A',
        });
      }
      if (res?.success) {
        setModalOpen(false);
        setEditing(null);
        await fetchAll();
      } else {
        setError('Failed to save payment');
      }
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!id) return;
    if (!confirm('Delete this payment?')) return;
    await apiService.deleteRentPayment(id);
    await fetchAll();
  };

  const markPaid = (p: PaymentRow) => openEdit({ ...p, paidAmount: p.amount });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rent Management (v2)</h1>
        <div className="flex gap-2">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border px-3 py-2 rounded" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border px-3 py-2 rounded">
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border px-3 py-2 rounded" />
          <button onClick={fetchAll} className="px-3 py-2 border rounded flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={openAdd} className="px-3 py-2 bg-yellow-500 text-white rounded flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border text-red-700">{error}</div>}
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="bg-white border rounded">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Tenant</th>
                <th className="text-left p-2">Room</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Paid</th>
                <th className="text-left p-2">Due</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Due Date</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const due = Math.max(0, p.amount - p.paidAmount);
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.tenantName}</td>
                    <td className="p-2">{p.roomNumber} / {p.wing}</td>
                    <td className="p-2">₹{p.amount.toLocaleString()}</td>
                    <td className="p-2 text-green-700">₹{p.paidAmount.toLocaleString()}</td>
                    <td className="p-2 text-red-700">₹{due.toLocaleString()}</td>
                    <td className="p-2 capitalize">{p.status}</td>
                    <td className="p-2">{format(p.dueDate, 'MMM dd, yyyy')}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button onClick={() => markPaid(p)} className="px-2 py-1 bg-green-50 text-green-700 rounded flex items-center gap-1" title="Pay"><CreditCard className="w-4 h-4" /> Pay</button>
                        {p._id && <button onClick={() => del(p._id!)} className="px-2 py-1 bg-red-50 text-red-700 rounded flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-center text-gray-500" colSpan={8}>No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Payment' : 'Add Payment'}</h3>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={save} className="space-y-3">
              {!editing && (
                <div>
                  <label className="block text-sm mb-1">Tenant</label>
                  <select value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })} className="border px-3 py-2 rounded w-full" required>
                    <option value="">Select Tenant</option>
                    {tenants.map(t => (
                      <option key={t._id} value={t._id}>{t.name} - Room {typeof t.roomId === 'object' ? t.roomId.roomNumber : t.roomId}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Payment Date</label>
                <input type="date" value={form.paidDate} onChange={e => setForm({ ...form, paidDate: e.target.value })} className="border px-3 py-2 rounded w-full" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Amount</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} className="border px-3 py-2 rounded w-full" min={0} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Paid Amount</label>
                  <input type="number" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: parseInt(e.target.value) || 0 })} className="border px-3 py-2 rounded w-full" min={0} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="border px-3 py-2 rounded w-full">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Transaction ID</label>
                  <input value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })} className="border px-3 py-2 rounded w-full" placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-yellow-500 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentManagementV2;


