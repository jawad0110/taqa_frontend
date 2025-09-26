'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 200); // Animation duration
    }, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200); // Animation duration
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="fixed inset-x-0 top-4 flex justify-center z-50 px-4 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-md">
            <div className="relative bg-red-600 text-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-700 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <span className="ml-3 flex-1 text-sm font-medium">{message}</span>
                <button
                  onClick={handleClose}
                  className="ml-4 flex-shrink-0 inline-flex p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-1 bg-white/50"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
