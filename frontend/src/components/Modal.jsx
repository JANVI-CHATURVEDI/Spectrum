import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLockBody } from './ui';

export default function Modal({ onClose, children }) {
  useLockBody(true);

  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {children}
    </div>,
    document.body
  );
}
