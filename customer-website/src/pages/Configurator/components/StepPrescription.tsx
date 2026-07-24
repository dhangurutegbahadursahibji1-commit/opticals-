import { useState } from 'react';
import { useConfigurator } from '../../../context/ConfiguratorContext';
import { RiUploadCloud2Line, RiFileTextLine, RiTimeLine, RiEdit2Line, RiCheckLine, RiErrorWarningLine, RiLoader4Line } from 'react-icons/ri';
import type { ManualPrescription } from '../../../types';
import { uploadPublicFile } from '../../../services/api';

export default function StepPrescription() {
  const { config, setPrescriptionStatus } = useConfigurator();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'plano' | 'later'>(
    config.prescription?.status === 'uploaded' ? 'upload' :
    config.prescription?.status === 'manual' ? 'manual' :
    config.prescription?.status === 'plano' ? 'plano' :
    config.prescription?.status === 'enter_later' ? 'later' : 'upload'
  );

  const [manual, setManual] = useState<ManualPrescription>(
    config.prescription?.manualData || {
      rightEyeSphere: '', rightEyeCylinder: '', rightEyeAxis: '',
      leftEyeSphere: '', leftEyeCylinder: '', leftEyeAxis: '', pdValue: ''
    }
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setActiveTab('upload');
    setUploadError(null);
    setIsUploading(true);
    const fileMeta = { name: file.name, size: file.size, type: file.type };
    try {
      const url = await uploadPublicFile(file, 'prescription');
      setPrescriptionStatus('uploaded', fileMeta, undefined, url);
    } catch (err) {
      console.error('Prescription upload failed', err);
      setUploadError("Upload failed — please try again, or choose 'Send Later' and email it to us.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualChange = (field: keyof ManualPrescription, value: string) => {
    const newData = { ...manual, [field]: value };
    setManual(newData);
    // If they type something, we consider it "manual" status
    setPrescriptionStatus('manual', undefined, newData);
  };

  const selectPlano = () => {
    setActiveTab('plano');
    setPrescriptionStatus('plano');
  };

  const selectLater = () => {
    setActiveTab('later');
    setPrescriptionStatus('enter_later');
  };

  const status = config.prescription?.status;
  const fileMeta = config.prescription?.fileMeta;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl font-semibold text-primary">Provide Your Prescription</h2>
        <p className="text-muted mt-2">How would you like to provide your prescription details?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <button
          onClick={() => setActiveTab('upload')}
          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            activeTab === 'upload' ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30'
          }`}
        >
          <RiUploadCloud2Line size={24} className={activeTab === 'upload' ? 'text-accent' : 'text-primary'} />
          <span className={`text-sm font-medium mt-2 ${activeTab === 'upload' ? 'text-accent' : 'text-primary'}`}>Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            activeTab === 'manual' ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30'
          }`}
        >
          <RiEdit2Line size={24} className={activeTab === 'manual' ? 'text-accent' : 'text-primary'} />
          <span className={`text-sm font-medium mt-2 ${activeTab === 'manual' ? 'text-accent' : 'text-primary'}`}>Enter Manually</span>
        </button>
        <button
          onClick={selectPlano}
          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            activeTab === 'plano' ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30'
          }`}
        >
          <RiCheckLine size={24} className={activeTab === 'plano' ? 'text-accent' : 'text-primary'} />
          <span className={`text-sm font-medium mt-2 text-center ${activeTab === 'plano' ? 'text-accent' : 'text-primary'}`}>Power 0<br/><span className="text-xs font-normal opacity-70">(Plano)</span></span>
        </button>
        <button
          onClick={selectLater}
          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
            activeTab === 'later' ? 'border-accent bg-accent/5 shadow-md' : 'border-primary/10 hover:border-primary/30'
          }`}
        >
          <RiTimeLine size={24} className={activeTab === 'later' ? 'text-accent' : 'text-primary'} />
          <span className={`text-sm font-medium mt-2 ${activeTab === 'later' ? 'text-accent' : 'text-primary'}`}>Send Later</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-primary/10 p-6 md:p-8 shadow-sm">
        {activeTab === 'upload' && (
          <div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
              status === 'uploaded' ? 'border-accent bg-accent/5' :
              isDragging ? 'border-accent bg-accent/10 scale-[1.01]' : 'border-primary/20 hover:border-primary/40 bg-surface'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4">
                  <RiLoader4Line size={32} className="animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Uploading…</h3>
                <p className="text-sm text-muted mt-1">Sending your file to our secure storage.</p>
              </>
            ) : status === 'uploaded' && fileMeta ? (
              <>
                <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center mb-4 shadow-md">
                  <RiFileTextLine size={32} />
                </div>
                <h3 className="text-lg font-semibold text-primary">Prescription Uploaded</h3>
                <p className="text-sm text-muted mt-1">{fileMeta.name} ({(fileMeta.size / 1024).toFixed(1)} KB)</p>
                <button onClick={() => setPrescriptionStatus('pending')} className="mt-6 text-accent text-sm font-medium hover:underline">
                  Upload a different file
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4">
                  <RiUploadCloud2Line size={32} />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">Upload your prescription</h3>
                <p className="text-sm text-muted mb-6 max-w-md">Drag and drop your PDF or image here, or click to browse. We'll verify it with our opticians before crafting your lenses.</p>
                
                <label className="bg-primary text-white px-8 py-3 rounded-full font-medium cursor-pointer hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  Browse Files
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                </label>
                {uploadError && <p className="text-sm text-red-500 mt-4 max-w-md">{uploadError}</p>}
              </>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-6">Enter Your Details</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Right Eye (OD) */}
              <div className="space-y-4">
                <h4 className="font-medium text-accent bg-accent/10 px-3 py-1 rounded-md inline-block">Right Eye (OD)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">SPH</label>
                    <input type="text" placeholder="-1.50" value={manual.rightEyeSphere} onChange={e => handleManualChange('rightEyeSphere', e.target.value)} className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">CYL</label>
                    <input type="text" placeholder="-0.50" value={manual.rightEyeCylinder} onChange={e => handleManualChange('rightEyeCylinder', e.target.value)} className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">AXIS</label>
                    <input type="text" placeholder="180" value={manual.rightEyeAxis} onChange={e => handleManualChange('rightEyeAxis', e.target.value)} className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                  </div>
                </div>
              </div>
              
              {/* Left Eye (OS) */}
              <div className="space-y-4">
                <h4 className="font-medium text-accent bg-accent/10 px-3 py-1 rounded-md inline-block">Left Eye (OS)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">SPH</label>
                    <input type="text" placeholder="-1.25" value={manual.leftEyeSphere} onChange={e => handleManualChange('leftEyeSphere', e.target.value)} className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">CYL</label>
                    <input type="text" placeholder="-0.75" value={manual.leftEyeCylinder} onChange={e => handleManualChange('leftEyeCylinder', e.target.value)} className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">AXIS</label>
                    <input type="text" placeholder="170" value={manual.leftEyeAxis} onChange={e => handleManualChange('leftEyeAxis', e.target.value)} className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-primary/10 pt-6 max-w-xs">
              <label className="block text-sm font-medium text-primary mb-2">Pupillary Distance (PD)</label>
              <div className="flex items-center gap-3">
                <input type="text" placeholder="62" value={manual.pdValue} onChange={e => handleManualChange('pdValue', e.target.value)} className="w-24 rounded-lg border border-primary/20 px-3 py-2 text-sm focus:border-accent outline-none" />
                <span className="text-sm text-muted">mm</span>
              </div>
            </div>
            
            {status === 'manual' && (
              <div className="mt-6 flex items-center gap-2 text-sm text-accent bg-accent/5 p-3 rounded-lg border border-accent/20">
                <RiCheckLine size={18} />
                <span>Prescription details saved.</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plano' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 mx-auto">
              <RiCheckLine size={32} />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Prescription Needed</h3>
            <p className="text-muted max-w-md mx-auto">You've selected Plano (Power 0) lenses. These lenses have no corrective power and are perfect for fashion, computer glasses, or reading glasses over contacts.</p>
          </div>
        )}

        {activeTab === 'later' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4 mx-auto">
              <RiTimeLine size={32} />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">Provide it later</h3>
            <p className="text-muted max-w-md mx-auto mb-6">We'll email you a secure link to enter or upload your prescription after checkout. Your order will be on hold until we receive it.</p>
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-lg text-sm">
              <RiErrorWarningLine />
              <span>This may delay your estimated delivery date.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
