'use client';

import { useRef, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const sources = [
  {
    icon: '📸',
    label: 'Camera',
    accept: 'image/*',
    capture: 'environment' as const,
  },
  {
    icon: '🖼️',
    label: 'Gallery',
    accept: 'image/*',
    capture: undefined,
  },
  {
    icon: '📄',
    label: 'PDF',
    accept: 'application/pdf',
    capture: undefined,
  },
  {
    icon: '📎',
    label: 'File',
    accept: 'image/*,application/pdf',
    capture: undefined,
  },
];

export default function UploadSheet({ open, onClose }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, label: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`Selected "${file.name}" via ${label}.\n\nUpload flow coming soon.`);
    e.target.value = '';
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-8 pt-2">
          <h2 className="text-lg font-bold text-gray-900">Upload a Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Take a photo or select a file</p>

          {/* Profile selector */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">For:</span>
            <button className="text-sm font-medium text-teal-600 flex items-center gap-1">
              Yogesh (You)
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Source grid */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {sources.map((s, i) => (
              <label key={s.label} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl hover:border-teal-400 hover:bg-teal-50 transition active:scale-95">
                  {s.icon}
                </div>
                <span className="text-xs font-medium text-gray-600">{s.label}</span>
                <input
                  ref={(el) => { refs.current[i] = el; }}
                  type="file"
                  accept={s.accept}
                  capture={s.capture}
                  className="hidden"
                  onChange={(e) => handleFile(e, s.label)}
                />
              </label>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Supported: JPG, PNG, PDF · Max 20 MB
          </p>
        </div>
      </div>
    </>
  );
}
