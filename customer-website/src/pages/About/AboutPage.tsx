import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import { useSettings } from '../../context/SettingsContext';

export default function AboutPage() {
  const settings = useSettings();
  return (
    <div className="mx-auto max-w-4xl px-6 md:px-12 py-14">
      <SEOHead title="About Us" description={`${settings.storeName} has served the community with premium eyewear, honest eye care advice, and expert fitting.`} />
      <SectionHeading eyebrow="Our Story" title={`About ${settings.storeName}`} />
      <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-primary space-y-4 text-muted">
        <p>
          {settings.storeName} has been serving the community's eyewear needs for years, building a reputation
          on straightforward advice rather than upsell. We carry a curated range of frames spanning everyday
          acetate classics to performance sports eyewear, alongside a full in-house eye testing service.
        </p>
        <p>
          Our approach is simple: every customer gets a proper eye test, an honest recommendation on frame shape
          and lens type, and after-sales support that doesn't stop at the door.
          {settings.reviewCount > 0 && (
            <> That's earned us a {settings.rating}&nbsp;star rating across {settings.reviewCount} Google reviews.</>
          )}
        </p>
        <h2>Visit the Showroom</h2>
        <p>{settings.address}</p>
        <p>{settings.hours} · {settings.phone}</p>
      </div>
    </div>
  );
}
