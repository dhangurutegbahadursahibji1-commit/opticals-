import { useState } from 'react';
import { RiUploadCloud2Line, RiCheckLine, RiEyeLine, RiListCheck2 } from 'react-icons/ri';
import type { PrescriptionData, PrescriptionMode } from '../../types';
import { uploadPublicFile } from '../../services/api';

// Common sphere powers used at Indian optical stores.
// Negative = myopia (near-sighted), Positive = hyperopia / reading.
const MINUS_POWERS = [
  '-0.25', '-0.50', '-0.75',
  '-1.00', '-1.25', '-1.50', '-1.75',
  '-2.00', '-2.25', '-2.50', '-2.75',
  '-3.00', '-3.50', '-4.00',
  '-4.50', '-5.00', '-5.50', '-6.00',
];
const PLUS_POWERS = ['+0.50', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.50', '+3.00'];
const ALL_POWERS = ['0.00 (Plano)', ...MINUS_POWERS, ...PLUS_POWERS];

interface PowerSelectorProps {
  value?: PrescriptionData;
  onChange: (data: PrescriptionData | undefined) => void;
}

export default function PowerSelector({ value, onChange }: PowerSelectorProps) {
  const [mode, setMode] = useState<PrescriptionMode>(value?.mode ?? 'standard');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleModeChange = (m: PrescriptionMode) => {
    setMode(m);
    onChange(undefined);
  };

  const handleStandardPower = (power: string) => {
    const actual = power.startsWith('0.00') ? '0.00' : power;
    onChange({ mode: 'standard', selectedPower: actual });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadPublicFile(file, 'prescription');
      onChange({
        mode: 'upload',
        upload: {
          fileUrl: url,
          fileType: file.type === 'application/pdf' ? 'pdf' : 'image',
          fileName: file.name,
        },
      });
    } catch {
      setUploadError('Upload failed. Please try again or enter your prescription manually.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualField = (field: string, val: string) => {
    const current = value?.manual ?? {
      rightEyeSphere: '', rightEyeCylinder: '', rightEyeAxis: '',
      leftEyeSphere: '', leftEyeCylinder: '', leftEyeAxis: '', pdValue: '',
    };
    onChange({ mode: 'manual', manual: { ...current, [field]: val } });
  };

  const inputCls = 'w-full rounded-lg border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-card px-3 py-2 text-sm outline-none focus:border-accent';
  const isSelected = (p: string) => {
    const actual = p.startsWith('0.00') ? '0.00' : p;
    return value?.mode === 'standard' && value.selectedPower === actual;
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex rounded-xl overflow-hidden border border-primary/15 dark:border-white/10">
        {([
          { key: 'standard', label: 'Common Powers', icon: <RiListCheck2 /> },
          { key: 'upload',   label: 'Upload Prescription', icon: <RiUploadCloud2Line /> },
          { key: 'manual',   label: 'Enter Manually', icon: <RiEyeLine /> },
        ] as { key: PrescriptionMode; label: string; icon: React.ReactNode }[]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleModeChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              mode === tab.key
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-primary/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Standard powers grid */}
      {mode === 'standard' && (
        <div>
          <p className="text-xs text-muted mb-3">
            Select the closest power to your prescription number. If your number is e.g. <strong>-1.5</strong>, choose <strong>-1.50</strong>.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {ALL_POWERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleStandardPower(p)}
                className={`rounded-lg border py-2 px-1 text-xs font-mono transition-all ${
                  isSelected(p)
                    ? 'border-accent bg-accent text-white font-semibold'
                    : 'border-primary/15 dark:border-white/10 hover:border-accent hover:bg-accent/5'
                }`}
              >
                {p.startsWith('0.00') ? '0 (Plano)' : p}
              </button>
            ))}
          </div>
          {value?.selectedPower && (
            <p className="mt-3 text-sm text-accent font-medium flex items-center gap-1">
              <RiCheckLine /> Selected: Power {value.selectedPower}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            Don't see your exact number? Choose the nearest value — our optician will confirm before grinding.
          </p>
        </div>
      )}

      {/* Upload prescription */}
      {mode === 'upload' && (
        <div>
          <p className="text-xs text-muted mb-3">
            Upload a clear photo or PDF of your prescription slip.
          </p>
          <label
            htmlFor="rx-upload"
            className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors ${
              value?.upload
                ? 'border-accent bg-accent/5'
                : 'border-primary/20 dark:border-white/20 hover:border-accent'
            }`}
          >
            {value?.upload
              ? <RiCheckLine className="text-accent text-xl" />
              : <RiUploadCloud2Line className="text-muted text-xl" />
            }
            <div>
              <p className="text-sm font-medium">
                {value?.upload ? value.upload.fileName : 'Tap to upload'}
              </p>
              <p className="text-xs text-muted">JPG, PNG, WEBP or PDF · Max 5 MB</p>
            </div>
          </label>
          <input
            id="rx-upload"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleUpload}
            className="sr-only"
            disabled={uploading}
          />
          {uploading && <p className="text-xs text-accent mt-2">Uploading…</p>}
          {uploadError && <p className="text-xs text-error mt-2">{uploadError}</p>}
        </div>
      )}

      {/* Manual entry */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Enter the values from your prescription slip exactly as written.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs text-muted font-mono uppercase">
                  <th className="pb-2 text-left w-12"></th>
                  <th className="pb-2 text-center">Sphere (SPH)</th>
                  <th className="pb-2 text-center">Cylinder (CYL)</th>
                  <th className="pb-2 text-center">Axis</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {(['Right Eye (RE)', 'Left Eye (LE)'] as const).map((eye, idx) => {
                  const prefix = idx === 0 ? 'rightEye' : 'leftEye';
                  return (
                    <tr key={eye} className="gap-2">
                      <td className="pr-3 text-xs font-medium whitespace-nowrap">{eye}</td>
                      <td className="pb-2 pr-2">
                        <input
                          className={inputCls}
                          placeholder="-1.50"
                          value={(value?.manual as any)?.[`${prefix}Sphere`] ?? ''}
                          onChange={(e) => handleManualField(`${prefix}Sphere`, e.target.value)}
                        />
                      </td>
                      <td className="pb-2 pr-2">
                        <input
                          className={inputCls}
                          placeholder="-0.50"
                          value={(value?.manual as any)?.[`${prefix}Cylinder`] ?? ''}
                          onChange={(e) => handleManualField(`${prefix}Cylinder`, e.target.value)}
                        />
                      </td>
                      <td className="pb-2">
                        <input
                          className={inputCls}
                          placeholder="90"
                          value={(value?.manual as any)?.[`${prefix}Axis`] ?? ''}
                          onChange={(e) => handleManualField(`${prefix}Axis`, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted whitespace-nowrap">PD (mm)</label>
            <input
              className={`${inputCls} max-w-[120px]`}
              placeholder="64"
              value={value?.manual?.pdValue ?? ''}
              onChange={(e) => handleManualField('pdValue', e.target.value)}
            />
            <p className="text-xs text-muted">Pupillary distance — usually 60–68 mm</p>
          </div>
        </div>
      )}
    </div>
  );
}
