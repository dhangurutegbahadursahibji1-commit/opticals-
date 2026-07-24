import { useSettings } from '../../context/SettingsContext';

export default function PartnerBadges() {
  const { partnerCredentials } = useSettings();
  if (!partnerCredentials || partnerCredentials.length === 0) return null;

  return (
    <div className="border-t border-white/10 py-6">
      <p className="text-center text-[11px] uppercase tracking-wide text-surface/40 mb-3">
        Verified Brand Partner
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {partnerCredentials.map((cred) => (
          <div key={cred.id} className="flex items-center gap-2" title={cred.note || cred.brandName}>
            <img
              src={cred.badgeImageUrl}
              alt={`${cred.brandName} verified partner badge`}
              className="h-8 w-auto object-contain opacity-90"
            />
            <span className="text-xs text-surface/60">{cred.brandName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
