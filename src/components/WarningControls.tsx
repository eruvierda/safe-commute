import { Bell, Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { REPORT_TYPES, ReportType } from '../types';

interface WarningControlsProps {
    warningRadius: number;
    onWarningRadiusChange: (radius: number) => void;
    enabledHazardTypes: Set<ReportType>;
    onHazardTypeToggle: (type: ReportType) => void;
    isWarningEnabled: boolean;
    onWarningToggle: (enabled: boolean) => void;
}

export function WarningControls({
    warningRadius,
    onWarningRadiusChange,
    enabledHazardTypes,
    onHazardTypeToggle,
    isWarningEnabled,
    onWarningToggle,
}: WarningControlsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`absolute bottom-24 sm:bottom-8 left-4 z-[999] glass transition-all duration-300 flex flex-col ${isExpanded ? 'w-72 p-4 max-h-[60vh] rounded-2xl' : 'w-auto p-2 rounded-xl'}`}>
            {/* Warning System Toggle */}
            <div className="flex items-center justify-between gap-2">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                    role="button"
                    aria-label={isExpanded ? "Collapse warning controls" : "Expand warning controls"}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
                >
                    <Bell className={`w-5 h-5 ${isWarningEnabled ? 'text-brand-600 fill-brand-100' : 'text-gray-400'}`} />
                    {isExpanded && <span className="font-bold text-gray-900">Sistem Peringatan</span>}
                </div>

                {isExpanded ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isWarningEnabled}
                            onChange={(e) => onWarningToggle(e.target.checked)}
                            aria-label="Toggle warning system"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                ) : (
                    <button onClick={() => setIsExpanded(true)} aria-label="Expand warning controls" className="hover:bg-brand-50 p-1 rounded-lg transition-colors">
                        <span className="sr-only">Expand</span>
                        {/* Using a smaller icon or just trigger expansion on main click, but retaining explicit button for a11y */}
                    </button>
                )}
            </div>

            {!isExpanded && (
                <div className="absolute inset-0 z-10" onClick={() => setIsExpanded(true)} />
            )}


            {isExpanded && isWarningEnabled && (
                <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-200 mt-4 overflow-y-auto pr-1 custom-scrollbar">
                    {/* Radius Slider */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                            Radius Deteksi: <span className="text-brand-700 font-bold text-sm ml-1">{warningRadius} km</span>
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={warningRadius}
                            onChange={(e) => onWarningRadiusChange(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 hover:accent-brand-700 active:accent-brand-800 transition-all"
                            aria-label={`Warning radius: ${warningRadius} kilometers`}
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
                            <span>0.5km</span>
                            <span>10km</span>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                    {/* Filters */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="w-4 h-4 text-brand-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filter Bahaya</span>
                        </div>
                        <div className="space-y-1">
                            {REPORT_TYPES.map((reportType) => {
                                const isEnabled = enabledHazardTypes.has(reportType.value);
                                return (
                                    <label
                                        key={reportType.value}
                                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 border ${isEnabled ? 'bg-brand-50 border-brand-100' : 'hover:bg-gray-50 border-transparent'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={() => onHazardTypeToggle(reportType.value)}
                                            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 transition-colors"
                                        />
                                        <div
                                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                                            style={{ backgroundColor: reportType.color }}
                                        />
                                        <span className={`flex-1 text-sm font-medium ${isEnabled ? 'text-brand-900' : 'text-gray-600'}`}>
                                            {reportType.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {isExpanded && (
                <div className="flex justify-center mt-2 pt-2 border-t border-gray-100">
                    <button onClick={() => setIsExpanded(false)} aria-label="Collapse warning controls" className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
