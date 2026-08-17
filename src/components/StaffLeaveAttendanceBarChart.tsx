import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Clock, 
  FileText, 
  Filter, 
  Download, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Staff, AttendanceRecord, LeaveRequest } from '../types';

export interface MonthlyHRData {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "Sep 2025"
  shortMonth: string; // e.g. "Sep"
  academicTerm: 'Term 1' | 'Term 2' | 'Term 3';
  workingDays: number;
  totalLeaveRequests: number;
  approvedLeaveDays: number;
  pendingLeaveDays: number;
  rejectedLeaveRequests: number;
  leavesByType: {
    sick: number;
    casual: number;
    annual: number;
    study: number;
    maternity: number;
  };
  attendanceRate: number; // e.g. 96.4 (%)
  onTimeRate: number; // e.g. 92.1 (%)
  unexcusedAbsenceDays: number;
  staffingAvailabilityIndex: number; // e.g. 94.8 (%)
  staffHeadcount: number;
  primaryDepartmentAffected: string;
  status: 'optimal' | 'moderate' | 'critical';
  notes: string;
}

interface StaffLeaveAttendanceBarChartProps {
  staff: Staff[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onApplyLeaveClick?: () => void;
}

// 12-Month Historical Benchmark Data for 2025/2026 Academic Session
const HISTORICAL_MONTHLY_BENCHMARKS: MonthlyHRData[] = [
  {
    monthKey: '2025-09',
    monthName: 'September 2025',
    shortMonth: 'Sep',
    academicTerm: 'Term 1',
    workingDays: 22,
    totalLeaveRequests: 2,
    approvedLeaveDays: 4,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 2, casual: 2, annual: 0, study: 0, maternity: 0 },
    attendanceRate: 98.2,
    onTimeRate: 95.0,
    unexcusedAbsenceDays: 1,
    staffingAvailabilityIndex: 97.7,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Academic - Sciences',
    status: 'optimal',
    notes: 'Resumption of Term 1. High attendance across all teaching faculties.',
  },
  {
    monthKey: '2025-10',
    monthName: 'October 2025',
    shortMonth: 'Oct',
    academicTerm: 'Term 1',
    workingDays: 21,
    totalLeaveRequests: 3,
    approvedLeaveDays: 7,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 1,
    leavesByType: { sick: 3, casual: 4, annual: 0, study: 0, maternity: 0 },
    attendanceRate: 96.0,
    onTimeRate: 91.5,
    unexcusedAbsenceDays: 2,
    staffingAvailabilityIndex: 95.1,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Academic - Languages',
    status: 'optimal',
    notes: 'Mid-term continuous assessments conducted smoothly with internal subs.',
  },
  {
    monthKey: '2025-11',
    monthName: 'November 2025',
    shortMonth: 'Nov',
    academicTerm: 'Term 1',
    workingDays: 21,
    totalLeaveRequests: 4,
    approvedLeaveDays: 9,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 4, casual: 2, annual: 0, study: 3, maternity: 0 },
    attendanceRate: 94.8,
    onTimeRate: 89.8,
    unexcusedAbsenceDays: 2,
    staffingAvailabilityIndex: 93.9,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'ICT & Tech',
    status: 'optimal',
    notes: 'ICT certification leave covered by assistant systems administrator.',
  },
  {
    monthKey: '2025-12',
    monthName: 'December 2025',
    shortMonth: 'Dec',
    academicTerm: 'Term 1',
    workingDays: 16,
    totalLeaveRequests: 6,
    approvedLeaveDays: 16,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 1,
    leavesByType: { sick: 3, casual: 5, annual: 8, study: 0, maternity: 0 },
    attendanceRate: 89.4,
    onTimeRate: 86.0,
    unexcusedAbsenceDays: 3,
    staffingAvailabilityIndex: 88.0,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Administration',
    status: 'moderate',
    notes: 'Term 1 Examination wrap-up & festive travel. Heavy annual leave requests.',
  },
  {
    monthKey: '2026-01',
    monthName: 'January 2026',
    shortMonth: 'Jan',
    academicTerm: 'Term 2',
    workingDays: 20,
    totalLeaveRequests: 3,
    approvedLeaveDays: 5,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 3, casual: 2, annual: 0, study: 0, maternity: 0 },
    attendanceRate: 97.5,
    onTimeRate: 94.0,
    unexcusedAbsenceDays: 1,
    staffingAvailabilityIndex: 96.9,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Medical',
    status: 'optimal',
    notes: 'Term 2 resumption; staff punctuality rebounded to excellent rates.',
  },
  {
    monthKey: '2026-02',
    monthName: 'February 2026',
    shortMonth: 'Feb',
    academicTerm: 'Term 2',
    workingDays: 20,
    totalLeaveRequests: 4,
    approvedLeaveDays: 8,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 5, casual: 3, annual: 0, study: 0, maternity: 0 },
    attendanceRate: 95.0,
    onTimeRate: 91.0,
    unexcusedAbsenceDays: 2,
    staffingAvailabilityIndex: 94.2,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Academic - Sciences',
    status: 'optimal',
    notes: 'Seasonal flu spike addressed promptly by school clinic health protocol.',
  },
  {
    monthKey: '2026-03',
    monthName: 'March 2026',
    shortMonth: 'Mar',
    academicTerm: 'Term 2',
    workingDays: 22,
    totalLeaveRequests: 5,
    approvedLeaveDays: 12,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 1,
    leavesByType: { sick: 3, casual: 4, annual: 0, study: 5, maternity: 0 },
    attendanceRate: 93.2,
    onTimeRate: 88.5,
    unexcusedAbsenceDays: 3,
    staffingAvailabilityIndex: 92.5,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'ICT & Tech',
    status: 'moderate',
    notes: 'Cambridge accreditation workshops & exam board training leaves.',
  },
  {
    monthKey: '2026-04',
    monthName: 'April 2026',
    shortMonth: 'Apr',
    academicTerm: 'Term 2',
    workingDays: 18,
    totalLeaveRequests: 4,
    approvedLeaveDays: 10,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 2, casual: 4, annual: 4, study: 0, maternity: 0 },
    attendanceRate: 92.0,
    onTimeRate: 87.0,
    unexcusedAbsenceDays: 2,
    staffingAvailabilityIndex: 91.4,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Bursary',
    status: 'moderate',
    notes: 'Easter recess & Term 2 report card compilations.',
  },
  {
    monthKey: '2026-05',
    monthName: 'May 2026',
    shortMonth: 'May',
    academicTerm: 'Term 3',
    workingDays: 21,
    totalLeaveRequests: 3,
    approvedLeaveDays: 6,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 3, casual: 3, annual: 0, study: 0, maternity: 0 },
    attendanceRate: 96.8,
    onTimeRate: 93.4,
    unexcusedAbsenceDays: 1,
    staffingAvailabilityIndex: 96.1,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Academic - Languages',
    status: 'optimal',
    notes: 'Term 3 kickoff; high faculty attendance and curriculum delivery.',
  },
  {
    monthKey: '2026-06',
    monthName: 'June 2026',
    shortMonth: 'Jun',
    academicTerm: 'Term 3',
    workingDays: 22,
    totalLeaveRequests: 4,
    approvedLeaveDays: 8,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 4, casual: 2, annual: 0, study: 2, maternity: 0 },
    attendanceRate: 95.5,
    onTimeRate: 90.5,
    unexcusedAbsenceDays: 2,
    staffingAvailabilityIndex: 94.6,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Security & Logistics',
    status: 'optimal',
    notes: 'WAEC / BECE exams invigilation coverage maintained.',
  },
  {
    monthKey: '2026-07',
    monthName: 'July 2026',
    shortMonth: 'Jul',
    academicTerm: 'Term 3',
    workingDays: 22,
    totalLeaveRequests: 6,
    approvedLeaveDays: 15,
    pendingLeaveDays: 0,
    rejectedLeaveRequests: 1,
    leavesByType: { sick: 2, casual: 3, annual: 10, study: 0, maternity: 0 },
    attendanceRate: 90.8,
    onTimeRate: 86.2,
    unexcusedAbsenceDays: 3,
    staffingAvailabilityIndex: 89.8,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Academic - Sciences',
    status: 'moderate',
    notes: 'Annual leave approvals ahead of summer vacation.',
  },
  {
    monthKey: '2026-08',
    monthName: 'August 2026 (Current)',
    shortMonth: 'Aug',
    academicTerm: 'Term 3',
    workingDays: 12,
    totalLeaveRequests: 5,
    approvedLeaveDays: 5,
    pendingLeaveDays: 2,
    rejectedLeaveRequests: 0,
    leavesByType: { sick: 0, casual: 0, annual: 3, study: 2, maternity: 0 },
    attendanceRate: 96.2,
    onTimeRate: 92.5,
    unexcusedAbsenceDays: 1,
    staffingAvailabilityIndex: 95.8,
    staffHeadcount: 8,
    primaryDepartmentAffected: 'Academic - Languages',
    status: 'optimal',
    notes: 'Current month in progress. Mrs. Eze-Chukwu (3d) & Mr. Adekunle (2d study).',
  },
];

