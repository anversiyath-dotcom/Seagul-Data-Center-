import React, { useState, useRef, useEffect } from 'react';
import { VisaFollowup, VisaStatus, CustomerType, VisaPaymentStatus, VISA_CATEGORIES } from '../types';
import { X, FileText, Upload, Sparkles, Loader2, CheckCircle2, AlertCircle, Trash2, Eye, Calendar, Building2, User, AlertTriangle, ExternalLink, DollarSign, Wallet, Check, Clock, TrendingUp, Tag, Percent } from 'lucide-react';
import { calculateVisaExpiryDate, getVisaDurationDays } from '../utils/helpers';

interface AddVisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVisa: (visa: VisaFollowup) => void;
  editingVisa?: VisaFollowup | null;
  onUpdateVisa?: (visa: VisaFollowup) => void;
  recordedAgencies?: string[];
  existingVisas?: VisaFollowup[];
  onOpenExistingVisa?: (visa: VisaFollowup) => void;
}

export const AddVisaModal: React.FC<AddVisaModalProps> = ({
  isOpen,
  onClose,
  onAddVisa,
  editingVisa,
  onUpdateVisa,
  recordedAgencies,
  existingVisas = [],
  onOpenExistingVisa
}) => {
  const [lastName, setLastName] = useState(editingVisa?.lastName || '');
  const [firstName, setFirstName] = useState(editingVisa?.firstName || '');
  const [passportNo, setPassportNo] = useState(editingVisa?.passportNo || '');
  const [passportExpiry, setPassportExpiry] = useState(editingVisa?.passportExpiry || '');
  const [nationality, setNationality] = useState(editingVisa?.nationality || 'SRI LANKAN');
  const [destinationCountry, setDestinationCountry] = useState(editingVisa?.destinationCountry || 'United Arab Emirates (UAE)');
  const [unifiedNumber, setUnifiedNumber] = useState(editingVisa?.unifiedNumber || '');
  const [dob, setDob] = useState(editingVisa?.dob || '');
  const [visaCategory, setVisaCategory] = useState(editingVisa?.visaCategory || '30 Days Single Entry');
  const [entryDate, setEntryDate] = useState(editingVisa?.entryDate || '');
  const [expiryDate, setExpiryDate] = useState(editingVisa?.expiryDate || '');
  const [status, setStatus] = useState<VisaStatus | ''>(editingVisa?.status || '');
  const [customer, setCustomer] = useState(editingVisa?.customer || 'Seagull Global');
  const [customerType, setCustomerType] = useState<CustomerType>(editingVisa?.customerType || 'Agency');
  const [remarks, setRemarks] = useState(editingVisa?.remarks || '');
  const [icpFileNo, setIcpFileNo] = useState(editingVisa?.icpFileNo || '');

  // Supplier & Financial States
  const [supplier, setSupplier] = useState(editingVisa?.supplier || 'Musafir B2B');
  const [purchasingPrice, setPurchasingPrice] = useState<string>(
    editingVisa?.purchasingPrice !== undefined ? String(editingVisa.purchasingPrice) : ''
  );
  const [sellingPrice, setSellingPrice] = useState<string>(
    editingVisa?.sellingPrice !== undefined ? String(editingVisa.sellingPrice) : ''
  );
  const [paymentStatus, setPaymentStatus] = useState<VisaPaymentStatus>(
    editingVisa?.paymentStatus || 'Pending'
  );
  const [currency, setCurrency] = useState<string>(editingVisa?.currency || 'AED');

  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [showDuplicateError, setShowDuplicateError] = useState(false);

  // Check for duplicate visa application entries
  const findDuplicateVisa = (): { visa: VisaFollowup; reason: string } | null => {
    if (!existingVisas || !Array.isArray(existingVisas) || existingVisas.length === 0) return null;

    const cleanPass = (passportNo || '').trim().toUpperCase();
    const cleanIcp = (icpFileNo || '').trim().toUpperCase();
    const cleanUid = (unifiedNumber || '').trim().toUpperCase();
    const cleanFirst = (firstName || '').trim().toUpperCase();
    const cleanLast = (lastName || '').trim().toUpperCase();

    for (const v of existingVisas) {
      if (!v) continue;
      if (editingVisa && v.id === editingVisa.id) continue;

      // 1. Passport Match
      if (cleanPass.length >= 4 && (v.passportNo || '').trim().toUpperCase() === cleanPass) {
        return { visa: v, reason: `Passport Number "${cleanPass}" is already registered` };
      }

      // 2. ICP File No Match
      if (cleanIcp.length >= 5 && v.icpFileNo && (v.icpFileNo || '').trim().toUpperCase() === cleanIcp) {
        return { visa: v, reason: `ICP File Number "${cleanIcp}" is already registered` };
      }

      // 3. Unified Number Match
      if (cleanUid.length >= 5 && v.unifiedNumber && (v.unifiedNumber || '').trim().toUpperCase() === cleanUid) {
        return { visa: v, reason: `Unified Number (UID) "${cleanUid}" is already registered` };
      }

      // 4. Full Name Match
      if (cleanFirst.length >= 2 && cleanLast.length >= 2) {
        if (
          (v.firstName || '').trim().toUpperCase() === cleanFirst &&
          (v.lastName || '').trim().toUpperCase() === cleanLast
        ) {
          return { visa: v, reason: `Applicant Name "${cleanFirst} ${cleanLast}" is already registered` };
        }
      }
    }

    return null;
  };

  const duplicateMatch = findDuplicateVisa();
  
  // Attachments state
  const [passportAttachment, setPassportAttachment] = useState<string | undefined>(editingVisa?.passportAttachment);
  const [passportFileName, setPassportFileName] = useState<string | undefined>(editingVisa?.passportFileName);
  const [visaAttachment, setVisaAttachment] = useState<string | undefined>(editingVisa?.visaAttachment);
  const [visaFileName, setVisaFileName] = useState<string | undefined>(editingVisa?.visaFileName);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const passportInputRef = useRef<HTMLInputElement | null>(null);
  const visaInputRef = useRef<HTMLInputElement | null>(null);

  const handleCategoryChange = (newCategory: string) => {
    setVisaCategory(newCategory);
    if (entryDate && entryDate !== 'N/A') {
      const calculatedExpiry = calculateVisaExpiryDate(entryDate, newCategory);
      if (calculatedExpiry) {
        setExpiryDate(calculatedExpiry);
      }
    }
  };

  const handleEntryDateChange = (newEntryDate: string) => {
    setEntryDate(newEntryDate);
    if (newEntryDate && newEntryDate !== 'N/A') {
      const calculatedExpiry = calculateVisaExpiryDate(newEntryDate, visaCategory);
      if (calculatedExpiry) {
        setExpiryDate(calculatedExpiry);
      }
    }
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for native date picker input helper
  const getNativeEntryDate = (): string => {
    if (!entryDate || entryDate === 'N/A') return '';
    const parts = entryDate.trim().split(/[/.-]/);
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  const handleNativeEntryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split('-');
      const formatted = `${d}/${m}/${y}`;
      handleEntryDateChange(formatted);
    }
  };

  const handleFileUpload = async (file: File, docType: 'passport' | 'visa') => {
    if (!file) return;

    if (docType === 'passport') {
      setPassportFileName(file.name);
    } else {
      setVisaFileName(file.name);
    }
    setScanStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (docType === 'passport') {
        setPassportAttachment(dataUrl);
      } else {
        setVisaAttachment(dataUrl);
      }

      // Call API to parse document
      setIsScanning(true);
      try {
        const response = await fetch('/api/parse-passport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: dataUrl,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const {
            lastName: extractedLast,
            firstName: extractedFirst,
            passportNo: extractedPass,
            passportExpiry: extractedExp,
            nationality: extractedNat,
            dateOfBirth: extractedDob,
            unifiedNumber: extractedUid,
            icpFileNo: extractedFileNo,
            entryDate: extractedEntry,
            expiryDate: extractedExpiry,
            visaCategory: extractedCat,
            status: extractedStatus
          } = result.data;
          
          const newLast = extractedLast ? extractedLast.toUpperCase() : lastName;
          const newFirst = extractedFirst ? extractedFirst.toUpperCase() : firstName;
          const newPass = extractedPass ? extractedPass.toUpperCase() : passportNo;
          const newExp = extractedExp || passportExpiry;
          const newNat = extractedNat ? extractedNat.toUpperCase() : nationality;
          const newDob = extractedDob || dob;
          const newUid = extractedUid || unifiedNumber;
          const newFileNo = extractedFileNo || icpFileNo;
          const newEntry = extractedEntry || entryDate;
          let newExpiry = extractedExpiry || expiryDate;
          const newCat = extractedCat || visaCategory;
          let newStatusVal = extractedStatus || status;

          if (extractedLast) setLastName(newLast);
          if (extractedFirst) setFirstName(newFirst);
          if (extractedPass) setPassportNo(newPass);
          if (extractedExp) setPassportExpiry(newExp);
          if (extractedNat) setNationality(newNat);
          if (extractedDob) setDob(newDob);
          if (extractedUid) setUnifiedNumber(newUid);
          if (extractedFileNo) setIcpFileNo(newFileNo);
          if (extractedEntry) setEntryDate(newEntry);
          if (extractedExpiry) setExpiryDate(newExpiry);
          if (extractedCat) setVisaCategory(newCat);

          // Trigger automated ICP validity verification
          try {
            const checkRes = await fetch('/api/check-visa-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                passportNo: newPass,
                passportExpiry: newExp,
                nationality: newNat,
                dob: newDob,
                unifiedNumber: newUid,
                visaCategory: newCat,
                entryDate: newEntry,
                expiryDate: newExpiry,
                currentStatus: newStatusVal,
                icpFileNo: newFileNo,
              }),
            });
            const checkJson = await checkRes.json();
            if (checkJson.success && checkJson.data) {
              if (checkJson.data.calculatedExpiryDate) {
                newExpiry = checkJson.data.calculatedExpiryDate;
                setExpiryDate(newExpiry);
              }
              if (checkJson.data.recommendedStatus) {
                newStatusVal = checkJson.data.recommendedStatus;
                setStatus(newStatusVal as VisaStatus);
              }
            }
          } catch (e) {
            console.warn('Auto validity check failed silently', e);
          }

          setScanStatus({
            type: 'success',
            message: `Extracted & Verified with ICP Rules: Expiry Date = ${newExpiry || 'Calculated'}, Status = ${newStatusVal || 'Set'} (UID: ${newUid || 'N/A'}, Passport: ${newPass || 'N/A'})`,
          });
        } else if (result.isQuotaExceeded || response.status === 429) {
          setScanStatus({
            type: 'error',
            message: '⚠️ Document attached successfully! (AI rate limit reached — please fill or confirm details manually below).',
          });
        } else {
          setScanStatus({
            type: 'error',
            message: result.error || 'Could not parse document details automatically. Document attached! Please verify fields manually.',
          });
        }
      } catch (err: any) {
        console.error('Scan error:', err);
        setScanStatus({
          type: 'error',
          message: '⚠️ Document attached successfully! AI parser temporary rate limit reached — please enter fields manually.',
        });
      } finally {
        setIsScanning(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0], 'passport');
    }
  };

  const handleVisaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0], 'visa');
    }
  };

  const handleRemovePassportAttachment = () => {
    setPassportAttachment(undefined);
    setPassportFileName(undefined);
    setScanStatus(null);
    if (passportInputRef.current) {
      passportInputRef.current.value = '';
    }
  };

  const handleRemoveVisaAttachment = () => {
    setVisaAttachment(undefined);
    setVisaFileName(undefined);
    setScanStatus(null);
    if (visaInputRef.current) {
      visaInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (duplicateMatch && !overrideDuplicate) {
      setShowDuplicateError(true);
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-GB');

    const numPurchasing = purchasingPrice ? parseFloat(purchasingPrice) : undefined;
    const numSelling = sellingPrice ? parseFloat(sellingPrice) : undefined;

    if (editingVisa && onUpdateVisa) {
      onUpdateVisa({
        ...editingVisa,
        lastName: lastName.toUpperCase(),
        firstName: firstName.toUpperCase(),
        passportNo: passportNo.toUpperCase(),
        passportExpiry,
        nationality: nationality.toUpperCase() || undefined,
        destinationCountry: destinationCountry.trim() || 'United Arab Emirates (UAE)',
        unifiedNumber: unifiedNumber || undefined,
        dob: dob || undefined,
        visaCategory,
        entryDate,
        expiryDate,
        status: (status as VisaStatus) || 'Not Confirmed',
        customer,
        customerType,
        remarks,
        supplier: supplier.trim() || undefined,
        purchasingPrice: !isNaN(numPurchasing as number) ? numPurchasing : undefined,
        sellingPrice: !isNaN(numSelling as number) ? numSelling : undefined,
        paymentStatus: paymentStatus || 'Pending',
        currency: currency || 'AED',
        passportAttachment,
        passportFileName,
        visaAttachment,
        visaFileName,
        icpFileNo: icpFileNo || undefined,
      });
    } else {
      const newVisa: VisaFollowup = {
        id: `v-${Date.now()}`,
        submissionDate: todayStr,
        lastName: lastName.toUpperCase() || 'SURNAME',
        firstName: firstName.toUpperCase() || 'FIRSTNAME',
        passportNo: passportNo.toUpperCase() || `P0${Math.floor(100000 + Math.random() * 900000)}`,
        passportExpiry: passportExpiry || 'N/A',
        nationality: nationality.toUpperCase() || 'SRI LANKAN',
        destinationCountry: destinationCountry.trim() || 'United Arab Emirates (UAE)',
        unifiedNumber: unifiedNumber || undefined,
        dob: dob || undefined,
        visaCategory: visaCategory,
        entryDate: entryDate || 'N/A',
        expiryDate: expiryDate || 'N/A',
        status: (status as VisaStatus) || 'Not Confirmed',
        customer: customer.trim() || 'Seagull Global',
        customerType: customerType,
        remarks: remarks,
        supplier: supplier.trim() || undefined,
        purchasingPrice: !isNaN(numPurchasing as number) ? numPurchasing : undefined,
        sellingPrice: !isNaN(numSelling as number) ? numSelling : undefined,
        paymentStatus: paymentStatus || 'Pending',
        currency: currency || 'AED',
        passportAttachment,
        passportFileName,
        visaAttachment,
        visaFileName,
        icpFileNo: icpFileNo || undefined,
        createdAt: new Date().toISOString()
      };
      onAddVisa(newVisa);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto my-8">
        
        <div className="bg-[#0088CC] text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <h3 className="text-sm font-bold">
              {editingVisa ? 'Edit Visa Application' : 'Add New Visa Application'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Duplicate Visa Application Warning Banner */}
          {duplicateMatch && (
            <div className={`p-4 rounded-xl border-2 space-y-2.5 transition-all ${
              showDuplicateError 
                ? 'bg-red-50 border-red-500 text-red-900 shadow-md ring-2 ring-red-200' 
                : 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 font-extrabold text-xs uppercase tracking-wide">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${showDuplicateError ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={showDuplicateError ? 'text-red-700' : 'text-amber-900'}>
                    ⚠️ Duplicate Visa Record Detected!
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  showDuplicateError ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  Duplicate Blocked
                </span>
              </div>

              <div className="text-xs font-medium space-y-1.5 pl-7">
                <p className="font-bold text-slate-800">
                  {duplicateMatch.reason}. An existing visa application already exists:
                </p>
                
                <div className="bg-white/90 p-3 rounded-lg border border-slate-300 space-y-1 text-[11px] font-sans shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Applicant Name:</span>
                    <span className="font-extrabold text-slate-900">
                      {duplicateMatch.visa.firstName} {duplicateMatch.visa.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Passport Number:</span>
                    <span className="font-mono font-bold text-blue-700">{duplicateMatch.visa.passportNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Customer / Agency:</span>
                    <span className="font-bold text-slate-800">{duplicateMatch.visa.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Visa Category:</span>
                    <span className="font-semibold text-slate-800">{duplicateMatch.visa.visaCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Current Status:</span>
                    <span className="font-bold text-emerald-700">{duplicateMatch.visa.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pl-7">
                <span className="text-[10px] text-slate-600 font-medium">
                  System prevents duplicate visa applications. Please view existing record or check override box if intentional.
                </span>
                {onOpenExistingVisa && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenExistingVisa(duplicateMatch.visa);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View / Edit Existing Visa</span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Document Attachments & AI Auto-fill Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Attach Documents (Passport & Visa)</span>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Auto-Extracts Details</span>
                </span>
              </label>
            </div>

            <input
              type="file"
              ref={passportInputRef}
              onChange={handlePassportFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            <input
              type="file"
              ref={visaInputRef}
              onChange={handleVisaFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Passport Copy Attachment Box */}
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Passport Copy</span>
                  </span>
                  {passportAttachment && (
                    <button
                      type="button"
                      onClick={handleRemovePassportAttachment}
                      className="text-red-600 hover:text-red-700 font-semibold text-[10px] flex items-center space-x-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {!passportAttachment ? (
                  <div
                    onClick={() => passportInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0], 'passport');
                      }
                    }}
                    className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-lg p-2 text-center cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-blue-700 text-[11px]">Click or Drop Passport</p>
                    <p className="text-[9px] text-slate-400">JPG, PNG, PDF</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                    {passportAttachment.startsWith('data:image') ? (
                      <img src={passportAttachment} alt="Passport" className="w-9 h-9 object-cover rounded shrink-0" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-[10px] truncate">{passportFileName || 'Passport_Copy.png'}</p>
                      <span className="text-[9px] text-emerald-600 font-semibold">Attached</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => passportInputRef.current?.click()}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[9px] font-semibold"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Visa Document Copy Attachment Box */}
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Visa / E-Visa Copy</span>
                  </span>
                  {visaAttachment && (
                    <button
                      type="button"
                      onClick={handleRemoveVisaAttachment}
                      className="text-red-600 hover:text-red-700 font-semibold text-[10px] flex items-center space-x-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {!visaAttachment ? (
                  <div
                    onClick={() => visaInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0], 'visa');
                      }
                    }}
                    className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 rounded-lg p-2 text-center cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-purple-700 text-[11px]">Click or Drop Visa Document</p>
                    <p className="text-[9px] text-slate-400">JPG, PNG, PDF</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                    {visaAttachment.startsWith('data:image') ? (
                      <img src={visaAttachment} alt="Visa Doc" className="w-9 h-9 object-cover rounded shrink-0" />
                    ) : (
                      <FileText className="w-6 h-6 text-purple-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-[10px] truncate">{visaFileName || 'Visa_Document.png'}</p>
                      <span className="text-[9px] text-purple-600 font-semibold">Attached</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => visaInputRef.current?.click()}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[9px] font-semibold"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scanning / Result status */}
            {isScanning && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2 text-blue-700 font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span>Extracting passport & visa details using Gemini AI...</span>
              </div>
            )}

            {scanStatus && (
              <div className={`p-2 border rounded-lg flex items-center space-x-2 ${
                scanStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {scanStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="font-medium text-[11px] leading-tight">{scanStatus.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. WEDIKKARA SAGARIKA"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. ANURADI SILVA"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Passport No.</label>
              <input
                type="text"
                value={passportNo}
                onChange={(e) => setPassportNo(e.target.value)}
                placeholder="e.g. P0220820"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono uppercase font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Passport Expiry (Optional)</label>
              <input
                type="text"
                value={passportExpiry}
                onChange={(e) => setPassportExpiry(e.target.value)}
                placeholder="21/02/2035 or leave blank"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Additional Person / Visa Identifiers: Nationality, Date of Birth, Unified Number & ICP File No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nationality / Citizenship</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. SRI LANKAN, INDIAN"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Person Date of Birth (DD/MM/YYYY)</label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="e.g. 15/08/1992"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Visa Unified Number (UID / UDB)</label>
              <input
                type="text"
                value={unifiedNumber}
                onChange={(e) => setUnifiedNumber(e.target.value)}
                placeholder="e.g. 123456789"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-purple-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ICP Application / Visa File No.</label>
              <input
                type="text"
                value={icpFileNo}
                onChange={(e) => setIcpFileNo(e.target.value)}
                placeholder="e.g. 201/2025/1/123456"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Processing Visa Country & Visa Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Processing Visa Country <span className="text-red-500">*</span>
              </label>
              <div className="space-y-1.5">
                <select
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="United Arab Emirates (UAE)">🇦🇪 United Arab Emirates (UAE)</option>
                  <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                  <option value="Qatar">🇶🇦 Qatar</option>
                  <option value="Oman">🇴🇲 Oman</option>
                  <option value="Kuwait">🇰🇼 Kuwait</option>
                  <option value="Bahrain">🇧🇭 Bahrain</option>
                  <option value="Malaysia">🇲🇾 Malaysia</option>
                  <option value="Singapore">🇸🇬 Singapore</option>
                  <option value="Thailand">🇹🇭 Thailand</option>
                  <option value="Turkey">🇹🇷 Turkey</option>
                  <option value="Schengen / Europe">🇪🇺 Schengen / Europe</option>
                  <option value="United Kingdom (UK)">🇬🇧 United Kingdom (UK)</option>
                  <option value="United States (USA)">🇺🇸 United States (USA)</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
                </select>
                <div className="flex flex-wrap gap-1">
                  {['United Arab Emirates (UAE)', 'Saudi Arabia', 'Qatar', 'Oman', 'Kuwait', 'Malaysia'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDestinationCountry(c)}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        destinationCountry === c ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Visa Category</label>
              <select
                value={visaCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {VISA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {VISA_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer border ${
                      visaCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Visa Application Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VisaStatus | '')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Skip / Default (Not Confirmed) --</option>
                <option value="In Process">⏳ In Process (Orange)</option>
                <option value="Posted">📩 Posted (Light Blue)</option>
                <option value="Documents Required">📄 Documents Required (Purple)</option>
                <option value="Approved">✅ Approved (Green)</option>
                <option value="Extended">🔄 Extended (Blue)</option>
                <option value="Used">🛬 Used (Teal)</option>
                <option value="Rejected">❌ Rejected (Red)</option>
                <option value="Cancelled">🚫 Cancelled (Slate)</option>
                <option value="Refund">💰 Refund (Purple)</option>
                <option value="Closed">🔒 Closed (Navy)</option>
                <option value="OutPass">🎫 OutPass (Gray)</option>
                <option value="Not Confirmed">❓ Not Confirmed (Gray)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Entry Date (DD/MM/YYYY)</label>
                <div className="relative inline-block text-[10px]">
                  <input
                    type="date"
                    value={getNativeEntryDate()}
                    onChange={handleNativeEntryDateChange}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    title="Select date with calendar"
                  />
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                  >
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Picker</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={entryDate}
                onChange={(e) => handleEntryDateChange(e.target.value)}
                placeholder="Select date or leave empty"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Visa Expiry Date</label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Auto +{getVisaDurationDays(visaCategory)} Days</span>
                </span>
              </div>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="Select date or leave empty"
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg p-2 font-mono text-emerald-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>


          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Primary Account / Entity Option</span>
              </label>
              <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCustomerType('Agency')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                    customerType === 'Agency'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>Agency (B2B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('Customer')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
                    customerType === 'Customer'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Direct Customer (B2C)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {customerType === 'Agency' ? 'Agency Name' : 'Direct Customer / Traveller Name'}
              </label>
              <input
                type="text"
                list="visa-recorded-agencies"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder={customerType === 'Agency' ? 'Select or type Agency name (e.g. Seagull Global)' : 'Select or type Customer name'}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="visa-recorded-agencies">
                {(recordedAgencies && recordedAgencies.length > 0
                  ? recordedAgencies
                  : ['Seagull Global', 'Royal Horizon Agency', 'Al Safa Travels', 'Skyline Tours', 'Global Travel Hub', 'Direct Customer (Walk-in)']
                ).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Quick Selection Buttons for Recorded Names */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Recorded Names:</span>
              {(recordedAgencies && recordedAgencies.length > 0
                ? recordedAgencies
                : ['Seagull Global', 'Royal Horizon Agency', 'Al Safa Travels', 'Skyline Tours', 'Global Travel Hub']
              ).slice(0, 8).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCustomer(name)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                    customer === name
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Supplier & Financial Details */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 rounded-xl border border-blue-200/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-md bg-blue-600 text-white">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                  Supplier & Financial Billing
                </h4>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                Cost & Profit Tracking
              </span>
            </div>

            {/* Supplier Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center space-x-1">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  <span>Supplier Name / Issuing Provider</span>
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">e.g. Musafir, Rayna Tours, Direct ICP</span>
              </div>
              <input
                type="text"
                list="visa-recorded-suppliers"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Enter or select supplier (e.g. Musafir B2B, Rayna Tours, Regal Travel)"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="visa-recorded-suppliers">
                <option value="Musafir B2B" />
                <option value="Rayna Tours" />
                <option value="Regal Travel" />
                <option value="Deira Travel" />
                <option value="Al Rostamani" />
                <option value="Direct ICP / GDRFA Portal" />
                <option value="AeroConnect Ltd" />
                <option value="Travelwings" />
                <option value="Global Visa Services" />
              </datalist>

              {/* Quick Supplier Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Quick Pick:</span>
                {['Musafir B2B', 'Rayna Tours', 'Regal Travel', 'Direct ICP Portal', 'Deira Travel'].map((sup) => (
                  <button
                    key={sup}
                    type="button"
                    onClick={() => setSupplier(sup)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                      supplier === sup
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    {sup}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchasing Price, Selling Price & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="LKR">LKR (Sri Lankan Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="SAR">SAR (Saudi Riyal)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Purchasing Price (Cost)</label>
                  <span className="text-[10px] text-slate-400 font-mono">Net Cost</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 font-mono font-bold text-slate-400 text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={purchasingPrice}
                    onChange={(e) => setPurchasingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 pl-12 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Selling Price</label>
                  <span className="text-[10px] text-slate-400 font-mono">Client Rate</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 font-mono font-bold text-slate-400 text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 pl-12 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Profit Margin Calculation Banner */}
            {(purchasingPrice || sellingPrice) && (
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-600 font-semibold">Estimated Margin / Profit:</span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className={`font-extrabold ${
                    ((parseFloat(sellingPrice) || 0) - (parseFloat(purchasingPrice) || 0)) >= 0
                      ? 'text-emerald-700'
                      : 'text-red-600'
                  }`}>
                    {currency} {((parseFloat(sellingPrice) || 0) - (parseFloat(purchasingPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {parseFloat(purchasingPrice) > 0 && parseFloat(sellingPrice) > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ((parseFloat(sellingPrice) || 0) - (parseFloat(purchasingPrice) || 0)) >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {((((parseFloat(sellingPrice) || 0) - (parseFloat(purchasingPrice) || 0)) / (parseFloat(purchasingPrice) || 1)) * 100).toFixed(1)}% Margin
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Payment Status Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center space-x-1">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <span>Payment Status</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Paid')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Paid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pending')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border ${
                    paymentStatus === 'Pending'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                      : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('Partially Paid')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border ${
                    paymentStatus === 'Partially Paid'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-200'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-300'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Partially Paid</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Remarks / Internal Note</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Extension approved for 60 additional days."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {duplicateMatch && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideDuplicate}
                  onChange={(e) => {
                    setOverrideDuplicate(e.target.checked);
                    if (e.target.checked) setShowDuplicateError(false);
                  }}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Allow adding duplicate application anyway (Override System Safety)</span>
              </label>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScanning}
              className={`px-5 py-2 font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1 cursor-pointer text-white ${
                duplicateMatch && !overrideDuplicate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300'
              }`}
            >
              {isScanning && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {duplicateMatch && !overrideDuplicate
                  ? 'Blocked (Duplicate Record Found)'
                  : editingVisa
                  ? 'Update Visa Record'
                  : 'Save Visa Entry'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

