import React, { useState, useEffect } from 'react';
import { Plus, Eye, DollarSign, Clock, CheckCircle, AlertCircle, XCircle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminView } from '../../context/AdminViewContext';
import { useLocation } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { useDataRefresh } from '../../context/DataRefreshContext';

interface RentPayment {
  id: string;
  _id?: string;
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
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  wing?: 'A' | 'B';
}

const DUE_DAY = 5; // Rent due on the 5th of each month

const RentManagement: React.FC = () => {
  const { view } = useAdminView();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialStatus = params.get('status') || 'all';
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [floorFilter, setFloorFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  // ...existing code...
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const [paymentForm, setPaymentForm] = useState({
    tenantId: '',
    roomId: '',
    amount: 0,
    paidAmount: 0,
  paymentMethod: 'cash',
    transactionId: '',
    notes: '',
    paidDate: '',
    payNextMonth: false,
  });

  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { refreshTrigger } = useDataRefresh();
  const [refreshKey, setRefreshKey] = useState(0);

  // Carry-forward helpers
  const getCarryForwardDue = (tenantId: string): number => {
    try {
      return rentPayments
        .filter((p) => p.tenantId === tenantId && p.month < selectedMonth && (p.paidAmount ?? 0) < (p.amount ?? 0))
        .reduce((sum, p) => sum + Math.max(0, (p.amount ?? 0) - (p.paidAmount ?? 0)), 0);
    } catch {
      return 0;
    }
  };

  const computeStatusWithCarry = (payment: RentPayment, carryForward: number): RentPayment['status'] => {
    const amount = payment.amount ?? 0;
    const paid = payment.paidAmount ?? 0;
    const totalDue = amount + carryForward;
    if (paid > 0 && paid >= totalDue) return 'paid';
    if (paid > 0 && paid < totalDue) return 'partial';
    const now = new Date();
    return now > payment.dueDate || carryForward > 0 ? 'overdue' : 'pending';
  };

  const getNextMonthStr = (yyyyMm: string): string => {
    const [y, m] = yyyyMm.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    return `${ny}-${nm}`;
  };

  const fetchRentPayments = async () => {
    try {
      setLoading(true);
  setError("");
      const response = await apiService.getRentPayments();
      console.log('Fetched rent payments:', response);
      if (response && response.success) {
        const processedPayments = response.data.map((p: any) => ({
          ...p,
          // Normalize ids so comparisons work reliably
          tenantId: typeof p.tenantId === 'object' ? (p.tenantId?._id || p.tenantId?.id) : p.tenantId,
          roomId: typeof p.roomId === 'object' ? (p.roomId?._id || p.roomId?.id) : p.roomId,
          id: p._id || `${(typeof p.tenantId === 'object' ? (p.tenantId?._id || p.tenantId?.id) : p.tenantId)}-${p.month}`,
          tenantName: p.tenantId?.name || 'Unknown',
          roomNumber: p.roomId?.roomNumber || 'Unknown',
          paidAmount: p.paidAmount ?? 0,
          dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
          paidDate: p.paidDate ? new Date(p.paidDate) : undefined,
          status: p.status,
        }));
        setRentPayments(processedPayments);
      } else {
        setError('Failed to fetch rent payments from database');
      }
    } catch (err) {
      setError('Failed to connect to database');
      console.error('Fetch payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await apiService.getTenants();
      if (response && response.success) {
        setTenants(response.data);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    }
  };

  useEffect(() => {
    fetchRentPayments();
    fetchTenants();
  }, [refreshTrigger, selectedMonth, refreshKey]);

  // Deep-link to pay for a specific tenant
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const payTenantId = qp.get('payTenantId');
    if (payTenantId && tenants.length > 0) {
      const row = mergedPayments.find(p => p.tenantId === payTenantId && p.month === selectedMonth);
      if (row && row.status !== 'paid') {
        handleMarkAsPaid(row);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants, rentPayments, selectedMonth]);

  // ...existing code...
  const [year, month] = selectedMonth.split('-').map(Number);
  const dueDateStr = `${year}-${month.toString().padStart(2, '0')}-${DUE_DAY.toString().padStart(2, '0')}`;

  const mergedPayments: RentPayment[] = tenants
    .filter((tenant) => tenant.status === 'active') // Only show active tenants
    .map((tenant) => {
    const payment = rentPayments.find((p) => p.tenantId === tenant._id && p.month === selectedMonth);
    let amount = tenant.rent || 0;
    let paidAmount = 0;
    let status: RentPayment['status'] = 'pending';
    let dueDate = new Date(dueDateStr);
    let paidDate: Date | undefined = undefined;
    let paymentMethod;
    let transactionId;
    let notes;
    let wing = typeof tenant.roomId === 'object' ? tenant.roomId.wing : tenant.wing;
    let yearVal = year;
    let monthNameVal = format(new Date(selectedMonth + '-01'), 'MMMM');
    let _id;
    let id = `${tenant._id}-${selectedMonth}`;

    if (payment) {
      amount = payment.amount ?? amount;
      paidAmount = payment.paidAmount ?? 0;
      const carry = getCarryForwardDue(tenant._id);
      status = computeStatusWithCarry({ ...(payment as any), amount, paidAmount, dueDate } as RentPayment, carry);
      dueDate = payment.dueDate ? new Date(payment.dueDate) : dueDate;
      paidDate = payment.paidDate ? new Date(payment.paidDate) : undefined;
      paymentMethod = payment.paymentMethod;
      transactionId = payment.transactionId;
      notes = payment.notes;
      wing = payment.wing ?? wing;
      yearVal = payment.year ?? yearVal;
      monthNameVal = payment.monthName ?? monthNameVal;
      _id = payment._id;
      id = payment.id || id;
    } else {
      const carry = getCarryForwardDue(tenant._id);
      status = carry > 0 ? 'overdue' : 'pending';
    }

    return {
      id,
      _id,
      tenantId: tenant._id,
      tenantName: tenant.name,
      roomNumber: typeof tenant.roomId === 'object' ? tenant.roomId.roomNumber : tenant.roomId,
      month: selectedMonth,
      year: yearVal,
      monthName: monthNameVal,
      amount,
      paidAmount,
      dueDate,
      paidDate,
      status,
      paymentMethod,
      transactionId,
      notes,
      wing,
    };
  });

  const filteredPayments = mergedPayments.filter((payment) => {
    const matchesSearch = payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.roomNumber.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesWing =
      view === 'dashboard' ||
      (view === 'wingA' && payment.wing === 'A') ||
      (view === 'wingB' && payment.wing === 'B');
    const matchesFloor = floorFilter === 'all' || (typeof payment.roomNumber === 'string' ? false : true);
    const matchesRoom = roomFilter === 'all' || payment.roomNumber?.toString() === roomFilter;
    return matchesSearch && matchesStatus && matchesWing && matchesFloor && matchesRoom;
  });

  const sortedPayments = [...filteredPayments]
    .filter(p => {
      if (!dueDateFilter) return true;
      const d = format(new Date(p.dueDate), 'yyyy-MM-dd');
      return d === dueDateFilter;
    })
    .sort((a,b)=> new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentPayments = sortedPayments.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedPayments.length / perPage);

  const summary = {
    totalRent: mergedPayments.reduce((sum, p) => {
      const carry = getCarryForwardDue(p.tenantId);
      return sum + (p.amount + carry);
    }, 0),
    collectedAmount: mergedPayments.reduce((sum, p) => sum + p.paidAmount, 0),
    pendingAmount: mergedPayments
      .map((p) => {
        const carry = getCarryForwardDue(p.tenantId);
        const status = computeStatusWithCarry(p, carry);
        return (status === 'pending' || status === 'partial' || status === 'overdue')
          ? Math.max(0, (p.amount - p.paidAmount) + carry)
          : 0;
      })
      .reduce((a, b) => a + b, 0),
    overdueAmount: mergedPayments
      .map((p) => {
        const carry = getCarryForwardDue(p.tenantId);
        const status = computeStatusWithCarry(p, carry);
        return status === 'overdue' ? Math.max(0, (p.amount - p.paidAmount) + carry) : 0;
      })
      .reduce((a, b) => a + b, 0),
    partialAmount: mergedPayments
      .filter((p) => p.status === 'partial')
      .reduce((sum, p) => sum + p.paidAmount, 0),
    totalTenants: mergedPayments.length,
    paidTenants: mergedPayments.filter((p) => computeStatusWithCarry(p, getCarryForwardDue(p.tenantId)) === 'paid').length,
    pendingTenants: mergedPayments.filter((p) => computeStatusWithCarry(p, getCarryForwardDue(p.tenantId)) === 'pending').length,
    overdueTenants: mergedPayments.filter((p) => computeStatusWithCarry(p, getCarryForwardDue(p.tenantId)) === 'overdue').length,
    partialTenants: mergedPayments.filter((p) => computeStatusWithCarry(p, getCarryForwardDue(p.tenantId)) === 'partial').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'partial': return <DollarSign className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  // Removed separate Edit action to keep only one Pay action

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
  setSaving(true);
  setError("");

    try {
      console.log('Submitting payment:', paymentForm);

      if (paymentForm.paidAmount < 0) {
        setError('Paid amount cannot be negative');
        setSaving(false);
        return;
      }

      if (paymentForm.paidAmount > paymentForm.amount) {
        const confirmOverpayment = window.confirm(
          `Paid amount (₹${paymentForm.paidAmount}) is more than due amount (₹${paymentForm.amount}). Do you want to continue?`
        );
        if (!confirmOverpayment) {
          setSaving(false);
          return;
        }
      }

      if (!isEditing && !selectedPayment?._id) {
        const duplicateCheck = rentPayments.some(
          (p) => p.tenantId === paymentForm.tenantId && p.month === selectedMonth
        );
        if (duplicateCheck) {
          setError('Payment record for this tenant and month already exists.');
          setSaving(false);
          return;
        }
      }

      const paidDateObj = paymentForm.paidDate ? new Date(paymentForm.paidDate) : new Date();
      const selectedTenant = tenants.find((t) => t._id === paymentForm.tenantId);

      let response;
      let newPayment: RentPayment;

      // Defer remaining to next month if chosen
      if (paymentForm.payNextMonth && selectedPayment) {
        if (!selectedTenant) {
          setError('Selected tenant not found');
          setSaving(false);
          return;
        }
        const tenantId = selectedTenant._id || paymentForm.tenantId;
        const carryPrev = getCarryForwardDue(tenantId);
        const alreadyPaid = selectedPayment?.paidAmount || 0;
        const remainingThisMonth = Math.max(0, paymentForm.amount - (alreadyPaid + paymentForm.paidAmount));
        const carryTotal = carryPrev + remainingThisMonth;
        const nextMonth = getNextMonthStr(selectedMonth);
        const existingNext = rentPayments.find((p) => p.tenantId === tenantId && p.month === nextMonth);
        const baseRent = selectedTenant.rent || paymentForm.amount;
        const nextAmount = Math.max(0, baseRent + carryTotal);

        if (existingNext && existingNext._id) {
          response = await apiService.updateRentPayment(existingNext._id, { amount: nextAmount });
        } else {
          const roomId = typeof selectedTenant?.roomId === 'object' ? selectedTenant.roomId._id : selectedTenant?.roomId;
          response = await apiService.createRentPayment({
            tenantId,
            roomId,
            month: nextMonth,
            year: parseInt(nextMonth.split('-')[0], 10),
            monthName: format(new Date(nextMonth + '-01'), 'MMMM'),
            amount: nextAmount,
            paidAmount: 0,
            dueDate: new Date(`${nextMonth}-${DUE_DAY.toString().padStart(2, '0')}`),
            paymentMethod: paymentForm.paymentMethod,
            wing: selectedTenant?.wing || 'A',
          });
        }

        if (response && response.success) {
          alert(`Due amount ₹${carryTotal.toLocaleString()} added to ${nextMonth}. Total next month payable: ₹${nextAmount.toLocaleString()}`);
          setShowPaymentModal(false);
          setSelectedPayment(null);
          setIsEditing(false);
          setPaymentForm({ tenantId: '', roomId: '', amount: 0, paidAmount: 0, paymentMethod: 'cash', transactionId: '', notes: '', paidDate: '', payNextMonth: false });
          await fetchRentPayments();
          await fetchTenants();
          setSaving(false);
          return;
        }
      }

      if (selectedPayment?._id) {
        const updateData = {
          amount: paymentForm.amount,
          paidAmount: (selectedPayment?.paidAmount || 0) + paymentForm.paidAmount,
          paidDate: paidDateObj,
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          notes: paymentForm.notes,
        };

        console.log('Updating payment with data:', updateData);
        response = await apiService.updateRentPayment(selectedPayment._id, updateData);

        if (response && response.success) {
          newPayment = {
            ...selectedPayment,
            ...response.data,
            id: response.data._id || selectedPayment.id,
            // Ensure ids remain normalized strings for reliable matching
            tenantId: selectedPayment.tenantId,
            tenantName: selectedPayment.tenantName,
            roomNumber: selectedPayment.roomNumber,
            dueDate: new Date(response.data.dueDate),
            paidDate: response.data.paidDate ? new Date(response.data.paidDate) : undefined,
          };

          setRentPayments((prev) =>
            prev.map((p) => (p._id === selectedPayment._id ? newPayment : p))
          );
        }
      } else {
        if (!selectedTenant) {
          setError('Selected tenant not found');
          setSaving(false);
          return;
        }

        const paymentMonth = format(paidDateObj, 'yyyy-MM');
        const roomId = typeof selectedTenant?.roomId === 'object' ? selectedTenant.roomId._id : selectedTenant?.roomId;

        const paymentData = {
          tenantId: selectedTenant._id,
          roomId: roomId,
          month: paymentMonth,
          year: paidDateObj.getFullYear(),
          monthName: format(paidDateObj, 'MMMM'),
          amount: paymentForm.amount,
          paidAmount: paymentForm.paidAmount,
          dueDate: new Date(`${paymentMonth}-${DUE_DAY.toString().padStart(2, '0')}`),
          paidDate: paidDateObj,
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          notes: paymentForm.notes,
          wing: selectedTenant?.wing || 'A',
        };

        console.log('Creating payment with data:', paymentData);
        response = await apiService.createRentPayment(paymentData);

        if (response && response.success) {
          newPayment = {
            ...response.data,
            id: response.data._id || `${selectedTenant._id}-${paymentMonth}`,
            // Normalize ids so matching works
            tenantId: selectedTenant._id,
            roomId: roomId,
            tenantName: selectedTenant.name,
            roomNumber: typeof selectedTenant.roomId === 'object' ? selectedTenant.roomId.roomNumber : selectedTenant.roomId,
            dueDate: new Date(response.data.dueDate),
            paidDate: response.data.paidDate ? new Date(response.data.paidDate) : undefined,
            // Trust server-calculated status
            status: response.data.status,
          };

          setRentPayments((prev) => [...prev, newPayment]);
        }
      }

      if (response && response.success) {
        console.log('Payment saved successfully, updating state...');
        setShowPaymentModal(false);
        setSelectedPayment(null);
        setIsEditing(false);
        setPaymentForm({
          tenantId: '',
          roomId: '',
          amount: 0,
          paidAmount: 0,
          paymentMethod: 'cash',
          transactionId: '',
          notes: '',
          paidDate: '',
          payNextMonth: false,
        });
        alert(`Payment ${isEditing ? 'updated' : 'added'} successfully!`);
      } else {
        console.error('API response error:', response);
  setError(`Failed to ${isEditing ? 'update' : 'add'} payment`);
      }
    } catch (err) {
      console.error('Save payment error:', err);
      setError(`Failed to ${isEditing ? 'update' : 'save'} payment`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setIsEditing(false);
    setPaymentForm({
      tenantId: '',
      roomId: '',
      amount: 0,
      paidAmount: 0,
      paymentMethod: 'cash',
      transactionId: '',
      notes: '',
      paidDate: format(new Date(), 'yyyy-MM-dd'),
      payNextMonth: false,
    });
    setShowPaymentModal(true);
  };

  const handleMarkAsPaid = (payment: RentPayment) => {
    if (payment.status === 'paid') return; // don't allow repeat payment
    setSelectedPayment(payment);
    setIsEditing(false);
    const carry = getCarryForwardDue(payment.tenantId);
    const totalThisCycle = payment.amount + carry;
    const alreadyPaid = payment.paidAmount || 0;
    const defaultPay = Math.max(0, totalThisCycle - alreadyPaid);
    setPaymentForm({
      tenantId: payment.tenantId,
      roomId: payment.roomNumber,
      amount: totalThisCycle,
      paidAmount: defaultPay,
      paymentMethod: 'cash',
      transactionId: '',
      notes: '',
      paidDate: format(new Date(), 'yyyy-MM-dd'),
      payNextMonth: false,
    });
    setShowPaymentModal(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      setLoading(true);
      const response = await apiService.deleteRentPayment(paymentId);
      if (response && response.success) {
        alert('Payment deleted successfully!');
        setRefreshKey((k) => k + 1);
        await fetchRentPayments();
        await fetchTenants();
      } else {
        alert('Failed to delete payment');
      }
    } catch (err) {
      console.error('Delete payment error:', err);
      alert('Error deleting payment');
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...

  const handleViewHistory = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowHistoryModal(true);
  };

  const tenantHistory = selectedTenantId
    ? rentPayments.filter((p) => p.tenantId === selectedTenantId).sort((a, b) => b.year - a.year || parseInt(b.month.split('-')[1]) - parseInt(a.month.split('-')[1]))
    : [];

  const exportToCSV = () => {
    const headers = ['Tenant Name', 'Room Number', 'Amount', 'Paid Amount', 'Status', 'Due Date', 'Paid Date'];
    const data = filteredPayments.map((p) => [
      p.tenantName,
      p.roomNumber,
      p.amount,
      p.paidAmount,
      p.status,
      format(p.dueDate, 'MMM dd, yyyy'),
      p.paidDate ? format(p.paidDate, 'MMM dd, yyyy') : '-',
    ]);
    const csvContent = [headers.join(','), ...data.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rent_payments_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ...existing code...

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg text-gray-600">Loading...</div></div>;
  }

  if (error && rentPayments.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
        <p className="mb-4">{error}</p>
        <button onClick={fetchRentPayments} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rent Management</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <span className="text-sm text-gray-600">Total Tenants</span>
          <span className="text-2xl font-bold text-gray-900">{summary.totalTenants}</span>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <span className="text-sm text-gray-600">Total Rent Expected</span>
          <span className="text-2xl font-bold text-gray-900">₹{summary.totalRent.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <span className="text-sm text-gray-600">Total Rent Collected</span>
          <span className="text-2xl font-bold text-green-600">₹{summary.collectedAmount.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <span className="text-sm text-gray-600">Pending Rent</span>
          <span className="text-2xl font-bold text-yellow-600">₹{summary.pendingAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by tenant name or room number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Floors</option>
          {[...new Set(tenants.map(t => (typeof t.roomId === 'object' ? t.roomId?.floor : undefined)).filter(Boolean))]
            .map((f:any)=>(<option key={String(f)} value={String(f)}>{String(f)} Floor</option>))}
        </select>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Rooms</option>
          {[...new Set(tenants.map(t => (typeof t.roomId === 'object' ? t.roomId?.roomNumber : t.roomId)).filter(Boolean))]
            .map((rn:any)=>(<option key={String(rn)} value={String(rn)}>{String(rn)}</option>))}
        </select>
        <input
          type="date"
          value={dueDateFilter}
          onChange={(e)=>setDueDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
          title="Due Date"
        />
        <button
          onClick={handleAddPayment}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Payment
        </button>
        <button
          onClick={exportToCSV}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Rent Payments - {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} ({filteredPayments.length})
          </h3>
        </div>
        <table className="w-full min-w-max bg-white rounded-lg shadow-md mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">S.No.</th>
              <th className="px-4 py-2 text-left">Tenant Name</th>
              <th className="px-4 py-2 text-left">Room/Wing</th>
              <th className="px-4 py-2 text-left">Monthly Rent</th>
              <th className="px-4 py-2 text-left">Amount Paid</th>
              <th className="px-4 py-2 text-left">Due Amount</th>
              <th className="px-4 py-2 text-left">Payment Status</th>
              <th className="px-4 py-2 text-left">Due Date</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.map((payment, idx) => {
              const dueAmount = Math.max(0, payment.amount - payment.paidAmount);
              return (
                <tr key={payment.id} className="hover:bg-yellow-50 border-b border-gray-100">
                  <td className="px-4 py-2">{idx + 1 + (currentPage - 1) * perPage}</td>
                  <td className="px-4 py-2 font-medium">{payment.tenantName}</td>
                  <td className="px-4 py-2">Room {payment.roomNumber} / Wing {payment.wing}</td>
                  <td className="px-4 py-2">₹{payment.amount.toLocaleString()}</td>
                  <td className="px-4 py-2 text-green-600 font-medium">₹{payment.paidAmount.toLocaleString()}</td>
                  <td className="px-4 py-2 text-red-600 font-medium">₹{dueAmount.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2">{format(payment.dueDate, 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      {payment.status !== 'paid' && (
                        <button 
                          onClick={() => handleMarkAsPaid(payment)} 
                          className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded transition-colors" 
                          title="Pay"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewHistory(payment.tenantId)} 
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded transition-colors" 
                        title="View History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {payment._id && (
                        <button 
                          onClick={() => handleDeletePayment(payment._id!)} 
                          className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded transition-colors" 
                          title="Delete Payment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {currentPayments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No payments found for the selected criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage((p) => p - 1)} 
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages} ({filteredPayments.length} total)
            </span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage((p) => p + 1)} 
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPayment ? (isEditing ? 'Edit Payment' : 'Mark as Paid') : 'Add New Payment'} 
                {selectedPayment && ` - ${selectedPayment.tenantName}`}
              </h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSavePayment} className="p-6 space-y-6">
              {saving && (
                <div className="flex items-center justify-center mb-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
                  <span className="text-yellow-600 font-semibold">Saving payment, please wait...</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPayment ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                      <input 
                        type="text" 
                        value={selectedPayment.tenantName} 
                        disabled 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                      <input 
                        type="text" 
                        value={`Room ${selectedPayment.roomNumber}`} 
                        disabled 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <input 
                        type="text" 
                        value={selectedPayment.monthName + ' ' + selectedPayment.year} 
                        disabled 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tenant *</label>
                      <select
                        value={paymentForm.tenantId}
                        onChange={(e) => {
                          const tenant = tenants.find((t) => t._id === e.target.value);
                          setPaymentForm({
                            ...paymentForm,
                            tenantId: e.target.value,
                            roomId: tenant?.roomId?._id || tenant?.roomId || '',
                            amount: tenant?.rent || 0,
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Tenant</option>
                        {tenants.map((tenant) => (
                          <option key={tenant._id} value={tenant._id}>
                            {tenant.name} - Room {typeof tenant.roomId === 'object' ? tenant.roomId.roomNumber : tenant.roomId}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.paidDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹) *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (₹) *</label>
                  <input
                    type="number"
                    value={paymentForm.paidAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  value={paymentForm.notes} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
                  rows={3} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" 
                  placeholder="Optional notes about the payment"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-semibold">₹{paymentForm.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Paid Amount:</span>
                  <span className="font-semibold text-green-600">₹{paymentForm.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-medium">Balance Due:</span>
                  <span className={`font-semibold ${(paymentForm.amount - paymentForm.paidAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.max(0, paymentForm.amount - paymentForm.paidAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-sm ${
                    (paymentForm.paidAmount > 0 && paymentForm.paidAmount >= paymentForm.amount) ? 'bg-green-100 text-green-800' :
                    (paymentForm.paidAmount > 0 && paymentForm.paidAmount < paymentForm.amount) ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(paymentForm.paidAmount > 0 && paymentForm.paidAmount >= paymentForm.amount) ? 'Paid' :
                     (paymentForm.paidAmount > 0 && paymentForm.paidAmount < paymentForm.amount) ? 'Partial' : 'Pending'}
                  </span>
                </div>
                {paymentForm.payNextMonth && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Next Month Total (rent + due):</span>
                    <span className="font-semibold">
                      {(() => {
                        const tenant = tenants.find((t) => t._id === (selectedPayment?.tenantId || paymentForm.tenantId));
                        const baseRent = tenant?.rent || paymentForm.amount;
                        const alreadyPaid = selectedPayment?.paidAmount || 0;
                        const carryPrev = selectedPayment ? getCarryForwardDue(selectedPayment.tenantId) : 0;
                        const remaining = Math.max(0, paymentForm.amount - (alreadyPaid + paymentForm.paidAmount));
                        const nextTotal = Math.max(0, baseRent + carryPrev + remaining);
                        return `₹${nextTotal.toLocaleString()}`;
                      })()}
                    </span>
                  </div>
                )}
                {selectedPayment && selectedPayment.status !== 'paid' && (
                  <div className="flex items-center gap-2 pt-2">
                    <input id="payNextMonth" type="checkbox" checked={paymentForm.payNextMonth} onChange={(e) => setPaymentForm({ ...paymentForm, payNextMonth: e.target.checked })} />
                    <label htmlFor="payNextMonth" className="text-sm text-gray-700">Defer remaining balance to next month</label>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowPaymentModal(false)} 
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : (selectedPayment ? (isEditing ? 'Update Payment' : 'Save Payment') : 'Add Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment History - {tenants.find((t) => t._id === selectedTenantId)?.name}
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {tenantHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Month</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Amount</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Paid</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Balance</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Status</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Due Date</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Paid Date</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantHistory.map((payment) => {
                        const balance = Math.max(0, payment.amount - payment.paidAmount);
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-3 font-medium">
                              {payment.monthName} {payment.year}
                            </td>
                            <td className="border border-gray-200 px-4 py-3">₹{payment.amount.toLocaleString()}</td>
                            <td className="border border-gray-200 px-4 py-3 text-green-600 font-medium">
                              ₹{payment.paidAmount.toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-red-600 font-medium">
                              ₹{balance.toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                {getStatusIcon(payment.status)}
                                <span className="ml-1 capitalize">{payment.status}</span>
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              {format(payment.dueDate, 'MMM dd, yyyy')}
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              {payment.paidDate ? format(payment.paidDate, 'MMM dd, yyyy') : '-'}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 capitalize">
                              {payment.paymentMethod || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No payment history found for this tenant</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentManagement;