import { getTodayDateStr } from '../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Dumbbell, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Video, 
  ExternalLink, 
  Play, 
  Users, 
  Clock, 
  ChevronDown, 
  Printer, 
  X,
  FileText,
  Upload,
  Eye,
  Download,
  Search,
  Filter,
  FolderOpen,
  FileCheck,
  Sparkles,
  CheckCircle2,
  User,
  Loader2
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { WorkoutProgram, WorkoutDay, ExerciseItem, Client, PdfDocument } from '../types';

interface WorkoutProgramViewProps {
  initialClientId?: string | null;
}

export const WorkoutProgramView: React.FC<WorkoutProgramViewProps> = ({
  initialClientId
}) => {
  const { clients, programs, saveProgram, deleteProgram, pdfDocuments, addPdfDocument, deletePdfDocument } = useGym();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients.length > 0 ? clients[0].id : '')
  );

  const [viewMode, setViewMode] = useState<'interactive' | 'pdf_library'>('interactive');

  // PDF Upload Modal & Filter States
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfCategory, setPdfCategory] = useState<'Giáo án' | 'Dinh dưỡng' | 'Lịch tập' | 'Hướng dẫn' | 'Khác'>('Giáo án');
  const [pdfClientId, setPdfClientId] = useState<string>('GENERAL');
  const [pdfDescription, setPdfDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // PDF Preview Modal
  const [selectedPreviewPdf, setSelectedPreviewPdf] = useState<PdfDocument | null>(null);

  // PDF Library Filters
  const [pdfCategoryFilter, setPdfCategoryFilter] = useState<string>('ALL');
  const [pdfSearchQuery, setPdfSearchQuery] = useState<string>('');

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const [activeProgramState, setActiveProgramState] = useState<WorkoutProgram>(() => {
    const prog = programs.find(p => p.clientId === selectedClientId);
    if (prog) return prog;
    return {
      id: `prog-${Date.now()}`,
      clientId: selectedClientId || 'default',
      clientName: selectedClient?.name || 'Học viên',
      title: `Giáo án cá nhân hóa - ${selectedClient?.name || ''}`,
      updatedAt: getTodayDateStr(),
      days: [
        {
          id: `d-${Date.now()}-1`,
          dayName: 'Day 1 - Thân Trên (Upper Body)',
          exercises: [
            { id: 'e1', name: 'Barbell Bench Press', sets: 4, reps: '8-10', weightKg: 60, tempo: '2-0-1-0', rpe: 8, restSeconds: 90, notes: 'Gồng ngực vai' }
          ]
        },
        {
          id: `d-${Date.now()}-2`,
          dayName: 'Day 2 - Thân Dưới (Lower Body)',
          exercises: [
            { id: 'e2', name: 'Barbell Back Squat', sets: 4, reps: '10', weightKg: 70, tempo: '3-0-1-0', rpe: 8, restSeconds: 120, notes: 'Nén bụng chuẩn' }
          ]
        }
      ]
    };
  });

  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  // Auto-select first client if none selected when clients load
  useEffect(() => {
    if ((!selectedClientId || !clients.some(c => c.id === selectedClientId)) && clients.length > 0) {
      const defaultId = initialClientId && clients.some(c => c.id === initialClientId) ? initialClientId : clients[0].id;
      setSelectedClientId(defaultId);
    }
  }, [clients, initialClientId, selectedClientId]);

  // Sync program state when selected client or programs list updates
  useEffect(() => {
    if (!selectedClientId) return;
    const clientObj = clients.find(c => c.id === selectedClientId);
    const prog = programs.find(p => p.clientId === selectedClientId);
    if (prog) {
      setActiveProgramState(prog);
    } else {
      setActiveProgramState({
        id: `prog-${Date.now()}`,
        clientId: selectedClientId,
        clientName: clientObj?.name || 'Học viên',
        title: `Giáo án tập luyện - ${clientObj?.name || 'Học viên'}`,
        updatedAt: getTodayDateStr(),
        days: [
          {
            id: `d-${Date.now()}-1`,
            dayName: 'Day 1 - Thân Trên (Upper Body)',
            exercises: [
              { id: 'e1', name: 'Barbell Bench Press', sets: 4, reps: '8-10', weightKg: 60, tempo: '2-0-1-0', rpe: 8, restSeconds: 90, notes: 'Gồng ngực vai' }
            ]
          },
          {
            id: `d-${Date.now()}-2`,
            dayName: 'Day 2 - Thân Dưới (Lower Body)',
            exercises: [
              { id: 'e2', name: 'Barbell Back Squat', sets: 4, reps: '10', weightKg: 70, tempo: '3-0-1-0', rpe: 8, restSeconds: 120, notes: 'Nén bụng chuẩn' }
            ]
          }
        ]
      });
    }
  }, [selectedClientId, programs]);

  // Sync state when client changes manually
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveDayIndex(0);
  };

  const handleSaveCurrentProgram = () => {
    if (!selectedClientId) {
      alert('Vui lòng chọn học viên để lưu giáo án!');
      return;
    }
    const clientObj = clients.find(c => c.id === selectedClientId);
    const programToSave: WorkoutProgram = {
      ...activeProgramState,
      clientId: selectedClientId,
      clientName: clientObj?.name || activeProgramState.clientName || 'Học viên',
      updatedAt: getTodayDateStr()
    };

    saveProgram(programToSave);
    alert('Đã lưu giáo án tập luyện thành công!');
  };

  const handleAddDay = () => {
    const newDayNum = activeProgramState.days.length + 1;
    const newDay: WorkoutDay = {
      id: `d-${Date.now()}`,
      dayName: `Day ${newDayNum} - Buổi Tập Mới`,
      exercises: []
    };
    setActiveProgramState({
      ...activeProgramState,
      days: [...activeProgramState.days, newDay]
    });
    setActiveDayIndex(activeProgramState.days.length);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (activeProgramState.days.length <= 1) {
      alert('Giáo án cần ít nhất 1 buổi tập!');
      return;
    }
    const updatedDays = activeProgramState.days.filter((_, idx) => idx !== dayIndex);
    setActiveProgramState({ ...activeProgramState, days: updatedDays });
    setActiveDayIndex(Math.max(0, dayIndex - 1));
  };

  const handleAddExercise = (dayIndex: number) => {
    const newEx: ExerciseItem = {
      id: `ex-${Date.now()}`,
      name: 'Bài Tập Mới (Nhấp chỉnh sửa)',
      sets: 3,
      reps: '10-12',
      weightKg: 20,
      tempo: '2-0-1-0',
      rpe: 8,
      restSeconds: 60,
      videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
    };

    const updatedDays = [...activeProgramState.days];
    updatedDays[dayIndex].exercises.push(newEx);
    setActiveProgramState({ ...activeProgramState, days: updatedDays });
  };

  const handleUpdateExercise = (dayIndex: number, exIndex: number, updates: Partial<ExerciseItem>) => {
    const updatedDays = [...activeProgramState.days];
    updatedDays[dayIndex].exercises[exIndex] = {
      ...updatedDays[dayIndex].exercises[exIndex],
      ...updates
    };
    setActiveProgramState({ ...activeProgramState, days: updatedDays });
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const updatedDays = [...activeProgramState.days];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter((_, idx) => idx !== exIndex);
    setActiveProgramState({ ...activeProgramState, days: updatedDays });
  };

  const handleUploadPdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile && !pdfTitle.trim()) {
      alert('Vui lòng chọn file tài liệu hoặc nhập tên giáo án!');
      return;
    }

    setIsProcessingPdf(true);

    const titleToUse = pdfTitle.trim() || (pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, '') : 'Tài liệu PDF mới');
    const fileNameToUse = pdfFile ? pdfFile.name : `${titleToUse.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    const fileSizeToUse = pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.0 MB';

    const saveDocument = (dataUrl: string) => {
      addPdfDocument({
        title: titleToUse,
        fileName: fileNameToUse,
        fileSize: fileSizeToUse,
        fileDataUrl: dataUrl,
        category: pdfCategory,
        clientId: pdfClientId,
        description: pdfDescription
      });

      setIsProcessingPdf(false);
      setIsUploadPdfModalOpen(false);
      setPdfTitle('');
      setPdfDescription('');
      setPdfFile(null);
      alert('Tải lên & lưu file PDF giáo án thành công!');
    };

    if (pdfFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string || '';
        saveDocument(dataUrl);
      };
      reader.onerror = () => {
        setIsProcessingPdf(false);
        alert('Có lỗi khi đọc file từ thiết bị. Vui lòng thử chọn lại file khác.');
      };
      reader.readAsDataURL(pdfFile);
    } else {
      saveDocument('');
    }
  };

  const filteredPdfDocs = pdfDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(pdfSearchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(pdfSearchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(pdfSearchQuery.toLowerCase()));
    
    const matchesCategory = pdfCategoryFilter === 'ALL' || doc.category === pdfCategoryFilter;
    
    // Also filter by selected client if user is in client mode or filter matches
    return matchesSearch && matchesCategory;
  });

  const currentDay = activeProgramState.days[activeDayIndex] || activeProgramState.days[0];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF4E00] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Quản lý giáo án & tài liệu
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#FF4E00]" />
            Giáo án tập luyện chuyên sâu
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Thiết kế giáo án chi tiết bài tập hoặc quản lý kho file PDF giáo án do bạn tự setup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'pdf_library' ? (
            <button
              onClick={() => setIsUploadPdfModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Upload className="w-4 h-4" /> + Tải Lên PDF Mới
            </button>
          ) : (
            <>
              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-full text-sm border border-slate-200 flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" /> In / Tải PDF
              </button>

              <button
                onClick={handleSaveCurrentProgram}
                className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" /> Lưu giáo án
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setViewMode('interactive')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            viewMode === 'interactive'
              ? 'bg-white text-[#FF4E00] shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Soạn giáo án chi tiết (Set / Rep / Kg)
        </button>

        <button
          onClick={() => setViewMode('pdf_library')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            viewMode === 'pdf_library'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          Kho file PDF giáo án (do PT tự setup)
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-black">
            {pdfDocuments.length}
          </span>
        </button>
      </div>

      {/* Mode 1: PDF Document Library */}
      {viewMode === 'pdf_library' ? (
        <div className="space-y-6">
          {/* PDF Section Info Bar */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-full border border-indigo-200 uppercase tracking-wider">
                  Tải & Mở File PDF Setup
                </span>
                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-200">
                  {pdfDocuments.length} File PDF Đã Lưu
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Kho tài liệu PDF giáo án & dinh dưỡng
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Quản lý các file PDF quy trình tập luyện, thực đơn mẫu, form test thể lực do bạn tự đưa lên. Click "Xem PDF" để xem trực tiếp ngay trong ứng dụng!
              </p>
            </div>

            <button
              onClick={() => setIsUploadPdfModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-full text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 self-start md:self-auto whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              + Tải Lên File PDF Mới
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên file, tiêu đề hoặc mô tả..."
                  value={pdfSearchQuery}
                  onChange={(e) => setPdfSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {pdfSearchQuery && (
                  <button
                    onClick={() => setPdfSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {['ALL', 'Giáo án', 'Dinh dưỡng', 'Lịch tập', 'Hướng dẫn', 'Khác'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPdfCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      pdfCategoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PDF Cards Grid */}
          {filteredPdfDocs.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-extrabold text-slate-800">Chưa có file PDF nào phù hợp</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                Bạn chưa tải lên file PDF nào thuộc danh mục này. Hãy nhấn nút <strong className="text-indigo-600">"+ Tải Lên File PDF Mới"</strong> ở trên để đưa tài liệu giáo án của bạn vào hệ thống.
              </p>
              <button
                onClick={() => setIsUploadPdfModalOpen(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold px-4 py-2 rounded-full text-xs border border-indigo-200 transition-colors inline-flex items-center gap-1.5 mt-2"
              >
                <Upload className="w-3.5 h-3.5" /> Tải Lên File PDF Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPdfDocs.map((doc) => {
                const linkedClient = clients.find(c => c.id === doc.clientId);
                
                return (
                  <div
                    key={doc.id}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Top Category Badge Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-indigo-50 text-indigo-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-indigo-600" />
                          {doc.category || 'Giáo án'}
                        </span>

                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {doc.fileSize}
                        </span>
                      </div>

                      {/* PDF Title & Filename */}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          {doc.fileName}
                        </p>
                      </div>

                      {/* Description notes */}
                      {doc.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      {/* Target Client info */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Phân loại học viên:</span>
                        <span className="font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-0.5 rounded-md border border-indigo-100">
                          {doc.clientId === 'GENERAL' || !doc.clientId
                            ? 'Dùng chung cho tất cả'
                            : (linkedClient ? `Học viên: ${linkedClient.name}` : 'Học viên cá nhân')}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium">
                        Ngày tải lên: {doc.uploadedAt}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPreviewPdf(doc)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem PDF
                      </button>

                      {doc.fileDataUrl ? (
                        <a
                          href={doc.fileDataUrl}
                          download={doc.fileName}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200"
                          title="Tải file về máy"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <button
                          onClick={() => alert(`File mẫu: ${doc.fileName}. Bạn có thể bấm 'Xem PDF' để xem nội dung tài liệu.`)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200"
                          title="Tải file mẫu"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn xóa file PDF "${doc.title}"?`)) {
                            deletePdfDocument(doc.id);
                          }
                        }}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors border border-rose-200"
                        title="Xóa file PDF này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Select Client Selector Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider whitespace-nowrap">
            Chọn Học Viên:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => handleSelectClient(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white flex-1 max-w-md"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.packageName} (Còn {c.remainingSessions} buổi)
              </option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 font-semibold">
              Mục tiêu: <strong className="text-[#FF4E00] font-black">{selectedClient.goals}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Program Editor Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Program Title Input */}
        <div>
          <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
            Tên Chương Trình / Tên Giáo Án
          </label>
          <input
            type="text"
            value={activeProgramState.title}
            onChange={(e) => setActiveProgramState({ ...activeProgramState, title: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 text-[#4F46E5] font-black text-lg rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all"
          />
        </div>

        {/* Days Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {activeProgramState.days.map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setActiveDayIndex(idx)}
                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeDayIndex === idx
                    ? 'bg-[#FF4E00] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                {day.dayName}
              </button>
            ))}

            <button
              onClick={handleAddDay}
              className="bg-orange-50 hover:bg-orange-100 text-[#FF4E00] p-2.5 rounded-full border border-orange-200 text-xs font-extrabold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm Ngày
            </button>
          </div>

          {activeProgramState.days.length > 1 && (
            <button
              onClick={() => handleRemoveDay(activeDayIndex)}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa Buổi
            </button>
          )}
        </div>

        {/* Active Day Detail Editor */}
        {currentDay && (
          <div className="space-y-4">
            {/* Day Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tên Buổi Tập</label>
                <input
                  type="text"
                  value={currentDay.dayName}
                  onChange={(e) => {
                    const updatedDays = [...activeProgramState.days];
                    updatedDays[activeDayIndex].dayName = e.target.value;
                    setActiveProgramState({ ...activeProgramState, days: updatedDays });
                  }}
                  className="w-full bg-white border border-slate-200 text-[#FF4E00] font-black text-base rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
                />
              </div>

              <button
                onClick={() => handleAddExercise(activeDayIndex)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-full text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 self-start sm:self-end"
              >
                <Plus className="w-4 h-4" /> + Thêm Bài Tập
              </button>
            </div>

            {/* Exercise Table */}
            {currentDay.exercises.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm font-medium">
                Chưa có bài tập trong buổi này. Hãy bấm "+ Thêm Bài Tập" ở trên.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tên Bài Tập</th>
                      <th className="p-3 w-16 text-center">Set</th>
                      <th className="p-3 w-20 text-center">Reps</th>
                      <th className="p-3 w-24 text-center">Khối lượng (kg)</th>
                      <th className="p-3 w-20 text-center">Tempo</th>
                      <th className="p-3 w-16 text-center">RPE</th>
                      <th className="p-3 w-24 text-center">Nghỉ (giây)</th>
                      <th className="p-3">Video Link</th>
                      <th className="p-3 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentDay.exercises.map((ex, exIdx) => (
                      <tr key={ex.id} className="hover:bg-slate-50/80">
                        {/* Name & Notes */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { name: e.target.value })}
                            className="w-full bg-slate-100 border border-slate-200 font-extrabold text-slate-900 text-xs rounded-lg p-2 focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Ghi chú kỹ thuật (gồng ngực, mở vai...)"
                            value={ex.notes || ''}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-[11px] rounded-lg p-1.5 mt-1 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Sets */}
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { sets: parseInt(e.target.value) || 0 })}
                            className="w-12 text-center bg-slate-100 border border-slate-200 font-black text-[#FF4E00] text-xs rounded-lg p-2 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Reps */}
                        <td className="p-2.5 text-center">
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { reps: e.target.value })}
                            className="w-16 text-center bg-slate-100 border border-slate-200 font-bold text-slate-800 text-xs rounded-lg p-2 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Kg */}
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            step="0.5"
                            value={ex.weightKg}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { weightKg: parseFloat(e.target.value) || 0 })}
                            className="w-16 text-center bg-slate-100 border border-slate-200 font-black text-emerald-600 text-xs rounded-lg p-2 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Tempo */}
                        <td className="p-2.5 text-center">
                          <input
                            type="text"
                            value={ex.tempo}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { tempo: e.target.value })}
                            className="w-16 text-center bg-slate-100 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* RPE */}
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={ex.rpe}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { rpe: parseInt(e.target.value) || 0 })}
                            className="w-12 text-center bg-slate-100 border border-slate-200 text-xs rounded-lg p-2 font-black text-rose-600 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Rest */}
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            value={ex.restSeconds}
                            onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { restSeconds: parseInt(e.target.value) || 0 })}
                            className="w-16 text-center bg-slate-100 border border-slate-200 text-xs rounded-lg p-2 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Video */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="YouTube URL..."
                              value={ex.videoUrl || ''}
                              onChange={(e) => handleUpdateExercise(activeDayIndex, exIdx, { videoUrl: e.target.value })}
                              className="w-full bg-slate-100 border border-slate-200 text-[11px] rounded-lg p-2 focus:bg-white focus:outline-none"
                            />
                            {ex.videoUrl && (
                              <a
                                href={ex.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-orange-100 text-[#FF4E00] hover:bg-[#FF4E00] hover:text-white rounded-lg transition-colors"
                                title="Xem Video Minh Họa"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Remove */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleRemoveExercise(activeDayIndex, exIdx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>
      </>
      )}

      {/* Upload PDF Modal */}
      {isUploadPdfModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tải lên file PDF giáo án mới</h3>
                  <p className="text-xs text-slate-500 font-medium">Hỗ trợ file .pdf do PT tự setup</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadPdfModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPdfSubmit} className="space-y-4">
              {/* File Selection Dropzone */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                  1. Chọn file PDF / giáo án từ máy tính hoặc điện thoại
                </label>
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      setPdfFile(file);
                      if (!pdfTitle) {
                        setPdfTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative ${
                    isDragging ? 'border-indigo-600 bg-indigo-100/80 scale-[1.01]' : 'border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf,application/x-pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setPdfFile(file);
                        if (!pdfTitle) {
                          setPdfTitle(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <FileText className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
                    {pdfFile ? (
                      <div>
                        <p className="text-sm font-black text-indigo-700">{pdfFile.name}</p>
                        <p className="text-xs text-slate-500">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • File đã chọn thành công</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700">Bấm chọn file hoặc kéo thả file .PDF/.DOC vào đây</p>
                        <p className="text-[11px] text-slate-400">Hỗ trợ PDF, hình ảnh, tài liệu giáo án</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  2. Tiêu đề giáo án / tài liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giáo án 12 tuần Hypertrophy Tăng Cơ, Thực đơn giảm mỡ..."
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 text-sm rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category & Linked Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    3. Danh mục
                  </label>
                  <select
                    value={pdfCategory}
                    onChange={(e) => setPdfCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 text-xs rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Giáo án">Giáo án tập luyện</option>
                    <option value="Dinh dưỡng">Thực đơn dinh dưỡng</option>
                    <option value="Lịch tập">Lịch tập mẫu</option>
                    <option value="Hướng dẫn">Hướng dẫn & Test thể lực</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                    4. Gán cho học viên
                  </label>
                  <select
                    value={pdfClientId}
                    onChange={(e) => setPdfClientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 text-xs rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GENERAL">Tất cả học viên (Dùng chung)</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.packageName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                  5. Ghi Chú / Hướng Dẫn Kèm Theo (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về mục tiêu bài tập, lưu ý tập luyện..."
                  value={pdfDescription}
                  onChange={(e) => setPdfDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 font-medium text-slate-900 text-xs rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isProcessingPdf}
                  onClick={() => setIsUploadPdfModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPdf}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang Xử Lý File...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Tải Lên & Lưu PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview PDF Modal */}
      {selectedPreviewPdf && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-2xl flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {selectedPreviewPdf.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md font-bold">
                      {selectedPreviewPdf.category || 'Giáo án'}
                    </span>
                    <span>• {selectedPreviewPdf.fileName}</span>
                    <span>• {selectedPreviewPdf.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedPreviewPdf.fileDataUrl && (
                  <a
                    href={selectedPreviewPdf.fileDataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-colors hidden sm:flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" /> Tab Mới
                  </a>
                )}

                {selectedPreviewPdf.fileDataUrl && (
                  <a
                    href={selectedPreviewPdf.fileDataUrl}
                    download={selectedPreviewPdf.fileName}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Tải Về
                  </a>
                )}

                <button
                  onClick={() => setSelectedPreviewPdf(null)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF IFrame or Custom Viewer */}
            <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden flex flex-col">
              {selectedPreviewPdf.fileDataUrl ? (
                <iframe
                  src={selectedPreviewPdf.fileDataUrl}
                  title={selectedPreviewPdf.title}
                  className="w-full h-full rounded-2xl border border-white/10 bg-white"
                />
              ) : (
                <div className="flex-1 bg-slate-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-2xl mx-auto my-auto">
                  <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center border border-indigo-500/30">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">{selectedPreviewPdf.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">{selectedPreviewPdf.description || 'Tài liệu giáo án huấn luyện cá nhân hóa do PT tự setup.'}</p>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/10 w-full text-left space-y-2 text-xs text-slate-300">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Tên file:</span>
                      <strong className="text-white font-mono">{selectedPreviewPdf.fileName}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Dung lượng:</span>
                      <strong className="text-white">{selectedPreviewPdf.fileSize}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Ngày cập nhật:</span>
                      <strong className="text-white">{selectedPreviewPdf.uploadedAt}</strong>
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300">
                    💡 Bạn có thể bấm nút <strong>"+ Tải Lên File PDF Mới"</strong> để tải trực tiếp bất kỳ file PDF thực tế từ thiết bị của bạn lên hệ thống để xem trực quan đầy đủ.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
