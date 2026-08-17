import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  Upload, 
  AlertCircle,
  FileText,
  Filter,
  Calendar,
  Lock,
  Layers
} from 'lucide-react';
import { 
  AttendanceRecord, 
  PayrollRecord, 
  Student, 
  Staff, 
  LeaveRequest, 
  NotificationLog, 
  SchoolSettings 
} from '../types';
import { 
  exportAttendanceRecordsToCSV, 
  exportPayrollRecordsToCSV, 
  exportStudentsDirectoryCSV, 
  exportStaffDirectoryCSV, 
  downloadCompleteSystemBackup,
  SystemBackupData 
} from '../utils/exportUtils';
import { formatNaira } from '../utils/audio';

interface DataExportCenterProps {
  schoolSettings: SchoolSettings;
  students: Student[];
  staff: Staff[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  leaveRequests: LeaveRequest[];
  notificationLogs: NotificationLog[];
  onRestoreBackup?: (backupData: SystemBackupData) => void;
}

export const DataExportCenter: React.FC<DataExportCenterProps> = ({
  schoolSettings,
  students,
  staff,
  attendanceRecords,
  payrollRecords,
  leaveRequests,
  notificationLogs,
  onRestoreBackup,
}) => {
  // Attendance Export Filter State
  const [attEntityType, setAttEntityType] = useState<'all' | 'student' | 'staff'>('all');
  const [attDateFilter, setAttDateFilter] = useState<string>('all');
  const [attStatusFilter, setAttStatusFilter] = useState<string>('all');
  const [attExportSuccess, setAttExportSuccess] = useState<string | null>(null);

  // Payroll Export Filter State
  const [payMonthFilter, setPayMonthFilter] = useState<string>('all');
  const [payStatusFilter, setPayStatusFilter] = useState<string>('all');
  const [payExportSuccess, setPayExportSuccess] = useState<string | null>(null);

  // General Status
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute preview counts
  const filteredAttCount = attendanceRecords.filter((r) => {
    if (attEntityType !== 'all' && r.entityType !== attEntityType) return false;
    if (attDateFilter !== 'all' && r.dateStr !== attDateFilter) return false;
    if (attStatusFilter !== 'all' && r.status !== attStatusFilter) return false;
    return true;
  }).length;

  const filteredPayCount = payrollRecords.filter((p) => {
    if (payMonthFilter !== 'all' && p.month !== payMonthFilter) return false;
    if (payStatusFilter !== 'all' && p.paymentStatus !== payStatusFilter) return false;
    return true;
  }).length;

  const handleExportAttendance = () => {
    const count = exportAttendanceRecordsToCSV(attendanceRecords, {
      entityType: attEntityType,
      dateFilter: attDateFilter,
      statusFilter: attStatusFilter,
      filenamePrefix: `${schoolSettings.shortName || 'School'}_Attendance_Records`,
    });
    setAttExportSuccess(`Successfully exported ${count} attendance records to CSV.`);
    setTimeout(() => setAttExportSuccess(null), 5000);
  };

  const handleExportPayroll = () => {
    const count = exportPayrollRecordsToCSV(payrollRecords, {
      monthFilter: payMonthFilter,
      statusFilter: payStatusFilter,
      filenamePrefix: `${schoolSettings.shortName || 'School'}_Payroll_Schedule`,
    });
    setPayExportSuccess(`Successfully exported ${count} staff payroll compensation records to CSV.`);
    setTimeout(() => setPayExportSuccess(null), 5000);
  };

  const handleExportStudents = () => {
    const count = exportStudentsDirectoryCSV(students);
    alert(`Exported ${count} active student records with guardian contacts.`);
  };

  const handleExportStaff = () => {
    const count = exportStaffDirectoryCSV(staff);
    alert(`Exported ${count} faculty & staff credential records.`);
  };

  const handleExportFullBackup = () => {
    const filename = downloadCompleteSystemBackup({
      schoolSettings,
      students,
      staff,
      attendanceRecords,
      payrollRecords,
      leaveRequests,
      notificationLogs,
    });
    setBackupSuccess(`Complete archive saved: ${filename}`);
    setTimeout(() => setBackupSuccess(null), 6000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as SystemBackupData;
        if (!parsed.schoolSettings || !Array.isArray(parsed.students)) {
          throw new Error('Invalid backup file structure.');
        }
        if (onRestoreBackup) {
          onRestoreBackup(parsed);
          setRestoreMessage({
            type: 'success',
            text: `System restored successfully from backup archive (${parsed.exportedAt})!`,
          });
        } else {
          setRestoreMessage({
            type: 'success',
            text: `Backup verified: Contains ${parsed.studentsCount} students, ${parsed.staffCount} staff, ${parsed.attendanceCount} attendance logs.`,
          });
        }
      } catch (err: any) {
        setRestoreMessage({
          type: 'error',
          text: `Failed to restore file: ${err.message || 'Corrupted or incompatible JSON file.'}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Available unique dates in attendance records
  const uniqueDates = Array.from(new Set(attendanceRecords.map((r) => r.dateStr)));
  const uniqueMonths = Array.from(new Set(payrollRecords.map((p) => p.month)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-900 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              Data Export & Secure Offline Storage Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Download comprehensive Attendance registers, Bursary payroll schedules, and complete encrypted database archives for local secure storage & compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportFullBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 hover:bg-indigo-850 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>1-Click Full System Backup (.JSON)</span>
          </button>
        </div>
      </div>

      {backupSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{backupSuccess}</span>
        </div>
      )}

      {/* Main Grid: 2 Primary Export Engines (Attendance & Payroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Records Export Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Attendance Records CSV Export
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Gate timestamps, punctuality status, and parent SMS/push delivery audits.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-black border border-emerald-200">
                {filteredAttCount} Records Ready
              </span>
            </div>

            {/* Attendance Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Entity Type</label>
                <select
                  value={attEntityType}
                  onChange={(e) => setAttEntityType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All (Students & Staff)</option>
                  <option value="student">Students Only ({students.length})</option>
                  <option value="staff">Staff Only ({staff.length})</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date Filter</label>
                <select
                  value={attDateFilter}
                  onChange={(e) => setAttDateFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Available Dates</option>
                  <option value="2026-08-16">Today (2026-08-16)</option>
                  {uniqueDates
                    .filter((d) => d !== '2026-08-16')
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status</label>
                <select
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="on-time">On-Time Only</option>
                  <option value="late">Late Arrival Only</option>
                  <option value="absent">Absence Logs</option>
                </select>
              </div>
            </div>

            {/* Included Fields Checklist */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-medium">
              <span className="font-bold text-slate-800 block text-xs">Included CSV Schema Fields:</span>
              <p>
                Record ID • Date & Time • Timestamp ISO • Entity Type • Admission / Staff ID • Full Name • Class/Role • Type (Check-in/Out) • Punctuality Status • Gate Location • Temperature • Verified By • Notes • Parent Push Sent • Parent Email Sent • Parent Phone Contact
              </p>
            </div>
          </div>

          <div>
            {attExportSuccess && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{attExportSuccess}</span>
              </div>
            )}
            <button
              onClick={handleExportAttendance}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Attendance Register CSV ({filteredAttCount} Records)</span>
            </button>
          </div>
        </div>

        {/* Payroll & Compensation Records Export Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
                  <FileSpreadsheet className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Staff Payroll & Compensation CSV
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Itemized allowances, PenCom 8% pension, PAYE tax, and bank schedules.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-mono font-black border border-amber-200">
                {filteredPayCount} Staff Records
              </span>
            </div>

            {/* Payroll Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pay Cycle Month</label>
                <select
                  value={payMonthFilter}
                  onChange={(e) => setPayMonthFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Pay Cycles</option>
                  {uniqueMonths.map((m) => (
                    <option key={m} value={m}>
                      {m} Cycle
                    </option>
                  ))}
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Disbursement Status</label>
                <select
                  value={payStatusFilter}
                  onChange={(e) => setPayStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Disbursed">Disbursed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Included Fields Checklist */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-medium">
              <span className="font-bold text-slate-800 block text-xs">Included CSV Schema Fields:</span>
              <p>
                Payroll Ref ID • Staff ID • Full Name • Role • Department • Base Salary (₦) • Housing Allowance • Transport Allowance • Total Allowances • Gross Pay (₦) • Days Present • Days Late • Days Absent • PenCom 8% Pension • PAYE Tax • Late Deductions • Total Deductions • Net Payable (₦) • Bank Name • Account Number • Disbursement Status • Payslip Sent
              </p>
            </div>
          </div>

          <div>
            {payExportSuccess && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                <span>{payExportSuccess}</span>
              </div>
            )}
            <button
              onClick={handleExportPayroll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Payroll Schedule CSV ({filteredPayCount} Records)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auxiliary Directories & Full System Offline Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Directory Master CSV */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>Student Master Directory</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Complete student registry with guardian phone numbers, home addresses, blood groups, and bus routes.
            </p>
          </div>
          <button
            onClick={handleExportStudents}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-700" />
            <span>Export Students CSV ({students.length})</span>
          </button>
        </div>

        {/* Staff Directory CSV */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>Staff & Faculty Master Directory</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Faculty credentials, tax identifiers (FCT IRS), PenCom pension numbers, and bank account mappings.
            </p>
          </div>
          <button
            onClick={handleExportStaff}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-700" />
            <span>Export Staff Directory CSV ({staff.length})</span>
          </button>
        </div>

        {/* Restore / Import from Backup Archive */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Upload className="w-4 h-4 text-indigo-700" />
              <span>Restore from Secure Archive</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Restore school settings, students, staff, and past logs from a locally saved `.json` backup file.
            </p>
          </div>

          <div>
            {restoreMessage && (
              <div
                className={`mb-2 p-2 rounded-lg text-[11px] font-bold ${
                  restoreMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {restoreMessage.text}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-indigo-700" />
              <span>Select Backup File (.JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Compliance & Local Storage Security Assurance */}
      <div className="bg-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Local Data Sovereignty & Offline Air-Gap Security Note</span>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed font-normal">
          All exported files are formatted according to standard UTF-8 CSV standards, fully compatible with Microsoft Excel, Google Sheets, and Nigerian banking disbursement portals (Zenith Bank, GTBank, Access Bank, UBA). Downloading regular local CSV and JSON archives guarantees complete institutional data sovereignty for {schoolSettings.schoolName}.
        </p>
      </div>
    </div>
  );
};
