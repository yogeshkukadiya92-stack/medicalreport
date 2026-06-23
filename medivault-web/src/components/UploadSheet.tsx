'use client';

import { useRef, useEffect, useState } from 'react';
import { filesAPI } from '@/lib/api/files';

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

const sources = [
  { icon: '📸', label: 'Camera',  accept: 'image/*',              capture: 'environment' as const },
  { icon: '🖼️', label: 'Gallery', accept: 'image/*',              capture: undefined },
  { icon: '📄', label: 'PDF',     accept: 'application/pdf',      capture: undefined },
  { icon: '📎', label: 'File',    accept: 'image/*,application/pdf', capture: undefined },
];

type Stage = 'pick' | 'uploading' | 'done' | 'error';

async function sha256hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function UploadSheet({ open, onClose, onUploaded }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [stage, setStage] = useState<Stage>('pick');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setStage('pick');
      setProgress(0);
      setErrorMsg('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setStage('uploading');
    setProgress(10);

    try {
      const { file_id, upload_url } = await filesAPI.getUploadURL(
        file.name,
        file.type || 'application/octet-stream',
        file.size,
      );
      setProgress(30);

      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      setProgress(70);

      const checksum = await sha256hex(file);
      setProgress(85);

      await filesAPI.confirmUpload(file_id, checksum);
      setProgress(100);

      setStage('done');
      onUploaded?.();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Upload failed. Please try again.',
      );
      setStage('error');
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={stage === 'uploading' ? undefined : onClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Pick stage */}
          {stage === 'pick' && (
            <>
              <h2 className="text-lg font-bold text-gray-900">Upload a Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">Take a photo or select a file</p>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">For:</span>
                <button className="text-sm font-medium text-teal-600 flex items-center gap-1">
                  My Profile
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

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
                      onChange={handleFile}
                    />
                  </label>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Supported: JPG, PNG, PDF · Max 20 MB
              </p>
            </>
          )}

          {/* Uploading stage */}
          {stage === 'uploading' && (
            <div className="py-4 text-center">
              <p className="text-base font-semibold text-gray-900 mb-4">Uploading…</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{progress}%</p>
            </div>
          )}

          {/* Done stage */}
          {stage === 'done' && (
            <div className="py-4 text-center">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-900">Report Uploaded!</p>
              <p className="text-sm text-gray-500 mt-1">Our AI is processing your report. It will appear shortly.</p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold"
              >
                Done
              </button>
            </div>
          )}

          {/* Error stage */}
          {stage === 'error' && (
            <div className="py-4 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-900">Upload Failed</p>
              <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
              <button
                onClick={() => setStage('pick')}
                className="mt-5 w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold"
              >
                Try Again
              </button>
              <button onClick={onClose} className="mt-2 w-full py-2 text-sm text-gray-500">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
