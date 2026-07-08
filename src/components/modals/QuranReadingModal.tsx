import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Square, CheckCircle2, BookOpen, Play, Pause, RotateCcw } from 'lucide-react';

interface QuranReadingModalProps {
  activityName: string;
  onClose: () => void;
  onSubmit: (audioDataUrl: string) => void;
}

const SURAH = {
  name: "Al-Fatihah (Pembukaan)",
  ayat: [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "الرَّحْمَٰنِ الرَّحِيمِ",
    "مَالِكِ يَوْمِ الدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  ],
  translation: [
    "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
    "Segala puji bagi Allah, Tuhan seluruh alam.",
    "Yang Maha Pengasih, Maha Penyayang.",
    "Pemilik hari pembalasan.",
    "Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan.",
    "Tunjukilah kami jalan yang lurus.",
    "(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat.",
  ],
};

type RecordState = 'idle' | 'recording' | 'recorded';

export default function QuranReadingModal({ activityName, onClose, onSubmit }: QuranReadingModalProps) {
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setRecordState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } catch (e) {
      setError('Tidak dapat mengakses mikrofon. Pastikan izin mikrofon telah diberikan.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordState('recorded');
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setAudioDataUrl(null);
    setElapsed(0);
    setIsPlaying(false);
    setRecordState('idle');
  };

  const togglePlayback = () => {
    if (!audioElRef.current) return;
    if (isPlaying) {
      audioElRef.current.pause();
    } else {
      audioElRef.current.play();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleFinish = () => {
    if (audioDataUrl) {
      onSubmit(audioDataUrl);
    }
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
                  <BookOpen className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Membaca Al-Qur'an</h3>
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

            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 space-y-4 max-h-64 overflow-y-auto">
              <p className="text-center text-sm font-bold text-emerald-700 dark:text-emerald-400">{SURAH.name}</p>
              {SURAH.ayat.map((ayat, i) => (
                <div key={i} className="space-y-1 border-b border-emerald-100 dark:border-emerald-900/30 last:border-0 pb-3 last:pb-0">
                  <p dir="rtl" className="text-right text-xl leading-loose text-slate-800 dark:text-slate-100 font-arabic">
                    {ayat} <span className="text-emerald-600 dark:text-emerald-400 text-sm">﴿{i + 1}﴾</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">{SURAH.translation[i]}</p>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3">
              {recordState === 'idle' && (
                <>
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
                  >
                    <Mic size={26} />
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tekan untuk mulai merekam bacaan</p>
                </>
              )}

              {recordState === 'recording' && (
                <>
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse"
                  >
                    <Square size={22} fill="currentColor" />
                  </button>
                  <p className="text-sm font-bold text-red-500">{formatTime(elapsed)} — Sedang merekam...</p>
                </>
              )}

              {recordState === 'recorded' && audioUrl && (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlayback}
                      className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <audio
                      ref={audioElRef}
                      src={audioUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Rekaman selesai</p>
                      <p className="text-xs text-slate-400">{formatTime(elapsed)}</p>
                    </div>
                  </div>
                  <button
                    onClick={resetRecording}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
                  >
                    <RotateCcw size={12} /> Rekam ulang
                  </button>
                </>
              )}
            </div>

            <button
              onClick={handleFinish}
              disabled={recordState !== 'recorded'}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold transition-all"
            >
              <CheckCircle2 size={18} />
              Selesai & Tandai Selesai
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
