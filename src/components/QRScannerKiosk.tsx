import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  UserCheck, 
  Clock, 
  Maximize2, 
  Minimize2, 
  Zap, 
  User, 
  ArrowRight,
  ShieldAlert,
  Send,
  Smartphone,
  Volume2,
  Volume1,
  VolumeX,
  Sliders,
  Play,
  Check,
  Music,
  Settings2,
  ChevronDown,
  ChevronUp,
  SwitchCamera,
  FlipHorizontal,
  RotateCw
} from 'lucide-react';
import { Student, Staff, AttendanceRecord, SchoolSettings } from '../types';
import { 
  soundFx, 
  SuccessSoundType, 
  FailSoundType, 
  SUCCESS_SOUND_OPTIONS, 
  FAIL_SOUND_OPTIONS 
} from '../utils/audio';

interface QRScannerKioskProps {
  students: Student[];
  staff: Staff[];
  schoolSettings?: SchoolSettings;
  onRecordAttendance: (record: AttendanceRecord) => void;
  gateLocation: string;
  soundEnabled: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const QRScannerKiosk: React.FC<QRScannerKioskProps> = ({
  students,
  staff,
  schoolSettings,
  onRecordAttendance,
  gateLocation,
  soundEnabled,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [scanType, setScanType] = useState<'check-in' | 'check-out'>('check-in');
  const [activeCamera, setActiveCamera] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [manualQuery, setManualQuery] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<AttendanceRecord | null>(null);
  const [scanAnimationActive, setScanAnimationActive] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<string>('36.5°C');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Audio configuration state with localStorage persistence
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);
  
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kiosk_audio_volume');
      if (saved !== null) return parseInt(saved, 10);
    } catch {
      // fallback
    }
    return 80; // 80% default
  });

  const [successSound, setSuccessSound] = useState<SuccessSoundType>(() => {
    try {
      const saved = localStorage.getItem('kiosk_success_sound') as SuccessSoundType;
      if (saved && SUCCESS_SOUND_OPTIONS.some((o) => o.id === saved)) return saved;
    } catch {
      // fallback
    }
    return 'chime';
  });

  const [failSound, setFailSound] = useState<FailSoundType>(() => {
    try {
      const saved = localStorage.getItem('kiosk_fail_sound') as FailSoundType;
      if (saved && FAIL_SOUND_OPTIONS.some((o) => o.id === saved)) return saved;
    } catch {
      // fallback
    }
    return 'buzz';
  });

  // Sync volume with soundFx utility
  useEffect(() => {
    soundFx.setVolume(volume / 100);
    try {
      localStorage.setItem('kiosk_audio_volume', volume.toString());
    } catch {
      // ignore
    }
  }, [volume]);

  // Persist sound choices
  const handleSuccessSoundChange = (sound: SuccessSoundType) => {
    setSuccessSound(sound);
    soundFx.playSuccess(sound, volume / 100);
    try {
      localStorage.setItem('kiosk_success_sound', sound);
    } catch {
      // ignore
    }
  };

  const handleFailSoundChange = (sound: FailSoundType) => {
    setFailSound(sound);
    soundFx.playWarning(sound, volume / 100);
    try {
      localStorage.setItem('kiosk_fail_sound', sound);
    } catch {
      // ignore
    }
  };

  // Quick test triggers for the operator
  const testSuccessSound = (e: React.MouseEvent, soundToTest: SuccessSoundType) => {
    e.stopPropagation();
    soundFx.playSuccess(soundToTest, volume / 100);
  };

  const testFailSound = (e: React.MouseEvent, soundToTest: FailSoundType) => {
    e.stopPropagation();
    soundFx.playWarning(soundToTest, volume / 100);
  };

  // Enumerate camera devices when permissions are granted
  const refreshCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (err) {
      console.warn('Could not enumerate video devices:', err);
    }
  };

  // Initialize camera when activeCamera, facingMode, or selectedDeviceId changes
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    if (activeCamera) {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const startStream = async () => {
        try {
          let s: MediaStream;
          try {
            s = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (firstErr) {
            // Graceful fallback for single-camera devices where exact/ideal facingMode might fail
            console.warn('Primary camera constraint failed, attempting generic video fallback:', firstErr);
            s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }

          if (isCancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }

          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraError(null);
          refreshCameraDevices();
        } catch (err: any) {
          if (isCancelled) return;
          console.warn('Camera access denied or unavailable:', err);
          setCameraError('Camera access not granted or camera not available. You can also test with the rapid badge deck or manual ID search.');
          setActiveCamera(false);
        }
      };

      startStream();
    }

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [activeCamera, facingMode, selectedDeviceId]);

  // Turn / Flip camera to Back or Front
  const handleToggleCameraFacing = () => {
    if (videoDevices.length > 1 && selectedDeviceId) {
      // Cycle through multiple detected camera devices
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
    } else {
      // Toggle facingMode between back (environment) and front (user)
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
      setSelectedDeviceId('');
    }
  };

  const triggerScanSuccess = (
    entity: { student?: Student; staff?: Staff },
    forcedStatus?: 'on-time' | 'late'
  ) => {
    setScanAnimationActive(true);
    setTimeout(() => setScanAnimationActive(false), 1200);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const dateStr = now.toISOString().split('T')[0];

    // Determine status (if check-in and after 8:00 AM, mark Late unless forced)
    let status: 'on-time' | 'late' = 'on-time';
    if (forcedStatus) {
      status = forcedStatus;
    } else if (scanType === 'check-in') {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      if (hours > 8 || (hours === 8 && minutes > 5)) {
        status = 'late';
      }
    }

    // Play operator configured sound FX
    if (soundEnabled && volume > 0) {
      if (status === 'on-time') {
        soundFx.playSuccess(successSound, volume / 100);
      } else {
        soundFx.playWarning(failSound, volume / 100);
      }
    }

    let newRecord: AttendanceRecord;

    if (entity.student) {
      const s = entity.student;
      newRecord = {
        id: `att_${Date.now()}_${s.id}`,
        entityType: 'student',
        entityId: s.id,
        entityName: `${s.firstName} ${s.lastName}`,
        admissionOrStaffId: s.admissionNumber,
        roleOrClass: s.classSection,
        photoUrl: s.photoUrl,
        timestamp: now.toISOString(),
        dateStr,
        timeStr,
        type: scanType,
        status,
        gateLocation,
        temperature: `${(36.2 + Math.random() * 0.6).toFixed(1)}°C`,
        scannedBy: 'Gate Scanner Terminal #1',
        notificationStatus: {
          pushSent: true,
          emailSent: true,
          smsSent: status === 'late',
          parentNotifiedName: s.parentName,
          parentPhone: s.parentPhone,
          parentEmail: s.parentEmail,
        },
      };
    } else if (entity.staff) {
      const st = entity.staff;
      newRecord = {
        id: `att_${Date.now()}_${st.id}`,
        entityType: 'staff',
        entityId: st.id,
        entityName: `${st.firstName} ${st.lastName}`,
        admissionOrStaffId: st.employeeId,
        roleOrClass: st.role,
        photoUrl: st.photoUrl,
        timestamp: now.toISOString(),
        dateStr,
        timeStr,
        type: scanType,
        status,
        gateLocation,
        temperature: `${(36.3 + Math.random() * 0.5).toFixed(1)}°C`,
        scannedBy: 'Staff Turnstile Scanner',
        notificationStatus: {
          pushSent: true,
          emailSent: false,
          smsSent: false,
        },
      };
    } else {
      return;
    }

    onRecordAttendance(newRecord);
    setLastScannedResult(newRecord);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    const q = manualQuery.toLowerCase().trim();

    // Check student match
    const matchedStudent = students.find(
      (s) =>
        s.admissionNumber.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    );

    if (matchedStudent) {
      triggerScanSuccess({ student: matchedStudent });
      setManualQuery('');
      return;
    }

    // Check staff match
    const matchedStaff = staff.find(
      (st) =>
        st.employeeId.toLowerCase().includes(q) ||
        st.firstName.toLowerCase().includes(q) ||
        st.lastName.toLowerCase().includes(q)
    );

    if (matchedStaff) {
      triggerScanSuccess({ staff: matchedStaff });
      setManualQuery('');
      return;
    }

    // Not found warning with custom sound
    if (soundEnabled && volume > 0) {
      soundFx.playWarning(failSound, volume / 100);
    }
    alert(`No student or staff ID matching "${manualQuery}". Please verify admission or employee ID.`);
  };

  const selectedSuccessLabel = SUCCESS_SOUND_OPTIONS.find((s) => s.id === successSound)?.name || 'Default';
  const selectedFailLabel = FAIL_SOUND_OPTIONS.find((s) => s.id === failSound)?.name || 'Default';

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-6 overflow-y-auto' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          {schoolSettings?.logoUrl ? (
            <div className="w-12 h-12 rounded-xl bg-indigo-950 p-1 flex items-center justify-center shrink-0 border border-indigo-800 shadow-xs overflow-hidden">
              <img
                src={schoolSettings.logoUrl}
                alt="School Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-400 text-indigo-950 font-black shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{schoolSettings?.shortName ? `${schoolSettings.shortName} Gate Terminal` : 'Gate QR Scanner & Kiosk'}</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold">
                ONLINE
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {schoolSettings?.schoolName ? `${schoolSettings.schoolName} • ` : ''}Active Gate: <span className="text-indigo-900 font-bold">{gateLocation}</span>
            </p>
          </div>
        </div>

        {/* Scan Type Toggle, Audio Options Toggle & Fullscreen control */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => setScanType('check-in')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scanType === 'check-in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Morning Check-in
            </button>
            <button
              onClick={() => setScanType('check-out')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scanType === 'check-out'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Afternoon Pickup
            </button>
          </div>

          {/* Audio Feedback Settings Toggle Button */}
          <button
            onClick={() => setShowAudioSettings(!showAudioSettings)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showAudioSettings
                ? 'bg-indigo-900 text-white border-indigo-800 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Audio & Volume Controls"
          >
            {volume === 0 || !soundEnabled ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4 text-amber-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            )}
            <span className="hidden sm:inline">Audio: {volume === 0 || !soundEnabled ? 'Muted' : `${volume}%`}</span>
            {showAudioSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Kiosk Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Operator Audio & Sound Selection Control Panel */}
      {showAudioSettings && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-md space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-100">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Terminal Audio Feedback & Volume Calibration
                </h3>
                <p className="text-xs text-slate-500">
                  Adjust acoustic alerts for noisy gate environments or quiet indoor turnstiles.
                </p>
              </div>
            </div>

            {/* Quick Environment Preset Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setVolume(100);
                  setSuccessSound('pos');
                  setFailSound('siren');
                  soundFx.playSuccess('pos', 1.0);
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                Outdoor Gate (100%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVolume(50);
                  setSuccessSound('chime');
                  setFailSound('buzz');
                  soundFx.playSuccess('chime', 0.5);
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                Indoor Foyer (50%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVolume(20);
                  setSuccessSound('marimba');
                  setFailSound('click');
                  soundFx.playSuccess('marimba', 0.2);
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                Quiet Library (20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Master Volume Control Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Master Volume</span>
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-950">
                  {volume}%
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-900"
                />
                
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Mute)</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100% (Max)</span>
                </div>
              </div>

              {/* Mute / Unmute & Test Tone */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setVolume(volume === 0 ? 80 : 0)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    volume === 0
                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{volume === 0 ? 'Unmute' : 'Mute'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => soundFx.playSuccess(successSound, volume / 100)}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-indigo-900 hover:bg-indigo-800 text-white shadow-2xs flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Test Tone</span>
                </button>
              </div>
            </div>

            {/* Column 2: Success Sound Tone Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scan Success Sound</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedSuccessLabel}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {SUCCESS_SOUND_OPTIONS.map((option) => {
                  const isSelected = successSound === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSuccessSoundChange(option.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {option.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {option.tag}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => testSuccessSound(e, option.id)}
                          className="p-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors"
                          title={`Preview ${option.name}`}
                        >
                          <Play className="w-3 h-3 fill-emerald-800" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Fail / Late Warning Sound Tone Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Late & Warning Sound</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedFailLabel}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {FAIL_SOUND_OPTIONS.map((option) => {
                  const isSelected = failSound === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleFailSoundChange(option.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-rose-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {option.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {option.tag}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => testFailSound(e, option.id)}
                          className="p-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-900 transition-colors"
                          title={`Preview ${option.name}`}
                        >
                          <Play className="w-3 h-3 fill-rose-800" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="text-amber-800 font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Scanner Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Camera Viewfinder & Laser Scanner */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] shadow-sm">
            {/* Viewfinder Target Area */}
            <div className="relative w-full max-w-sm aspect-square bg-indigo-950 rounded-2xl border-2 border-dashed border-amber-400/60 p-4 flex flex-col items-center justify-center overflow-hidden shadow-xl">
              {activeCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-16 h-16 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center mx-auto text-amber-400">
                    <QrCode className="w-8 h-8 animate-pulse" />
                  </div>
                  <h4 className="font-black text-white text-sm">Present Student or Staff QR Badge</h4>
                  <p className="text-xs text-indigo-200 max-w-xs leading-relaxed font-medium">
                    Hold badge 15cm from camera or select from the rapid test deck below.
                  </p>
                </div>
              )}

              {/* Animated Laser Scanning Line */}
              <div
                className={`absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.9)] transition-all duration-1000 ${
                  scanAnimationActive ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] scale-y-150' : 'animate-bounce'
                }`}
                style={{ top: scanAnimationActive ? '50%' : '30%' }}
              />

              {/* Corner Viewfinder Brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl pointer-events-none" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br pointer-events-none" />

              {/* Live Camera Facing Mode Indicator & Quick Flip Button (When Active) */}
              {activeCamera && (
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-300 border border-slate-700/80 flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{facingMode === 'environment' ? '📷 Back / Rear Camera' : '🤳 Front / Selfie Camera'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleToggleCameraFacing}
                    className="p-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-amber-400 border border-amber-400/50 backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center gap-1.5 text-[11px] font-bold px-2.5"
                    title="Turn camera to Back or Front"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                </div>
              )}

              {/* Scan Mode Pill Badge */}
              <div className="absolute bottom-3 bg-indigo-900/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-indigo-700 text-[11px] font-mono text-amber-300 font-bold z-20">
                {scanType === 'check-in' ? '🟢 Gate Arrival Mode' : '🔵 Afternoon Pickup Mode'}
              </div>
            </div>

            {/* Camera Switcher & Manual Input Row */}
            <div className="w-full max-w-md mt-5 space-y-3">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveCamera(!activeCamera)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    activeCamera
                      ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                      : 'bg-indigo-900 hover:bg-indigo-800 text-white border-indigo-900 shadow-xs'
                  }`}
                >
                  {activeCamera ? (
                    <>
                      <CameraOff className="w-4 h-4 text-rose-600" />
                      <span>Stop Scanner</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Start Webcam Scanner</span>
                    </>
                  )}
                </button>

                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={handleToggleCameraFacing}
                  className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-2xs"
                  title="Turn camera back (rear) or front (selfie)"
                >
                  <SwitchCamera className="w-4 h-4 text-indigo-700" />
                  <span>{facingMode === 'environment' ? 'Turn to Front' : 'Turn to Back'}</span>
                </button>
              </div>

              {/* Multi-Device Camera Selector if multiple hardware cameras detected */}
              {videoDevices.length > 1 && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <SwitchCamera className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  <span className="font-bold text-slate-700 shrink-0">Camera Device:</span>
                  <select
                    value={selectedDeviceId || ''}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Default ({facingMode === 'environment' ? 'Back' : 'Front'})</option>
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Manual Barcode / Name Input Form */}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Type Admission No, Staff ID, or Name (e.g. HEA/2026/0101)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                >
                  Scan ID
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Col: Instant Live Scan Result Card & Real-time Parent Notification Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <span>Instant Scan Confirmation</span>
              {lastScannedResult && (
                <span className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Verified
                </span>
              )}
            </h3>

            {lastScannedResult ? (
              <div className="space-y-4">
                {/* Person Bio Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
                  <img
                    src={lastScannedResult.photoUrl}
                    alt={lastScannedResult.entityName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-black text-indigo-700">
                        {lastScannedResult.admissionOrStaffId}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          lastScannedResult.status === 'on-time'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {lastScannedResult.status}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 truncate mt-0.5">
                      {lastScannedResult.entityName}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{lastScannedResult.roleOrClass}</p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-700 font-mono font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {lastScannedResult.timeStr}
                      </span>
                      <span>•</span>
                      <span>Temp: {lastScannedResult.temperature || '36.5°C'}</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Parent Push Notification Dispatch Receipt */}
                {lastScannedResult.entityType === 'student' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span>Real-Time Parent Push Dispatched</span>
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs">
                        DELIVERED
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-emerald-100">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Recipient:{' '}
                        <strong className="text-slate-900">
                          {lastScannedResult.notificationStatus?.parentNotifiedName}
                        </strong>
                      </p>
                      <p className="font-mono text-[11px] text-indigo-700 font-bold">
                        {lastScannedResult.notificationStatus?.parentPhone}
                      </p>
                      <p className="text-[11px] text-emerald-800 font-semibold italic pt-1 leading-relaxed">
                        &quot;🎓 Heritage Alert: {lastScannedResult.entityName} checked in safely at {lastScannedResult.gateLocation} at {lastScannedResult.timeStr}.&quot;
                      </p>
                    </div>
                  </div>
                )}

                {lastScannedResult.entityType === 'staff' && (
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-sky-700" />
                        <span>Staff Clock-In Registered</span>
                      </span>
                      <span className="text-[10px] bg-sky-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs">
                        RECONCILED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Clock-in recorded for payroll attendance reconciliation. Punctuality score updated.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
                <QrCode className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No scan recorded in this session yet.</p>
                <p className="text-[11px] text-slate-500">
                  Tap any student badge below to test gate check-in and parent push notification.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rapid Test Deck: Student & Staff Badges */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Rapid Test Deck (Tap any Badge to Simulate QR Scan)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Instantly simulates gate scan with sound, parent alert, and dashboard logging.
            </p>
          </div>
          <span className="text-xs text-slate-600 font-mono font-bold">
            {students.length} Students • {staff.length} Faculty
          </span>
        </div>

        {/* Student Test Badges Grid */}
        <div>
          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-2.5">
            Student ID Badges
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {students.map((std) => (
              <button
                key={std.id}
                onClick={() => triggerScanSuccess({ student: std })}
                className="group p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-2xl text-left transition-all flex flex-col items-center text-center relative shadow-2xs"
              >
                <div className="relative mb-2">
                  <img
                    src={std.photoUrl}
                    alt={std.firstName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 group-hover:border-indigo-600 transition-colors shadow-2xs"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-900">
                    {std.firstName} {std.lastName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{std.classSection}</p>
                  <span className="inline-block text-[9px] font-mono font-bold text-indigo-700 mt-1">
                    {std.admissionNumber}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Staff Test Badges Grid */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-2.5">
            Staff & Faculty ID Badges
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {staff.map((stf) => (
              <button
                key={stf.id}
                onClick={() => triggerScanSuccess({ staff: stf })}
                className="group p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-2xl text-left transition-all flex flex-col items-center text-center shadow-2xs"
              >
                <div className="relative mb-2">
                  <img
                    src={stf.photoUrl}
                    alt={stf.firstName}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 group-hover:border-sky-600 transition-colors shadow-2xs"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-sky-500 border-2 border-white" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900">
                    {stf.firstName} {stf.lastName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{stf.role}</p>
                  <span className="inline-block text-[9px] font-mono font-bold text-sky-700 mt-1">
                    {stf.employeeId}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

