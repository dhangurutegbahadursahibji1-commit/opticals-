import { useRef, useState } from 'react';
import { RiImageAddLine, RiLoader4Line, RiCloseCircleLine } from 'react-icons/ri';
import { api } from '../../api/client';

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  /** R2 folder to upload into — must be an allowed folder on the backend. */
  folder?: string;
  /** Square previews (logo/favicon) vs wide (QR code). */
  shape?: 'square' | 'wide';
}

async function uploadImage(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const { data } = await api.post('/upload/admin', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.url as string;
}

export default function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  folder = 'settings',
  shape = 'square',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG or WEBP images are supported.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch {
      setError('Upload failed — please try again.');
    } finally {
      setUploading(false);
    }
  };

  const previewClasses =
    shape === 'square'
      ? 'h-16 w-16 rounded-xl'
      : 'h-24 w-24 rounded-lg';

  return (
    <div>
      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      <div className="flex items-center gap-3">
        <div
          className={`${previewClasses} shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden`}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-contain" />
          ) : (
            <RiImageAddLine className="text-slate-300" size={22} />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-accent disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center gap-1.5">
                  <RiLoader4Line className="animate-spin" size={14} /> Uploading…
                </span>
              ) : value ? (
                'Replace image'
              ) : (
                'Upload image'
              )}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-red-600"
              >
                <RiCloseCircleLine size={14} /> Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
