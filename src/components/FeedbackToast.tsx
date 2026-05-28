/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackToastProps {
  message: { text: string; type: 'success' | 'info' | 'error' } | null;
  onClose: () => void;
}

export function FeedbackToast({ message, onClose }: FeedbackToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          id="toast-notification"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 max-w-sm w-[90%] ${
            message.type === 'success' ? 'bg-emerald-600 text-white' : 
            message.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
          }`}
        >
          <span className="text-xs font-semibold leading-normal flex-1">{message.text}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white p-0.5 rounded-full cursor-pointer">
            <Check className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
