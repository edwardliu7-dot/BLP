import { useCallback, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { motion } from 'motion/react';
import { X, Check, ZoomIn } from 'lucide-react';

interface PhotoCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

const MAX_BYTES = 1024 * 1024; // 1MB
const OUTPUT_SIZE_START = 480;

function dataUrlSizeBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

async function drawCroppedCanvas(imageSrc: string, crop: Area, outputSize: number): Promise<HTMLCanvasElement> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung');
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  );
  return canvas;
}

async function cropAndCompress(imageSrc: string, crop: Area): Promise<string> {
  let size = OUTPUT_SIZE_START;
  let quality = 0.9;
  let dataUrl = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const canvas = await drawCroppedCanvas(imageSrc, crop, size);
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrlSizeBytes(dataUrl) <= MAX_BYTES) {
      return dataUrl;
    }
    if (quality > 0.5) {
      quality -= 0.1;
    } else {
      size = Math.max(160, Math.round(size * 0.85));
    }
  }
  return dataUrl;
}

export default function PhotoCropModal({ imageSrc, onCancel, onConfirm }: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await cropAndCompress(imageSrc, croppedArea);
      onConfirm(result);
    } catch (err) {
      console.error(err);
      setError('Gagal memproses foto. Coba foto lain.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Sesuaikan Foto</h3>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative w-full h-72 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <ZoomIn size={16} className="text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !croppedArea}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Check size={15} />
              {isProcessing ? 'Memproses...' : 'Gunakan Foto'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
