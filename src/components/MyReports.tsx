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
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-gray-900">Laporan Saya</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeReports.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Anda belum memiliki laporan</p>
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
                                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                    >
                                        {isEditing ? (
                                            /* Edit Mode */
                                            <div className="space-y-3">
                                                <select
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as ReportType)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    {REPORT_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Deskripsi (opsional)"
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    maxLength={500}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(report.id)}
                                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                        aria-label="Save report changes"
                                                    >
                                                        Simpan
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                                        aria-label="Cancel editing"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: reportType?.color }}
                                                        />
                                                        <h3 className="font-semibold text-gray-900">
                                                            {reportType?.label}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium ${report.trust_score > 0 ? 'text-green-600' :
                                                            report.trust_score < 0 ? 'text-red-600' : 'text-gray-600'
                                                            }`}>
                                                            Trust: {report.trust_score > 0 ? '+' : ''}{report.trust_score}
                                                        </span>
                                                    </div>
                                                </div>

                                                {report.description && (
                                                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                                                )}

                                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeDate(report.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(report)}
                                                        disabled={!canEdit}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                        title={canEdit ? 'Edit laporan' : 'Waktu edit telah habis (15 menit)'}
                                                        aria-label="Edit report"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit {!canEdit && '(Terkunci)'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(report.id)}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
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
