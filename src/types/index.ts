export type Role = 'admin' | 'security' | 'teacher' | 'parent' | 'bursar';

export type EntityType = 'student' | 'staff';

export type AttendanceStatus = 'on-time' | 'late' | 'excused' | 'absent' | 'early-departure';

export type AttendanceType = 'check-in' | 'check-out';

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  grade: string; // e.g. 'JSS 1', 'JSS 2', 'SS 1', 'Primary 4'
  classSection: string; // e.g. 'JSS 2 Diamond', 'SS 3 Science Gold'
  photoUrl: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: 'Father' | 'Mother' | 'Guardian';
  address: string; // Abuja districts
  busRoute?: string;
  houseColor: 'Emerald' | 'Sapphire' | 'Ruby' | 'Topaz';
  bloodGroup?: string;
  emergencyContact: string;
  status: 'Active' | 'Suspended' | 'Alumni';
  qrCodePayload: string;
}

export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  role: string; // e.g. 'Head of STEM', 'Senior Mathematics Master', 'Bursar'
  department: 'Academic - Sciences' | 'Academic - Humanities' | 'Academic - Languages' | 'Administration' | 'Bursary' | 'ICT & Tech' | 'Medical' | 'Security & Logistics';
  email: string;
  phone: string;
  photoUrl: string;
  baseSalary: number; // In Naira (₦)
  allowances: {
    housing: number;
    transport: number;
    hazard?: number;
    teaching?: number;
    responsibility?: number;
  };
  bankName: string;
  accountNumber: string;
  accountName: string;
  pensionNumber: string;
  taxId: string;
  dateJoined: string;
  shiftSchedule: {
    start: string; // e.g. "07:30"
    end: string;   // e.g. "16:00"
  };
  employmentType: 'Full-time' | 'Contract' | 'Part-time';
  status: 'Active' | 'On Leave' | 'Suspended';
  qrCodePayload: string;
}

export interface AttendanceRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  admissionOrStaffId: string;
  roleOrClass: string;
  photoUrl: string;
  timestamp: string; // ISO string
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM AM/PM
  type: AttendanceType;
  status: AttendanceStatus;
  gateLocation: string;
  temperature?: string;
  scannedBy: string;
  notes?: string;
  notificationStatus: {
    pushSent: boolean;
    emailSent: boolean;
    smsSent: boolean;
    parentNotifiedName?: string;
    parentPhone?: string;
    parentEmail?: string;
  };
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  type: 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Study' | 'Bereavement';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  approvedBy?: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  employeeId: string;
  role: string;
  department: string;
  month: string; // e.g. "August 2026"
  year: number;
  baseSalary: number;
  totalAllowances: number;
  allowancesBreakdown: {
    housing: number;
    transport: number;
    hazard?: number;
    teaching?: number;
    responsibility?: number;
  };
  workingDaysExpected: number;
  daysPresent: number;
  daysLate: number;
  daysAbsentUnexcused: number;
  daysOnApprovedLeave: number;
  deductions: {
    lateDeductions: number;
    unexcusedAbsenceDeduction: number;
    pensionContribution: number; // 8% statutory
    payeTax: number;
    welfareLoan?: number;
  };
  totalDeductions: number;
  grossPay: number;
  netPay: number;
  bankName: string;
  accountNumber: string;
  paymentStatus: 'Draft' | 'Approved' | 'Disbursed' | 'Pending Review';
  disbursedAt?: string;
  payslipSent: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'gate_arrival' | 'gate_departure' | 'absence_alert' | 'late_warning' | 'broadcast' | 'payslip_dispatch';
  channel: 'Mobile Push' | 'Email' | 'SMS / WhatsApp';
  recipientType: 'Parent' | 'Staff' | 'All Parents' | 'All Staff';
  recipientName: string;
  recipientContact: string; // phone or email
  studentOrStaffName?: string;
  subject: string;
  body: string;
  status: 'Delivered' | 'Opened' | 'Failed' | 'Sending';
}

export interface NotificationTemplate {
  id: string;
  title: string;
  type: 'arrival' | 'departure' | 'absence' | 'late' | 'broadcast' | 'payslip';
  channel: 'push' | 'email' | 'sms';
  subject: string;
  body: string;
  variables: string[];
}

export interface SchoolHouse {
  name: string;
  color: string;
  badgeColor: string;
}

export interface SchoolSettings {
  schoolName: string;
  shortName: string;
  logoUrl?: string; // Base64 data URL or web image URL for the official school logo
  motto: string;
  academicSession: string;
  currentTerm: string;
  campusAddress: string;
  stateCity: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  principalName: string;
  principalTitle: string;
  bursarName: string;
  bursarTitle: string;
  morningCutoffTime: string; // e.g. "07:45"
  dismissalTime: string; // e.g. "14:30"
  lateGracePeriodMinutes: number;
  requireTemperatureCheck: boolean;
  autoSendPushOnScan: boolean;
  autoSendSmsOnLate: boolean;
  gateLocations: string[];
  statutoryPensionRate: number; // e.g. 8 (for 8%)
  currencySymbol: string; // "₦"
  workingDaysPerMonth: number; // 22
  latePenaltyPerOccurrence: number; // 3500
  unexcusedAbsencePenaltyDaily: number; // 15000
  disbursementBankDefault: string;
  houses: SchoolHouse[];
}
