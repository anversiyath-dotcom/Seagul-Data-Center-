import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, Calendar, Tag, Building2, CreditCard, 
  FileText, CheckCircle2, AlertCircle, Sparkles, Building 
} from 'lucide-react';
import { 
  ExpenseItem, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES, 
  BranchOffice, 
  BRANCH_CONFIG 
} from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: ExpenseItem) => void;
  editingExpense?: ExpenseItem | null;
  defaultBranch?: BranchOffice;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  editingExpense,
  defaultBranch = 'Negombo'
}) => {
  const [branch, setBranch] = useState<BranchOffice>(editingExpense?.branch || defaultBranch);
  const [date, setDate] = useState<string>(() => {
    if (editingExpense?.date) return editingExpense.date;
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [title, setTitle] = useState(editingExpense?.title || '');
  const [category, setCategory] = useState<ExpenseCategory | string>(
    editingExpense?.category || 'Office Rent & Tenancy'
  );
  const [amount, setAmount] = useState<string>(
    editingExpense?.amount !== undefined ? String(editingExpense.amount) : ''
  );
  const [currency, setCurrency] = useState<string>(
    editingExpense?.currency || (defaultBranch === 'Dubai' ? 'AED' : 'LKR')
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    editingExpense?.paymentMethod || 'Cash'
  );
  const [vendor, setVendor] = useState(editingExpense?.vendor || '');
  const [receiptNo, setReceiptNo] = useState(editingExpense?.receiptNo || '');
  const [notes, setNotes] = useState(editingExpense?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Sync state when editingExpense or defaultBranch changes
  useEffect(() => {
    if (editingExpense) {
      setBranch(editingExpense.branch || defaultBranch);
      setDate(editingExpense.date || new Date().toISOString().split('T')[0]);
      setTitle(editingExpense.title || '');
      setCategory(editingExpense.category || 'Office Rent & Tenancy');
      setAmount(editingExpense.amount !== undefined ? String(editingExpense.amount) : '');
      setCurrency(editingExpense.currency || (editingExpense.branch === 'Dubai' ? 'AED' : 'LKR'));
      setPaymentMethod(editingExpense.paymentMethod || 'Cash');
      setVendor(editingExpense.vendor || '');
      setReceiptNo(editingExpense.receiptNo || '');
      setNotes(editingExpense.notes || '');
    } else {
      const initialBranch = defaultBranch || 'Negombo';
      setBranch(initialBranch);
      setDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setCategory('Office Rent & Tenancy');
      setAmount('');
      setCurrency(initialBranch === 'Dubai' ? 'AED' : 'LKR');
      setPaymentMethod('Cash');
      setVendor('');
      setReceiptNo('');
      setNotes('');
    }
    setError(null);
  }, [editingExpense, isOpen, defaultBranch]);

  if (!isOpen) return null;

  const handleBranchChange = (newBranch: BranchOffice) => {
    setBranch(newBranch);
    if (!editingExpense) {
      setCurrency(newBranch === 'Dubai' ? 'AED' : 'LKR');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a description or title for this expense.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!date) {
      setError('Please select a valid expense date.');
      return;
    }

    const expenseData: ExpenseItem = {
      id: editingExpense?.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      title: trimmedTitle,
      category,
      amount: numAmount,
      currency: currency || (branch === 'Dubai' ? 'AED' : 'LKR'),
      branch,
      paymentMethod,
      vendor: vendor.trim() || undefined,
      receiptNo: receiptNo.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingExpense?.createdAt || new Date().toISOString()
    };

    onSaveExpense(expenseData);
    onClose();
  };

  // Quick category presets suggestions
  const presetTemplates = [
    { title: 'Office Rent - Monthly Lease', cat: 'Office Rent & Tenancy' },
    { title: 'Staff Monthly Salary & Allowance', cat: 'Salaries & Staff Commissions' },
    { title: 'High-speed Office Internet & WiFi', cat: 'Internet, Telecom & Phone' },
    { title: 'Electricity & Water Utility Bill', cat: 'Utilities, Electricity & Water' },
    { title: 'Social Media & Google Ad Spend', cat: 'Marketing, Ads & Promotion' },
    { title: 'Government Portal & Typing Charges', cat: 'Government, Typing & Portal Fees' },
    { title: 'Office Supplies, Paper & Toner', cat: 'Office Supplies, Courier & Printing' },
    { title: 'Bank Transfer & Transaction Fees', cat: 'Bank Charges & Currency Exchange' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>{editingExpense ? 'Edit Expense Record' : 'Record Business Expense'}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400/30 uppercase">
                  P&L Deduction
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Record operating expenses to compute accurate business Net Profit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Selector Bar */}
        <div className="bg-gradient-to-r from-emerald-50/70 via-slate-50 to-blue-50/70 border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-800">Operating Branch:</span>
          </div>

          <div className="inline-flex bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => handleBranchChange('Dubai')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                branch === 'Dubai'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <span>🇦🇪</span>
              <span>Dubai (AED)</span>
            </button>
            <button
              type="button"
              onClick={() => handleBranchChange('Negombo')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                branch === 'Negombo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <span>🇱🇰</span>
              <span>Negombo (LKR)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick preset chips */}
          {!editingExpense && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Preset Suggestions</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetTemplates.slice(0, 4).map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(tmpl.title);
                      setCategory(tmpl.cat);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors font-medium cursor-pointer"
                  >
                    + {tmpl.title.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Expense Title / Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Office Rent, Staff Salaries, High-speed Internet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Expense Category <span className="text-red-500">*</span></span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Expense Date <span className="text-red-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                <span>Amount Paid <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">
                  {currency}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-14 pr-3 py-2.5 font-mono font-black text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="AED">AED (Dirhams)</option>
                <option value="LKR">LKR (Rupees)</option>
                <option value="USD">USD (Dollars)</option>
              </select>
            </div>
          </div>

          {/* Payment Method & Paid To / Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Payment Method</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="Cash">Cash Voucher</option>
                <option value="Bank Transfer">Bank Transfer / Wire</option>
                <option value="Credit Card">Credit / Debit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online / Portal Payment</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Paid To / Vendor / Beneficiary
              </label>
              <input
                type="text"
                placeholder="e.g. Landlord, Telecom Co, Staff Name"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Receipt No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Receipt / Voucher / Invoice Ref</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RCP-8831, INV-2026-09"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Additional Notes / Remarks
              </label>
              <input
                type="text"
                placeholder="Optional notes or context"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingExpense ? 'Update Expense' : 'Save Expense Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
