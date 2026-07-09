import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, PenLine } from 'lucide-react';

interface TextSubmissionModalProps {
  title: string;
  activityName: string;
  placeholder: string;
  minChars?: number;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export default function TextSubmissionModal({
  title,
  activityName,
  placeholder,
  minChars,
  initialValue = '',
  onClose,
  onSubmit,
}: TextSubmissionModalProps) {
  const [text, setText] = useState(initialValue);
  const charCount = text.trim().length;
  const isValid = minChars ? charCount >= minChars : text.trim().length > 0;

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
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <PenLine className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
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

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={8}
              className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm leading-relaxed resize-none transition-colors"
              autoFocus
            />

            <div className="flex items-center justify-end">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {minChars ? `${charCount}/${minChars} karakter` : `${charCount} karakter`}
              </span>
            </div>

            <button
              onClick={() => isValid && onSubmit(text.trim())}
              disabled={!isValid}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold transition-all"
            >
              <Send size={16} />
              Kirim & Tandai Selesai
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
