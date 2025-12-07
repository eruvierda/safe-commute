import { X, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { REPORT_TYPES, type Report, type ReportType } from '../types';
import { canEditReport, deleteUserReport, updateUserReport } from '../utils/userStats';
import { getUserId } from '../utils/userId';
import { formatRelativeDate } from '../utils/dateFormatter';

interface MyReportsProps {
    isOpen: boolean;
    onClose: () => void;
    reports: Report[];
    onReportUpdated: () => void;
}

export function MyReports({ isOpen, onClose, reports, onReportUpdated }: MyReportsProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editType, setEditType] = useState<ReportType>('banjir');
    const [editDescription, setEditDescription] = useState('');

    if (!isOpen) return null;

    const activeReports = reports.filter(r => !r.deleted_at);

    const handleEdit = (report: Report) => {
        setEditingId(report.id);
        setEditType(report.type);
        setEditDescription(report.description || '');
    };

    const handleSaveEdit = async (reportId: string) => {
        try {
            const userId = await getUserId();
            if (!userId) {
                toast.error('Anda harus login untuk mengedit laporan');
                return;
            }
            const result = await updateUserReport(reportId, userId, editType, editDescription);

            if (result.success) {
                toast.success('Laporan berhasil diperbarui!');
                setEditingId(null);
                onReportUpdated();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error updating report:', error);
            toast.error('Gagal memperbarui laporan');
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!confirm('Yakin ingin menghapus laporan ini?')) return;

        try {
            const userId = await getUserId();
            if (!userId) {
                toast.error('Anda harus login untuk menghapus laporan');
                return;
            }
            const result = await deleteUserReport(reportId, userId);

            if (result.success) {
                toast.success('Laporan berhasil dihapus!');
                onReportUpdated();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            toast.error('Gagal menghapus laporan');
        }
    };

    return (
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0 transition-opacity duration-300">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto transform transition-transform duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-brand-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 font-sans">Laporan Saya</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeReports.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Laporan</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">Anda belum membuat laporan apapun. Laporan yang Anda buat akan muncul di sini.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeReports.map((report) => {
                                const isEditing = editingId === report.id;
                                const canEdit = canEditReport(report.created_at);
                                const reportType = REPORT_TYPES.find(t => t.value === report.type);

                                return (
                                    <div
                                        key={report.id}
                                        className={`border rounded-2xl p-5 transition-all duration-200 ${isEditing ? 'border-brand-300 ring-4 ring-brand-50 bg-white' : 'border-gray-200 hover:border-brand-200 hover:shadow-lg bg-white'}`}
                                    >
                                        {isEditing ? (
                                            /* Edit Mode */
                                            <div className="space-y-4 animate-in fade-in duration-200">
                                                <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm uppercase tracking-wider mb-1">
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit Laporan
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Tipe Laporan</label>
                                                    <select
                                                        value={editType}
                                                        onChange={(e) => setEditType(e.target.value as ReportType)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-colors"
                                                    >
                                                        {REPORT_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Deskripsi</label>
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        placeholder="Tambahkan detail laporan..."
                                                        rows={3}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none outline-none bg-gray-50 focus:bg-white transition-colors"
                                                        maxLength={500}
                                                    />
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(report.id)}
                                                        className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold shadow-md shadow-brand-200"
                                                        aria-label="Save report changes"
                                                    >
                                                        Simpan Perubahan
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                                                        aria-label="Cancel editing"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5"
                                                            style={{ backgroundColor: `${reportType?.color}20`, color: reportType?.color }}
                                                        >
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                                                {reportType?.label}
                                                            </h3>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${report.trust_score > 0 ? 'bg-green-100 text-green-700' :
                                                                report.trust_score < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                Verifikasi: {report.trust_score > 0 ? '+' : ''}{report.trust_score}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {report.description && (
                                                    <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                                                        <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-4 bg-white border border-gray-100 rounded-lg p-2 inline-flex w-full">
                                                    <span className="flex items-center gap-1.5 flex-1">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        {formatRelativeDate(report.created_at)}
                                                    </span>
                                                    <div className="w-px h-4 bg-gray-200"></div>
                                                    <span className="flex items-center gap-1.5 flex-1 justify-end">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate max-w-[120px]">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
                                                    </span>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleEdit(report)}
                                                        disabled={!canEdit}
                                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm ${canEdit ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 hover:shadow-brand-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        title={canEdit ? 'Edit laporan' : 'Waktu edit telah habis (15 menit)'}
                                                        aria-label="Edit report"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit {!canEdit && '(Terkunci)'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(report.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all font-semibold text-sm hover:shadow-red-100"
                                                        aria-label="Delete report"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
