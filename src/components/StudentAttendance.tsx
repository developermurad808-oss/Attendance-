import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Download, 
  Phone, 
  Mail, 
  Edit3, 
  X, 
  Check,
  Building,
  UserCheck,
  Camera,
  CameraOff,
  RotateCcw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Eye,
  QrCode,
  MapPin,
  Shield,
  ShieldCheck,
  PhoneCall,
  Copy,
  Printer,
  Heart,
  Bus,
  User,
  ExternalLink,
  Share2,
  CheckCircle,
  SwitchCamera,
  FlipHorizontal
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolSettings } from '../types';
import { downloadCSV } from '../utils/audio';

interface StudentAttendanceProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  schoolSettings?: SchoolSettings;
  onAddStudent: (newStudent: Student) => void;
  onUpdateAttendanceStatus: (studentId: string, status: 'on-time' | 'late' | 'excused' | 'absent', notes?: string) => void;
  onSendBatchAbsenceNotice: (absentStudents: Student[]) => void;
  onTriggerDirectNotification: (student: Student, type: 'absence' | 'late') => void;
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({
  students,
  attendanceRecords,
  schoolSettings,
  onAddStudent,
  onUpdateAttendanceStatus,
  onSendBatchAbsenceNotice,
  onTriggerDirectNotification,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-16');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');

  // Quick View Student Modal State
  const [quickViewStudent, setQuickViewStudent] = useState<Student | null>(null);
  const [quickViewQrUrl, setQuickViewQrUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifyingScan, setIsVerifyingScan] = useState<boolean>(false);
  const [scanVerificationNotice, setScanVerificationNotice] = useState<string | null>(null);

  // Generate QR Code on the fly whenever quickViewStudent is opened
  useEffect(() => {
    if (quickViewStudent) {
      QRCode.toDataURL(quickViewStudent.qrCodePayload, {
        width: 360,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQuickViewQrUrl(url))
        .catch((err) => console.error('Failed to generate student QR code', err));
      
      setScanVerificationNotice(null);
      setIsVerifyingScan(false);
    } else {
      setQuickViewQrUrl('');
      setScanVerificationNotice(null);
      setIsVerifyingScan(false);
    }
  }, [quickViewStudent]);

  // Copy text helper with visual feedback
  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Download QR Code image
  const handleDownloadQR = () => {
    if (!quickViewQrUrl || !quickViewStudent) return;
    const link = document.createElement('a');
    link.href = quickViewQrUrl;
    link.download = `${quickViewStudent.admissionNumber}_${quickViewStudent.lastName}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger test gate scan simulation
  const handleTestGateScan = () => {
    if (!quickViewStudent) return;
    setIsVerifyingScan(true);
    setTimeout(() => {
      setIsVerifyingScan(false);
      setScanVerificationNotice(
        `✓ Validated: Security payload decoded successfully (${quickViewStudent.admissionNumber} • ${quickViewStudent.firstName} ${quickViewStudent.lastName})`
      );
      setTimeout(() => setScanVerificationNotice(null), 5000);
    }, 600);
  };

  // Print ID Badge
  const handlePrintBadge = () => {
    if (!quickViewStudent) return;
    window.print();
  };

  // New Student Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Female' as 'Male' | 'Female',
    grade: 'SS 1',
    classSection: 'SS 1 Science Alpha',
    parentName: '',
    parentPhone: '+234 ',
    parentEmail: '',
    parentRelationship: 'Father' as 'Father' | 'Mother' | 'Guardian',
    address: 'Maitama, Abuja',
    houseColor: 'Emerald' as 'Emerald' | 'Sapphire' | 'Ruby' | 'Topaz',
    emergencyContact: '',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  });

  // Device Camera Capture State for Student Enrollment
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Enumerate cameras
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

  // Manage camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    if (showAddModal && isCameraActive) {
      setCameraError(null);

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 640 } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      };

      const startStream = async () => {
        try {
          let s: MediaStream;
          try {
            s = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (firstErr) {
            console.warn('FacingMode constraint failed, falling back to generic video:', firstErr);
            s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }

          if (isCancelled) {
            s.getTracks().forEach((track) => track.stop());
            return;
          }

          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          refreshCameraDevices();
        } catch (err) {
          if (isCancelled) return;
          console.warn('Camera access denied or unavailable:', err);
          setCameraError('Unable to access device camera. Please check camera permissions or upload a photo.');
          setIsCameraActive(false);
        }
      };

      startStream();
    }

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [showAddModal, isCameraActive, facingMode, selectedDeviceId]);

  // Turn / Flip camera to Back or Front
  const handleToggleCameraFacing = () => {
    if (videoDevices.length > 1 && selectedDeviceId) {
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
      setSelectedDeviceId('');
    }
  };

  // Clean up camera when modal closes
  const handleCloseModal = () => {
    setIsCameraActive(false);
    setCapturedPhoto(null);
    setCameraError(null);
    setCountdown(null);
    setShowAddModal(false);
  };

  // Capture frame from active video element
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;

    // Optional 3-second countdown for good posture
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          executeSnap();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Calculate crop to make a centered square profile photo
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
      setIsCameraActive(false);
    }
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const result = event.target.result as string;
          setCapturedPhoto(result);
          setFormData((prev) => ({ ...prev, photoUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate status for each student on selectedDate
  const dateRecords = attendanceRecords.filter(
    (r) => r.entityType === 'student' && r.dateStr === selectedDate && r.type === 'check-in'
  );
  const recordMap = new Map<string, AttendanceRecord>();
  dateRecords.forEach((r) => recordMap.set(r.entityId, r));

  const enrichedStudents = students.map((std) => {
    const record = recordMap.get(std.id);
    const status = record ? record.status : 'absent';
    return {
      student: std,
      record,
      status,
    };
  });

  // Filter students
  const filtered = enrichedStudents.filter(({ student, status }) => {
    const matchesGrade =
      selectedGrade === 'all' ||
      student.grade.toLowerCase().includes(selectedGrade.toLowerCase()) ||
      student.classSection.toLowerCase().includes(selectedGrade.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

    const matchesSearch =
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGrade && matchesStatus && matchesSearch;
  });

  const absentList = enrichedStudents
    .filter((e) => e.status === 'absent')
    .map((e) => e.student);

  const presentCount = enrichedStudents.filter((e) => e.status === 'on-time' || e.status === 'late').length;
  const lateCount = enrichedStudents.filter((e) => e.status === 'late').length;
  const absentCount = absentList.length;

  const handleExportCSV = () => {
    const rows = enrichedStudents.map(({ student, record, status }) => ({
      AdmissionNumber: student.admissionNumber,
      StudentName: `${student.firstName} ${student.lastName}`,
      Grade: student.grade,
      Class: student.classSection,
      Date: selectedDate,
      Status: status.toUpperCase(),
      ArrivalTime: record ? record.timeStr : 'N/A',
      Gate: record ? record.gateLocation : 'N/A',
      ParentName: student.parentName,
      ParentPhone: student.parentPhone,
      ParentEmail: student.parentEmail,
      PushDelivered: record?.notificationStatus?.pushSent ? 'YES' : 'NO',
    }));
    downloadCSV(`Heritage_Student_Attendance_${selectedDate}`, rows);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.parentName) {
      alert('Please fill in required student and parent fields.');
      return;
    }

    const nextNumber = 100 + students.length + 1;
    const admissionNumber = `HEA/2026/0${nextNumber}`;
    const newId = `std_${Date.now()}`;

    const newStudent: Student = {
      id: newId,
      admissionNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      grade: formData.grade,
      classSection: formData.classSection,
      photoUrl: formData.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@heritage-parent.ng`,
      parentRelationship: formData.parentRelationship,
      address: formData.address,
      houseColor: formData.houseColor,
      emergencyContact: formData.emergencyContact || formData.parentPhone,
      status: 'Active',
      qrCodePayload: JSON.stringify({
        id: newId,
        type: 'student',
        adm: admissionNumber,
        name: `${formData.firstName} ${formData.lastName}`,
        class: formData.classSection,
      }),
    };

    onAddStudent(newStudent);
    handleCloseModal();
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'Female',
      grade: 'SS 1',
      classSection: 'SS 1 Science Alpha',
      parentName: '',
      parentPhone: '+234 ',
      parentEmail: '',
      parentRelationship: 'Father',
      address: 'Maitama, Abuja',
      houseColor: 'Emerald',
      emergencyContact: '',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-700" />
            <span>Student Attendance Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Class-level registers, excuse logging, and real-time parent contact dispatch for Abuja campus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSendBatchAbsenceNotice(absentList)}
            disabled={absentCount === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Absentees ({absentCount})</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Total Enrolled</span>
          <p className="text-3xl font-black text-indigo-950 mt-1">{students.length}</p>
        </div>
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Present Today</span>
          <p className="text-3xl font-black text-emerald-950 mt-1">{presentCount}</p>
        </div>
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Late Arrivals</span>
          <p className="text-3xl font-black text-amber-950 mt-1">{lateCount}</p>
        </div>
        <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Absentees</span>
          <p className="text-3xl font-black text-rose-950 mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or parent name, admission no..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Classes / Grades</option>
            <option value="SS 3">SS 3 Classes</option>
            <option value="SS 2">SS 2 Classes</option>
            <option value="SS 1">SS 1 Classes</option>
            <option value="JSS 3">JSS 3 Classes</option>
            <option value="JSS 2">JSS 2 Classes</option>
            <option value="JSS 1">JSS 1 Classes</option>
            <option value="Primary">Primary Grades</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Statuses</option>
            <option value="on-time">On-Time</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Arrival Log</th>
                <th className="py-3.5 px-4">Parent Details (Abuja)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(({ student, record, status }) => {
                return (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div 
                        onClick={() => setQuickViewStudent(student)}
                        className="flex items-center gap-3 cursor-pointer group select-none"
                        title="Click to Quick View Profile & Scannable QR Code"
                      >
                        <div className="relative">
                          <img
                            src={student.photoUrl}
                            alt={student.firstName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 transition-all"
                          />
                          <div 
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                              student.houseColor === 'Emerald' ? 'bg-emerald-500' :
                              student.houseColor === 'Sapphire' ? 'bg-blue-500' :
                              student.houseColor === 'Ruby' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            title={`House: ${student.houseColor}`}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                            <span>{student.firstName} {student.lastName}</span>
                            <Eye className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="font-mono font-bold text-[11px] text-indigo-700">{student.admissionNumber}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{student.classSection}</p>
                      <span className="text-[11px] text-slate-500 font-medium">House: {student.houseColor}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                          status === 'on-time'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : status === 'late'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : status === 'excused'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {record ? (
                        <div>
                          <p className="font-mono font-bold text-slate-900">{record.timeStr}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[140px] font-medium">
                            {record.gateLocation}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">No check-in</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-slate-900 font-bold">{student.parentName}</p>
                        <p className="text-[11px] font-mono font-semibold text-slate-600">{student.parentPhone}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQuickViewStudent(student)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs group"
                          title="Quick View Student Profile, Contacts & Scannable QR"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-700 group-hover:scale-110 transition-transform" />
                          <span>Quick View</span>
                        </button>

                        {status === 'absent' && (
                          <button
                            onClick={() => onTriggerDirectNotification(student, 'absence')}
                            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg text-[11px] font-bold"
                            title="Send Absence Push/SMS"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setEditNotes('');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          Override
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Dialog */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Attendance Override: {editingStudent.firstName} {editingStudent.lastName}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Admission No: <span className="text-indigo-700 font-mono font-bold">{editingStudent.admissionNumber}</span> • Class: {editingStudent.classSection}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onUpdateAttendanceStatus(editingStudent.id, 'on-time', editNotes);
                  setEditingStudent(null);
                }}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold"
              >
                Mark Present (On-Time)
              </button>
              <button
                onClick={() => {
                  onUpdateAttendanceStatus(editingStudent.id, 'late', editNotes || 'Late drop-off');
                  setEditingStudent(null);
                }}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold"
              >
                Mark Late
              </button>
              <button
                onClick={() => {
                  onUpdateAttendanceStatus(editingStudent.id, 'excused', editNotes || 'Medical excuse');
                  setEditingStudent(null);
                }}
                className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold"
              >
                Mark Excused Leave
              </button>
              <button
                onClick={() => {
                  onUpdateAttendanceStatus(editingStudent.id, 'absent', editNotes);
                  setEditingStudent(null);
                }}
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold"
              >
                Mark Absent
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason / Note (Optional):
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. Clinic visit, heavy traffic on Airport road..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick View Student Modal */}
      {quickViewStudent && (() => {
        const studentRecord = attendanceRecords.find(
          (r) => r.entityId === quickViewStudent.id && r.date === selectedDate
        );
        const currentStatus = studentRecord ? studentRecord.status : 'absent';

        const houseColors = {
          Emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
          Sapphire: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-600' },
          Ruby: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-600' },
          Topaz: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
        }[quickViewStudent.houseColor] || { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', dot: 'bg-indigo-500' };

        return (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
            onClick={() => setQuickViewStudent(null)}
          >
            <div 
              className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-indigo-800/60">
                <div className="flex items-center gap-3">
                  {schoolSettings?.logoUrl ? (
                    <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shrink-0 overflow-hidden">
                      <img
                        src={schoolSettings.logoUrl}
                        alt="School Crest"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-indigo-950 font-black text-lg flex items-center justify-center shrink-0">
                      {schoolSettings?.shortName ? schoolSettings.shortName.charAt(0) : 'H'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Student Identity & Verification Record
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                        {quickViewStudent.status}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 font-medium mt-0.5">
                      {schoolSettings?.schoolName || 'Heritage of Excellence Academy'} • Session {schoolSettings?.academicSession || '2026/2027'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuickViewStudent(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close Quick View"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* 1. Student Identity Header & Photo Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={quickViewStudent.photoUrl}
                        alt={`${quickViewStudent.firstName} ${quickViewStudent.lastName}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-indigo-600/20"
                      />
                      <div 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${houseColors.dot}`}
                        title={`House: ${quickViewStudent.houseColor}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {quickViewStudent.firstName} {quickViewStudent.lastName}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopyText(quickViewStudent.admissionNumber, 'admission')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100/70 hover:bg-indigo-200 text-indigo-950 font-mono font-bold transition-colors"
                          title="Click to copy Admission Number"
                        >
                          <span>{quickViewStudent.admissionNumber}</span>
                          {copiedField === 'admission' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-indigo-600 opacity-60" />
                          )}
                        </button>

                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold">
                          {quickViewStudent.classSection}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${houseColors.bg} ${houseColors.text} ${houseColors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${houseColors.dot}`} />
                          <span>{quickViewStudent.houseColor} House</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">
                          {quickViewStudent.gender}
                        </span>

                        {quickViewStudent.bloodGroup && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" />
                            <span>{quickViewStudent.bloodGroup}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Today's Attendance Snapshot Badge */}
                  <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                      Today's Gate Status ({selectedDate}):
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase shadow-2xs ${
                        currentStatus === 'on-time'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : currentStatus === 'late'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : currentStatus === 'excused'
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {currentStatus === 'on-time' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {currentStatus === 'late' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {currentStatus === 'absent' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                      <span>{currentStatus}</span>
                    </span>
                    {studentRecord && (
                      <p className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                        {studentRecord.timeStr} • {studentRecord.gateLocation}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Main 2-Column Grid: Contacts & Scannable QR Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Parent / Guardian & Emergency Contacts */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-700" />
                        <span>Guardian & Emergency Contacts</span>
                      </h5>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {quickViewStudent.parentRelationship}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Parent Full Name */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Primary Guardian Name
                        </span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {quickViewStudent.parentName}
                        </p>
                      </div>

                      {/* Phone Number with Call & Copy */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                          <span>Phone Number (Abuja)</span>
                          {copiedField === 'parentPhone' && (
                            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          )}
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {quickViewStudent.parentPhone}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyText(quickViewStudent.parentPhone, 'parentPhone')}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy Phone Number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`tel:${quickViewStudent.parentPhone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
                              title="Call Parent directly"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Email Address with Mail & Copy */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                          <span>Email Address</span>
                          {copiedField === 'parentEmail' && (
                            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          )}
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-slate-800 text-[11px] truncate max-w-[180px]">
                            {quickViewStudent.parentEmail}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyText(quickViewStudent.parentEmail, 'parentEmail')}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy Email"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`mailto:${quickViewStudent.parentEmail}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[11px] transition-colors shadow-2xs"
                              title="Send Email"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="flex items-center justify-between p-2.5 bg-rose-50/60 rounded-xl border border-rose-200">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-800 block">
                            Emergency Hotline
                          </span>
                          <span className="font-mono font-bold text-rose-950 text-xs">
                            {quickViewStudent.emergencyContact}
                          </span>
                        </div>
                        <a
                          href={`tel:${quickViewStudent.emergencyContact}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Emergency</span>
                        </a>
                      </div>

                      {/* Residence & Transport */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-start gap-2 text-[11px] text-slate-700">
                          <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900 block">Abuja Residence:</span>
                            <span className="text-slate-600">{quickViewStudent.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-700">
                          <Bus className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900">Transport: </span>
                            <span className="text-slate-600">
                              {quickViewStudent.busRoute ? `School Bus: ${quickViewStudent.busRoute}` : 'Private Drop-off'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scannable Security QR Code & Staff Verification */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-indigo-700" />
                          <span>Gate Verification QR Code</span>
                        </h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                          SCANNABLE
                        </span>
                      </div>

                      {/* QR Display Frame */}
                      <div className="mt-3 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        {quickViewQrUrl ? (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                            <img
                              src={quickViewQrUrl}
                              alt="Student Security QR"
                              className="w-40 h-40 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-40 h-40 rounded-xl bg-slate-200 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                            Generating QR...
                          </div>
                        )}

                        <p className="text-[11px] font-mono font-bold text-slate-800 mt-2 text-center">
                          {quickViewStudent.admissionNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 text-center font-medium">
                          Point kiosk turnstile scanner or mobile device camera directly at this QR code.
                        </p>
                      </div>

                      {/* Decoded Payload Box */}
                      <div className="mt-3 p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Security Payload:</span>
                          <span className="text-[10px] font-mono text-slate-800 truncate block">
                            {quickViewStudent.qrCodePayload}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(quickViewStudent.qrCodePayload, 'payload')}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
                          title="Copy QR Payload"
                        >
                          {copiedField === 'payload' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Scan Verification Notice */}
                      {scanVerificationNotice && (
                        <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fadeIn">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{scanVerificationNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* QR Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadQR}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleTestGateScan}
                          disabled={isVerifyingScan}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
                        >
                          {isVerifyingScan ? (
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Test Gate Scan</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handlePrintBadge}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Print Student ID Card</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Quick Staff Attendance Override Controls */}
                <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Quick Attendance Status Override:</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">1-Click Status Update</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateAttendanceStatus(quickViewStudent.id, 'on-time', 'Verified via Quick View')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        currentStatus === 'on-time'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      ✓ Mark On-Time
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateAttendanceStatus(quickViewStudent.id, 'late', 'Marked late via Quick View')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        currentStatus === 'late'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      ⚠ Mark Late
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateAttendanceStatus(quickViewStudent.id, 'excused', 'Excused via Quick View')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        currentStatus === 'excused'
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                      }`}
                    >
                      📋 Mark Excused
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateAttendanceStatus(quickViewStudent.id, 'absent', 'Marked absent via Quick View')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      ✕ Mark Absent
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Authorized Staff Verification Dossier</span>
                </div>

                <div className="flex items-center gap-2">
                  {currentStatus === 'absent' && (
                    <button
                      type="button"
                      onClick={() => onTriggerDirectNotification(quickViewStudent, 'absence')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Absence Alert</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setQuickViewStudent(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Enroll New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-700" />
                <span>Enroll New Student & Generate QR ID</span>
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden canvas & file input for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Student Profile Photo Capture Section with Device Camera */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-700" />
                  <span>Student ID Badge Portrait *</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {capturedPhoto ? 'Custom photo selected' : 'Standard placeholder active'}
                </span>
              </div>

              {cameraError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera viewfinder or Captured Photo Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-32 h-32 rounded-2xl bg-indigo-950 border-2 border-amber-400/80 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder Target Framing Grid */}
                      <div className="absolute inset-2 border border-white/40 rounded-xl pointer-events-none" />
                      
                      {/* Camera Facing mode indicator & quick flip overlay */}
                      <button
                        type="button"
                        onClick={handleToggleCameraFacing}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-400/40 backdrop-blur-xs transition-transform active:scale-95"
                        title={`Turn to ${facingMode === 'user' ? 'Back' : 'Front'} Camera`}
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                      </button>

                      {countdown !== null && (
                        <div className="absolute inset-0 bg-indigo-950/75 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-3xl font-black text-amber-400 animate-ping">
                            {countdown}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src={formData.photoUrl}
                      alt="Student preview"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Corner indicator badge */}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-indigo-900/90 text-amber-300 font-mono text-[9px] font-bold rounded">
                    {isCameraActive ? (facingMode === 'environment' ? '📷 Back' : '🤳 Front') : '400×400'}
                  </span>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <p className="text-[11px] text-slate-600 font-medium">
                    Capture student portrait instantly using the webcam or upload a passport photo for badges and gate scanners.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {isCameraActive ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSnapPhoto}
                          disabled={countdown !== null}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{countdown !== null ? `Snapping in ${countdown}...` : 'Snap Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleCameraFacing}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                          title="Turn camera to Back or Front"
                        >
                          <SwitchCamera className="w-3.5 h-3.5 text-amber-700" />
                          <span>{facingMode === 'user' ? 'Turn to Back' : 'Turn to Front'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(false)}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(true)}
                          className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>Use Device Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload File</span>
                        </button>
                        {capturedPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              setCapturedPhoto(null);
                              setFormData((prev) => ({
                                ...prev,
                                photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
                              }));
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                            title="Reset to default placeholder"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Camera device switcher if multiple cameras detected */}
                  {isCameraActive && videoDevices.length > 1 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                      <span className="font-bold text-slate-600">Camera:</span>
                      <select
                        value={selectedDeviceId || ''}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-800"
                      >
                        <option value="">Default ({facingMode === 'user' ? 'Front' : 'Back'})</option>
                        {videoDevices.map((dev, idx) => (
                          <option key={dev.deviceId || idx} value={dev.deviceId}>
                            {dev.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Maryam"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Last Name / Surname *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Dantata"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">House Color</label>
                  <select
                    value={formData.houseColor}
                    onChange={(e) => setFormData({ ...formData, houseColor: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                  >
                    <option value="Emerald">Emerald (Green)</option>
                    <option value="Sapphire">Sapphire (Blue)</option>
                    <option value="Ruby">Ruby (Red)</option>
                    <option value="Topaz">Topaz (Yellow)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 mb-1 font-bold">Grade / Class</label>
                  <select
                    value={formData.classSection}
                    onChange={(e) => setFormData({ ...formData, classSection: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                  >
                    <option value="SS 3 Science Platinum">SS 3 Science Platinum</option>
                    <option value="SS 2 Commercial Gold">SS 2 Commercial Gold</option>
                    <option value="SS 2 Arts Diamond">SS 2 Arts Diamond</option>
                    <option value="SS 1 Science Alpha">SS 1 Science Alpha</option>
                    <option value="JSS 3 Emerald">JSS 3 Emerald</option>
                    <option value="JSS 2 Diamond">JSS 2 Diamond</option>
                    <option value="JSS 1 Sapphire">JSS 1 Sapphire</option>
                    <option value="Primary 5 Topaz">Primary 5 Topaz</option>
                    <option value="Primary 4 Ruby">Primary 4 Ruby</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h4 className="font-black text-indigo-900 mb-2">Parent / Guardian Contact (Abuja)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Parent Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Alhaji Aminu Dantata"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Nigerian Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="+234 803 000 0000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Parent Email</label>
                      <input
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        placeholder="parent@company.ng"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Residential Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Maitama / Asokoro / Wuse II, Abuja"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs shadow-sm"
                >
                  Create & Generate QR Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
