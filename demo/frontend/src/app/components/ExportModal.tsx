import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Monitor, Play, FolderOpen, Download, Cloud } from 'lucide-react';
import { authFetch, getAccessToken } from '../utils/auth';
import { analytics, EXPERIMENTS } from '../utils/analytics';
import { exportViaAgent, pingAgent, openFile as agentOpenFile, revealFile as agentRevealFile, type AgentVideoInfo } from '../utils/desktopAgent';

const EXPORT_CTA_FLAG = EXPERIMENTS.EXPORT_CTA;

interface ExportPayload {
  mediaBlocks: any[];
  musicBlocks: any[];
  voiceBlocks: any[];
  captions: any[];
  captionStyle: any;
  totalDuration: number;
  width: number;
  height: number;
  bgColor: string;
  fps: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  getPayload: () => ExportPayload;
}

type ExportStatus = 'idle' | 'exporting' | 'done' | 'error' | 'no-agent' | 'waiting-plugin';

function formatCountdown(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  if (m > 0) return `~${m} phút ${s} giây còn lại`;
  return `~${s} giây còn lại`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export default function ExportModal({ isOpen, onClose, getPayload }: ExportModalProps) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [serverStatus, setServerStatus] = useState('');
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState('');
  const [eta, setEta] = useState('');
  const [exportTime, setExportTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [outputPath, setOutputPath] = useState('');
  const [exportedInfo, setExportedInfo] = useState<AgentVideoInfo | null>(null);
  const pollRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const encodeStartRef = useRef(0);
  const exportingRef = useRef(false);

  // Auto-start export on open
  useEffect(() => {
    if (isOpen) {
      if (exportingRef.current) return; // already running — skip (StrictMode / HMR)
      setStatus('idle');
      setProgress(0);
      setServerStatus('');
      setError('');
      setJobId('');
      setEta('');
      setExportTime(0);
      setVideoDuration(0);
      setOutputPath('');
      setExportedInfo(null);
      // Start immediately
      const timer = setTimeout(() => startExport(), 0);
      return () => clearTimeout(timer);
    }
    return () => { clearInterval(pollRef.current); exportingRef.current = false; };
  }, [isOpen]);

  const startExport = useCallback(async (mode: 'auto' | 'cloud' = 'auto') => {
    if (exportingRef.current) return; // guard against double-invoke
    exportingRef.current = true;
    setStatus('exporting');
    setProgress(0);
    setError('');
    setEta('');
    startTimeRef.current = Date.now();
    encodeStartRef.current = 0;

    try {
      const payload = getPayload();
      setVideoDuration(payload.totalDuration || 0);
      const fireStarted = () => analytics.exportStarted({
        duration: Math.round(payload.totalDuration || 0),
        width: payload.width,
        height: payload.height,
        fps: payload.fps,
        ab_variant: analytics.getVariant(EXPORT_CTA_FLAG) ?? 'unknown',
      });

      // ── Desktop agent: offload render to the local companion app ──
      // If the agent is running, render locally and stream progress via job
      // polling. If not, show the user a choice (install app / export on cloud)
      // instead of silently falling back.
      if (mode === 'auto') {
        if (!(await pingAgent())) {
          setStatus('no-agent');
          exportingRef.current = false;
          return;
        }
        fireStarted();
        try {
          const res = await exportViaAgent(payload, {
            filename: `vbee_${Date.now()}`,
            apiBase: window.location.origin,
            token: getAccessToken(),
            onProgress: (s) => {
              setServerStatus(s.status);
              setProgress(s.progress || 0);
              if (s.progress >= 30 && s.progress < 95) {
                if (!encodeStartRef.current) encodeStartRef.current = Date.now();
                const el = (Date.now() - encodeStartRef.current) / 1000;
                const prog = s.progress - 30;
                if (prog > 2) setEta(formatCountdown(Math.max(0, (el / prog) * (95 - s.progress))));
              } else if (s.progress < 30) {
                setEta('Đang chuẩn bị…');
              } else {
                setEta('');
              }
            },
          });
          if (res.canceled) {
            exportingRef.current = false;
            setStatus('idle');
            onClose();
            return;
          }
          const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
          setExportTime(elapsed);
          setOutputPath(res.outputPath || '');
          setExportedInfo(res.info || null);
          setProgress(100);
          setStatus('done');
          analytics.exportCompleted({
            job_id: 'desktop-agent',
            export_time: elapsed,
            video_duration: Math.round(payload.totalDuration || 0),
            ab_variant: analytics.getVariant(EXPORT_CTA_FLAG) ?? 'unknown',
          });
        } catch (err: any) {
          setStatus('error');
          setError(err?.message || 'Export thất bại');
          analytics.exportFailed({ reason: err?.message || 'unknown', stage: 'desktop-agent' });
        } finally {
          exportingRef.current = false;
        }
        return;
      }

      // ── Cloud export (mode === 'cloud'): render on the server ──
      fireStarted();

      // Deep clone to avoid mutating original state
      const exportData = JSON.parse(JSON.stringify(payload));

      const formData = new FormData();

      const collectBlob = async (url: string, prefix: string, idx: number) => {
        if (!url || !url.startsWith('blob:')) return url;
        const key = `${prefix}_${idx}`;
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const ext = blob.type.includes('video') ? '.mp4' : blob.type.includes('audio') ? '.mp3' : '.bin';
          formData.append(key, blob, `${key}${ext}`);
          return `__file__:${key}`;
        } catch {
          return url;
        }
      };

      for (let i = 0; i < exportData.mediaBlocks.length; i++) {
        exportData.mediaBlocks[i].src = await collectBlob(exportData.mediaBlocks[i].src, 'media', i);
      }
      for (let i = 0; i < exportData.voiceBlocks.length; i++) {
        if (exportData.voiceBlocks[i].audioUrl) {
          exportData.voiceBlocks[i].audioUrl = await collectBlob(exportData.voiceBlocks[i].audioUrl, 'voice', i);
        }
      }
      for (let i = 0; i < exportData.musicBlocks.length; i++) {
        exportData.musicBlocks[i].url = await collectBlob(exportData.musicBlocks[i].url, 'music', i);
      }

      formData.append('payload', JSON.stringify(exportData));

      const res = await authFetch('/api/export', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Không thể bắt đầu xuất video');
      const { jobId: id } = await res.json();
      setJobId(id);

      // Poll progress
      pollRef.current = window.setInterval(async () => {
        try {
          const s = await authFetch(`/api/export/status/${id}`);
          const data = await s.json();
          const pct = data.progress || 0;
          setProgress(pct);
          setServerStatus(data.status || '');

          // Calculate ETA from encode phase only (30-95%)
          if (pct >= 30 && pct < 100) {
            if (!encodeStartRef.current) encodeStartRef.current = Date.now();
            const encodeElapsed = (Date.now() - encodeStartRef.current) / 1000;
            const encodeProgress = pct - 30; // 0-65 range
            if (encodeProgress > 2) {
              const remaining = (encodeElapsed / encodeProgress) * (95 - pct);
              setEta(formatCountdown(Math.max(0, remaining)));
            }
          } else if (pct < 30) {
            setEta('Đang chuẩn bị...');
          } else {
            setEta('');
          }

          if (data.status === 'done') {
            clearInterval(pollRef.current);
            exportingRef.current = false;
            const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
            setExportTime(elapsed);
            setStatus('done');
            // Primary conversion event for the funnel / A-B experiment goal.
            analytics.exportCompleted({
              job_id: id,
              export_time: elapsed,
              video_duration: Math.round(videoDuration),
              ab_variant: analytics.getVariant(EXPORT_CTA_FLAG) ?? 'unknown',
            });
            // Auto download via authenticated fetch
            const dlRes = await authFetch(`/api/export/download/${id}`);
            const blob = await dlRes.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `export_${id}.mp4`;
            link.click();
            URL.revokeObjectURL(link.href);
          } else if (data.status === 'error') {
            clearInterval(pollRef.current);
            exportingRef.current = false;
            setStatus('error');
            setError(data.error || 'Lỗi không xác định');
            analytics.exportFailed({ job_id: id, reason: data.error || 'unknown', stage: 'server' });
          }
        } catch {
          // Network error, keep polling
        }
      }, 1500);
    } catch (e: any) {
      exportingRef.current = false;
      setStatus('error');
      setError(e.message);
      analytics.exportFailed({ reason: e?.message || 'unknown', stage: 'client' });
    }
  }, [getPayload]);

  // Go to the install screen. The user clicks "Xuất video" once installed.
  const handleDownloadPlugin = useCallback(() => {
    setStatus('waiting-plugin');
  }, []);

  // "Xuất video" on the install screen: always produce a real video — render
  // locally if the plugin is now running, otherwise fall back to cloud export.
  const handleContinueExport = useCallback(async () => {
    if (await pingAgent()) startExport('auto');
    else startExport('cloud');
  }, [startExport]);

  if (!isOpen) return null;

  const statusLabel: Record<string, string> = {
    queued: 'Đang chuẩn bị...',
    preparing: 'Đang chuẩn bị...',
    downloading: 'Đang tải media...',
    rendering: 'Đang render video...',
    done: 'Hoàn tất!',
    error: 'Lỗi',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={status === 'exporting' ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <h2 className="font-semibold text-[16px] text-[#1c1c1e]">Xuất video</h2>
            {status !== 'exporting' && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          <div className="px-6 py-5">
            {(status === 'idle' || status === 'exporting') && (
              <div className="py-2">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 text-[#1e164e] animate-spin" />
                  <span className="text-[14px] font-medium text-[#1c1c1e]">
                    {statusLabel[serverStatus] || 'Đang xử lý...'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffd60a] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[12px] text-gray-400">{eta}</p>
                  <p className="text-[12px] text-gray-400">{progress}%</p>
                </div>
              </div>
            )}

            {status === 'done' && (
              <div className="py-2 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#1c1c1e] mb-3">Xuất video thành công!</p>
                {exportedInfo ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] text-left px-1 mb-4">
                    {!!(exportedInfo.width && exportedInfo.height) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Độ phân giải</span>
                        <span className="text-[#1c1c1e] font-medium">{exportedInfo.width}×{exportedInfo.height}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Thời lượng</span>
                      <span className="text-[#1c1c1e] font-medium">{formatDuration(exportedInfo.duration ?? videoDuration)}</span>
                    </div>
                    {!!exportedInfo.sizeBytes && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dung lượng</span>
                        <span className="text-[#1c1c1e] font-medium">{formatBytes(exportedInfo.sizeBytes)}</span>
                      </div>
                    )}
                    {exportTime > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Thời gian xuất</span>
                        <span className="text-[#1c1c1e] font-medium">{formatDuration(exportTime)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 text-[12px] text-gray-400 mb-4">
                    {videoDuration > 0 && <span>Video: {formatDuration(videoDuration)}</span>}
                    {videoDuration > 0 && exportTime > 0 && <span>·</span>}
                    {exportTime > 0 && <span>Thời gian export: {formatDuration(exportTime)}</span>}
                  </div>
                )}
                {outputPath ? (
                  <>
                    <p className="text-[11px] text-gray-400 truncate mb-3 text-left" title={outputPath}>{outputPath}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => agentOpenFile(outputPath)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#ffd60a] hover:bg-[#ffc107] rounded-xl font-semibold text-[13px] text-[#1e164e] transition-colors cursor-pointer"
                      >
                        <Play className="w-4 h-4" /> Mở video
                      </button>
                      <button
                        onClick={() => agentRevealFile(outputPath)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-[13px] text-[#1c1c1e] transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4" /> Mở thư mục
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-[13px] text-[#1c1c1e] transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                )}
              </div>
            )}

            {status === 'no-agent' && (
              <div className="py-2 text-center">
                <Monitor className="w-10 h-10 text-[#1e164e] mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#1c1c1e] mb-1">Xuất ngay trên máy của bạn</p>
                <p className="text-[12px] text-gray-400 mb-4 px-2">
                  Cài <span className="font-medium text-[#1c1c1e]">Vbee Studio Plugin</span> để xuất video bằng máy của bạn — nhanh hơn và không giới hạn dung lượng.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDownloadPlugin}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#ffd60a] hover:bg-[#ffc107] rounded-xl font-semibold text-[13px] text-[#1e164e] transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Tải Vbee Studio Plugin
                  </button>
                  <button
                    onClick={() => startExport('cloud')}
                    className="w-full flex flex-col items-center gap-0.5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#1c1c1e] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-[13px]">
                      <Cloud className="w-4 h-4" /> Xuất video trên web
                    </span>
                    <span className="text-[11px] text-gray-400">Chờ lâu · Tối đa 5 phút video</span>
                  </button>
                </div>
              </div>
            )}

            {status === 'waiting-plugin' && (
              <div className="py-2 text-center">
                <Monitor className="w-10 h-10 text-[#1e164e] mx-auto mb-3" />
                <p className="text-[13px] text-[#1c1c1e] mb-4 px-2">Khi đã cài đặt xong, bấm <span className="font-medium">"Xuất video"</span> để tiếp tục.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus('no-agent')}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-[13px] text-[#1c1c1e] transition-colors cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleContinueExport}
                    className="flex-1 py-2.5 bg-[#ffd60a] hover:bg-[#ffc107] rounded-xl font-semibold text-[13px] text-[#1e164e] transition-colors cursor-pointer"
                  >
                    Xuất video
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="py-2 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-[#1c1c1e] mb-1">Xuất video thất bại</p>
                <p className="text-[12px] text-red-400 mb-4">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-[13px] text-[#1c1c1e] transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={startExport}
                    className="flex-1 py-2.5 bg-[#ffd60a] hover:bg-[#ffc107] rounded-xl font-semibold text-[13px] text-[#1e164e] transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
