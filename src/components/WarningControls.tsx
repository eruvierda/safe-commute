import { Bell, Filter } from 'lucide-react';
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
    return (
        <div className="absolute bottom-8 left-4 z-[999] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 w-72 max-h-[60vh] overflow-y-auto">
            {/* Warning System Toggle */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bell className={`w-5 h-5 ${isWarningEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-gray-900">Peringatan</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isWarningEnabled}
                        onChange={(e) => onWarningToggle(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {isWarningEnabled && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
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
        </div>
    );
}
