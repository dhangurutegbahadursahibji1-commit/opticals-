import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth, hasMinRole } from '../../context/AuthContext';
import ImageUploadField from '../../components/common/ImageUploadField';

// Single source of truth for every white-label value on the storefront.
// Nothing in this shape should ever be duplicated as a literal string
// anywhere in customer-website or admin-dashboard — this page is the only
// place it's edited, and GET /settings (public) is the only place it's read
// from on the storefront.
interface StoreSettings {
  storeName: string;
  tagline: string;
  introLine1: string; // Text shown inside the LEFT lens of the welcome animation
  introLine2: string; // Text shown inside the RIGHT lens of the welcome animation
  logoUrl: string;
  faviconUrl: string;

  address: string;
  phone: string;
  email: string;
  hours: string;
  mapEmbedUrl: string;

  socials: {
    instagram: string;
    facebook: string;
    youtube: string;
  };

  colors: {
    primary: string;
    accent: string;
  };

  gstNumber: string;
  partnerCredentials: { id: string; brandName: string; badgeImageUrl: string; note: string }[];

  // Read by the storefront at runtime. Reserved for features that don't
  // exist yet (360° spin viewer / virtual try-on), so intentionally not
  // exposed as a toggle here (a checkbox that does nothing would be worse
  // than no checkbox); this shape just carries them through unchanged on save.
  featureFlags: {
    enable360Spin: boolean;
    enableVirtualTryOn: boolean;
  };
}

// Stored in its own Setting row (key: 'paymentSettings'), not 'store' —
// enforced SUPER_ADMIN-only server-side (see backend settings.controller.ts).
// The isOwner check below is only a UX nicety; don't rely on it for security.
interface PaymentSettings {
  paymentUpiId: string;
  paymentUpiName: string;
  paymentUpiQrUrl: string;
  paymentInstructions: string;
  paymentBankName: string;
  paymentAccountNumber: string;
  paymentIfsc: string;
  paymentAccountHolder: string;
}

const EMPTY_SETTINGS: StoreSettings = {
  storeName: '', tagline: '', introLine1: '', introLine2: '', logoUrl: '', faviconUrl: '',
  address: '', phone: '', email: '', hours: '', mapEmbedUrl: '',
  socials: { instagram: '', facebook: '', youtube: '' },
  colors: { primary: '#0f172a', accent: '#c8a15a' },
  gstNumber: '',
  partnerCredentials: [],
  featureFlags: { enable360Spin: true, enableVirtualTryOn: true },
};

const EMPTY_PAYMENT: PaymentSettings = {
  paymentUpiId: '', paymentUpiName: '', paymentUpiQrUrl: '', paymentInstructions: '',
  paymentBankName: '', paymentAccountNumber: '', paymentIfsc: '', paymentAccountHolder: '',
};

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

