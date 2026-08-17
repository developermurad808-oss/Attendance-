import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { LeadershipDashboard } from './components/LeadershipDashboard';
import { QRScannerKiosk } from './components/QRScannerKiosk';
import { StudentAttendance } from './components/StudentAttendance';
import { StaffAttendance } from './components/StaffAttendance';
import { StaffPayroll } from './components/StaffPayroll';
import { ParentNotificationCenter } from './components/ParentNotificationCenter';
import { IDCardStudio } from './components/IDCardStudio';
import { DataExportCenter } from './components/DataExportCenter';
import { SchoolSettingsView } from './components/SchoolSettings';

import { 
  Student, 
  Staff, 
  AttendanceRecord, 
  LeaveRequest, 
  PayrollRecord, 
  NotificationLog, 
  NotificationTemplate,
  SchoolSettings
} from './types';

import { 
  INITIAL_STUDENTS, 
  INITIAL_STAFF, 
  INITIAL_LEAVES, 
  INITIAL_NOTIFICATION_TEMPLATES, 
  INITIAL_NOTIFICATION_LOGS, 
  generateInitialAttendance, 
  generatePayrollRecords 
} from './data/mockData';

import { DEFAULT_SCHOOL_SETTINGS } from './data/defaultSettings';
import { SystemBackupData } from './utils/exportUtils';
import { soundFx } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // School Settings with LocalStorage persistence
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem('heritage_abuja_school_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_SCHOOL_SETTINGS;
  });

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(generateInitialAttendance());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(generatePayrollRecords(INITIAL_STAFF));
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(INITIAL_NOTIFICATION_LOGS);
  const [templates] = useState<NotificationTemplate[]>(INITIAL_NOTIFICATION_TEMPLATES);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [gateLocation, setGateLocation] = useState<string>(
    schoolSettings.gateLocations[0] || 'Main Gate (Maitama Campus)'
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Sync settings changes to localStorage
  const handleSaveSchoolSettings = (updated: SchoolSettings) => {
    setSchoolSettings(updated);
    try {
      localStorage.setItem('heritage_abuja_school_settings', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
    if (!updated.gateLocations.includes(gateLocation) && updated.gateLocations.length > 0) {
      setGateLocation(updated.gateLocations[0]);
    }
  };

  const handleResetSchoolSettings = () => {
    setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    try {
      localStorage.removeItem('heritage_abuja_school_settings');
    } catch (e) {
      console.error(e);
    }
    setGateLocation(DEFAULT_SCHOOL_SETTINGS.gateLocations[0]);
  };

  // Restore Complete System from JSON Backup
  const handleRestoreBackup = (backupData: SystemBackupData) => {
    if (backupData.schoolSettings) {
      handleSaveSchoolSettings(backupData.schoolSettings);
    }
    if (backupData.students && Array.isArray(backupData.students)) {
      setStudents(backupData.students);
    }
    if (backupData.staff && Array.isArray(backupData.staff)) {
      setStaff(backupData.staff);
    }
    if (backupData.attendanceRecords && Array.isArray(backupData.attendanceRecords)) {
      setAttendanceRecords(backupData.attendanceRecords);
    }
    if (backupData.payrollRecords && Array.isArray(backupData.payrollRecords)) {
      setPayrollRecords(backupData.payrollRecords);
    }
    if (backupData.leaveRequests && Array.isArray(backupData.leaveRequests)) {
      setLeaveRequests(backupData.leaveRequests);
    }
    if (backupData.notificationLogs && Array.isArray(backupData.notificationLogs)) {
      setNotificationLogs(backupData.notificationLogs);
    }
  };

  // Record Attendance Handler
  const handleRecordAttendance = useCallback((record: AttendanceRecord) => {
    setAttendanceRecords((prev) => [record, ...prev]);

    // Dispatch automatic parent notification if student
    if (record.entityType === 'student') {
      const isArrival = record.type === 'check-in';
      const isLate = record.status === 'late';

      const pushLog: NotificationLog = {
        id: `notif_push_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: isLate ? 'late_warning' : isArrival ? 'gate_arrival' : 'gate_departure',
        channel: 'Mobile Push',
        recipientType: 'Parent',
        recipientName: record.notificationStatus?.parentNotifiedName || 'Parent',
        recipientContact: record.notificationStatus?.parentPhone || '',
        studentOrStaffName: record.entityName,
        subject: isLate
          ? `⏰ Late Arrival: ${record.entityName}`
          : `🎓 Heritage Alert: ${record.entityName} ${isArrival ? 'Arrived Safely' : 'Checked Out'}`,
        body: isLate
          ? `${record.entityName} arrived at school at ${record.timeStr} (after assembly cutoff). Class: ${record.roleOrClass}.`
          : `${record.entityName} was scanned ${isArrival ? 'in' : 'out'} at ${record.gateLocation} at ${record.timeStr}.`,
        status: 'Delivered',
      };

      const emailLog: NotificationLog = {
        id: `notif_email_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: isArrival ? 'gate_arrival' : 'gate_departure',
        channel: 'Email',
        recipientType: 'Parent',
        recipientName: record.notificationStatus?.parentNotifiedName || 'Parent',
        recipientContact: record.notificationStatus?.parentEmail || '',
        studentOrStaffName: record.entityName,
        subject: `Heritage of Excellence Gate Confirmation: ${record.entityName}`,
        body: `Dear Parent,\n\nThis is an automated confirmation that ${record.entityName} has passed through ${record.gateLocation} at ${record.timeStr}.\n\nWarm regards,\nAttendance Office, Heritage of Excellence Abuja`,
        status: 'Delivered',
      };

      setNotificationLogs((prev) => [pushLog, emailLog, ...prev]);
    }
  }, []);

  // Morning Rush Simulator
  const handleSimulateRush = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const eligibleStudents = students.filter(
      (s) => !attendanceRecords.some((r) => r.entityId === s.id && r.dateStr === '2026-08-16')
    );

    const pool = eligibleStudents.length > 0 ? eligibleStudents : students;
    let count = 0;
    const maxScans = Math.min(4, pool.length);

    const interval = setInterval(() => {
      if (count >= maxScans) {
        clearInterval(interval);
        setIsSimulating(false);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch {
          // ignore
        }
        return;
      }

      const std = pool[count];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newRecord: AttendanceRecord = {
        id: `att_sim_${Date.now()}_${std.id}`,
        entityType: 'student',
        entityId: std.id,
        entityName: `${std.firstName} ${std.lastName}`,
        admissionOrStaffId: std.admissionNumber,
        roleOrClass: std.classSection,
        photoUrl: std.photoUrl,
        timestamp: now.toISOString(),
        dateStr: '2026-08-16',
        timeStr,
        type: 'check-in',
        status: count === 2 ? 'late' : 'on-time',
        gateLocation: 'Main Gate (Maitama Campus)',
        temperature: '36.4°C',
        scannedBy: 'Gate Scanner Terminal #1 (Rush Simulation)',
        notificationStatus: {
          pushSent: true,
          emailSent: true,
          smsSent: count === 2,
          parentNotifiedName: std.parentName,
          parentPhone: std.parentPhone,
          parentEmail: std.parentEmail,
        },
      };

      if (soundEnabled) {
        if (count === 2) {
          soundFx.playWarning();
        } else {
          soundFx.playSuccess();
        }
      }

      handleRecordAttendance(newRecord);
      count++;
    }, 1400);
  };

  // Student Add & Update handlers
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleUpdateAttendanceStatus = (
    studentId: string,
    status: 'on-time' | 'late' | 'excused' | 'absent',
    notes?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (status === 'absent') {
      setAttendanceRecords((prev) => prev.filter((r) => r.entityId !== studentId || r.dateStr !== '2026-08-16'));
      return;
    }

    const now = new Date();
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.entityId === studentId && r.dateStr === '2026-08-16' && r.type === 'check-in'
    );

    const updatedRecord: AttendanceRecord = {
      id: existingIndex >= 0 ? attendanceRecords[existingIndex].id : `att_${Date.now()}_${student.id}`,
      entityType: 'student',
      entityId: student.id,
      entityName: `${student.firstName} ${student.lastName}`,
      admissionOrStaffId: student.admissionNumber,
      roleOrClass: student.classSection,
      photoUrl: student.photoUrl,
      timestamp: now.toISOString(),
      dateStr: '2026-08-16',
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'check-in',
      status,
      gateLocation,
      notes: notes || 'Administrative override',
      scannedBy: 'Vice Principal Office (Manual)',
      notificationStatus: {
        pushSent: true,
        emailSent: true,
        smsSent: false,
        parentNotifiedName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
      },
    };

    if (existingIndex >= 0) {
      const copy = [...attendanceRecords];
      copy[existingIndex] = updatedRecord;
      setAttendanceRecords(copy);
    } else {
      setAttendanceRecords((prev) => [updatedRecord, ...prev]);
    }
  };

  const handleSendBatchAbsenceNotice = (absentList: Student[]) => {
    const newLogs: NotificationLog[] = absentList.map((std) => ({
      id: `notif_abs_${Date.now()}_${std.id}`,
      timestamp: new Date().toISOString(),
      type: 'absence_alert',
      channel: 'SMS / WhatsApp',
      recipientType: 'Parent',
      recipientName: std.parentName,
      recipientContact: std.parentPhone,
      studentOrStaffName: `${std.firstName} ${std.lastName}`,
      subject: `Heritage of Excellence: Absence Notice for ${std.firstName}`,
      body: `Dear ${std.parentName}, our morning attendance roll call indicates that ${std.firstName} ${std.lastName} (${std.classSection}) has not arrived at school today. Please reply or contact the Vice Principal if your child is excused.`,
      status: 'Delivered',
    }));

    if (soundEnabled) soundFx.playNotificationPing();
    setNotificationLogs((prev) => [...newLogs, ...prev]);
    alert(`Dispatched absence advisory notices to ${absentList.length} parent telephone lines.`);
  };

  const handleTriggerDirectNotification = (student: Student, type: 'absence' | 'late') => {
    const newLog: NotificationLog = {
      id: `notif_direct_${Date.now()}_${student.id}`,
      timestamp: new Date().toISOString(),
      type: type === 'absence' ? 'absence_alert' : 'late_warning',
      channel: 'Mobile Push',
      recipientType: 'Parent',
      recipientName: student.parentName,
      recipientContact: student.parentPhone,
      studentOrStaffName: `${student.firstName} ${student.lastName}`,
      subject:
        type === 'absence'
          ? `⚠️ Absence Alert: ${student.firstName} ${student.lastName}`
          : `⏰ Late Arrival Warning: ${student.firstName}`,
      body:
        type === 'absence'
          ? `Dear ${student.parentName}, ${student.firstName} (${student.classSection}) has not checked in at the school gate today.`
          : `Dear ${student.parentName}, ${student.firstName} arrived after the morning assembly cutoff time.`,
      status: 'Delivered',
    };

    if (soundEnabled) soundFx.playNotificationPing();
    setNotificationLogs((prev) => [newLog, ...prev]);
    alert(`Instant notification sent to ${student.parentName} (${student.parentPhone})`);
  };

  // Staff & Leave Handlers
  const handleAddStaff = (newStaff: Staff) => {
    setStaff((prev) => [newStaff, ...prev]);
    setPayrollRecords(generatePayrollRecords([newStaff, ...staff]));
  };

  const handleApproveLeave = (leaveId: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? { ...l, status: 'Approved', approvedBy: 'Dr. Mrs. Funmilayo Adeleke-Kano' }
          : l
      )
    );
  };

  const handleRejectLeave = (leaveId: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'Rejected' } : l))
    );
  };

  const handleRequestLeave = (newLeave: LeaveRequest) => {
    setLeaveRequests((prev) => [newLeave, ...prev]);
  };

  // Payroll Handlers
  const handleDisbursePayroll = () => {
    setPayrollRecords((prev) =>
      prev.map((p) => ({
        ...p,
        paymentStatus: 'Disbursed',
        disbursedAt: new Date().toISOString().split('T')[0],
      }))
    );
    if (soundEnabled) soundFx.playSuccess();
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    alert('Payroll for August 2026 successfully approved and disbursed to all staff bank accounts!');
  };

  const handleSendSinglePayslip = (record: PayrollRecord) => {
    const newLog: NotificationLog = {
      id: `notif_pay_${Date.now()}_${record.id}`,
      timestamp: new Date().toISOString(),
      type: 'payslip_dispatch',
      channel: 'Email',
      recipientType: 'Staff',
      recipientName: record.staffName,
      recipientContact: `${record.employeeId.toLowerCase()}@heritage-abuja.sch.ng`,
      subject: `💼 Official Payslip Advice: ${record.month} - Heritage of Excellence Abuja`,
      body: `Dear ${record.staffName}, your salary payslip for ${record.month} has been processed. Net Pay: ₦${record.netPay.toLocaleString()} disbursed to ${record.bankName} (${record.accountNumber}).`,
      status: 'Delivered',
    };
    setNotificationLogs((prev) => [newLog, ...prev]);
    if (soundEnabled) soundFx.playNotificationPing();
    alert(`Payslip dispatched to ${record.staffName}`);
  };

  const handleSendAllPayslips = () => {
    const newLogs: NotificationLog[] = payrollRecords.map((record) => ({
      id: `notif_pay_all_${Date.now()}_${record.id}`,
      timestamp: new Date().toISOString(),
      type: 'payslip_dispatch',
      channel: 'Email',
      recipientType: 'Staff',
      recipientName: record.staffName,
      recipientContact: `${record.employeeId.toLowerCase()}@heritage-abuja.sch.ng`,
      subject: `💼 Payslip Advice for ${record.month} - Heritage of Excellence Abuja`,
      body: `Dear ${record.staffName}, your salary payslip for ${record.month} has been disbursed to ${record.bankName} (${record.accountNumber}). Net: ₦${record.netPay.toLocaleString()}.`,
      status: 'Delivered',
    }));
    setNotificationLogs((prev) => [...newLogs, ...prev]);
    if (soundEnabled) soundFx.playNotificationPing();
    alert(`Dispatched monthly payslips to all ${payrollRecords.length} staff members.`);
  };

  const handleSendBroadcast = (
    targetGroup: string,
    subject: string,
    body: string,
    channel: 'push' | 'email' | 'sms'
  ) => {
    const channelLabel =
      channel === 'push' ? 'Mobile Push' : channel === 'email' ? 'Email' : 'SMS / WhatsApp';

    const newLog: NotificationLog = {
      id: `notif_bcast_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'broadcast',
      channel: channelLabel,
      recipientType: targetGroup.includes('Parent') ? 'All Parents' : 'All Staff',
      recipientName: targetGroup,
      recipientContact: 'Abuja Community Broadcast Gateway',
      subject,
      body,
      status: 'Delivered',
    };

    setNotificationLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900 font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLaunchKiosk={() => {
          setActiveTab('scanner');
          setIsFullscreen(true);
        }}
        onSimulateRush={handleSimulateRush}
        isSimulating={isSimulating}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        gateLocation={gateLocation}
        setGateLocation={setGateLocation}
        unreadNotificationsCount={notificationLogs.filter((l) => l.status === 'Delivered').length}
        schoolSettings={schoolSettings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'dashboard' && (
          <LeadershipDashboard
            students={students}
            staff={staff}
            attendanceRecords={attendanceRecords}
            payrollRecords={payrollRecords}
            notificationLogs={notificationLogs}
            schoolSettings={schoolSettings}
            onTriggerDirectNotification={handleTriggerDirectNotification}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'scanner' && (
          <QRScannerKiosk
            students={students}
            staff={staff}
            schoolSettings={schoolSettings}
            onRecordAttendance={handleRecordAttendance}
            gateLocation={gateLocation}
            soundEnabled={soundEnabled}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
        )}

        {activeTab === 'students' && (
          <StudentAttendance
            students={students}
            attendanceRecords={attendanceRecords}
            schoolSettings={schoolSettings}
            onAddStudent={handleAddStudent}
            onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
            onSendBatchAbsenceNotice={handleSendBatchAbsenceNotice}
            onTriggerDirectNotification={handleTriggerDirectNotification}
          />
        )}

        {activeTab === 'staff' && (
          <StaffAttendance
            staff={staff}
            attendanceRecords={attendanceRecords}
            leaveRequests={leaveRequests}
            onAddStaff={handleAddStaff}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
            onRequestLeave={handleRequestLeave}
          />
        )}

        {activeTab === 'payroll' && (
          <StaffPayroll
            payrollRecords={payrollRecords}
            staff={staff}
            schoolSettings={schoolSettings}
            onDisbursePayroll={handleDisbursePayroll}
            onSendSinglePayslip={handleSendSinglePayslip}
            onSendAllPayslips={handleSendAllPayslips}
          />
        )}

        {activeTab === 'notifications' && (
          <ParentNotificationCenter
            notificationLogs={notificationLogs}
            templates={templates}
            students={students}
            onSendBroadcast={handleSendBroadcast}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'id-cards' && (
          <IDCardStudio
            students={students}
            staff={staff}
            schoolSettings={schoolSettings}
          />
        )}

        {activeTab === 'export' && (
          <DataExportCenter
            schoolSettings={schoolSettings}
            students={students}
            staff={staff}
            attendanceRecords={attendanceRecords}
            payrollRecords={payrollRecords}
            leaveRequests={leaveRequests}
            notificationLogs={notificationLogs}
            onRestoreBackup={handleRestoreBackup}
          />
        )}

        {activeTab === 'settings' && (
          <SchoolSettingsView
            settings={schoolSettings}
            onSaveSettings={handleSaveSchoolSettings}
            onResetSettings={handleResetSchoolSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-800 text-amber-400 font-serif font-black flex items-center justify-center text-[10px]">
            {schoolSettings.shortName ? schoolSettings.shortName.charAt(0) : 'H'}
          </div>
          <span className="font-medium text-slate-700">{schoolSettings.schoolName} • Attendance & Payroll System</span>
        </div>
        <div className="text-right">
          <span>{schoolSettings.campusAddress} • Motto: <span className="font-semibold text-indigo-900">&ldquo;{schoolSettings.motto}&rdquo;</span></span>
        </div>
      </footer>
    </div>
  );
}
