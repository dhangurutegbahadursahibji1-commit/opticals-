import { Link } from 'react-router-dom';
import { RiMapPin2Line, RiPhoneLine, RiTimeLine, RiStarFill } from 'react-icons/ri';
import { useSettings } from '../../context/SettingsContext';
import PartnerBadges from './PartnerBadges';

export default function Footer() {
  const settings = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-surface/80 mt-24">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-16 grid gap-10 md:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl text-white mb-3">
          {settings.storeName}
        </h3>
          <p className="text-sm text-surface/70 mb-4">
            {settings.tagline || 'We care about your vision.'}
          </p>
          {settings.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-accent-light text-sm">
              <RiStarFill /> {settings.rating} ({settings.reviewCount} Google reviews)
            </div>
          )}
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-accent-light">Shop</Link></li>

            <li><Link to="/eye-test" className="hover:text-accent-light">Book Eye Test</Link></li>
            <li><Link to="/offers" className="hover:text-accent-light">Offers</Link></li>
            <li><Link to="/blog" className="hover:text-accent-light">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-accent-light">About Us</Link></li>
            <li><Link to="/gallery" className="hover:text-accent-light">Gallery</Link></li>
            <li><Link to="/faq" className="hover:text-accent-light">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-accent-light">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Visit Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><RiMapPin2Line className="shrink-0 mt-0.5" /> {settings.address}</li>
            <li className="flex gap-2"><RiPhoneLine className="shrink-0 mt-0.5" /> {settings.phone}</li>
            <li className="flex gap-2"><RiTimeLine className="shrink-0 mt-0.5" /> {settings.hours}</li>
          </ul>
        </div>
      </div>
      <PartnerBadges />
      <div className="border-t border-white/10 py-6 text-center text-xs text-surface/50">
        © {year} {settings.storeName}. All rights reserved.
      </div>
    </footer>
  );
}
