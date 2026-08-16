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
  Smartphone
} from 'lucide-react';
import { Student, Staff, AttendanceRecord } from '../types';
import { soundFx } from '../utils/audio';

interface QRScannerKioskProps {
  students: Student[];
  staff: Staff[];
  onRecordAttendance: (record: AttendanceRecord) => void;
  gateLocation: string;
  soundEnabled: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const QRScannerKiosk: React.FC<QRScannerKioskProps> = ({
  students,
  staff,
  onRecordAttendance,
  gateLocation,
  soundEnabled,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [scanType, setScanType] = useState<'check-in' | 'check-out'>('check-in');
  const [activeCamera, setActiveCamera] = useState<boolean>(false);
  const [manualQuery, setManualQuery] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<AttendanceRecord | null>(null);
  const [scanAnimationActive, setScanAnimationActive] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<string>('36.5°C');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize camera when activeCamera is toggled
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (activeCamera) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraError(null);
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
          setCameraError('Camera access not granted or not available on this device. You can test with the quick test badges or manual ID search.');
          setActiveCamera(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeCamera]);

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

    // Play sound FX
    if (soundEnabled) {
      if (status === 'on-time') {
        soundFx.playSuccess();
      } else {
        soundFx.playWarning();
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

    // Not found warning
    if (soundEnabled) soundFx.playWarning();
    alert(`No student or staff ID matching "${manualQuery}". Please verify admission or employee ID.`);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-6 overflow-y-auto' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-400 text-indigo-950 font-black shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Gate QR Scanner & Kiosk Terminal</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold">
                ONLINE
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Active Terminal: <span className="text-indigo-900 font-bold">{gateLocation}</span>
            </p>
          </div>
        </div>

        {/* Scan Type Toggle & Fullscreen control */}
        <div className="flex items-center gap-3">
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

          <button
            onClick={onToggleFullscreen}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Kiosk Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

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
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br" />

              {/* Scan Mode Pill Badge */}
              <div className="absolute bottom-3 bg-indigo-900/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-indigo-700 text-[11px] font-mono text-amber-300 font-bold z-20">
                {scanType === 'check-in' ? '🟢 Gate Arrival Mode' : '🔵 Afternoon Pickup Mode'}
              </div>
            </div>

            {/* Camera Switcher & Manual Input Row */}
            <div className="w-full max-w-md mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveCamera(!activeCamera)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    activeCamera
                      ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  {activeCamera ? (
                    <>
                      <CameraOff className="w-4 h-4 text-rose-600" />
                      <span>Stop Webcam Stream</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-indigo-700" />
                      <span>Start Webcam Scanner</span>
                    </>
                  )}
                </button>
              </div>

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
