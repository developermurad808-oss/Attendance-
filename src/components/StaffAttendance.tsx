import React, { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  Search, 
  Filter, 
  FileText, 
  Check, 
  X, 
  Award,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Staff, AttendanceRecord, LeaveRequest } from '../types';

interface StaffAttendanceProps {
  staff: Staff[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onAddStaff: (newStaff: Staff) => void;
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string) => void;
  onRequestLeave: (newLeave: LeaveRequest) => void;
}

export const StaffAttendance: React.FC<StaffAttendanceProps> = ({
  staff,
  attendanceRecords,
  leaveRequests,
  onAddStaff,
  onApproveLeave,
  onRejectLeave,
  onRequestLeave,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'leaves'>('attendance');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState<boolean>(false);

  // Today records
  const todayStr = '2026-08-16';
  const todayStaffRecords = attendanceRecords.filter(
    (r) => r.entityType === 'staff' && r.dateStr === todayStr && r.type === 'check-in'
  );
  const staffRecordMap = new Map<string, AttendanceRecord>();
  todayStaffRecords.forEach((r) => staffRecordMap.set(r.entityId, r));

  const enrichedStaff = staff.map((st) => {
    const record = staffRecordMap.get(st.id);
    const hasApprovedLeave = leaveRequests.some(
      (l) => l.staffId === st.id && l.status === 'Approved'
    );

    let status = 'absent';
    if (record) {
      status = record.status;
    } else if (hasApprovedLeave) {
      status = 'leave';
    }

    return {
      staff: st,
      record,
      status,
    };
  });

  const filteredStaff = enrichedStaff.filter(({ staff: st }) => {
    const matchesDept = selectedDept === 'all' || st.department === selectedDept;
    const matchesSearch =
      st.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Leave Form state
  const [leaveForm, setLeaveForm] = useState({
    staffId: staff[0]?.id || '',
    type: 'Sick' as 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Study',
    startDate: '2026-08-18',
    endDate: '2026-08-19',
    daysCount: 2,
    reason: '',
  });

  // New Staff form state
  const [newStaffForm, setNewStaffForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    department: 'Academic - Sciences' as any,
    email: '',
    phone: '+234 ',
    baseSalary: 400000,
    bankName: 'Zenith Bank PLC',
    accountNumber: '',
    accountName: '',
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.firstName || !newStaffForm.lastName || !newStaffForm.role) {
      alert('Please fill all required fields');
      return;
    }

    const nextId = `HEA-EMP-00${staff.length + 1}`;
    const id = `stf_${Date.now()}`;

    const created: Staff = {
      id,
      employeeId: nextId,
      firstName: newStaffForm.firstName,
      lastName: newStaffForm.lastName,
      gender: 'Male',
      role: newStaffForm.role,
      department: newStaffForm.department,
      email: newStaffForm.email || `${newStaffForm.firstName.toLowerCase()}@heritage-abuja.sch.ng`,
      phone: newStaffForm.phone,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      baseSalary: Number(newStaffForm.baseSalary),
      allowances: {
        housing: Math.round(Number(newStaffForm.baseSalary) * 0.15),
        transport: Math.round(Number(newStaffForm.baseSalary) * 0.08),
      },
      bankName: newStaffForm.bankName,
      accountNumber: newStaffForm.accountNumber || '1029384756',
      accountName: newStaffForm.accountName || `${newStaffForm.firstName} ${newStaffForm.lastName}`,
      pensionNumber: `PEN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      taxId: `FCT-TAX-${Math.floor(10000 + Math.random() * 90000)}`,
      dateJoined: new Date().toISOString().split('T')[0],
      shiftSchedule: { start: '07:30', end: '16:00' },
      employmentType: 'Full-time',
      status: 'Active',
      qrCodePayload: JSON.stringify({
        id,
        type: 'staff',
        empId: nextId,
        name: `${newStaffForm.firstName} ${newStaffForm.lastName}`,
        role: newStaffForm.role,
      }),
    };

    onAddStaff(created);
    setShowAddStaffModal(false);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const stf = staff.find((s) => s.id === leaveForm.staffId);
    if (!stf) return;

    const newReq: LeaveRequest = {
      id: `lev_${Date.now()}`,
      staffId: stf.id,
      staffName: `${stf.firstName} ${stf.lastName}`,
      role: stf.role,
      department: stf.department,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      daysCount: Number(leaveForm.daysCount),
      reason: leaveForm.reason || 'Personal matters',
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    onRequestLeave(newReq);
    setShowApplyLeaveModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-700" />
            <span>Staff Attendance, Punctuality & Leave Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Biometric and QR clock-in records, shift coverage, and duty leave approvals for Heritage of Excellence Abuja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowApplyLeaveModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-700" />
            <span>Log Leave Request</span>
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Sub tabs: Attendance roster vs Leave applications */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'attendance'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Daily Clock-in Register ({enrichedStaff.filter(e => e.status !== 'absent').length}/{staff.length})
        </button>
        <button
          onClick={() => setActiveSubTab('leaves')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'leaves'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Leave Requests & Duty Approvals</span>
          {leaveRequests.filter((l) => l.status === 'Pending').length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-400 text-indigo-950 rounded-full font-black">
              {leaveRequests.filter((l) => l.status === 'Pending').length} Pending
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'attendance' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff name, role, employee ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Departments</option>
              <option value="Administration">Administration</option>
              <option value="Academic - Sciences">Academic - Sciences</option>
              <option value="Academic - Languages">Academic - Languages</option>
              <option value="Bursary">Bursary & Finance</option>
              <option value="Medical">Medical / Health Clinic</option>
              <option value="ICT & Tech">ICT & Tech</option>
              <option value="Security & Logistics">Security & Logistics</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Role & Dept</th>
                    <th className="py-3.5 px-4">Shift Schedule</th>
                    <th className="py-3.5 px-4">Clock-in Time</th>
                    <th className="py-3.5 px-4">Today Status</th>
                    <th className="py-3.5 px-4 text-right">Punctuality Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map(({ staff: st, record, status }) => {
                    const punctualityScore = status === 'late' ? '88%' : status === 'on-time' ? '98%' : '92%';
                    return (
                      <tr key={st.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.photoUrl}
                              alt={st.firstName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">
                                {st.firstName} {st.lastName}
                              </p>
                              <p className="font-mono font-bold text-[11px] text-indigo-700">{st.employeeId}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{st.role}</p>
                          <span className="text-[11px] text-slate-500 font-medium">{st.department}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {st.shiftSchedule.start} – {st.shiftSchedule.end}
                        </td>

                        <td className="py-3.5 px-4">
                          {record ? (
                            <div>
                              <span className="font-mono font-bold text-slate-900">{record.timeStr}</span>
                              <span className="block text-[11px] text-slate-500 font-medium">{record.gateLocation}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">Not clocked in</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                              status === 'on-time'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : status === 'late'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : status === 'leave'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-600">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>{punctualityScore}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Leaves Sub Tab */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Official Leave Applications & Approvals</h3>
              <span className="text-xs text-slate-500 font-mono font-bold">
                {leaveRequests.length} Total Applications
              </span>
            </div>

            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{req.staffName}</h4>
                      <span className="text-xs text-slate-500">({req.role})</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-black border border-amber-200">
                        {req.type} Leave • {req.daysCount} Days
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Duration:{' '}
                      <strong className="text-slate-900">
                        {req.startDate} to {req.endDate}
                      </strong>{' '}
                      • Applied on {req.appliedOn}
                    </p>
                    <p className="text-xs text-slate-500 italic">&quot;{req.reason}&quot;</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => onApproveLeave(req.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onRejectLeave(req.id)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {req.status}
                        {req.approvedBy && ` by ${req.approvedBy}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-700" />
                <span>Submit Staff Leave Request</span>
              </h3>
              <button
                onClick={() => setShowApplyLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Select Staff Member</label>
                <select
                  value={leaveForm.staffId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, staffId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Leave Category</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                  >
                    <option value="Sick">Medical / Sick Leave</option>
                    <option value="Annual">Annual Vacation Leave</option>
                    <option value="Casual">Casual / Family Emergency</option>
                    <option value="Study">Study / Examination Leave</option>
                    <option value="Maternity">Maternity / Paternity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={leaveForm.daysCount}
                    onChange={(e) => setLeaveForm({ ...leaveForm, daysCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Reason / Handover Notes</label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Provide justification and substitute teacher coverage..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-700" />
                <span>Onboard New Staff Member</span>
              </h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.firstName}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, firstName: e.target.value })}
                    placeholder="e.g. Samuel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.lastName}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, lastName: e.target.value })}
                    placeholder="e.g. Momoh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Job Title / Role *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    placeholder="e.g. Senior Biology Master"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Department</label>
                  <select
                    value={newStaffForm.department}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                  >
                    <option value="Academic - Sciences">Academic - Sciences</option>
                    <option value="Academic - Humanities">Academic - Humanities</option>
                    <option value="Academic - Languages">Academic - Languages</option>
                    <option value="Administration">Administration</option>
                    <option value="Bursary">Bursary</option>
                    <option value="ICT & Tech">ICT & Tech</option>
                    <option value="Medical">Medical</option>
                    <option value="Security & Logistics">Security & Logistics</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h4 className="font-black text-indigo-900 mb-2">Payroll & Compensation (₦ Naira)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Base Monthly Salary (₦) *</label>
                    <input
                      type="number"
                      required
                      value={newStaffForm.baseSalary}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, baseSalary: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Bank Name</label>
                      <select
                        value={newStaffForm.bankName}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, bankName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:outline-none font-medium"
                      >
                        <option value="Zenith Bank PLC">Zenith Bank PLC</option>
                        <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                        <option value="Access Bank PLC">Access Bank PLC</option>
                        <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                        <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                        <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-bold">Account Number (10 Digits)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={newStaffForm.accountNumber}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, accountNumber: e.target.value })}
                        placeholder="0123456789"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs shadow-sm"
                >
                  Save & Generate Staff QR Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
