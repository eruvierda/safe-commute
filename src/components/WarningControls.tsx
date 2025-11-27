import { Bell, Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
        <div className={`absolute bottom-24 sm:bottom-8 left-4 z-[999] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${isExpanded ? 'w-72 p-4 max-h-[60vh] overflow-y-auto' : 'w-auto p-2'}`}>
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
                    <Bell className={`w-5 h-5 ${isWarningEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                    {isExpanded && <span className="font-semibold text-gray-900">Peringatan</span>}
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
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                ) : (
                    <button onClick={() => setIsExpanded(true)} aria-label="Expand warning controls">
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    </button>
                )}
            </div>

            {isExpanded && isWarningEnabled && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200 mt-4">
                    {/* Radius Slider */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                            Radius: {warningRadius} km
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={warningRadius}
                            onChange={(e) => onWarningRadiusChange(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            aria-label={`Warning radius: ${warningRadius} kilometers`}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>0.5km</span>
                            <span>10km</span>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 my-2" />

                    {/* Filters */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter</span>
                        </div>
                        <div className="space-y-1.5">
                            {REPORT_TYPES.map((reportType) => {
                                const isEnabled = enabledHazardTypes.has(reportType.value);
                                return (
                                    <label
                                        key={reportType.value}
                                        className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={() => onHazardTypeToggle(reportType.value)}
                                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: reportType.color }}
                                        />
                                        <span className="flex-1 text-xs font-medium text-gray-700">
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
                    <button onClick={() => setIsExpanded(false)} aria-label="Collapse warning controls">
                        <ChevronDown className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>
            )}
        </div>
    );
}