function TextAreaField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{label}</label>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isOwner = hasMinRole(user, 'SUPER_ADMIN');

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const store = res.data?.data?.store ?? {};
        const paymentSettings = res.data?.data?.paymentSettings ?? {};
        setSettings({
          ...EMPTY_SETTINGS,
          ...store,
          socials: { ...EMPTY_SETTINGS.socials, ...(store.socials ?? {}) },
          colors: { ...EMPTY_SETTINGS.colors, ...(store.colors ?? {}) },
          featureFlags: { ...EMPTY_SETTINGS.featureFlags, ...(store.featureFlags ?? {}) },
        });
        setPayment({ ...EMPTY_PAYMENT, ...paymentSettings });
      })
      .catch(() => setError('Could not load settings.'));
  }, []);

  const update = (patch: Partial<StoreSettings>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  const updatePayment = (patch: Partial<PaymentSettings>) =>
    setPayment((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await api.put('/admin/settings/store', { value: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async () => {
    if (!payment) return;
    setPaymentSaving(true);
    setPaymentError(null);
    try {
      await api.put('/admin/settings/paymentSettings', { value: payment });
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 2000);
    } catch {
      setPaymentError('Save failed. Only the Owner (Super Admin) can save payment settings.');
    } finally {
      setPaymentSaving(false);
    }
  };

  if (error && !settings) return <p className="text-sm text-red-600">{error}</p>;
  if (!settings || !payment) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Store Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything here is white-label — it drives what customers see on the storefront.
          Nothing on this page should ever need a code change to update.
        </p>
      </div>

      <Section title="Store Identity" description="Name, tagline and branding images shown across the storefront.">
        <Field label="Store name" value={settings.storeName} onChange={(v) => update({ storeName: v })} placeholder="Your Optical Store" />
        <Field label="Tagline" value={settings.tagline} onChange={(v) => update({ tagline: v })} placeholder="We care about your vision." />
        <Field
          label="Welcome animation — Left lens"
          value={settings.introLine1}
          onChange={(v) => update({ introLine1: v })}
          placeholder="WE CARE"
        />
        <Field
          label="Welcome animation — Right lens"
          value={settings.introLine2}
          onChange={(v) => update({ introLine2: v })}
          placeholder="ABOUT YOUR VISION"
        />
        <ImageUploadField label="Logo" value={settings.logoUrl} onChange={(v) => update({ logoUrl: v })} />
        <ImageUploadField label="Favicon" value={settings.faviconUrl} onChange={(v) => update({ faviconUrl: v })} />
      </Section>

      <Section title="Contact & Location">
        <Field label="Phone" value={settings.phone} onChange={(v) => update({ phone: v })} />
        <Field label="Email" value={settings.email} onChange={(v) => update({ email: v })} type="email" />
        <Field label="Store hours" value={settings.hours} onChange={(v) => update({ hours: v })} />
        <Field label="GST number" value={settings.gstNumber} onChange={(v) => update({ gstNumber: v })} />
        <TextAreaField label="Address" value={settings.address} onChange={(v) => update({ address: v })} />
        <TextAreaField label="Google Maps embed URL" value={settings.mapEmbedUrl} onChange={(v) => update({ mapEmbedUrl: v })} />
      </Section>

      <Section title="Social Links">
        <Field label="Instagram" value={settings.socials.instagram} onChange={(v) => update({ socials: { ...settings.socials, instagram: v } })} />
        <Field label="Facebook" value={settings.socials.facebook} onChange={(v) => update({ socials: { ...settings.socials, facebook: v } })} />
        <Field label="YouTube" value={settings.socials.youtube} onChange={(v) => update({ socials: { ...settings.socials, youtube: v } })} />
      </Section>

      <Section title="Brand Colors" description="Accent colors used across the storefront theme.">
        <Field label="Primary color" value={settings.colors.primary} onChange={(v) => update({ colors: { ...settings.colors, primary: v } })} type="color" />
        <Field label="Accent color" value={settings.colors.accent} onChange={(v) => update({ colors: { ...settings.colors, accent: v } })} type="color" />
      </Section>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Verified Brand Partnerships</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              If you're an official/authorized dealer for a brand (e.g. Ray-Ban), add it here — shown publicly in the site footer.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              update({
                partnerCredentials: [
                  ...settings.partnerCredentials,
                  { id: crypto.randomUUID(), brandName: '', badgeImageUrl: '', note: '' },
                ],
              })
            }
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-accent"
          >
            + Add partner
          </button>
        </div>
        {settings.partnerCredentials.length === 0 ? (
          <p className="text-xs text-slate-400">No verified partnerships added yet.</p>
        ) : (
          <div className="space-y-4">
            {settings.partnerCredentials.map((cred, i) => (
              <div key={cred.id} className="grid gap-4 sm:grid-cols-2 rounded-xl border border-slate-100 p-4">
                <Field
                  label="Brand name"
                  value={cred.brandName}
                  onChange={(v) => {
                    const next = [...settings.partnerCredentials];
                    next[i] = { ...next[i], brandName: v };
                    update({ partnerCredentials: next });
                  }}
                  placeholder="Ray-Ban"
                />
                <ImageUploadField
                  label="Badge / certificate image"
                  value={cred.badgeImageUrl}
                  onChange={(v) => {
                    const next = [...settings.partnerCredentials];
                    next[i] = { ...next[i], badgeImageUrl: v };
                    update({ partnerCredentials: next });
                  }}
                />
                <div className="sm:col-span-2 flex items-end gap-3">
                  <div className="flex-1">
                    <Field
                      label="Note (optional)"
                      value={cred.note}
                      onChange={(v) => {
                        const next = [...settings.partnerCredentials];
                        next[i] = { ...next[i], note: v };
                        update({ partnerCredentials: next });
                      }}
                      placeholder="Authorized dealer since 2019"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      update({ partnerCredentials: settings.partnerCredentials.filter((c) => c.id !== cred.id) })
                    }
                    className="rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Payment Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Shown live on the customer checkout page. Owner-only — nothing here is ever hardcoded in frontend code.
          </p>
        </div>
        {!isOwner ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Only the Owner (Super Admin) role can view or edit payment settings.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="UPI ID" value={payment.paymentUpiId} onChange={(v) => updatePayment({ paymentUpiId: v })} placeholder="yourstore@upi" />
              <Field label="UPI display name" value={payment.paymentUpiName} onChange={(v) => updatePayment({ paymentUpiName: v })} placeholder="Name shown to customer" />
              <ImageUploadField
                label="UPI QR code"
                shape="wide"
                value={payment.paymentUpiQrUrl}
                onChange={(v) => updatePayment({ paymentUpiQrUrl: v })}
                hint="Customers scan this exact image at checkout."
              />
              <TextAreaField label="Payment instructions (optional)" value={payment.paymentInstructions} onChange={(v) => updatePayment({ paymentInstructions: v })} placeholder="e.g. Please include your order number in the UPI note." />
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-mono uppercase text-slate-500 mb-3">Bank transfer (alternate method)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bank name" value={payment.paymentBankName} onChange={(v) => updatePayment({ paymentBankName: v })} />
                <Field label="Account holder" value={payment.paymentAccountHolder} onChange={(v) => updatePayment({ paymentAccountHolder: v })} />
                <Field label="Account number" value={payment.paymentAccountNumber} onChange={(v) => updatePayment({ paymentAccountNumber: v })} />
                <Field label="IFSC code" value={payment.paymentIfsc} onChange={(v) => updatePayment({ paymentIfsc: v })} />
              </div>
            </div>
            {payment.paymentUpiQrUrl && (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-2">Live preview — exactly what the customer sees at checkout:</p>
                <div className="flex items-center gap-3">
                  <img src={payment.paymentUpiQrUrl} alt="UPI QR preview" className="h-24 w-24 rounded-lg border border-slate-200 object-contain bg-white" />
                  <div className="text-sm">
                    <p className="font-mono font-semibold text-slate-800">{payment.paymentUpiId || 'UPI ID not set'}</p>
                    <p className="text-slate-500">{payment.paymentUpiName || settings.storeName}</p>
                  </div>
                </div>
              </div>
            )}
            {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
            <button
              onClick={savePayment}
              disabled={paymentSaving}
              className="w-full sm:w-auto rounded-lg bg-primary text-white px-6 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {paymentSaving ? 'Saving…' : paymentSaved ? 'Saved ✓' : 'Save Payment Settings'}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="w-full sm:w-auto rounded-lg bg-primary text-white px-6 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Settings'}
      </button>
    </div>
  );
}