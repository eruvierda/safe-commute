import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { MapView } from './components/MapView';

function App() {
  return (
    <AuthProvider>
      <div className="h-screen w-screen relative overflow-hidden">
        <Toaster position="top-center" />
        <MapView />
      </div>
    </AuthProvider>
  );
}

export default App;
