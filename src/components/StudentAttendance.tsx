import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { Student, AttendanceRecord } from '../types';
import { downloadCSV } from '../utils/audio';

interface StudentAttendanceProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (newStudent: Student) => void;
  onUpdateAttendanceStatus: (studentId: string, status: 'on-time' | 'late' | 'excused' | 'absent', notes?: string) => void;
  onSendBatchAbsenceNotice: (absentStudents: Student[]) => void;
  onTriggerDirectNotification: (student: Student, type: 'absence' | 'late') => void;
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({
  students,
  attendanceRecords,
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
  });

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
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
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
    setShowAddModal(false);
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
                      <div className="flex items-center gap-3">
                        <img
                          src={student.photoUrl}
                          alt={student.firstName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">
                            {student.firstName} {student.lastName}
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
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold"
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
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
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
                  onClick={() => setShowAddModal(false)}
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
