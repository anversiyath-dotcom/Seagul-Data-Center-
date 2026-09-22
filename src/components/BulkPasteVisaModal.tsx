import React, { useState, useMemo } from 'react';
import { X, ClipboardList, Check, AlertCircle, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { parsePassportMRZ } from '../utils/imageUrlHelpers';

export interface GroupApplicantItem {
  id: string;
  lastName: string;
  firstName: string;
  passportNo: string;
  passportExpiry: string;
  nationality: string;
  dob?: string;
  unifiedNumber?: string;
  icpFileNo?: string;
  passportAttachment?: string;
  passportFileName?: string;
}

interface BulkPasteVisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultNationality?: string;
  onApplyApplicants: (applicants: GroupApplicantItem[]) => void;
}

export const BulkPasteVisaModal: React.FC<BulkPasteVisaModalProps> = ({
  isOpen,
  onClose,
  defaultNationality = 'SRI LANKAN',
  onApplyApplicants,
}) => {
  const [pasteText, setPasteText] = useState('');

  // Parser helper function
  const parsedApplicants = useMemo<GroupApplicantItem[]>(() => {
    if (!pasteText.trim()) return [];

    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result: GroupApplicantItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      // 1. Check for 2-line Passport MRZ (starts with P<)
      if (
        (rawLine.startsWith('P<') || (rawLine.startsWith('P') && rawLine.includes('<') && rawLine.length >= 35)) &&
        i + 1 < lines.length &&
        lines[i + 1].length >= 35
      ) {
        const mrz = parsePassportMRZ(`${rawLine}\n${lines[i + 1]}`);
        if (mrz) {
          result.push({
            id: `app-bulk-${Date.now()}-${result.length + 1}`,
            lastName: (mrz.lastName || 'SURNAME').toUpperCase(),
            firstName: (mrz.firstName || 'FIRSTNAME').toUpperCase(),
            passportNo: (mrz.passportNo || '').toUpperCase(),
            passportExpiry: mrz.expiryDate || 'N/A',
            nationality: (mrz.nationality || defaultNationality).toUpperCase(),
            dob: mrz.dateOfBirth || '',
            unifiedNumber: '',
            icpFileNo: '',
          });
          i++; // Skip second MRZ line
          continue;
        }
      }

      // 2. Remove leading numberings: "1.", "1)", "1 -", "#1", "[1]"
      const cleanedLine = rawLine.replace(/^(?:#|\[)?\d+(?:[\.\)\-\:\s\]])\s*/, '');

      // Split by tab, comma, pipe, or dash with surrounding spaces
      let tokens = cleanedLine
        .split(/\t+|,\s*|\|\s*|\s+-\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

      // If only 1 token, fallback to whitespace separation
      if (tokens.length === 1) {
        tokens = cleanedLine.split(/\s+/).filter(Boolean);
      }

      let extractedLast = '';
      let extractedFirst = '';
      let extractedPass = '';
      let extractedExp = '';
      let extractedNat = defaultNationality;
      let extractedDob = '';

      const nameTokens: string[] = [];

      for (const tok of tokens) {
        const cleanTok = tok.replace(/[^A-Za-z0-9\/\-\.]/g, '').trim();

        // A. Check for Date: DD/MM/YYYY or DD-MM-YYYY
        const dateMatch = cleanTok.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dateMatch) {
          let [_, d, m, y] = dateMatch;
          d = d.padStart(2, '0');
          m = m.padStart(2, '0');
          if (y.length === 2) y = `20${y}`;
          const formattedDate = `${d}/${m}/${y}`;
          if (!extractedExp) {
            extractedExp = formattedDate;
          } else if (!extractedDob) {
            extractedDob = formattedDate;
          }
          continue;
        }

        // B. Check for Passport: 6-12 chars, usually starts with letter followed by numbers or digits
        const passMatch = cleanTok.match(/^[A-Za-z][0-9A-Za-z]{5,10}$/i) || cleanTok.match(/^[0-9]{7,10}$/);
        if (passMatch && !extractedPass) {
          extractedPass = cleanTok.toUpperCase();
          continue;
        }

        // C. Check for known Nationalities
        const upperTok = tok.toUpperCase();
        if (
          ['SRI LANKAN', 'INDIAN', 'PAKISTANI', 'BANGLADESHI', 'FILIPINO', 'NEPALESE', 'INDONESIAN', 'MALAYSIAN', 'EMIRATI', 'SAUDI', 'EGYPTIAN', 'BRITISH', 'AMERICAN'].some(
            (nat) => upperTok.includes(nat)
          )
        ) {
          extractedNat = upperTok;
          continue;
        }

        // D. Otherwise, treat as name component
        nameTokens.push(tok);
      }

      // Process Name Tokens
      if (nameTokens.length > 0) {
        const fullName = nameTokens.join(' ').replace(/[/\\,-]+/g, '/').trim();
        if (fullName.includes('/')) {
          const [l, f] = fullName.split('/').map((s) => s.trim());
          extractedLast = (l || '').toUpperCase();
          extractedFirst = (f || '').toUpperCase();
        } else {
          const parts = fullName.split(/\s+/);
          if (parts.length === 1) {
            extractedLast = parts[0].toUpperCase();
            extractedFirst = '';
          } else {
            extractedLast = parts[0].toUpperCase();
            extractedFirst = parts.slice(1).join(' ').toUpperCase();
          }
        }
      }

      // Only add if at least a name or passport was found
      if (extractedPass || extractedLast || extractedFirst) {
        result.push({
          id: `app-bulk-${Date.now()}-${result.length + 1}-${Math.floor(Math.random() * 1000)}`,
          lastName: extractedLast || 'SURNAME',
          firstName: extractedFirst || 'FIRSTNAME',
          passportNo: extractedPass || `P0${Math.floor(100000 + Math.random() * 900000)}`,
          passportExpiry: extractedExp || 'N/A',
          nationality: extractedNat.toUpperCase() || defaultNationality,
          dob: extractedDob || '',
          unifiedNumber: '',
          icpFileNo: '',
        });
      }
    }

    return result;
  }, [pasteText, defaultNationality]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedApplicants.length > 0) {
      onApplyApplicants(parsedApplicants);
      onClose();
      setPasteText('');
    }
  };

  const handleInsertSample = () => {
    const sample = `1. PERERA / SUNIL, N1234567, 12/05/2030, SRI LANKAN
2. PERERA / KUMARI, N7654321, 15/08/2029, SRI LANKAN
3. PERERA / KAVINDA, N9988776, 20/01/2032, SRI LANKAN
4. SILVA / ANIL, N3344556, 10/11/2028, SRI LANKAN`;
    setPasteText(sample);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-purple-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="font-bold text-sm">Bulk Paste Group Visa Applicants</h3>
              <p className="text-[11px] text-purple-200">
                Paste names & passports from Excel, Google Sheets, WhatsApp or MRZ codes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick tips & Sample button */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Supported Data Formats</span>
              </span>
              <button
                type="button"
                onClick={handleInsertSample}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                Insert Sample Data
              </button>
            </div>
            <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
              <li>
                <strong>Excel / Google Sheets:</strong> Copy cells and paste directly (columns will be tab-separated).
              </li>
              <li>
                <strong>WhatsApp / Email:</strong> e.g. <code className="bg-purple-100/70 px-1 py-0.5 rounded font-mono text-purple-900">PERERA / SUNIL, N1234567, 12/05/2030, SRI LANKAN</code>
              </li>
              <li>
                <strong>Passport MRZ:</strong> Paste 2-line machine readable zone blocks (<code className="font-mono">P&lt;LKA...</code>).
              </li>
            </ul>
          </div>

          {/* Textarea Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Paste Roster Text Below:</label>
              <span className="text-[11px] text-slate-500 font-mono">
                {pasteText.split('\n').filter((l) => l.trim()).length} lines entered
              </span>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={7}
              placeholder="Paste rows here...&#10;Example:&#10;PERERA / SUNIL, N1234567, 12/05/2030, SRI LANKAN&#10;PERERA / KUMARI, N7654321, 15/08/2029, SRI LANKAN"
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-y"
            />
          </div>

          {/* Live Parsing Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Detected Applicants Preview:</span>
              </span>
              <span
                className={`font-extrabold text-xs px-2.5 py-0.5 rounded-full ${
                  parsedApplicants.length > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {parsedApplicants.length} {parsedApplicants.length === 1 ? 'Applicant' : 'Applicants'} Detected
              </span>
            </div>

            {parsedApplicants.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
                Paste applicant rows above to preview extracted names, passports, and expiry dates.
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-2xs">
                {parsedApplicants.map((app, idx) => (
                  <div key={app.id || idx} className="p-2 px-3 flex items-center justify-between gap-2 hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-purple-100 text-purple-800 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 uppercase">
                          {app.lastName} {app.firstName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {app.nationality} {app.dob ? `• DOB: ${app.dob}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-blue-700 text-[11px]">{app.passportNo}</div>
                      <div className="text-[10px] text-slate-500">Exp: {app.passportExpiry}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={parsedApplicants.length === 0}
            className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply {parsedApplicants.length} Applicants to Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
