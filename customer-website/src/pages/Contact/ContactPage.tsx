import { RiMapPin2Line, RiPhoneLine, RiTimeLine } from 'react-icons/ri';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import CallButton from '../../components/buttons/CallButton';
import ContactForm from '../../components/forms/ContactForm';
import { useSettings } from '../../context/SettingsContext';

export default function ContactPage() {
  const settings = useSettings();
  return (
    <div className="mx-auto max-w-6xl px-6 md:px-12 py-14 grid lg:grid-cols-2 gap-12">
      <SEOHead title="Contact Us" description={`Visit ${settings.storeName}${settings.address ? ` at ${settings.address}` : ''}${settings.phone ? `, or call ${settings.phone}` : ''}.`} />
      <div>
        <SectionHeading eyebrow="Get In Touch" title="Visit or Contact Us" />
        <ul className="space-y-5 text-sm mb-8">
          <li className="flex gap-3"><RiMapPin2Line className="text-accent shrink-0 mt-0.5" size={20} /> {settings.address}</li>
          <li className="flex gap-3"><RiPhoneLine className="text-accent shrink-0 mt-0.5" size={20} /> {settings.phone}</li>
          <li className="flex gap-3"><RiTimeLine className="text-accent shrink-0 mt-0.5" size={20} /> {settings.hours}</li>
        </ul>
        <div className="mb-8 flex flex-wrap gap-4">
          <CallButton />
        </div>
        <div className="rounded-2xl border border-primary/10 dark:border-white/10 p-6 bg-white dark:bg-dark-card">
          <h2 className="font-display text-lg text-primary dark:text-surface mb-4">Send Us a Message</h2>
          <ContactForm />
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden border border-primary/10 dark:border-white/10 aspect-[4/3] lg:sticky lg:top-24 h-fit">
        <iframe
          title={`${settings.storeName} location`}
          src={settings.mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}