import React, { useState, useMemo } from 'react';
import { 
  PieChart as PieIcon, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UserX, 
  Filter, 
  Layers, 
  ArrowUpRight, 
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Student, AttendanceRecord } from '../types';

interface AttendanceStatusPieChartProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSelectStudent?: (student: Student) => void;
}

interface StatusSlice {
  key: 'on-time' | 'late' | 'absent';
  label: string;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
  bgLight: string;
  textLight: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  studentsList: Student[];
}

export const AttendanceStatusPieChart: React.FC<AttendanceStatusPieChartProps> = ({
  students,
  attendanceRecords,
  onSelectStudent,
}) => {
  // Selected Class Filter (or 'all')
  const [selectedClass, setSelectedClass] = useState<string>('all');
  // Selected Date Filter (or 'today')
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-16');
  // Chart Visual Mode: 'donut' | 'pie'
  const [chartMode, setChartMode] = useState<'donut' | 'pie'>('donut');
  // Hovered slice for interactive details
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  // Active slice filter to show drill-down student cards
  const [activeDrillDown, setActiveDrillDown] = useState<'on-time' | 'late' | 'absent' | null>(null);

  // Available unique classes
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.classSection));
    return Array.from(set).sort();
  }, [students]);

  // Available dates in attendance records
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    attendanceRecords.forEach((r) => {
      if (r.dateStr) set.add(r.dateStr);
    });
    set.add('2026-08-16');
    return Array.from(set).sort().reverse();
  }, [attendanceRecords]);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    if (selectedClass === 'all') return students;
    return students.filter((s) => s.classSection === selectedClass);
  }, [students, selectedClass]);

  // Check-ins for the selected date
  const dateCheckIns = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.entityType === 'student' && r.dateStr === selectedDate && r.type === 'check-in'
    );
  }, [attendanceRecords, selectedDate]);

  // Calculate status breakdown for current selection
  const { slices, totalCount, onTimeCount, lateCount, absentCount, onTimeRate } = useMemo(() => {
    const presentMap = new Map<string, AttendanceRecord>();
    dateCheckIns.forEach((r) => {
      presentMap.set(r.entityId, r);
    });

    const onTimeList: Student[] = [];
    const lateList: Student[] = [];
    const absentList: Student[] = [];

    classStudents.forEach((student) => {
      const record = presentMap.get(student.id);
      if (!record) {
        absentList.push(student);
      } else if (record.status === 'late') {
        lateList.push(student);
      } else {
        onTimeList.push(student);
      }
    });

    const total = classStudents.length || 1;
    const onTime = onTimeList.length;
    const late = lateList.length;
    const absent = absentList.length;

    const onTimePct = Math.round((onTime / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const absentPct = 100 - onTimePct - latePct >= 0 ? 100 - onTimePct - latePct : Math.round((absent / total) * 100);

    const sliceData: StatusSlice[] = [
      {
        key: 'on-time',
        label: 'On-Time Arrival',
        count: onTime,
        percentage: onTimePct,
        color: '#10B981', // emerald-500
        hoverColor: '#059669', // emerald-600
        bgLight: 'bg-emerald-50',
        textLight: 'text-emerald-800',
        borderColor: 'border-emerald-200',
        icon: CheckCircle2,
        studentsList: onTimeList,
      },
      {
        key: 'late',
        label: 'Late Arrival',
        count: late,
        percentage: latePct,
        color: '#F59E0B', // amber-500
        hoverColor: '#D97706', // amber-600
        bgLight: 'bg-amber-50',
        textLight: 'text-amber-800',
        borderColor: 'border-amber-200',
        icon: Clock,
        studentsList: lateList,
      },
      {
        key: 'absent',
        label: 'Unexcused Absence',
        count: absent,
        percentage: absentPct,
        color: '#F43F5E', // rose-500
        hoverColor: '#E11D48', // rose-600
        bgLight: 'bg-rose-50',
        textLight: 'text-rose-800',
        borderColor: 'border-rose-200',
        icon: UserX,
        studentsList: absentList,
      },
    ];

    return {
      slices: sliceData,
      totalCount: classStudents.length,
      onTimeCount: onTime,
      lateCount: late,
      absentCount: absent,
      onTimeRate: onTimePct,
    };
  }, [classStudents, dateCheckIns]);

  // Class-by-Class Comparative Matrix
  const classBreakdownMatrix = useMemo(() => {
    const presentMap = new Map<string, AttendanceRecord>();
    dateCheckIns.forEach((r) => {
      presentMap.set(r.entityId, r);
    });

    return uniqueClasses.map((cls) => {
      const clsStudents = students.filter((s) => s.classSection === cls);
      let onTime = 0;
      let late = 0;
      let absent = 0;

      clsStudents.forEach((st) => {
        const rec = presentMap.get(st.id);
        if (!rec) {
          absent++;
        } else if (rec.status === 'late') {
          late++;
        } else {
          onTime++;
        }
      });

      const total = clsStudents.length || 1;
      const onTimePct = Math.round((onTime / total) * 100);
      const latePct = Math.round((late / total) * 100);
      const absentPct = Math.round((absent / total) * 100);

      return {
        className: cls,
        total: clsStudents.length,
        onTime,
        late,
        absent,
        onTimePct,
        latePct,
        absentPct,
      };
    });
  }, [uniqueClasses, students, dateCheckIns]);

  // Highest late class & Highest on-time class for leadership insights
  const leadershipInsights = useMemo(() => {
    if (classBreakdownMatrix.length === 0) return null;
    const sortedByPunctuality = [...classBreakdownMatrix].sort((a, b) => b.onTimePct - a.onTimePct);
    const topClass = sortedByPunctuality[0];
    const sortedByLate = [...classBreakdownMatrix].sort((a, b) => b.latePct - a.latePct);
    const mostLateClass = sortedByLate[0];
    const sortedByAbsence = [...classBreakdownMatrix].sort((a, b) => b.absentPct - a.absentPct);
    const mostAbsentClass = sortedByAbsence[0];

    return {
      topClass,
      mostLateClass,
      mostAbsentClass,
    };
  }, [classBreakdownMatrix]);

  // SVG Pie/Donut Geometry Calculations
  const renderSvgSlices = () => {
    const cx = 100;
    const cy = 100;
    const outerR = 82;
    const innerR = chartMode === 'donut' ? 48 : 0;

    let cumulativeAngle = -Math.PI / 2; // start from top (12 o'clock)
    const validSlices = slices.filter((s) => s.count > 0);

    // If only one category has 100%
    if (validSlices.length === 1) {
      const slice = validSlices[0];
      const isHovered = hoveredSlice === slice.key || activeDrillDown === slice.key;
      return (
        <g 
          className="cursor-pointer transition-transform duration-200"
          onMouseEnter={() => setHoveredSlice(slice.key)}
          onMouseLeave={() => setHoveredSlice(null)}
          onClick={() => setActiveDrillDown(activeDrillDown === slice.key ? null : slice.key)}
        >
          {chartMode === 'donut' ? (
            <circle
              cx={cx}
              cy={cy}
              r={(outerR + innerR) / 2}
              fill="none"
              stroke={isHovered ? slice.hoverColor : slice.color}
              strokeWidth={outerR - innerR}
              className="transition-all duration-300"
            />
          ) : (
            <circle
              cx={cx}
              cy={cy}
              r={outerR}
              fill={isHovered ? slice.hoverColor : slice.color}
              className="transition-all duration-300"
            />
          )}
        </g>
      );
    }

    return validSlices.map((slice) => {
      const fraction = slice.count / (totalCount || 1);
      const angle = fraction * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);

      const isLargeArc = angle > Math.PI ? 1 : 0;
      const isHovered = hoveredSlice === slice.key || activeDrillDown === slice.key;

      let d = '';
      if (chartMode === 'donut') {
        const x3 = cx + innerR * Math.cos(endAngle);
        const y3 = cy + innerR * Math.sin(endAngle);
        const x4 = cx + innerR * Math.cos(startAngle);
        const y4 = cy + innerR * Math.sin(startAngle);

        d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${isLargeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${isLargeArc} 0 ${x4} ${y4} Z`;
      } else {
        d = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${isLargeArc} 1 ${x2} ${y2} Z`;
      }

      // Mid-angle for slice explosion offset on hover
      const midAngle = (startAngle + endAngle) / 2;
      const offsetDist = isHovered ? 4 : 0;
      const offsetX = offsetDist * Math.cos(midAngle);
      const offsetY = offsetDist * Math.sin(midAngle);

      return (
        <path
          key={slice.key}
          d={d}
          fill={isHovered ? slice.hoverColor : slice.color}
          stroke="#ffffff"
          strokeWidth="2"
          transform={`translate(${offsetX}, ${offsetY})`}
          className="cursor-pointer transition-all duration-200 hover:opacity-95"
          onMouseEnter={() => setHoveredSlice(slice.key)}
          onMouseLeave={() => setHoveredSlice(null)}
          onClick={() => setActiveDrillDown(activeDrillDown === slice.key ? null : slice.key)}
        />
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-900 text-amber-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Attendance Status Breakdown by Class Section
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Proportional distribution of On-Time, Late Arrivals, and Unaccounted Absences across classes.
          </p>
        </div>

        {/* Filters: Class Selector, Date Picker & Chart Type */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setActiveDrillDown(null);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes ({students.length} Students)</option>
              {uniqueClasses.map((cls) => {
                const count = students.filter((s) => s.classSection === cls).length;
                return (
                  <option key={cls} value={cls}>
                    {cls} ({count} Students)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date Selector */}
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {date === '2026-08-16' ? `Today (${date})` : date}
              </option>
            ))}
          </select>

          {/* Donut / Full Pie Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
            <button
              type="button"
              onClick={() => setChartMode('donut')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'donut'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Donut
            </button>
            <button
              type="button"
              onClick={() => setChartMode('pie')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'pie'
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pie
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Row: SVG Chart & Status Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Side: SVG Interactive Pie / Donut Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full transform transition-transform">
              {renderSvgSlices()}
            </svg>

            {/* Donut Center Summary Callout */}
            {chartMode === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {onTimeRate}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  On-Time Rate
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                  {selectedClass === 'all' ? 'School-wide' : selectedClass}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>Click any slice or card to view detailed student roster</span>
          </p>
        </div>

        {/* Right Side: Breakdown Stat Cards & Interactive Legend */}
        <div className="md:col-span-7 space-y-3">
          {slices.map((slice) => {
            const Icon = slice.icon;
            const isHovered = hoveredSlice === slice.key;
            const isActive = activeDrillDown === slice.key;

            return (
              <div
                key={slice.key}
                onMouseEnter={() => setHoveredSlice(slice.key)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => setActiveDrillDown(isActive ? null : slice.key)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? `${slice.bgLight} ${slice.borderColor} ring-2 ring-indigo-500/20 shadow-xs`
                    : isHovered
                    ? `${slice.bgLight} ${slice.borderColor} shadow-xs`
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
                    style={{ backgroundColor: slice.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {slice.label}
                      </h4>
                      {isActive && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-900 text-white rounded-full">
                          Filtering Roster
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {slice.key === 'on-time'
                        ? 'Scanned before 07:45 AM threshold'
                        : slice.key === 'late'
                        ? 'Clocked in during grace period or late'
                        : 'No gate check-in recorded'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-base sm:text-lg font-black text-slate-900">
                    {slice.count} <span className="text-xs font-semibold text-slate-500">({slice.percentage}%)</span>
                  </div>
                  <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden ml-auto">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${slice.percentage}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-Down Student List Drawer (when a status slice is clicked) */}
      {activeDrillDown && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                {slices.find((s) => s.key === activeDrillDown)?.label} Roster
              </span>
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-900 font-mono font-bold rounded-full">
                {slices.find((s) => s.key === activeDrillDown)?.studentsList.length} Students
              </span>
            </div>
            <button
              onClick={() => setActiveDrillDown(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Close Roster
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {slices.find((s) => s.key === activeDrillDown)?.studentsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 italic col-span-3 text-center">
                No students in this status category for {selectedClass === 'all' ? 'the entire school' : selectedClass}.
              </p>
            ) : (
              slices
                .find((s) => s.key === activeDrillDown)
                ?.studentsList.map((std) => (
                  <div
                    key={std.id}
                    onClick={() => onSelectStudent && onSelectStudent(std)}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={std.photoUrl}
                        alt={std.firstName}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {std.firstName} {std.lastName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {std.admissionNumber} • {std.classSection}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {std.houseColor}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Leadership Insights & Class-by-Class Comparative Matrix */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-700" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Cross-Class Section Comparative Breakdown
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Benchmark: 95% On-Time Target
          </span>
        </div>

        {/* Insight Badges for Executive Leadership */}
        {leadershipInsights && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Top Punctuality: {leadershipInsights.topClass.className}</span>
                <p className="text-[11px] text-emerald-800">
                  {leadershipInsights.topClass.onTimePct}% on-time rate ({leadershipInsights.topClass.onTime}/{leadershipInsights.topClass.total} present)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Highest Late Rate: {leadershipInsights.mostLateClass.className}</span>
                <p className="text-[11px] text-amber-800">
                  {leadershipInsights.mostLateClass.latePct}% late ({leadershipInsights.mostLateClass.late} late arrivals)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Absence Alert: {leadershipInsights.mostAbsentClass.className}</span>
                <p className="text-[11px] text-rose-800">
                  {leadershipInsights.mostAbsentClass.absentPct}% unexcused ({leadershipInsights.mostAbsentClass.absent} absentees)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compact Stacked Multi-Bar Visual Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {classBreakdownMatrix.map((item) => {
            const isSelected = selectedClass === item.className;
            return (
              <div
                key={item.className}
                onClick={() => {
                  setSelectedClass(isSelected ? 'all' : item.className);
                  setActiveDrillDown(null);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-900">{item.className}</span>
                  <span className="font-mono font-bold text-indigo-950">
                    {item.onTimePct}% On-Time
                  </span>
                </div>

                {/* Stacked Proportional Bar: Green (On-time) | Amber (Late) | Red (Absent) */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${item.onTimePct}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`On-Time: ${item.onTime}`}
                  />
                  <div
                    style={{ width: `${item.latePct}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Late: ${item.late}`}
                  />
                  <div
                    style={{ width: `${item.absentPct}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`Absent: ${item.absent}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                  <span className="text-emerald-700 font-bold">{item.onTime} On-Time</span>
                  <span className="text-amber-700 font-bold">{item.late} Late</span>
                  <span className="text-rose-700 font-bold">{item.absent} Absent</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
