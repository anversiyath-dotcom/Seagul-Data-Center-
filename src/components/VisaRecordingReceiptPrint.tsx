import React, { useRef } from 'react';
import { VisaFollowup, CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../types';
import { 
  MapPin, Phone, Mail, FileText, Globe, ShieldCheck, 
  User, Calendar, CreditCard, Hash, CheckCircle2, Clock, AlertCircle,
  Camera, Upload, Trash2
} from 'lucide-react';
import { SeagullLogo } from './SeagullLogo';
import { TicketQrCode } from './TicketQrCode';
import { normalizeToFullDate } from '../utils/imageUrlHelpers';
import { getNationalityFlag } from '../data/nationalities';

interface VisaRecordingReceiptPrintProps {
  visa: VisaFollowup;
  companyProfile?: CompanyProfile;
  onUpdateVisa?: (updatedVisa: VisaFollowup) => void;
}

export const VisaRecordingReceiptPrint: React.FC<VisaRecordingReceiptPrintProps> = ({
  visa,
  companyProfile = DEFAULT_COMPANY_PROFILE,
  onUpdateVisa
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const negomboAddress = companyProfile.negomboAddress || '45/1/1 Meerigama Road, Pankada junction , Negombo';
  const negomboPhone = companyProfile.negomboPhone || '+94 70 170 4613';
  const dubaiAddress = companyProfile.dubaiAddress || 'Coastal building , Al tawar center Dubai';
  const dubaiPhone = companyProfile.dubaiPhone || '+971 52 263 6372';
  const companyEmail = companyProfile.email || 'Info@seagullglobal.com';

  const receiptNo = `VR-${(visa.passportNo || '00000').slice(-5).toUpperCase()}-${(visa.id || '000').slice(-4).toUpperCase()}`;
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const submissionDateFormatted = normalizeToFullDate(visa.submissionDate) || visa.submissionDate || 'Recorded';
  const applicantFullName = `${visa.lastName || ''} ${visa.firstName || ''}`.trim() || 'Valued Customer';
  const curr = visa.currency || 'AED';
  const feeAmount = typeof visa.sellingPrice === 'number' ? visa.sellingPrice : 0;
  const paymentStatus = visa.paymentStatus || 'Pending';

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (onUpdateVisa) {
        onUpdateVisa({
          ...visa,
          photoAttachment: base64,
          photoFileName: file.name
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove applicant photo from this visa receipt?')) {
      if (onUpdateVisa) {
        onUpdateVisa({
          ...visa,
          photoAttachment: undefined,
          photoFileName: undefined
        });
      }
    }
  };

  // Group members if group visa
  const groupMembers = visa.groupMembers && visa.groupMembers.length > 0 ? visa.groupMembers : null;
  const totalApplicantsCount = groupMembers ? groupMembers.length + 1 : (visa.groupSize || 1);

  const qrValue = `SEAGULL-VISA-REC:${receiptNo}|PAX:${applicantFullName}|PASS:${visa.passportNo}|STATUS:${visa.status}`;

  return (
    <div 
      id="printable-visa-receipt"
      className="bg-white text-slate-900 font-sans p-6 sm:p-8 max-w-4xl mx-auto border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 flex flex-col justify-between relative overflow-hidden"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', minHeight: '1020px' }}
    >
      <div>
        {/* ================= 1. HEADER & BRAND LETTERHEAD ================= */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
          {/* Top Left: Logo stacked */}
          <div className="shrink-0 flex items-start">
            <SeagullLogo size="md" variant="stacked" />
          </div>

          {/* Top Right: Corporate Offices & Contact */}
          <div className="space-y-1.5 text-[11px] text-slate-700 text-right self-end sm:self-auto max-w-lg">
            {/* Negombo Branch */}
            <div className="flex items-center justify-end gap-2">
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="font-extrabold uppercase tracking-wide">NEGOMBO:</span>
              </div>
              <span className="text-slate-600">{negomboAddress}</span>
              <span className="font-bold text-slate-900 font-mono shrink-0 ml-1">
                {negomboPhone}
              </span>
            </div>

            {/* Dubai Branch */}
            <div className="flex items-center justify-end gap-2">
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="font-extrabold uppercase tracking-wide">DUBAI:</span>
              </div>
              <span className="text-slate-600">{dubaiAddress}</span>
              <span className="font-bold text-slate-900 font-mono shrink-0 ml-1">
                {dubaiPhone}
              </span>
            </div>

            {/* Email & Web */}
            <div className="flex items-center justify-end gap-2 text-slate-500 font-medium pt-0.5">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{companyEmail}</span>
              <span>•</span>
              <span className="font-semibold text-blue-700">www.seagullglobal.com</span>
            </div>
          </div>
        </div>

        {/* ================= 2. RECEIPT TITLE & META BANNER ================= */}
        <div className="my-4 bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-blue-500 text-[10px] font-black uppercase tracking-wider rounded">
                Official Document
              </span>
              <span className="text-xs text-slate-300">Customer Reference Copy</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1 uppercase">
              Visa Recording & Application Receipt
            </h1>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="border-r border-slate-700 pr-4">
              <div className="text-[10px] uppercase font-bold text-slate-400">Receipt Ref #</div>
              <div className="font-mono text-sm sm:text-base font-black text-blue-300 tracking-wider">
                {receiptNo}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Date of Issue</div>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-200">
                {printDate}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. PRIMARY APPLICANT & VISA DETAILS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          
          {/* Card A: Passenger / Applicant Details & Photo */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Passenger / Applicant Information
                  </h3>
                </div>
                {onUpdateVisa && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="no-print inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                    title="Upload applicant passport-size photo"
                  >
                    <Camera className="w-3 h-3 text-blue-600" />
                    <span>{visa.photoAttachment ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                )}
              </div>

              {/* Photo + Details row */}
              <div className="flex gap-3.5 items-start">
                {/* Applicant Photo Frame */}
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    onClick={() => onUpdateVisa && fileInputRef.current?.click()}
                    className={`relative w-24 h-32 rounded-lg border-2 ${
                      visa.photoAttachment 
                        ? 'border-slate-300 bg-slate-100' 
                        : 'border-dashed border-slate-300 bg-white hover:bg-slate-50'
                    } overflow-hidden shadow-2xs flex flex-col items-center justify-center cursor-pointer group transition-all`}
                    title={onUpdateVisa ? "Click to upload / change applicant photo" : "Applicant Photo"}
                  >
                    {visa.photoAttachment ? (
                      <>
                        <img 
                          src={visa.photoAttachment} 
                          alt={`${applicantFullName} Photo`} 
                          className="w-full h-full object-cover"
                        />
                        {onUpdateVisa && (
                          <div className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold transition-opacity p-1 text-center">
                            <Camera className="w-4 h-4 mb-0.5" />
                            <span>Change</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-2 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center mb-1 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 leading-tight">
                          Photo
                        </span>
                        <span className="text-[7.5px] text-slate-400 mt-0.5">
                          35 × 45 mm
                        </span>
                        {onUpdateVisa && (
                          <span className="no-print text-[8px] text-blue-600 font-semibold mt-1 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                            Upload
                          </span>
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </div>

                  <span className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-wider mt-1 text-center">
                    Applicant Photo
                  </span>

                  {visa.photoAttachment && onUpdateVisa && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="no-print mt-0.5 text-[8.5px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Information Fields */}
                <div className="flex-1 space-y-1.5 text-xs min-w-0">
                  <div className="flex flex-col pb-1 border-b border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium">Full Name:</span>
                    <span className="font-extrabold text-slate-900 uppercase font-sans text-sm truncate" title={applicantFullName}>
                      {applicantFullName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Passport No:</span>
                    <span className="font-mono font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {visa.passportNo}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Passport Expiry:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {visa.passportExpiry || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Nationality:</span>
                    <span className="font-bold text-slate-800 truncate flex items-center space-x-1">
                      <span>{getNationalityFlag(visa.nationality)}</span>
                      <span>{visa.nationality || 'SRI LANKAN'}</span>
                    </span>
                  </div>

                  {visa.dob && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Date of Birth:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {normalizeToFullDate(visa.dob)}
                      </span>
                    </div>
                  )}

                  {visa.customer && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium truncate">Sponsor / Agency:</span>
                      <span className="font-bold text-slate-800 truncate" title={visa.customer}>
                        {visa.customer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Visa Processing & Official Tracking Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-3">
              <Globe className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Visa Application & ICP Tracking
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Destination Country:</span>
                <span className="font-extrabold text-slate-900">
                  {visa.destinationCountry || 'United Arab Emirates (UAE)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {visa.branch === 'Dubai' ? 'Service / Category:' : 'Visa Category:'}
                </span>
                <span className="font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-xs">
                  {visa.visaCategory}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Submission Date:</span>
                <span className="font-mono font-bold text-slate-800">
                  {submissionDateFormatted}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">UID (Unified Number):</span>
                <span className="font-mono font-black text-purple-700">
                  {visa.unifiedNumber || 'Assigned by ICP / Under Process'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">ICP File / Application Ref:</span>
                <span className="font-mono font-bold text-slate-800">
                  {visa.icpFileNo || 'Assigned upon ICP submission'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-xs inline-flex items-center gap-1 ${
                  visa.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : visa.status === 'In Process'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {visa.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {visa.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4. GROUP APPLICANTS BREAKDOWN (IF GROUP) ================= */}
        {groupMembers && groupMembers.length > 0 && (
          <div className="mb-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Group Booking Manifest ({totalApplicantsCount} Total Applicants)
              </h3>
              <span className="text-[11px] font-mono font-bold text-blue-700">
                Group Ref: {visa.groupName || receiptNo}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Applicant Name</th>
                    <th className="py-2 px-3 font-mono">Passport No</th>
                    <th className="py-2 px-3 font-mono">Passport Expiry</th>
                    <th className="py-2 px-3">Nationality</th>
                    <th className="py-2 px-3 font-mono">UID / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {/* Lead Applicant */}
                  <tr className="bg-blue-50/30 font-medium">
                    <td className="py-2 px-3 font-bold text-blue-600">1 (Lead)</td>
                    <td className="py-2 px-3 font-bold">{applicantFullName}</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-800">{visa.passportNo}</td>
                    <td className="py-2 px-3 font-mono">{visa.passportExpiry || 'N/A'}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center space-x-1">
                        <span>{getNationalityFlag(visa.nationality)}</span>
                        <span>{visa.nationality || 'SRI LANKAN'}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">{visa.unifiedNumber || '-'}</td>
                  </tr>

                  {/* Other Group Members */}
                  {groupMembers.map((member, idx) => (
                    <tr key={member.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-500">{idx + 2}</td>
                      <td className="py-2 px-3 font-bold uppercase">{member.lastName} {member.firstName}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-800">{member.passportNo}</td>
                      <td className="py-2 px-3 font-mono">{member.passportExpiry || 'N/A'}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center space-x-1">
                          <span>{getNationalityFlag(member.nationality || visa.nationality)}</span>
                          <span>{member.nationality || visa.nationality || 'SRI LANKAN'}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{member.unifiedNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 5. FINANCIAL & PAYMENT STATEMENT ================= */}
        <div className="mb-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Payment & Billing Recording Summary
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Standard official fees receipt for visa documentation
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Amount */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Visa Charges</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {curr} {feeAmount > 0 ? feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <span className="text-[10px] text-slate-400">Inclusive of Government & Processing</span>
            </div>

            {/* Payment Status Pill */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment Status</span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                  paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : paymentStatus === 'Partially Paid'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {paymentStatus === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {paymentStatus}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Verified by Accounts</span>
            </div>

            {/* Balance / Terms */}
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Balance Due</span>
              <div className="text-xl font-black font-mono mt-0.5 text-slate-800">
                {paymentStatus === 'Paid' ? `${curr} 0.00` : `${curr} ${feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </div>
              <span className="text-[10px] text-slate-400">
                {paymentStatus === 'Paid' ? 'Paid in Full - No Balance' : 'Payable upon collection'}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks / Special Notes if available */}
        {visa.remarks && (
          <div className="mb-4 bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs">
            <span className="font-bold text-amber-900 block mb-0.5">Special Processing Notes / Remarks:</span>
            <p className="text-slate-700">{visa.remarks}</p>
          </div>
        )}

        {/* ================= 6. TERMS & TRAVEL ADVISORY ================= */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[10px] text-slate-600 space-y-1.5 mb-6">
          <div className="font-extrabold text-slate-800 uppercase tracking-wide flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black text-slate-900">Important Terms & Customer Conditions</span>
            </div>
            <span className="text-[9px] font-black uppercase text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded">
              Strict Non-Refundable Policy
            </span>
          </div>

          {/* Prominent Visa Rejection Non-Refundable Clause */}
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-950 text-[10.5px] leading-relaxed">
            <span className="font-black text-red-900 block mb-0.5">
              ⚠️ 1. Visa Rejection & Non-Refundable Clause:
            </span>
            <span>
              In the event of <strong>visa rejection, refusal, delay, or denial</strong> by immigration authorities (ICP / GDRFA or consular departments), all visa fees, documentation charges, and government processing costs are <strong>STRICTLY 100% NON-REFUNDABLE</strong> under any circumstances. No refunds or credit notes will be provided once the application has been lodged into the government system.
            </span>
          </div>

          <p>2. <strong>Passport Validity:</strong> Travelers must ensure their original passports have a minimum validity of six (6) months from the scheduled travel date.</p>
          <p>3. <strong>Issuance & Government Discretion:</strong> Visa issuance, verification, security clearance approvals, and authorized entry duration remain under the exclusive jurisdiction and discretion of the host country's immigration authorities.</p>
          <p>4. <strong>E-Visa Verification & Entry:</strong> Once issued, the official e-Visa copy must be printed in color and presented alongside valid return air tickets and confirmed hotel accommodation at check-in and airport immigration checkpoints.</p>
          <p>5. <strong>Overstay Rules & Penalties:</strong> Passengers must strictly adhere to the approved duration of stay. Overstaying will lead to immediate statutory daily immigration fines, absconding charges, and legal bans under host country laws.</p>
        </div>
      </div>

      {/* ================= 7. FOOTER, QR VERIFICATION & SIGNATURES ================= */}
      <div className="border-t-2 border-slate-900 pt-4 mt-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          
          {/* QR Code & Verification */}
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
              <TicketQrCode value={qrValue} size={64} />
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <div className="font-bold text-slate-800 uppercase">Verification QR</div>
              <div>Scan to verify validity & file reference</div>
              <div className="font-mono text-blue-700 font-bold">{receiptNo}</div>
            </div>
          </div>

          {/* Customer Signature Box */}
          <div className="text-center">
            <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
            <span className="text-[10px] font-bold text-slate-700 uppercase">
              Customer Signature (Terms Accepted)
            </span>
          </div>

          {/* Authorized Agency Seal Box */}
          <div className="text-center">
            <div className="h-10 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center">
              <span className="text-[9px] font-bold text-blue-900/40 uppercase tracking-widest border border-blue-900/30 px-2 py-0.5 rounded">
                SEAGULL GLOBAL OFFICIAL
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase">
              Authorized Signatory & Seal
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 flex items-center justify-between">
          <span>Seagull Global Travel & Tourism Workflow System</span>
          <span>Computer-Generated Customer Recording Receipt • Valid without manual alteration</span>
          <span className="font-mono">Ref: {visa.id}</span>
        </div>
      </div>
    </div>
  );
};
