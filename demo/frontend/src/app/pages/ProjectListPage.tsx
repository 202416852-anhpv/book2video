import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import VideoUploadModal from '../components/VideoUploadModal';
import HomeSidebar from '../components/HomeSidebar';
import HomeHeader from '../components/HomeHeader';
import { BlockData } from '../types/block';
import {
  TaoAudioCard,
  LongTiengVideoCard,
  LongTiengSlideCard,
  Empty,
} from '../components/figma/ProjectCards';
import { listProjects, createProject, deleteProject, renameProject, type ProjectSummary } from '../utils/projectApi';
import { authFetch } from '../utils/auth';
import { Film, MoreVertical, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import lesson1Data from '../data/lesson1Mock.json';

const PAGE_SIZES = [10, 20, 50];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProjectListPage() {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadProjects = async () => {
    try {
      const list = await listProjects();
      setProjects(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [search]);

  const handleCreateVideoProject = async (file: File) => {
    const isLesson1Mock = file.name.includes('LOG') || file.name.endsWith('.pdf');
    const videoUrl = isLesson1Mock ? '/lesson_1/LOG_1.1.1_Video.mp4' : URL.createObjectURL(file);
    const audioUrl = isLesson1Mock ? '/lesson_1/LOG_1.1.1_Audio_bai_giang.mp3' : undefined;

    const initialBlocks = isLesson1Mock ? (lesson1Data.blocks as any[]) : [
      {
        id: 1, title: 'Khối 1', content: '', imageUrl: null,
        previewUrl: undefined, audioUrl: undefined, selected: false,
        type: 'video' as const, startTime: '00:00', endTime: '00:00',
        startSeconds: 0, endSeconds: 0,
      }
    ];

    const project = await createProject(file.name.replace(/\.[^.]+$/, ''), 'video', {
      blocks: initialBlocks,
      videoUrl,
      audioUrl,
      fileName: file.name,
      musicBlocks: audioUrl ? [
        {
          id: 2001,
          src: audioUrl,
          name: 'LOG.1.1.1 Audio bài giảng',
          startTime: 0,
          duration: 1341,
          naturalDuration: 1341,
          volume: 100,
        }
      ] : []
    });

    navigate(`/project/${project.id}`, {
      state: {
        blocks: initialBlocks,
        type: 'video',
        videoUrl,
        audioUrl,
        fileName: file.name,
        musicBlocks: project.data?.musicBlocks
      },
    });
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    if (!confirm('Xóa dự án này?')) return;
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRenameStart = (project: ProjectSummary) => {
    setMenuOpenId(null);
    setEditingId(project.id);
    setEditName(project.name);
  };

  const handleRenameConfirm = async () => {
    if (!editingId || !editName.trim()) return;
    await renameProject(editingId, editName.trim());
    setProjects((prev) => prev.map((p) => (p.id === editingId ? { ...p, name: editName.trim() } : p)));
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
  };

  const VideoProjectIcon = () => (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.40039 0.599609H19.2002C19.2972 0.599609 19.3904 0.638452 19.459 0.707031L28.0928 9.3418C28.1612 9.41028 28.2001 9.50278 28.2002 9.59961V28.7998C28.2002 30.2356 27.0363 31.4002 25.6006 31.4004H6.40039C4.96445 31.4004 3.7998 30.2357 3.7998 28.7998V3.2002C3.7998 1.76425 4.96445 0.599609 6.40039 0.599609Z" fill="white" stroke="#D5D7DA" strokeWidth="1.2"/>
      <path d="M19.2002 0.399902V6.3999C19.2002 8.16721 20.6329 9.5999 22.4002 9.5999H28.4002" stroke="#D5D7DA" strokeWidth="1.2"/>
      <path d="M10 19.2002H22M10 16.2002H13M19 16.2002H22M10 22.2002H13M19 22.2002H22M13 25.2002V13.2002M19 25.2002V13.2002M12.88 25.2002H19.12C20.1281 25.2002 20.6321 25.2002 21.0172 25.004C21.3559 24.8314 21.6312 24.5561 21.8038 24.2174C22 23.8323 22 23.3283 22 22.3202V16.0802C22 15.0721 22 14.5681 21.8038 14.183C21.6312 13.8443 21.3559 13.569 21.0172 13.3964C20.6321 13.2002 20.1281 13.2002 19.12 13.2002H12.88C11.8719 13.2002 11.3679 13.2002 10.9828 13.3964C10.6441 13.569 10.3688 13.8443 10.1962 14.183C10 14.5681 10 15.0721 10 16.0802V22.3202C10 23.3283 10 23.8323 10.1962 24.2174C10.3688 24.5561 10.6441 24.8314 10.9828 25.004C11.3679 25.2002 11.8719 25.2002 12.88 25.2002Z" stroke="#1E164E" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const typeIcon = (type: string) => {
    if (type === 'video') return <VideoProjectIcon />;
    return <Film className="size-5 text-gray-400" />;
  };

  return (
    <>
    <div className="absolute bg-white content-stretch flex inset-0 items-start">
      <HomeSidebar />

      <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-start min-h-px min-w-px overflow-x-clip overflow-y-auto relative">
        <HomeHeader />

        <div className="flex-[1_0_0] min-h-px min-w-px relative w-full">
          <div className="flex flex-col gap-6 p-6 pb-10 w-full min-h-full">

            {/* 3 Project Type Cards */}
            <div className="flex gap-6 items-start shrink-0 w-[992px]">
              <div className="opacity-50 cursor-not-allowed"><TaoAudioCard /></div>
              <button className="cursor-pointer" onClick={() => setShowVideoModal(true)}><LongTiengVideoCard /></button>
              <div className="opacity-50 cursor-not-allowed"><LongTiengSlideCard /></div>
            </div>

            {/* Project List Section */}
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <p className="font-['SF_Pro_Text:Bold',sans-serif] leading-7 text-[#1c1c1e] text-xl tracking-[-0.4px]">
                  Danh sách dự án
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm dự án"
                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#7c6dd8] w-[240px]"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">Đang tải...</p>
              ) : projects.length === 0 ? (
                <Empty />
              ) : (
                <>
                  {/* Empty search result */}
                  {filtered.length === 0 && (
                    <p className="text-sm text-gray-400 py-8 text-center">Không tìm thấy dự án nào phù hợp.</p>
                  )}

                  {/* List */}
                  <div className="flex-1">
                    {paginated.map((project, idx) => (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/project/${project.id}`)}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          idx !== paginated.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {typeIcon(project.type)}
                        </div>

                        {/* Name & meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1c1c1e] truncate">{project.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(project.updatedAt)}</p>
                        </div>

                        {/* 3-dot menu */}
                        <div className="relative flex-shrink-0" ref={menuOpenId === project.id ? menuRef : undefined}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === project.id ? null : project.id);
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                          {menuOpenId === project.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 w-40 z-50">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRenameStart(project); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Pencil className="size-4" />
                                Đổi tên
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination — ẩn khi chỉ có 1 trang */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>Hiển thị số mục trên 1 trang</span>
                        <select
                          value={pageSize}
                          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                          className="border border-gray-200 rounded px-2 py-1 text-sm outline-none cursor-pointer"
                        >
                          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{`${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} trong ${filtered.length} mục`}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showVideoModal && (
        <VideoUploadModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          onUpload={handleCreateVideoProject}
        />
      )}
    </div>

    {/* Rename Modal */}
    {editingId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={handleRenameCancel} />
        <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-[400px] z-50">
          <h3 className="text-lg font-semibold mb-4">Đổi tên dự án</h3>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Tên dự án</label>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
              if (e.key === 'Escape') handleRenameCancel();
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7c6dd8] focus:ring-1 focus:ring-[#7c6dd8]"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleRenameCancel}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleRenameConfirm}
              disabled={!editName.trim()}
              className="px-4 py-2 text-sm bg-[#1c1c1e] text-white rounded-lg hover:bg-[#333] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
