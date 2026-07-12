import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ListChecks, Check } from 'lucide-react';
import { ChecklistItem } from '../../data/activities';

interface ChecklistSubmissionModalProps {
  title: string;
  activityName: string;
  items: ChecklistItem[];
  initialValues?: Record<string, boolean>;
  onClose: () => void;
  onSubmit: (items: Record<string, boolean>) => void;
}

export default function ChecklistSubmissionModal({
  title,
  activityName,
  items,
  initialValues,
  onClose,
  onSubmit,
}: ChecklistSubmissionModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      initial[item.id] = !!initialValues?.[item.id];
    });
    return initial;
  });

  const checkedCount = items.filter((item) => checked[item.id]).length;
  const isValid = checkedCount === items.length;

  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
                  <ListChecks className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
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

            <div className="space-y-2">
              {items.map((item) => {
                const isChecked = !!checked[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check size={16} />
                    </span>
                    <span
                      className={`font-medium text-sm ${
                        isChecked ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {checkedCount}/{items.length} sudah disiapkan
              </span>
            </div>

            <button
              onClick={() => isValid && onSubmit(checked)}
              disabled={!isValid}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold transition-all"
            >
              <ListChecks size={16} />
              Kirim & Tandai Selesai
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
