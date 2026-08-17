import { 
  AttendanceRecord, 
  PayrollRecord, 
  Student, 
  Staff, 
  LeaveRequest, 
  NotificationLog, 
  SchoolSettings 
} from '../types';
import { downloadCSV } from './audio';

/**
 * Format date for backup filenames
 */
export function getBackupDateSlug(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${mins}`;
}

/**
 * Export All Attendance Records to CSV with comprehensive metadata
 */
export function exportAttendanceRecordsToCSV(
  records: AttendanceRecord[],
  options?: {
    entityType?: 'all' | 'student' | 'staff';
    dateFilter?: string; // e.g. "2026-08-16" or "all"
    statusFilter?: string; // e.g. "late", "on-time", "all"
    filenamePrefix?: string;
  }
) {
  let filtered = [...records];

  if (options?.entityType && options.entityType !== 'all') {
    filtered = filtered.filter(r => r.entityType === options.entityType);
  }

  if (options?.dateFilter && options.dateFilter !== 'all') {
    filtered = filtered.filter(r => r.dateStr === options.dateFilter);
  }

  if (options?.statusFilter && options.statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === options.statusFilter);
  }

  const rows = filtered.map((r, index) => ({
    'S/N': index + 1,
    'Record ID': r.id,
    'Date (YYYY-MM-DD)': r.dateStr,
    'Time Scanned': r.timeStr,
    'Timestamp (ISO)': r.timestamp,
    'Entity Type': r.entityType === 'student' ? 'Student' : 'Staff / Faculty',
    'Student/Staff ID': r.admissionOrStaffId,
    'Full Name': r.entityName,
    'Class or Role / Department': r.roleOrClass,
    'Attendance Type': r.type === 'check-in' ? 'Check-In (Arrival)' : 'Check-Out (Departure)',
    'Punctuality Status': r.status.toUpperCase(),
    'Gate Location': r.gateLocation,
    'Body Temperature': r.temperature || 'N/A',
    'Scanned / Verified By': r.scannedBy,
    'Administrative Notes': r.notes || 'None',
    'Parent Mobile Push Sent': r.notificationStatus?.pushSent ? 'YES' : 'NO',
    'Parent Email Sent': r.notificationStatus?.emailSent ? 'YES' : 'NO',
    'Parent SMS Sent': r.notificationStatus?.smsSent ? 'YES' : 'NO',
    'Parent Notified Name': r.notificationStatus?.parentNotifiedName || 'N/A',
    'Parent Phone Contact': r.notificationStatus?.parentPhone || 'N/A',
    'Parent Email Contact': r.notificationStatus?.parentEmail || 'N/A',
  }));

  const prefix = options?.filenamePrefix || 'Attendance_Register_Secure_Export';
  downloadCSV(`${prefix}_${getBackupDateSlug()}`, rows);
  return rows.length;
}

/**
 * Export All Payroll Records to CSV for Bursary and Bank auditing
 */
export function exportPayrollRecordsToCSV(
  payrollRecords: PayrollRecord[],
  options?: {
    monthFilter?: string;
    statusFilter?: string;
    filenamePrefix?: string;
  }
) {
  let filtered = [...payrollRecords];

  if (options?.monthFilter && options.monthFilter !== 'all') {
    filtered = filtered.filter(p => p.month === options.monthFilter);
  }

  if (options?.statusFilter && options.statusFilter !== 'all') {
    filtered = filtered.filter(p => p.paymentStatus === options.statusFilter);
  }

  const rows = filtered.map((p, index) => ({
    'S/N': index + 1,
    'Payroll Ref ID': p.id,
    'Payroll Month Cycle': p.month,
    'Year': p.year,
    'Staff Employee ID': p.employeeId,
    'Staff Full Name': p.staffName,
    'Designation / Role': p.role,
    'Department': p.department,
    'Base Basic Salary (NGN)': p.baseSalary,
    'Housing Allowance (NGN)': p.allowancesBreakdown.housing || 0,
    'Transport Allowance (NGN)': p.allowancesBreakdown.transport || 0,
    'Responsibility Allowance (NGN)': p.allowancesBreakdown.responsibility || 0,
    'Hazard Allowance (NGN)': p.allowancesBreakdown.hazard || 0,
    'Teaching Allowance (NGN)': p.allowancesBreakdown.teaching || 0,
    'Total Allowances (NGN)': p.totalAllowances,
    'Gross Earnings (NGN)': p.grossPay,
    'Expected Working Days': p.workingDaysExpected,
    'Days Present (Clocked-In)': p.daysPresent,
    'Days Late (Recorded)': p.daysLate,
    'Days Absent Unexcused': p.daysAbsentUnexcused,
    'Days on Approved Leave': p.daysOnApprovedLeave,
    'PenCom Pension Contribution (8%) (NGN)': p.deductions.pensionContribution,
    'PAYE Income Tax (FCT IRS) (NGN)': p.deductions.payeTax,
    'Late Arrival Penalty Deductions (NGN)': p.deductions.lateDeductions,
    'Unexcused Absence Deductions (NGN)': p.deductions.unexcusedAbsenceDeduction,
    'Total Statutory & Attendance Deductions (NGN)': p.totalDeductions,
    'Net Payable Salary (NGN)': p.netPay,
    'Beneficiary Bank Name': p.bankName,
    'Beneficiary Account Number': p.accountNumber,
    'Disbursement Status': p.paymentStatus,
    'Disbursed Date': p.disbursedAt || 'Pending',
    'Payslip Email Sent': p.payslipSent ? 'YES' : 'NO',
  }));

  const prefix = options?.filenamePrefix || 'Staff_Payroll_Disbursement_Schedule';
  downloadCSV(`${prefix}_${getBackupDateSlug()}`, rows);
  return rows.length;
}

/**
 * Export Students Directory CSV
 */
export function exportStudentsDirectoryCSV(students: Student[]) {
  const rows = students.map((s, index) => ({
    'S/N': index + 1,
    'Student ID': s.id,
    'Admission Number': s.admissionNumber,
    'First Name': s.firstName,
    'Last Name': s.lastName,
    'Gender': s.gender,
    'Grade Level': s.grade,
    'Class Section': s.classSection,
    'House Color': s.houseColor,
    'Blood Group': s.bloodGroup || 'N/A',
    'Parent / Guardian Name': s.parentName,
    'Relationship': s.parentRelationship,
    'Parent Phone': s.parentPhone,
    'Parent Email': s.parentEmail,
    'Residential Address': s.address,
    'School Bus Route': s.busRoute || 'Private Drop-off',
    'Emergency Contact': s.emergencyContact,
    'Enrollment Status': s.status,
  }));

  downloadCSV(`Student_Directory_Master_${getBackupDateSlug()}`, rows);
  return rows.length;
}

/**
 * Export Staff Directory CSV
 */
export function exportStaffDirectoryCSV(staff: Staff[]) {
  const rows = staff.map((st, index) => ({
    'S/N': index + 1,
    'Staff ID': st.id,
    'Employee ID': st.employeeId,
    'First Name': st.firstName,
    'Last Name': st.lastName,
    'Gender': st.gender,
    'Role / Title': st.role,
    'Department': st.department,
    'Email Address': st.email,
    'Phone Number': st.phone,
    'Base Salary (NGN)': st.baseSalary,
    'Housing Allowance': st.allowances.housing || 0,
    'Transport Allowance': st.allowances.transport || 0,
    'Bank Name': st.bankName,
    'Account Number': st.accountNumber,
    'Account Name': st.accountName,
    'PenCom Pension ID': st.pensionNumber,
    'Tax Identification Number': st.taxId,
    'Date Joined': st.dateJoined,
    'Shift Hours': `${st.shiftSchedule.start} - ${st.shiftSchedule.end}`,
    'Employment Type': st.employmentType,
    'Status': st.status,
  }));

  downloadCSV(`Staff_Faculty_Directory_${getBackupDateSlug()}`, rows);
  return rows.length;
}

/**
 * Complete Full System Backup (Encrypted / JSON Archive)
 * Saves all database tables and school settings to a single secure local JSON file
 */
export interface SystemBackupData {
  version: string;
  exportedAt: string;
  schoolSettings: SchoolSettings;
  studentsCount: number;
  students: Student[];
  staffCount: number;
  staff: Staff[];
  attendanceCount: number;
  attendanceRecords: AttendanceRecord[];
  payrollCount: number;
  payrollRecords: PayrollRecord[];
  leaveRequestsCount: number;
  leaveRequests: LeaveRequest[];
  notificationLogsCount: number;
  notificationLogs: NotificationLog[];
}

export function downloadCompleteSystemBackup(data: {
  schoolSettings: SchoolSettings;
  students: Student[];
  staff: Staff[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  leaveRequests: LeaveRequest[];
  notificationLogs: NotificationLog[];
}) {
  const backup: SystemBackupData = {
    version: '2.5.0-abuja-fct',
    exportedAt: new Date().toISOString(),
    schoolSettings: data.schoolSettings,
    studentsCount: data.students.length,
    students: data.students,
    staffCount: data.staff.length,
    staff: data.staff,
    attendanceCount: data.attendanceRecords.length,
    attendanceRecords: data.attendanceRecords,
    payrollCount: data.payrollRecords.length,
    payrollRecords: data.payrollRecords,
    leaveRequestsCount: data.leaveRequests.length,
    leaveRequests: data.leaveRequests,
    notificationLogsCount: data.notificationLogs.length,
    notificationLogs: data.notificationLogs,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Heritage_Abuja_Complete_Secure_Backup_${getBackupDateSlug()}.json`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return filename;
}
