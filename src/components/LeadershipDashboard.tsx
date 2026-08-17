import React from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  PhoneCall, 
  Send, 
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Student, Staff, AttendanceRecord, PayrollRecord, NotificationLog, SchoolSettings } from '../types';
import { formatNaira, downloadCSV } from '../utils/audio';
import { AttendanceStatusPieChart } from './AttendanceStatusPieChart';

interface LeadershipDashboardProps {
  students: Student[];
  staff: Staff[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  notificationLogs: NotificationLog[];
  schoolSettings?: SchoolSettings;
  onTriggerDirectNotification: (student: Student, type: 'absence' | 'late') => void;
  onNavigateTab: (tab: string) => void;
}

export const LeadershipDashboard: React.FC<LeadershipDashboardProps> = ({
  students,
  staff,
  attendanceRecords,
  payrollRecords,
  notificationLogs,
  schoolSettings,
  onTriggerDirectNotification,
  onNavigateTab,
}) => {
  // Compute metrics for today (using 2026-08-16 as current local date)
  const todayStr = '2026-08-16';

  const todayStudentAtt = attendanceRecords.filter(
    (r) => r.entityType === 'student' && r.dateStr === todayStr && r.type === 'check-in'
  );
  const todayStaffAtt = attendanceRecords.filter(
    (r) => r.entityType === 'staff' && r.dateStr === todayStr && r.type === 'check-in'
  );

  const presentStudentIds = new Set(todayStudentAtt.map((r) => r.entityId));
  const lateStudents = todayStudentAtt.filter((r) => r.status === 'late');
  const onTimeStudents = todayStudentAtt.filter((r) => r.status === 'on-time');
  const absentStudents = students.filter((s) => !presentStudentIds.has(s.id));

  const studentAttRate = Math.round((presentStudentIds.size / (students.length || 1)) * 100);

  const presentStaffIds = new Set(todayStaffAtt.map((r) => r.entityId));
  const lateStaff = todayStaffAtt.filter((r) => r.status === 'late');
  const staffAttRate = Math.round((presentStaffIds.size / (staff.length || 1)) * 100);

  // Live on-campus headcount (check-ins minus check-outs)
  const checkOutIds = new Set(
    attendanceRecords
      .filter((r) => r.dateStr === todayStr && r.type === 'check-out')
      .map((r) => r.entityId)
  );
  const studentsOnCampus = todayStudentAtt.filter((r) => !checkOutIds.has(r.entityId)).length;
  const staffOnCampus = todayStaffAtt.filter((r) => !checkOutIds.has(r.entityId)).length;
  const totalOnCampus = studentsOnCampus + staffOnCampus;

  // Total payroll summary
  const totalNetPayroll = payrollRecords.reduce((sum, p) => sum + p.netPay, 0);
  const totalGrossPayroll = payrollRecords.reduce((sum, p) => sum + p.grossPay, 0);
  const totalTaxAndPension = payrollRecords.reduce(
    (sum, p) => sum + (p.deductions.payeTax + p.deductions.pensionContribution), 
    0
  );

  // Grade Breakdown calculation
  const grades = ['SS 3', 'SS 2', 'SS 1', 'JSS 3', 'JSS 2', 'JSS 1', 'Primary'];
  const gradeStats = grades.map((grade) => {
    const totalInGrade = students.filter((s) => s.grade.startsWith(grade) || s.grade === grade).length;
    const presentInGrade = students.filter(
      (s) => (s.grade.startsWith(grade) || s.grade === grade) && presentStudentIds.has(s.id)
    ).length;
    const percentage = totalInGrade > 0 ? Math.round((presentInGrade / totalInGrade) * 100) : 100;
    return { grade, totalInGrade, presentInGrade, percentage };
  });

  const handleExportDailyReport = () => {
    const reportData = attendanceRecords.map((r) => ({
      Timestamp: r.timestamp,
      Date: r.dateStr,
      Time: r.timeStr,
      Type: r.type,
      Status: r.status,
      Entity: r.entityType,
      ID: r.admissionOrStaffId,
      Name: r.entityName,
      RoleOrClass: r.roleOrClass,
      Gate: r.gateLocation,
      ScannedBy: r.scannedBy,
      ParentPushSent: r.notificationStatus?.pushSent ? 'YES' : 'NO',
      ParentEmailSent: r.notificationStatus?.emailSent ? 'YES' : 'NO',
    }));
    downloadCSV(`Heritage_Abuja_Attendance_Report_${todayStr}`, reportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Executive Brief */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-indigo-800 text-white border border-indigo-700/50 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-amber-400/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            {schoolSettings?.logoUrl ? (
              <div className="w-14 h-14 rounded-2xl bg-white/10 p-1 flex items-center justify-center border border-white/20 shadow-md shrink-0 overflow-hidden">
                <img
                  src={schoolSettings.logoUrl}
                  alt="School Crest"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-indigo-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                {schoolSettings?.shortName ? schoolSettings.shortName.charAt(0) : 'H'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Briefing & Real-Time Campus Operations</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {schoolSettings?.schoolName || 'Heritage of Excellence Abuja'} — Operational Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                Real-time monitoring of student gate check-ins, staff clock-in compliance, automatic parent push notifications, and month-to-date payroll disbursement ({schoolSettings?.academicSession || '2026/2027'}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('export')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Data Export & Storage</span>
            </button>
            <button
              onClick={() => onNavigateTab('scanner')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Gate Terminal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Row - 4 Vibrant Signature Surfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Student Attendance Rate */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Student Attendance</span>
            <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-950">{studentAttRate}%</span>
              <span className="text-xs text-emerald-700 font-mono font-semibold">
                {presentStudentIds.size}/{students.length} Present
              </span>
            </div>
            <div className="w-full bg-emerald-200/80 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${studentAttRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 mt-2.5">
              <span className="text-emerald-700">{onTimeStudents.length} On-Time</span>
              <span className="text-amber-800">{lateStudents.length} Late</span>
              <span className="text-rose-700">{absentStudents.length} Absent</span>
            </div>
          </div>
        </div>

        {/* Staff Attendance & Compliance */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Staff Punctuality</span>
            <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-950">{staffAttRate}%</span>
              <span className="text-xs text-amber-800 font-mono font-semibold">
                {presentStaffIds.size}/{staff.length} Present
              </span>
            </div>
            <div className="w-full bg-amber-200/80 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${staffAttRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-900 mt-2.5">
              <span className="text-emerald-700">{presentStaffIds.size - lateStaff.length} On-Time</span>
              <span className="text-amber-800">{lateStaff.length} Late</span>
              <span className="text-slate-600">1 On Leave</span>
            </div>
          </div>
        </div>

        {/* Live On-Campus Headcount */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-900">Live Campus Headcount</span>
            <span className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-sky-950">{totalOnCampus}</span>
              <span className="text-xs text-emerald-700 flex items-center font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Inside Campus
              </span>
            </div>
            <p className="text-xs text-sky-800 font-medium mt-2">
              {studentsOnCampus} Students • {staffOnCampus} Staff & Faculty
            </p>
            <div className="mt-2 text-[11px] text-sky-700 font-medium flex items-center justify-between">
              <span>Maitama Main Gate: Active</span>
              <span className="font-semibold text-sky-900">03 Pickups Today</span>
            </div>
          </div>
        </div>

        {/* Monthly Payroll Total in Naira */}
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">August Payroll</span>
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-indigo-950">
              {formatNaira(totalNetPayroll)}
            </div>
            <p className="text-xs text-indigo-800 font-medium mt-1">
              Gross: {formatNaira(totalGrossPayroll)}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-bold">✓ Reconciled</span>
              <button
                onClick={() => onNavigateTab('payroll')}
                className="text-indigo-700 hover:text-indigo-950 font-bold flex items-center gap-0.5"
              >
                <span>View Breakdown</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Proportional Attendance Status Breakdown by Class Section (Pie / Donut Chart) */}
      <AttendanceStatusPieChart
        students={students}
        attendanceRecords={attendanceRecords}
      />

      {/* Main Grid: Live Gate Stream & Absentee Alert Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Gate Activity Feed & Grade Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Gate Arrival Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-slate-900 text-sm">Live Gate Scanner Feed</h3>
                <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-900 font-bold rounded-full border border-indigo-100 font-mono">
                  {todayStudentAtt.length + todayStaffAtt.length} Scans Today
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('scanner')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1"
              >
                <span>Launch Gate Camera</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {attendanceRecords.slice(0, 8).map((record) => {
                const isOnTime = record.status === 'on-time';
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-indigo-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={record.photoUrl}
                        alt={record.entityName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {record.entityName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                              isOnTime
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                          <span className="text-indigo-900 font-mono font-bold text-[11px]">{record.admissionOrStaffId}</span>
                          <span>•</span>
                          <span>{record.roleOrClass}</span>
                          <span>•</span>
                          <span className="text-slate-500">{record.gateLocation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-black text-slate-900">{record.timeStr}</div>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        {record.notificationStatus?.pushSent && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold border border-sky-200 px-2 py-0.5 rounded-full">
                            Push Sent
                          </span>
                        )}
                        {record.notificationStatus?.emailSent && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-medium border border-slate-200 px-1.5 py-0.5 rounded">
                            Email
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grade-by-Grade Attendance Rate */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                <span>Class & Grade Attendance Distribution</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">School Target: ≥ 95%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {gradeStats.map((item) => (
                <div key={item.grade} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-900">{item.grade} Classes</span>
                    <span className="font-mono font-bold text-slate-700">
                      {item.percentage}% ({item.presentInGrade}/{item.totalInGrade})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percentage >= 90
                          ? 'bg-emerald-500'
                          : item.percentage >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Absentee Follow-Up & Parent Push Log Widget */}
        <div className="space-y-6">
          {/* Actionable Absentees List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Unaccounted Absentees ({absentStudents.length})</span>
              </div>
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              Students without gate check-in logs as of morning roll call. Trigger immediate alerts to Abuja parent numbers.
            </p>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {absentStudents.length === 0 ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-emerald-600" />
                  All students have arrived on campus! Perfect attendance recorded.
                </div>
              ) : (
                absentStudents.map((std) => (
                  <div
                    key={std.id}
                    className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={std.photoUrl}
                        alt={std.firstName}
                        className="w-9 h-9 rounded-xl object-cover border border-rose-200 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {std.firstName} {std.lastName}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">{std.classSection}</p>
                      </div>
                    </div>

                    <div className="text-[11px] bg-white p-2.5 rounded-lg border border-rose-100">
                      <div className="font-bold text-slate-800">
                        {std.parentRelationship}: {std.parentName}
                      </div>
                      <div className="font-mono text-slate-600 font-semibold">{std.parentPhone}</div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onTriggerDirectNotification(std, 'absence')}
                        className="flex-1 py-2 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Absence Alert</span>
                      </button>
                      <a
                        href={`tel:${std.parentPhone.replace(/\s+/g, '')}`}
                        className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center"
                        title="Call Parent directly"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-indigo-700" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Notification Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Parent Communication Gateway</span>
              </h3>
              <button
                onClick={() => onNavigateTab('notifications')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold"
              >
                View Hub
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">Push Notifications Delivered</span>
                <span className="font-mono font-bold text-emerald-700">100% (&lt;1.2s instant)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">Email Gate Confirmations</span>
                <span className="font-mono font-bold text-slate-900">98.4% Delivered</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-medium text-slate-700">Abuja SMS/WhatsApp Gateway</span>
                <span className="font-mono font-bold text-emerald-700">Active (MTN/Airtel/Glo)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