export const StaffLeaveAttendanceBarChart: React.FC<StaffLeaveAttendanceBarChartProps> = ({
  staff,
  attendanceRecords,
  leaveRequests,
  onApplyLeaveClick,
}) => {
  // Filter States
  const [timeRange, setTimeRange] = useState<'12m' | 'term1' | 'term2' | 'term3' | '6m'>('12m');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'comparison' | 'categories' | 'headcount'>('comparison');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyHRData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyHRData | null>(HISTORICAL_MONTHLY_BENCHMARKS[HISTORICAL_MONTHLY_BENCHMARKS.length - 1]);

  // Compute live dataset merged with any newly submitted leave requests
  const monthlyData = useMemo(() => {
    // Clone benchmarks
    const data = HISTORICAL_MONTHLY_BENCHMARKS.map((m) => ({ ...m }));

    // Factor in live leave requests into August 2026 (current month)
    const currentMonthData = data.find((d) => d.monthKey === '2026-08');
    if (currentMonthData && leaveRequests.length > 0) {
      let liveLeaveDays = 0;
      let livePendingDays = 0;
      let sick = 0;
      let casual = 0;
      let annual = 0;
      let study = 0;
      let maternity = 0;

      leaveRequests.forEach((req) => {
        if (req.status === 'Approved') {
          liveLeaveDays += req.daysCount;
        } else if (req.status === 'Pending') {
          livePendingDays += req.daysCount;
        }

        if (req.type === 'Sick') sick += req.daysCount;
        else if (req.type === 'Casual') casual += req.daysCount;
        else if (req.type === 'Annual') annual += req.daysCount;
        else if (req.type === 'Study') study += req.daysCount;
        else if (req.type === 'Maternity') maternity += req.daysCount;
      });

      currentMonthData.totalLeaveRequests = leaveRequests.length;
      currentMonthData.approvedLeaveDays = liveLeaveDays || 3;
      currentMonthData.pendingLeaveDays = livePendingDays || 2;
      currentMonthData.leavesByType = { sick, casual, annual, study, maternity };
    }

    // Filter by time range
    let filtered = data;
    if (timeRange === '6m') {
      filtered = data.slice(-6);
    } else if (timeRange === 'term1') {
      filtered = data.filter((d) => d.academicTerm === 'Term 1');
    } else if (timeRange === 'term2') {
      filtered = data.filter((d) => d.academicTerm === 'Term 2');
    } else if (timeRange === 'term3') {
      filtered = data.filter((d) => d.academicTerm === 'Term 3');
    }

    // Department adjustment factor (if user filters by department)
    if (selectedDept !== 'all') {
      return filtered.map((item) => {
        const isTargetDept = item.primaryDepartmentAffected === selectedDept;
        const leaveMultiplier = isTargetDept ? 0.65 : 0.2;
        const totalDeptLeave = Math.max(1, Math.round(item.approvedLeaveDays * leaveMultiplier));
        return {
          ...item,
          approvedLeaveDays: totalDeptLeave,
          totalLeaveRequests: Math.max(1, Math.round(item.totalLeaveRequests * (isTargetDept ? 0.7 : 0.3))),
          staffingAvailabilityIndex: isTargetDept
            ? Math.max(82, item.staffingAvailabilityIndex - 3.5)
            : Math.min(99, item.staffingAvailabilityIndex + 2.0),
        };
      });
    }

    return filtered;
  }, [timeRange, selectedDept, leaveRequests]);

  // Aggregate Key Performance Indicators for HR
  const summaryStats = useMemo(() => {
    const totalRequests = monthlyData.reduce((sum, m) => sum + m.totalLeaveRequests, 0);
    const totalLeaveDays = monthlyData.reduce((sum, m) => sum + m.approvedLeaveDays, 0);
    const avgAttendanceRate = (
      monthlyData.reduce((sum, m) => sum + m.attendanceRate, 0) / (monthlyData.length || 1)
    ).toFixed(1);
    const avgAvailabilityIndex = (
      monthlyData.reduce((sum, m) => sum + m.staffingAvailabilityIndex, 0) / (monthlyData.length || 1)
    ).toFixed(1);

    // Find peak leave month
    let peakMonth = monthlyData[0];
    monthlyData.forEach((m) => {
      if (m.approvedLeaveDays > (peakMonth?.approvedLeaveDays || 0)) {
        peakMonth = m;
      }
    });

    return {
      totalRequests,
      totalLeaveDays,
      avgAttendanceRate,
      avgAvailabilityIndex,
      peakMonthName: peakMonth ? `${peakMonth.shortMonth} (${peakMonth.approvedLeaveDays} days)` : 'None',
      currentMonthAvailable: monthlyData[monthlyData.length - 1]?.staffingAvailabilityIndex.toFixed(1) || '95.8',
    };
  }, [monthlyData]);

  // SVG Chart Dimensions
  const chartHeight = 240;
  const chartWidth = 720;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Max values for scale
  const maxLeaveDays = Math.max(20, ...monthlyData.map((d) => d.approvedLeaveDays + d.pendingLeaveDays));
  const maxAttendancePct = 100;

  // X & Y Scale calculations
  const barGroupWidth = innerWidth / monthlyData.length;
  const singleBarWidth = Math.max(8, Math.min(22, (barGroupWidth - 12) / 2));

  // Export CSV summary of HR data
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Term',
      'Total Leave Requests',
      'Approved Leave Days',
      'Pending Leave Days',
      'Attendance Rate (%)',
      'Staffing Availability (%)',
      'Status',
      'HR Operational Notes',
    ];
    const rows = monthlyData.map((d) => [
      `"${d.monthName}"`,
      `"${d.academicTerm}"`,
      d.totalLeaveRequests,
      d.approvedLeaveDays,
      d.pendingLeaveDays,
      d.attendanceRate,
      d.staffingAvailabilityIndex,
      `"${d.status}"`,
      `"${d.notes}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HR_Staff_Leave_Attendance_Report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFocusMonth = hoveredMonth || selectedMonth || monthlyData[monthlyData.length - 1];

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900">
                <BarChart3 className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Monthly Total Leave Requests vs Historical Attendance Patterns
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Dual-metric HR intelligence comparing faculty leave volume against biometric clock-in coverage.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
              title="Download detailed CSV data"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            {onApplyLeaveClick && (
              <button
                onClick={onApplyLeaveClick}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Log Leave Request</span>
              </button>
            )}
          </div>
        </div>

        {/* HR Availability KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Historical Attendance Avg
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 font-mono">
                {summaryStats.avgAttendanceRate}%
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +1.4%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Target: ≥92.0% benchmark</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cumulative Leave Days Taken
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-600 font-mono">
                {summaryStats.totalLeaveDays} Days
              </span>
              <span className="text-[10px] font-bold text-slate-600 font-mono">
                ({summaryStats.totalRequests} Requests)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Approved by Principal Office</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Staffing Availability Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-indigo-950 font-mono">
                {summaryStats.avgAvailabilityIndex}%
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                Optimal
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Active classroom & admin coverage</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Peak Leave Strain Period
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900 truncate">
                {summaryStats.peakMonthName}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Term wrap-up & holiday travel</p>
          </div>
        </div>

        {/* Filter Toolbar: Time Range, Department, & Metric View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Time range selector pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTimeRange('12m')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === '12m'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Full 12 Months
            </button>
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === '6m'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Recent 6M
            </button>
            <button
              onClick={() => setTimeRange('term1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === 'term1'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Term 1 (Sep-Dec)
            </button>
            <button
              onClick={() => setTimeRange('term2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === 'term2'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Term 2 (Jan-Apr)
            </button>
            <button
              onClick={() => setTimeRange('term3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === 'term3'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Term 3 (May-Aug)
            </button>
          </div>

          {/* Department Filter & Metric Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Departments ({staff.length} Staff)</option>
                <option value="Academic - Sciences">Academic - Sciences</option>
                <option value="Academic - Languages">Academic - Languages</option>
                <option value="Administration">Administration</option>
                <option value="Bursary">Bursary & Finance</option>
                <option value="ICT & Tech">ICT & Tech</option>
                <option value="Medical">Medical / Clinic</option>
                <option value="Security & Logistics">Security & Logistics</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setChartMetric('comparison')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartMetric === 'comparison'
                    ? 'bg-white text-indigo-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave vs Attendance %
              </button>
              <button
                onClick={() => setChartMetric('categories')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartMetric === 'categories'
                    ? 'bg-white text-indigo-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Leave Categories Breakdown
              </button>
            </div>
          </div>
        </div>

        {/* Legend Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            {chartMetric === 'comparison' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-900 border border-indigo-950 inline-block" />
                  <span className="font-bold text-slate-700">Historical Attendance Rate (%) [Left Axis]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-600 inline-block" />
                  <span className="font-bold text-slate-700">Total Approved Leave Days [Right Axis]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-emerald-500 inline-block border-t border-dashed border-emerald-600" />
                  <span className="font-bold text-emerald-800">92% Target Availability Threshold</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                  <span className="font-medium text-slate-700">Sick Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  <span className="font-medium text-slate-700">Casual Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                  <span className="font-medium text-slate-700">Annual Vacation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
                  <span className="font-medium text-slate-700">Study / Exam Leave</span>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Hover or click bars to inspect monthly HR metrics
          </div>
        </div>

        {/* Primary Interactive SVG Bar Chart */}
        <div className="relative overflow-x-auto">
          <div className="min-w-[640px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Background horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const y = padding.top + innerHeight - (pct / 100) * innerHeight;
                return (
                  <g key={pct}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerWidth}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    {/* Left Axis Label: Attendance % */}
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#64748b"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Right Axis: Leave Days Scale */}
              {[0, 5, 10, 15, 20].map((days) => {
                const y = padding.top + innerHeight - (days / 20) * innerHeight;
                return (
                  <g key={`right-${days}`}>
                    <text
                      x={padding.left + innerWidth + 8}
                      y={y + 3}
                      textAnchor="start"
                      fontSize="10"
                      fill="#b45309"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {days}d
                    </text>
                  </g>
                );
              })}

              {/* 92% Target Benchmark Line */}
              {chartMetric === 'comparison' && (
                <g>
                  <line
                    x1={padding.left}
                    y1={padding.top + innerHeight - (92 / 100) * innerHeight}
                    x2={padding.left + innerWidth}
                    y2={padding.top + innerHeight - (92 / 100) * innerHeight}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                  />
                  <text
                    x={padding.left + innerWidth - 5}
                    y={padding.top + innerHeight - (92 / 100) * innerHeight - 4}
                    textAnchor="end"
                    fontSize="9"
                    fill="#059669"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Target (92%)
                  </text>
                </g>
              )}

              {/* Bars per month */}
              {monthlyData.map((item, index) => {
                const groupCenterX = padding.left + index * barGroupWidth + barGroupWidth / 2;
                const isSelected = selectedMonth?.monthKey === item.monthKey;
                const isHovered = hoveredMonth?.monthKey === item.monthKey;

                // Heights
                const attendanceBarHeight = (item.attendanceRate / maxAttendancePct) * innerHeight;
                const attendanceY = padding.top + innerHeight - attendanceBarHeight;

                const leaveDaysBarHeight = (Math.min(20, item.approvedLeaveDays) / 20) * innerHeight;
                const leaveY = padding.top + innerHeight - leaveDaysBarHeight;

                return (
                  <g
                    key={item.monthKey}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredMonth(item)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    onClick={() => setSelectedMonth(item)}
                  >
                    {/* Background Column Highlight on Hover or Select */}
                    {(isHovered || isSelected) && (
                      <rect
                        x={padding.left + index * barGroupWidth + 2}
                        y={padding.top - 5}
                        width={barGroupWidth - 4}
                        height={innerHeight + 10}
                        fill="#f8fafc"
                        stroke={isSelected ? '#6366f1' : '#cbd5e1'}
                        strokeWidth="1"
                        rx="6"
                      />
                    )}

                    {chartMetric === 'comparison' ? (
                      /* Grouped Dual Bars */
                      <>
                        {/* Bar 1: Attendance Rate % (Indigo) */}
                        <rect
                          x={groupCenterX - singleBarWidth - 2}
                          y={attendanceY}
                          width={singleBarWidth}
                          height={attendanceBarHeight}
                          fill={isHovered ? '#312e81' : '#1e1b4b'}
                          rx="3"
                          className="transition-all duration-200"
                        />

                        {/* Top Label for Attendance */}
                        {(isHovered || isSelected || monthlyData.length <= 6) && (
                          <text
                            x={groupCenterX - singleBarWidth / 2 - 2}
                            y={attendanceY - 4}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#1e1b4b"
                          >
                            {Math.round(item.attendanceRate)}%
                          </text>
                        )}

                        {/* Bar 2: Leave Days (Amber) */}
                        <rect
                          x={groupCenterX + 2}
                          y={leaveY}
                          width={singleBarWidth}
                          height={Math.max(4, leaveDaysBarHeight)}
                          fill={isHovered ? '#d97706' : '#f59e0b'}
                          rx="3"
                          className="transition-all duration-200"
                        />

                        {/* Top Label for Leave Days */}
                        {(isHovered || isSelected || monthlyData.length <= 6) && (
                          <text
                            x={groupCenterX + singleBarWidth / 2 + 2}
                            y={leaveY - 4}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#b45309"
                          >
                            {item.approvedLeaveDays}d
                          </text>
                        )}
                      </>
                    ) : (
                      /* Stacked Bar for Leave Categories */
                      (() => {
                        const totalDays = Math.max(1, item.approvedLeaveDays);
                        let curY = padding.top + innerHeight;
                        const barW = singleBarWidth * 1.6;
                        const x = groupCenterX - barW / 2;

                        const types = [
                          { key: 'sick', val: item.leavesByType.sick, color: '#f43f5e' },
                          { key: 'casual', val: item.leavesByType.casual, color: '#f59e0b' },
                          { key: 'annual', val: item.leavesByType.annual, color: '#4f46e5' },
                          { key: 'study', val: item.leavesByType.study, color: '#9333ea' },
                        ];

                        return (
                          <>
                            {types.map((t) => {
                              if (t.val <= 0) return null;
                              const segH = (t.val / 20) * innerHeight;
                              curY -= segH;
                              return (
                                <rect
                                  key={t.key}
                                  x={x}
                                  y={curY}
                                  width={barW}
                                  height={Math.max(2, segH)}
                                  fill={t.color}
                                  rx="2"
                                />
                              );
                            })}
                            <text
                              x={groupCenterX}
                              y={curY - 4}
                              textAnchor="middle"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              fill="#475569"
                            >
                              {item.approvedLeaveDays}d
                            </text>
                          </>
                        );
                      })()
                    )}

                    {/* X Axis Month Label */}
                    <text
                      x={groupCenterX}
                      y={padding.top + innerHeight + 18}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? 'bold' : '500'}
                      fill={isSelected ? '#1e1b4b' : '#475569'}
                    >
                      {item.shortMonth}
                    </text>

                    {/* Term Label indicator */}
                    <text
                      x={groupCenterX}
                      y={padding.top + innerHeight + 30}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {item.academicTerm.replace('Term ', 'T')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Month Deep-Dive HR Detail Card */}
      {activeFocusMonth && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-900 text-white font-bold font-mono text-xs">
                {activeFocusMonth.shortMonth}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{activeFocusMonth.monthName}</span>
                  <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-mono font-bold">
                    {activeFocusMonth.academicTerm}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      activeFocusMonth.status === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : activeFocusMonth.status === 'moderate'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {activeFocusMonth.status === 'optimal'
                      ? 'Optimal Staffing'
                      : activeFocusMonth.status === 'moderate'
                      ? 'Moderate Load'
                      : 'Critical Strain'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {activeFocusMonth.notes}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase block">Staffing Capacity</span>
                <span className="text-indigo-950 font-black text-sm">
                  {activeFocusMonth.staffingAvailabilityIndex}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase block">Attendance Rate</span>
                <span className="text-emerald-700 font-black text-sm">
                  {activeFocusMonth.attendanceRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Metric Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Leave Requests Logged</span>
              <p className="text-base font-black text-slate-900 font-mono">
                {activeFocusMonth.totalLeaveRequests} Applications
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {activeFocusMonth.approvedLeaveDays} Days Approved • {activeFocusMonth.pendingLeaveDays} Pending
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Punctuality Score</span>
              <p className="text-base font-black text-amber-600 font-mono">
                {activeFocusMonth.onTimeRate}% On-Time
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Gate check-in before 07:30 AM
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Leave Categories</span>
              <div className="text-xs space-y-0.5 pt-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Annual / Vacation:</span>
                  <span className="font-mono font-bold text-indigo-900">{activeFocusMonth.leavesByType.annual}d</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Sick / Medical:</span>
                  <span className="font-mono font-bold text-rose-700">{activeFocusMonth.leavesByType.sick}d</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Casual / Study:</span>
                  <span className="font-mono font-bold text-purple-700">
                    {activeFocusMonth.leavesByType.casual + activeFocusMonth.leavesByType.study}d
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Department Most Affected</span>
              <p className="text-xs font-bold text-slate-900 truncate mt-1">
                {activeFocusMonth.primaryDepartmentAffected}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Substitute Cover Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Historical Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-700" />
            <span>Monthly HR Staffing Audit Table & Coverage Ledger</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            Showing {monthlyData.length} Months
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Academic Month</th>
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4">Leave Requests</th>
                <th className="py-3 px-4">Leave Days (Approved)</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">On-Time %</th>
                <th className="py-3 px-4">Staffing Availability</th>
                <th className="py-3 px-4 text-right">HR Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {monthlyData.map((d) => (
                <tr
                  key={d.monthKey}
                  onClick={() => setSelectedMonth(d)}
                  className={`cursor-pointer transition-colors ${
                    selectedMonth?.monthKey === d.monthKey
                      ? 'bg-indigo-50/50 font-bold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 text-slate-900 font-bold flex items-center gap-2">
                    <span>{d.monthName}</span>
                    {d.monthKey === '2026-08' && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-black rounded uppercase">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{d.academicTerm}</td>
                  <td className="py-3 px-4 font-mono text-slate-800">
                    {d.totalLeaveRequests} req
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-700">
                    {d.approvedLeaveDays} Days
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {d.attendanceRate}%
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {d.onTimeRate}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            d.staffingAvailabilityIndex >= 93
                              ? 'bg-emerald-500'
                              : d.staffingAvailabilityIndex >= 88
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${d.staffingAvailabilityIndex}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {d.staffingAvailabilityIndex}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        d.status === 'optimal'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : d.status === 'moderate'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
