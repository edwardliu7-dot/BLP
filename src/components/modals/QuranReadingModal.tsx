import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Square, CheckCircle2, BookOpen, Play, Pause, RotateCcw, Bookmark } from 'lucide-react';
import { SURAH_LIST, getSurah } from '../../data/quran';
import { QuranBookmark, QuranReadingRef } from '../../types';

interface QuranReadingModalProps {
  activityName: string;
  bookmark?: QuranBookmark | null;
  onClose: () => void;
  onSubmit: (audioDataUrl: string, quranRef: QuranReadingRef) => void;
}

type RecordState = 'idle' | 'recording' | 'recorded';
type Mode = 'ayat' | 'halaman';

export default function QuranReadingModal({ activityName, bookmark, onClose, onSubmit }: QuranReadingModalProps) {
  const [mode, setMode] = useState<Mode>('ayat');
  const [surahNo, setSurahNo] = useState<number>(bookmark?.surahNo || 1);
  const [ayatFrom, setAyatFrom] = useState<number>(bookmark?.ayat || 1);
  const [ayatTo, setAyatTo] = useState<number>(bookmark?.ayat || 1);
  const [halaman, setHalaman] = useState<number>(bookmark?.halaman || 1);
  const [rangeError, setRangeError] = useState('');

  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [surahText, setSurahText] = useState<{ arabic: string[]; translations: string[] } | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const selectedSurah = useMemo(() => getSurah(surahNo), [surahNo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    // Keep ayat range within bounds of the selected surah.
    if (!selectedSurah) return;
    if (ayatFrom > selectedSurah.ayatCount) setAyatFrom(selectedSurah.ayatCount);
    if (ayatTo > selectedSurah.ayatCount) setAyatTo(selectedSurah.ayatCount);
  }, [selectedSurah]);

  // Fetch the Arabic text + Indonesian translation for the selected surah so
  // students actually have something to read from inside the app, instead of
  // needing a separate physical mushaf/app just to see the verses.
  useEffect(() => {
    if (mode !== 'ayat') return;
    let cancelled = false;
    setTextLoading(true);
    setTextError('');
    fetch(`/api/quran/surah/${surahNo}`)
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat teks');
        return res.json();
      })
      .then(data => {
        if (!cancelled) setSurahText(data);
      })
      .catch(() => {
        if (!cancelled) setTextError('Teks Al-Qur\'an tidak dapat dimuat. Kamu tetap bisa membaca dari mushaf/aplikasi lain.');
      })
      .finally(() => {
        if (!cancelled) setTextLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode, surahNo]);

  const applyBookmark = () => {
    if (!bookmark) return;
    setMode(bookmark.halaman ? 'halaman' : 'ayat');
    setSurahNo(bookmark.surahNo);
    setAyatFrom(bookmark.ayat);
    setAyatTo(bookmark.ayat);
    if (bookmark.halaman) setHalaman(bookmark.halaman);
  };

  const validateRange = (): boolean => {
    if (mode === 'halaman') {
      if (!halaman || halaman < 1 || halaman > 604) {
        setRangeError('Nomor halaman harus antara 1 - 604.');
        return false;
      }
      setRangeError('');
      return true;
    }
    if (!selectedSurah) {
      setRangeError('Pilih surah terlebih dahulu.');
      return false;
    }
    if (ayatFrom < 1 || ayatTo < 1 || ayatFrom > selectedSurah.ayatCount || ayatTo > selectedSurah.ayatCount) {
      setRangeError(`Ayat harus antara 1 - ${selectedSurah.ayatCount} untuk surah ${selectedSurah.nameLatin}.`);
      return false;
    }
    if (ayatTo < ayatFrom) {
      setRangeError('Ayat akhir tidak boleh lebih kecil dari ayat awal.');
      return false;
    }
    setRangeError('');
    return true;
  };

  const startRecording = async () => {
    if (!validateRange()) return;
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
    if (!audioDataUrl) return;
    if (!validateRange()) return;
    if (mode === 'halaman') {
      onSubmit(audioDataUrl, {
        surahNo,
        surahName: selectedSurah?.nameLatin || '',
        ayatFrom,
        ayatTo,
        halaman,
      });
    } else if (selectedSurah) {
      onSubmit(audioDataUrl, {
        surahNo,
        surahName: selectedSurah.nameLatin,
        ayatFrom,
        ayatTo,
        halaman: null,
      });
    }
  };

  const isLocked = recordState !== 'idle';

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

            {bookmark && (
              <button
                type="button"
                onClick={applyBookmark}
                disabled={isLocked}
                className="w-full flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3 text-left disabled:opacity-50"
              >
                <Bookmark className="text-amber-500 w-4 h-4 flex-shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Penanda terakhir: <span className="font-bold">{bookmark.surahName}</span>
                  {bookmark.halaman ? ` — Halaman ${bookmark.halaman}` : ` ayat ${bookmark.ayat}`}.
                  {' '}Ketuk untuk lanjutkan dari sini.
                </span>
              </button>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('ayat')}
                  disabled={isLocked}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${mode === 'ayat' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} disabled:opacity-50`}
                >
                  Surah &amp; Ayat
                </button>
                <button
                  type="button"
                  onClick={() => setMode('halaman')}
                  disabled={isLocked}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${mode === 'halaman' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} disabled:opacity-50`}
                >
                  Halaman
                </button>
              </div>

              {mode === 'ayat' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:col-span-3 -mb-1">Surah</label>
                  <select
                    value={surahNo}
                    disabled={isLocked}
                    onChange={(e) => {
                      const no = Number(e.target.value);
                      setSurahNo(no);
                      setAyatFrom(1);
                      setAyatTo(1);
                    }}
                    className="sm:col-span-3 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60"
                  >
                    {SURAH_LIST.map(s => (
                      <option key={s.no} value={s.no}>
                        {s.no}. {s.nameLatin} — {s.translatedName} ({s.ayatCount} ayat)
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ayat dari</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedSurah?.ayatCount || 1}
                      value={ayatFrom}
                      disabled={isLocked}
                      onChange={(e) => setAyatFrom(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Ayat sampai</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedSurah?.ayatCount || 1}
                      value={ayatTo}
                      disabled={isLocked}
                      onChange={(e) => setAyatTo(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                  <div className="flex items-end">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      Maks. {selectedSurah?.ayatCount || '-'} ayat
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nomor Halaman (1 - 604)</label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={halaman}
                    disabled={isLocked}
                    onChange={(e) => setHalaman(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-100 disabled:opacity-60"
                  />
                </div>
              )}

              {rangeError && (
                <p className="text-xs text-red-500 font-medium">{rangeError}</p>
              )}

              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 text-center">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {mode === 'ayat'
                    ? `${selectedSurah?.nameLatin || ''} : Ayat ${ayatFrom}${ayatTo !== ayatFrom ? `-${ayatTo}` : ''}`
                    : `Halaman ${halaman}`}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {mode === 'ayat'
                    ? 'Bacalah ayat di bawah ini, lalu rekam bacaannya.'
                    : "Bacalah bagian ini dari Al-Qur'an/mushaf/aplikasi kamu, lalu rekam bacaannya di bawah."}
                </p>
              </div>

              {mode === 'ayat' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-4">
                  {textLoading && (
                    <p className="text-xs text-slate-400 text-center">Memuat teks ayat...</p>
                  )}
                  {!textLoading && textError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center">{textError}</p>
                  )}
                  {!textLoading && !textError && surahText && selectedSurah && (
                    Array.from({ length: Math.max(0, ayatTo - ayatFrom + 1) }).map((_, i) => {
                      const ayatNo = ayatFrom + i;
                      const arabic = surahText.arabic[ayatNo - 1];
                      const translation = surahText.translations[ayatNo - 1];
                      if (!arabic) return null;
                      return (
                        <div key={ayatNo} className="space-y-1.5">
                          <p dir="rtl" lang="ar" className="text-right text-xl leading-loose text-slate-800 dark:text-slate-100" style={{ fontFamily: '"Traditional Arabic", "Amiri", serif' }}>
                            {arabic} <span className="text-emerald-600 dark:text-emerald-400 text-sm align-middle">({ayatNo})</span>
                          </p>
                          {translation && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{translation}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
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
