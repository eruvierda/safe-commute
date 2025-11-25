import { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {activeTab === 'login' ? 'Masuk' : 'Daftar Akun'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'login'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('login')}
                    >
                        Masuk
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'signup'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Daftar
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'login' ? (
                        <LoginForm onSuccess={onClose} />
                    ) : (
                        <SignupForm onSuccess={onClose} />
                    )}
                </div>
            </div>
        </div>
    );
}
