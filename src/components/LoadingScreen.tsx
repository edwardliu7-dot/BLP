import { motion } from 'motion/react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Memuat data...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 overflow-hidden">

      {/* Background decorative circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8 z-10"
      >
        {/* Logo + spinning ring */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute w-36 h-36 rounded-full bg-white/10 blur-xl" />

          {/* Spinning arc */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="absolute w-32 h-32"
          >
            <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
              <circle
                cx="64" cy="64" r="58"
                stroke="white"
                strokeOpacity="0.15"
                strokeWidth="6"
              />
              <path
                d="M 64 6 A 58 58 0 0 1 122 64"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Counter-rotating inner arc */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24"
          >
            <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
              <path
                d="M 48 6 A 42 42 0 0 1 90 48"
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <img src="/logo.png" alt="BLP Harian" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow">
            BLP Harian
          </h1>
          <p className="text-emerald-100 mt-1 text-sm font-medium">
            SMP TISA Islamic School
          </p>
        </motion.div>

        {/* Bouncing dots + message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-white/80"
                animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <p className="text-emerald-100 text-xs font-medium tracking-wide">
            {message}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
