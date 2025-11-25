import { X, User, LogOut, Settings, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './Auth/AuthModal';

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
      <div className="fixed left-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[1001] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pengaturan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{profile?.display_name || 'Pengguna'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profil Saya</span>
              </button>
            )}

            {/* Info Section */}

            {/* Info Section */}
            <section className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-blue-600" />
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
