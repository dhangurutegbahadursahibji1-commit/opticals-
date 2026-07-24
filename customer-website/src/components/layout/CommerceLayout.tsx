import { Outlet } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../footer/Footer';
import { useWishlistContext } from '../../context/WishlistContext';

export default function CommerceLayout() {
  const { toast } = useWishlistContext();
  return (
    <div className="min-h-screen flex flex-col bg-surface text-text">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 rounded-full bg-primary text-white text-sm px-4 py-2 shadow-lg animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
