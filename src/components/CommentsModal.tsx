import React, { useState } from 'react';
import { ActivityComment, TicketFollowup, VisaFollowup } from '../types';
import { X, MessageSquare, Send, Bot, Copy, Check, Clock } from 'lucide-react';

interface CommentsModalProps {
  item: TicketFollowup | VisaFollowup | null;
  targetType: 'ticket' | 'visa';
  comments: ActivityComment[];
  onClose: () => void;
  onAddComment: (text: string, author: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  item,
  targetType,
  comments,
  onClose,
  onAddComment
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState('Agency Operator');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  if (!item) return null;

  const title = targetType === 'ticket' 
    ? `Ticket Followup Comments - PNR ${(item as TicketFollowup).pnr || (item as TicketFollowup).tickets[0]}`
    : `Visa Followup Comments - ${(item as VisaFollowup).firstName} ${(item as VisaFollowup).lastName} (${(item as VisaFollowup).passportNo})`;

  const filteredComments = comments.filter((c) => c.targetId === item.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), authorName);
    setNewCommentText('');
  };

  // Automated Quick Templates
  const applyQuickTemplate = (templateType: string) => {
    if (targetType === 'ticket') {
      const t = item as TicketFollowup;
      if (templateType === 'airline_followup') {
        setNewCommentText(`Official Follow-up Email sent to ${t.airline || 'Airline'} Desk regarding Tickets: ${t.tickets.join(', ')} (PNR: ${t.pnr}). Requested waiver/reissue quote updates.`);
      } else if (templateType === 'client_update') {
        setNewCommentText(`Client notified regarding ticket status: ${t.status}. Total refundable estimate: LKR ${t.totalRefundable.toLocaleString()}.`);
      }
    } else {
      const v = item as VisaFollowup;
      if (templateType === 'embassy_check') {
        setNewCommentText(`Inquired status at Immigration Portal for ${v.firstName} ${v.lastName} (Passport ${v.passportNo}). Status updated to ${v.status}.`);
      } else if (templateType === 'passport_request') {
        setNewCommentText(`Requested renewed passport copy or extension documentation from customer ${v.customer || ''}.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Communication & Activity Log
              </h3>
              <p className="text-[11px] text-slate-300 font-mono truncate max-w-md">
                {title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Chips */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-bold shrink-0">Quick Log:</span>
          {targetType === 'ticket' ? (
            <>
              <button
                type="button"
                onClick={() => applyQuickTemplate('airline_followup')}
                className="bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 px-2.5 py-1 rounded font-semibold whitespace-nowrap transition-colors"
              >
                + Airline Email Sent
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('client_update')}
                className="bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 px-2.5 py-1 rounded font-semibold whitespace-nowrap transition-colors"
              >
                + Client Quote Update
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => applyQuickTemplate('embassy_check')}
                className="bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 px-2.5 py-1 rounded font-semibold whitespace-nowrap transition-colors"
              >
                + Immigration Portal Inquired
              </button>
              <button
                type="button"
                onClick={() => applyQuickTemplate('passport_request')}
                className="bg-white hover:bg-amber-50 text-amber-700 border border-slate-300 px-2.5 py-1 rounded font-semibold whitespace-nowrap transition-colors"
              >
                + Passport Copy Requested
              </button>
            </>
          )}
        </div>

        {/* Comment Thread List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
          {filteredComments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No comment records yet.</p>
              <p className="text-[11px]">Log your email sent to airline or visa status update below.</p>
            </div>
          ) : (
            filteredComments.map((c) => (
              <div
                key={c.id}
                className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {c.author}
                  </span>
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {c.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans pt-1">
                  {c.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Submit Form Footer */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Your Name / Operator ID"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-1/3 bg-slate-50 text-slate-800 text-xs rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            />
            <span className="text-slate-400 text-xs">Logging comment as agency staff</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type comment or email details..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 bg-slate-50 text-slate-900 text-xs rounded-lg px-3 py-2 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1 shrink-0 shadow-xs"
            >
              <span>Post</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
