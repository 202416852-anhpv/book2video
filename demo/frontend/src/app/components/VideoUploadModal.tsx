import { useState, useRef } from 'react';
import { X, CloudUpload, Loader2 } from 'lucide-react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void | Promise<void>;
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DURATION_SEC = 30 * 60; // 30 phút

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoUploadModal({ isOpen, onClose, onUpload }: VideoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateFile = (file: File) => {
    setError(null);
    setSelectedFile(file);

    // Check file type: .pdf, .docx, .txt, .md (and keep .mp4/.mov if needed, or primarily document formats)
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.txt', '.md', '.mp4', '.mov'];
    if (!validExtensions.includes(ext)) {
      setError('Vui lòng chọn file .pdf, .docx, .txt hoặc .md');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Dung lượng file ${formatSize(file.size)} vượt quá giới hạn 200MB`);
      return;
    }

    // If it's a video, check duration
    if (ext === '.mp4' || ext === '.mov') {
      setValidating(true);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        setValidating(false);
        if (video.duration > MAX_DURATION_SEC) {
          const mins = Math.floor(video.duration / 60);
          const secs = Math.floor(video.duration % 60);
          setError(`Thời lượng video ${mins}:${String(secs).padStart(2, '0')} vượt quá giới hạn 30 phút`);
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        setValidating(false);
        setError('Không thể đọc file video. Vui lòng thử file khác.');
      };
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUploadClick = async () => {
    try {
      // Auto-load mock file LOG_1.1.1_TB.pdf from public/lesson_1
      const res = await fetch('/lesson_1/LOG_1.1.1_TB.pdf');
      if (res.ok) {
        const blob = await res.blob();
        const mockFile = new File([blob], 'LOG_1.1.1_TB.pdf', { type: 'application/pdf' });
        validateFile(mockFile);
        return;
      }
    } catch (e) {
      // fallback to normal file picker
    }
    fileInputRef.current?.click();
  };

  const handleContinue = async () => {
    if (selectedFile && !error && !validating && !uploading) {
      setUploading(true);
      try {
        await onUpload(selectedFile);
        onClose();
      } catch {
        setError('Không thể tải video lên server. Vui lòng thử lại.');
        setUploading(false);
      }
    }
  };

  const isValid = selectedFile !== null && !error && !validating && !uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={uploading ? undefined : onClose} />

      {/* Modal */}
      <div className="relative z-10 flex flex-col w-[640px] bg-white rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[rgba(60,60,67,0.16)] rounded-t-[16px]">
          <h2 className="text-[20px] font-bold text-[#1c1c1e] tracking-[-0.4px] leading-[28px]">
            Tạo video bài giảng
          </h2>
          <button onClick={onClose} disabled={uploading} className="p-1 hover:opacity-60 transition-opacity disabled:opacity-30">
            <X size={24} className="text-[#1e164e] opacity-64" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">
          {/* Upload Area */}
          <div
            className="flex flex-col items-center justify-center gap-3 p-10 border border-dashed border-[rgba(30,22,78,0.32)] rounded-[16px] bg-[rgba(244,245,247,0.64)] backdrop-blur-[8px] cursor-pointer hover:bg-[rgba(244,245,247,0.8)] transition-colors"
            onClick={handleUploadClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.mp4,.mov"
              onChange={handleFileChange}
              className="hidden"
            />

            <CloudUpload size={32} className="text-[#1e164e] opacity-80" />

            <div className="flex flex-col gap-1 items-center text-center">
              <p className="text-[16px] tracking-[-0.4px] leading-[24px]">
                <span className="font-medium text-[#1c1c1e]">Nhấn để tải lên</span>
                <span className="font-normal text-[#101323]"> hoặc kéo thả file vào đây</span>
              </p>
              <div className="text-[14px] text-[rgba(28,28,30,0.64)] leading-[20px]">
                <p className="mb-0">Hỗ trợ định dạng .pdf, .docx, .txt, .md.</p>
                <p>Tối đa 200MB.</p>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-2 flex flex-col items-center gap-1">
                <div className={`px-3 py-1.5 rounded-lg text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-[#007aff] text-white'}`}>
                  {selectedFile.name}
                  <span className="ml-2 opacity-70">({formatSize(selectedFile.size)})</span>
                </div>
                {validating && (
                  <span className="text-[12px] text-[rgba(28,28,30,0.64)]">Đang kiểm tra video...</span>
                )}
                {error && (
                  <span className="text-[12px] text-red-500 font-medium">{error}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 pb-6">
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className={`px-6 py-2 rounded-lg text-[14px] font-semibold tracking-[-0.4px] leading-[20px] transition-all ${
              isValid
                ? 'bg-[#ffd60a] text-[#1e164e] hover:bg-[#ffd60a]/90'
                : 'bg-[#ffd60a] text-[#1e164e] opacity-32 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Đang xử lý
              </span>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
