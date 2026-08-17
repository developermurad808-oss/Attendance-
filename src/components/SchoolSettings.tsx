import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles,
  School,
  IdCard,
  MapPin,
  Mail,
  Phone,
  Globe,
  Sliders,
  DollarSign,
  Upload,
  Image,
  FileImage,
  Link as LinkIcon,
  Check,
  ExternalLink,
  AlertCircle,
  X,
  Eye,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { SchoolSettings, SchoolHouse } from '../types';
import { DEFAULT_SCHOOL_SETTINGS, PRESET_SCHOOL_CONFIGS, SAMPLE_SCHOOL_LOGOS } from '../data/defaultSettings';

interface SchoolSettingsProps {
  settings: SchoolSettings;
  onSaveSettings: (updated: SchoolSettings) => void;
  onResetSettings: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsProps> = ({
  settings,
  onSaveSettings,
  onResetSettings,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [newGateInput, setNewGateInput] = useState<string>('');
  const [newHouseName, setNewHouseName] = useState<string>('');
  const [newHouseColor, setNewHouseColor] = useState<string>('#6366F1');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'gate' | 'payroll' | 'houses'>('profile');

  // Logo upload & management local states
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState<string>('');
  const [showLogoUrlModal, setShowLogoUrlModal] = useState<boolean>(false);
  const [logoPreviewBg, setLogoPreviewBg] = useState<'dark' | 'light' | 'badge'>('dark');
  const [logoUploadNotice, setLogoUploadNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = (field: keyof SchoolSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Helper to process and optimize uploaded logo files
  const processLogoFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // If SVG, read as text or data URL directly to preserve vector crispness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          handleInputChange('logoUrl', result);
          setLogoUploadNotice(`Vector SVG Logo applied successfully (${(file.size / 1024).toFixed(1)} KB)`);
          setTimeout(() => setLogoUploadNotice(null), 4000);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // For PNG/JPG/WebP, use canvas resizing to ensure high quality while keeping data URL compact
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Use PNG to preserve transparency
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          handleInputChange('logoUrl', dataUrl);
          setLogoUploadNotice(`Logo uploaded & optimized (${width}×${height}px • ${(file.size / 1024).toFixed(1)} KB)`);
          setTimeout(() => setLogoUploadNotice(null), 4000);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleApplyLogoUrl = () => {
    if (!customLogoUrlInput.trim()) return;
    handleInputChange('logoUrl', customLogoUrlInput.trim());
    setCustomLogoUrlInput('');
    setShowLogoUrlModal(false);
    setLogoUploadNotice('Logo loaded from URL');
    setTimeout(() => setLogoUploadNotice(null), 4000);
  };

  const handleSelectPresetLogo = (presetDataUrl: string, name: string) => {
    handleInputChange('logoUrl', presetDataUrl);
    setLogoUploadNotice(`Applied preset crest: ${name}`);
    setTimeout(() => setLogoUploadNotice(null), 4000);
  };

  const handleRemoveLogo = () => {
    handleInputChange('logoUrl', undefined);
    setLogoUploadNotice('Logo removed. System will display standard initial badge.');
    setTimeout(() => setLogoUploadNotice(null), 4000);
  };

  const handleResetToDefaultLogo = () => {
    handleInputChange('logoUrl', SAMPLE_SCHOOL_LOGOS[0].dataUrl);
    setLogoUploadNotice('Reset to official Heritage of Excellence Academy crest.');
    setTimeout(() => setLogoUploadNotice(null), 4000);
  };

  const handleAddGate = () => {
    if (!newGateInput.trim()) return;
    if (formData.gateLocations.includes(newGateInput.trim())) return;
    setFormData((prev) => ({
      ...prev,
      gateLocations: [...prev.gateLocations, newGateInput.trim()],
    }));
    setNewGateInput('');
  };

  const handleRemoveGate = (gate: string) => {
    if (formData.gateLocations.length <= 1) {
      alert('At least one gate location must remain active in the system.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      gateLocations: prev.gateLocations.filter((g) => g !== gate),
    }));
  };

  const handleAddHouse = () => {
    if (!newHouseName.trim()) return;
    const newHouse: SchoolHouse = {
      name: newHouseName.trim(),
      color: newHouseColor,
      badgeColor: 'bg-indigo-600',
    };
    setFormData((prev) => ({
      ...prev,
      houses: [...prev.houses, newHouse],
    }));
    setNewHouseName('');
  };

  const handleRemoveHouse = (houseName: string) => {
    if (formData.houses.length <= 1) {
      alert('At least one house must be configured.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      houses: prev.houses.filter((h) => h.name !== houseName),
    }));
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_SCHOOL_CONFIGS.find((p) => p.id === presetId);
    if (!preset) return;
    if (confirm(`Apply preset configuration: "${preset.label}"?`)) {
      setFormData((prev) => ({
        ...prev,
        ...preset.settings,
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all school settings to system default?')) {
      setFormData(DEFAULT_SCHOOL_SETTINGS);
      onResetSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-900 text-amber-400">
              <School className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              School Profile & Institutional Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Customize school branding, gate attendance rules, assembly cut-off times, PenCom pension rates, and official leadership signatures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save School Settings</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-bold animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>School settings successfully updated! Changes are saved and applied to all ID badges, payslips, and gates.</span>
          </div>
        </div>
      )}

      {/* Preset Switcher Strip */}
      <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">Quick Institution Profile Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_SCHOOL_CONFIGS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.id)}
              className="px-3 py-1.5 bg-indigo-950/80 hover:bg-white/20 border border-indigo-700/60 rounded-xl text-[11px] font-bold text-indigo-100 transition-all"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'profile'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>School Identity & Leadership</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'gate'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Gate, Cut-Off & Attendance Rules</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'payroll'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payroll & Statutory Deductions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('houses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'houses'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>Houses & Co-Curricular</span>
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SUBTAB 1: School Profile & Leadership */}
        {activeSubTab === 'profile' && (
          <div className="space-y-6">
            {/* SCHOOL LOGO & INSTITUTIONAL CREST UPLOAD SECTION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-indigo-700" />
                    <span>Official School Logo & Institutional Crest</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Upload your school's official logo or choose an institutional crest. Appears across the top navigation, student ID cards, printed payslips, and gate terminals.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoUrlModal(!showLogoUrlModal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enter URL</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Logo URL Input Drawer */}
              {showLogoUrlModal && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Provide External Image URL</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLogoUrlModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customLogoUrlInput}
                      onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                      placeholder="https://example.com/assets/school-logo.png"
                      className="flex-1 bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-800 transition-colors whitespace-nowrap"
                    >
                      Apply Logo
                    </button>
                  </div>
                </div>
              )}

              {/* Status Notice */}
              {logoUploadNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{logoUploadNotice}</span>
                </div>
              )}

              {/* Main Upload / Dropzone & Live Multi-Surface Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left: Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleLogoDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`lg:col-span-7 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDraggingLogo
                      ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50/80 bg-slate-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3 shadow-2xs">
                    <Upload className="w-7 h-7 text-indigo-700" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mb-1">
                    Click to browse or Drag & Drop school logo file
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mb-3">
                    Supports PNG, JPG, JPEG, SVG, WebP, GIF. High-resolution images are automatically optimized for instant gate sync.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-100">
                    <Image className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Select Logo from Computer / Device</span>
                  </div>
                </div>

                {/* Right: Live Interactive Multi-Surface Preview */}
                <div className="lg:col-span-5 bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Live Branding Preview</span>
                    </span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLogoPreviewBg('dark')}
                        className={`px-2 py-0.5 rounded ${logoPreviewBg === 'dark' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600'}`}
                      >
                        Navy Topbar
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoPreviewBg('light')}
                        className={`px-2 py-0.5 rounded ${logoPreviewBg === 'light' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600'}`}
                      >
                        White Paper
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoPreviewBg('badge')}
                        className={`px-2 py-0.5 rounded ${logoPreviewBg === 'badge' ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600'}`}
                      >
                        Card Badge
                      </button>
                    </div>
                  </div>

                  {/* Surface Box */}
                  <div
                    className={`rounded-xl p-4 flex items-center justify-center transition-all min-h-[110px] border ${
                      logoPreviewBg === 'dark'
                        ? 'bg-indigo-950 border-indigo-900 text-white'
                        : logoPreviewBg === 'light'
                        ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                        : 'bg-gradient-to-r from-indigo-900 to-indigo-800 border-indigo-700 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full max-w-xs">
                      {formData.logoUrl ? (
                        <div className="w-14 h-14 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 overflow-hidden shadow-sm">
                          <img
                            src={formData.logoUrl}
                            alt="School Logo Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-amber-400 text-indigo-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-sm">
                          {formData.shortName ? formData.shortName.charAt(0) : 'H'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate">
                          {formData.schoolName || 'School Name'}
                        </div>
                        <div
                          className={`text-[10px] font-mono truncate ${
                            logoPreviewBg === 'light' ? 'text-indigo-600 font-bold' : 'text-amber-400'
                          }`}
                        >
                          {formData.motto || formData.shortName}
                        </div>
                        <div
                          className={`text-[9px] uppercase tracking-wider ${
                            logoPreviewBg === 'light' ? 'text-slate-500' : 'text-indigo-200'
                          }`}
                        >
                          {formData.stateCity.split(',')[0]} • Active
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      {formData.logoUrl ? '✓ Custom Logo Active' : 'No image uploaded (using acronym initial)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Default Crest</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Curated Institutional Logo Presets */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Or Select a Pre-Designed Institutional Crest Library:</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">6 High-Resolution Crests</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {SAMPLE_SCHOOL_LOGOS.map((sample) => {
                    const isSelected = formData.logoUrl === sample.dataUrl;
                    return (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectPresetLogo(sample.dataUrl, sample.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all relative group text-left ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-100 p-1 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                          <img
                            src={sample.dataUrl}
                            alt={sample.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="w-full text-center">
                          <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                            {sample.category}
                          </p>
                          <p className="text-[9px] text-slate-500 truncate mt-0.5">
                            {sample.name.split(' ')[0]} {sample.name.split(' ')[1]}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* General School Information Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-700" />
                  <span>General School Information</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Official institution details reflected across ID badges, letterheads, and parents portal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-800">Official School Name</label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Short Acronym / Code</label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => handleInputChange('shortName', e.target.value)}
                    placeholder="e.g. HEA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">School Motto</label>
                  <input
                    type="text"
                    value={formData.motto}
                    onChange={(e) => handleInputChange('motto', e.target.value)}
                    placeholder="e.g. Virtus et Scientia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Academic Session</label>
                <input
                  type="text"
                  value={formData.academicSession}
                  onChange={(e) => handleInputChange('academicSession', e.target.value)}
                  placeholder="e.g. 2026/2027 Academic Session"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Current Academic Term</label>
                <input
                  type="text"
                  value={formData.currentTerm}
                  onChange={(e) => handleInputChange('currentTerm', e.target.value)}
                  placeholder="e.g. First Term"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-800">Campus Physical Address</label>
                <input
                  type="text"
                  value={formData.campusAddress}
                  onChange={(e) => handleInputChange('campusAddress', e.target.value)}
                  placeholder="e.g. Plot 410, Mississippi St, Maitama District, Abuja"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">State / Territory</label>
                <input
                  type="text"
                  value={formData.stateCity}
                  onChange={(e) => handleInputChange('stateCity', e.target.value)}
                  placeholder="e.g. Abuja, Federal Capital Territory"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Official Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="info@school.sch.ng"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Official Phone Number</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+234 803 100 2000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">School Website Portal</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="www.school.sch.ng"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                Institutional Leadership & Official Signatures
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Executive Principal / Head of School</label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => handleInputChange('principalName', e.target.value)}
                    placeholder="e.g. Dr. Mrs. Funmilayo Adeleke-Kano"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Principal's Official Title</label>
                  <input
                    type="text"
                    value={formData.principalTitle}
                    onChange={(e) => handleInputChange('principalTitle', e.target.value)}
                    placeholder="e.g. Executive Principal & Director of Academics"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Chief Bursar / Financial Controller</label>
                  <input
                    type="text"
                    value={formData.bursarName}
                    onChange={(e) => handleInputChange('bursarName', e.target.value)}
                    placeholder="e.g. Alhaji Ibrahim Dantata"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Bursar's Official Title</label>
                  <input
                    type="text"
                    value={formData.bursarTitle}
                    onChange={(e) => handleInputChange('bursarTitle', e.target.value)}
                    placeholder="e.g. Chief Bursar & Financial Controller"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Gate & Attendance Rules */}
        {activeSubTab === 'gate' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-700" />
                <span>Punctuality & Assembly Cut-off Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure timing thresholds that automatically determine on-time versus late arrivals at scanning terminals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Morning Assembly Cut-Off Time</label>
                <input
                  type="time"
                  value={formData.morningCutoffTime}
                  onChange={(e) => handleInputChange('morningCutoffTime', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Scans after this time are marked as Late Arrival.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Dismissal / Checkout Time</label>
                <input
                  type="time"
                  value={formData.dismissalTime}
                  onChange={(e) => handleInputChange('dismissalTime', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Standard end of academic day.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Late Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.lateGracePeriodMinutes}
                  onChange={(e) => handleInputChange('lateGracePeriodMinutes', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Grace allowance before penalty triggers.</p>
              </div>
            </div>

            {/* Gate Locations Manager */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Active Campus Gate & Scanner Terminals
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.gateLocations.map((gate) => (
                  <div
                    key={gate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                    <span>{gate}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGate(gate)}
                      className="text-rose-600 hover:text-rose-800 ml-1"
                      title="Remove gate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-md pt-2">
                <input
                  type="text"
                  value={newGateInput}
                  onChange={(e) => setNewGateInput(e.target.value)}
                  placeholder="e.g. Secondary Science Wing Turnstile"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddGate}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Gate</span>
                </button>
              </div>
            </div>

            {/* Automation Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Gate Automation & Notification Dispatch
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.autoSendPushOnScan}
                    onChange={(e) => handleInputChange('autoSendPushOnScan', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Instant Push on Scan</span>
                    <span className="text-[11px] text-slate-500">Notify parent smartphone app</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.autoSendSmsOnLate}
                    onChange={(e) => handleInputChange('autoSendSmsOnLate', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Auto-SMS on Late Arrival</span>
                    <span className="text-[11px] text-slate-500">Dispatch SMS to Abuja lines</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.requireTemperatureCheck}
                    onChange={(e) => handleInputChange('requireTemperatureCheck', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Health Temperature Check</span>
                    <span className="text-[11px] text-slate-500">Prompt guard for thermal reading</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Payroll & Statutory Deductions */}
        {activeSubTab === 'payroll' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-700" />
                <span>Payroll, PenCom Pension & Statutory Tax Settings</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Nigerian labor compliance, statutory pension deductions (PRA 2014), and attendance penalty multipliers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">PenCom Statutory Pension (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={formData.statutoryPensionRate}
                  onChange={(e) => handleInputChange('statutoryPensionRate', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Standard employee rate: 8.0% of base + allowances.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Working Days Per Month Cycle</label>
                <input
                  type="number"
                  min="15"
                  max="31"
                  value={formData.workingDaysPerMonth}
                  onChange={(e) => handleInputChange('workingDaysPerMonth', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Expected clock-in days (default 22 days).</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Default Disbursement Bank</label>
                <select
                  value={formData.disbursementBankDefault}
                  onChange={(e) => handleInputChange('disbursementBankDefault', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="Zenith Bank PLC">Zenith Bank PLC</option>
                  <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTBank)</option>
                  <option value="Access Bank PLC">Access Bank PLC</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                </select>
                <p className="text-[11px] text-slate-500">School master corporate account.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Late Arrival Penalty (₦)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.latePenaltyPerOccurrence}
                  onChange={(e) => handleInputChange('latePenaltyPerOccurrence', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Deduction per late occurrence after grace.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Unexcused Absence Penalty (₦)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.unexcusedAbsencePenaltyDaily}
                  onChange={(e) => handleInputChange('unexcusedAbsencePenaltyDaily', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500">Daily unexcused absenteeism charge.</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Primary Currency</label>
                <input
                  type="text"
                  value="₦ (Nigerian Naira - NGN)"
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600"
                />
                <p className="text-[11px] text-slate-500">Default Central Bank of Nigeria tender.</p>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: Houses & Co-Curricular */}
        {activeSubTab === 'houses' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-indigo-700" />
                <span>School House System & Badges</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pastoral house assignments displayed on student smart ID badges and inter-house events.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {formData.houses.map((house) => (
                <div
                  key={house.name}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shadow-xs"
                        style={{ backgroundColor: house.color }}
                      />
                      <span className="font-bold text-xs text-slate-900">{house.name} House</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHouse(house.name)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Color: {house.color}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="House Name (e.g. Diamond)"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newHouseColor}
                  onChange={(e) => setNewHouseColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-mono">{newHouseColor}</span>
              </div>
              <button
                type="button"
                onClick={handleAddHouse}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add House</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Button Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
