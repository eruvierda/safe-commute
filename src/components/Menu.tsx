import { X, User, LogOut, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './Auth/AuthModal';
import logo from '../img/logo.png';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}

export function Menu({
  isOpen,
  onClose,
  onOpenProfile
}: MenuProps) {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleProfileClick = () => {
    onOpenProfile();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="fixed left-0 top-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur-md shadow-2xl z-[1001] overflow-y-auto transform transition-transform duration-300">
        <div className="sticky top-0 bg-white/50 backdrop-blur z-10 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SafeCommute Logo" className="w-10 h-10 object-contain" />
            <h2 className="text-xl font-bold text-brand-900 font-sans tracking-tight">
              SafeCommute
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="p-5 border-b border-gray-100 bg-brand-50/30">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.display_name || 'User'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-brand-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-brand-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{profile?.display_name || 'Pengguna'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Keluar"
                  aria-label="Keluar dari akun"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all font-semibold shadow-lg shadow-brand-200"
                aria-label="Masuk atau daftar akun baru"
              >
                <User className="w-5 h-5" />
                Masuk / Daftar
              </button>
            )}
          </div>

          <div className="px-6 space-y-6 pb-6">
            {user && (
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-brand-50 rounded-xl transition-all border border-gray-200 hover:border-brand-200 hover:text-brand-700 group"
                aria-label="Buka profil saya"
              >
                <User className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
                <span className="font-medium">Profil Saya</span>
              </button>
            )}

            {/* Info Section */}
            <section className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-gray-900">Tentang</h3>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  SafeCommute membantu Anda menghindari bahaya di jalan dengan sistem
                  peringatan berbasis radius.
                </p>
                <p>
                  Aktifkan sistem peringatan untuk mendapatkan notifikasi saat mendekati
                  area bahaya.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
