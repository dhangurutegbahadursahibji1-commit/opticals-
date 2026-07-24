import { RiEyeLine, RiTimeLine, RiShieldCheckLine } from 'react-icons/ri';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import EyeTestForm from '../../components/forms/EyeTestForm';
import { useSettings } from '../../context/SettingsContext';

export default function EyeTestPage() {
  const { storeName } = useSettings();
  return (
    <div className="mx-auto max-w-6xl px-6 md:px-12 py-14 grid lg:grid-cols-2 gap-12 items-start">
      <SEOHead title="Book a Free Eye Test" description={`Book a free, no-obligation eye test at ${storeName}. Choose your date and time — we'll confirm by phone.`} />
      <div>
        <SectionHeading eyebrow="No Cost, No Obligation" title="Book a Free Eye Test" subtitle="Choose a date and time that works for you — we'll confirm your slot by phone." />
        <div className="space-y-4">
          {[
            { icon: RiEyeLine, text: 'Comprehensive vision test by trained opticians' },
            { icon: RiTimeLine, text: 'Takes about 20 minutes, walk-ins welcome' },
            { icon: RiShieldCheckLine, text: 'Completely free, no purchase required' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-sm text-muted">
              <item.icon className="text-accent shrink-0" size={20} />
              {item.text}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-primary/10 dark:border-white/10 p-6 bg-white dark:bg-dark-card">
        <EyeTestForm />
      </div>
    </div>
  );
}