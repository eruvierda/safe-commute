import { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import logo from '../../img/logo.png';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="SafeCommute Logo" className="w-8 h-8 object-contain" />
                        <h2 className="text-2xl font-bold text-brand-900 font-sans tracking-tight">
                            {activeTab === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeTab === 'login'
                            ? 'text-brand-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('login')}
                    >
                        Masuk
                        {activeTab === 'login' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]"></div>
                        )}
                    </button>
                    <button
                        className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeTab === 'signup'
                            ? 'text-brand-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Daftar
                        {activeTab === 'signup' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]"></div>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
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
