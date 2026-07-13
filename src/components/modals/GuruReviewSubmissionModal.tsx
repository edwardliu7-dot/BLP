import { motion, AnimatePresence } from 'motion/react';
import { X, PenLine, Mic, ListChecks, Clock, ShieldAlert, BookOpenText } from 'lucide-react';
import { ActivitySubmission } from '../../types';
import { ChecklistItem } from '../../data/activities';

interface GuruReviewSubmissionModalProps {
  activityName: string;
  submission: ActivitySubmission;
  checklistItems?: ChecklistItem[];
  onClose: () => void;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function GuruReviewSubmissionModal({
  activityName,
  submission,
  checklistItems,
  onClose,
}: GuruReviewSubmissionModalProps) {
  const expiresAt = submission.reviewedAt
    ? new Date(new Date(submission.reviewedAt).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;

  const icon =
    submission.type === 'audio' ? <Mic className="text-emerald-600 dark:text-emerald-400 w-5 h-5" /> :
    submission.type === 'checklist' ? <ListChecks className="text-emerald-600 dark:text-emerald-400 w-5 h-5" /> :
    <PenLine className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">{icon}</div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Tugas Dikumpulkan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activityName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {submission.quranRef && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
                <BookOpenText size={16} className="text-slate-400 flex-shrink-0" />
                <span>
                  QS. {submission.quranRef.surahName}
                  {submission.quranRef.halaman
                    ? `, Halaman ${submission.quranRef.halaman}`
                    : `, Ayat ${submission.quranRef.ayatFrom}${submission.quranRef.ayatTo !== submission.quranRef.ayatFrom ? `-${submission.quranRef.ayatTo}` : ''}`}
                </span>
              </div>
            )}

            {submission.expired ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
                <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
                <p>Rekaman/berkas ini sudah otomatis dihapus dari server 7 hari setelah pertama kali Anda tinjau, sesuai kebijakan penyimpanan data.</p>
              </div>
            ) : submission.type === 'audio' && submission.content ? (
              <audio src={submission.content} controls className="w-full" />
            ) : submission.type === 'checklist' && checklistItems ? (
              <div className="space-y-2">
                {checklistItems.map((item) => {
                  const checked = !!submission.items?.[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                        checked
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <span>{checked ? '✓' : '○'}</span>
                      {item.label}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl leading-relaxed">
                {submission.content || '(Tidak ada isi)'}
              </p>
            )}

            <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={14} className="flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p>Dikumpulkan: {formatDateTime(submission.recordedAt)}</p>
                {submission.type === 'audio' && (
                  submission.expired ? (
                    <p>Berkas dihapus otomatis: {formatDateTime(expiresAt?.toISOString())}</p>
                  ) : expiresAt ? (
                    <p>Berkas akan terhapus otomatis pada: {formatDateTime(expiresAt.toISOString())}</p>
                  ) : (
                    <p>Berkas akan otomatis terhapus 7 hari setelah pertama kali ditinjau.</p>
                  )
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
