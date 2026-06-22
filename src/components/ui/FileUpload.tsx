import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
  fileType?: 'image' | 'pdf';
}

export default function FileUpload({
  value,
  onChange,
  folder = 'general',
  accept,
  label = 'File',
  fileType = 'image',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const defaultAccept = fileType === 'pdf' ? '.pdf' : 'image/*';
  const actualAccept = accept || defaultAccept;

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('media').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'File';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 p-4">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline truncate block"
              >
                {getFileName(value)}
              </a>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              >
                View PDF
              </a>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                title="Replace"
              >
                <Upload size={16} className="text-surface-500" />
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                title="Remove"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 p-6"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-primary-500" />
          ) : (
            <>
              <FileText size={24} className="text-red-500" />
              <span className="text-sm text-surface-500">
                Drop PDF here or <span className="text-primary-600 dark:text-primary-400 font-medium">browse</span>
              </span>
              <span className="text-xs text-surface-400">PDF files up to 10MB</span>
            </>
          )}
        </div>
      )}

      {uploading && value === '' && (
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <Loader2 size={14} className="animate-spin" /> Uploading...
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={actualAccept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
