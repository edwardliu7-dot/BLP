import { useRef, useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, User as UserIcon, Loader2, Save } from 'lucide-react';
import PhotoCropModal from './PhotoCropModal';

interface ProfileModalProps {
  name: string;
  currentPhotoUrl?: string | null;
  currentBio?: string | null;
  onClose: () => void;
  onSave: (photoUrl: string | null, bio: string) => Promise<void> | void;
}

const MAX_BIO_LENGTH = 300;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ name, currentPhotoUrl, currentBio, onClose, onSave }: ProfileModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl ?? null);
  const [bio, setBio] = useState(currentBio ?? '');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG/PNG).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError(null);
    setIsProcessingImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setRawImageSrc(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Gagal membaca foto. Coba foto lain.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(photoUrl, bio.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
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
          className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Edit Profil</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Foto profil" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="text-slate-400 dark:text-slate-500 w-10 h-10" />
                  )}
                  {isProcessingImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="text-white w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg transition-colors"
                  title="Ganti foto"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {photoUrl && (
                <button
                  onClick={() => setPhotoUrl(null)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  Hapus foto
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                placeholder="Ceritakan sedikit tentang dirimu..."
                rows={4}
                className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm leading-relaxed resize-none transition-colors"
              />
              <div className="flex items-center justify-end">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || isProcessingImage}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold transition-all"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan Profil
            </button>
          </div>
        </motion.div>
      </motion.div>

      {rawImageSrc && (
        <PhotoCropModal
          imageSrc={rawImageSrc}
          onCancel={() => setRawImageSrc(null)}
          onConfirm={(croppedDataUrl) => {
            setPhotoUrl(croppedDataUrl);
            setRawImageSrc(null);
          }}
        />
      )}
    </AnimatePresence>
  );
}
