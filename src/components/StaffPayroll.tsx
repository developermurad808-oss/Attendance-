import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  Send, 
  Download, 
  CheckCircle2, 
  Clock, 
  Building, 
  Printer, 
  X, 
  Sparkles, 
  AlertCircle,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';
import { PayrollRecord, Staff } from '../types';
import { formatNaira, downloadCSV } from '../utils/audio';

interface StaffPayrollProps {
  payrollRecords: PayrollRecord[];
  staff: Staff[];
  onDisbursePayroll: () => void;
  onSendSinglePayslip: (record: PayrollRecord) => void;
  onSendAllPayslips: () => void;
}

export const StaffPayroll: React.FC<StaffPayrollProps> = ({
  payrollRecords,
  staff,
  onDisbursePayroll,
  onSendSinglePayslip,
  onSendAllPayslips,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('August 2026');
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalGross = payrollRecords.reduce((sum, p) => sum + p.grossPay, 0);
  const totalDeductions = payrollRecords.reduce((sum, p) => sum + p.totalDeductions, 0);
  const totalNet = payrollRecords.reduce((sum, p) => sum + p.netPay, 0);
  const totalPension = payrollRecords.reduce((sum, p) => sum + p.deductions.pensionContribution, 0);
  const totalTax = payrollRecords.reduce((sum, p) => sum + p.deductions.payeTax, 0);

  const filtered = payrollRecords.filter((p) =>
    p.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportBankDisbursement = () => {
    const bankData = payrollRecords.map((p) => ({
      BeneficiaryName: p.staffName,
      EmployeeID: p.employeeId,
      BankName: p.bankName,
      AccountNumber: p.accountNumber,
      AmountNaira: p.netPay,
      Narration: `Heritage Abuja Salary ${selectedMonth}`,
      PaymentStatus: p.paymentStatus,
    }));
    downloadCSV(`Heritage_Abuja_Bank_Disbursement_Schedule_${selectedMonth.replace(/\s+/g, '_')}`, bankData);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-700" />
            <span>Staff Payroll & Compensation Engine (₦ Naira)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Automated attendance-linked deductions, statutory pension (8%), PAYE tax, and bank schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-indigo-600"
          >
            <option value="August 2026">August 2026 Cycle</option>
            <option value="July 2026">July 2026 Cycle</option>
            <option value="September 2026">September 2026 (Projected)</option>
          </select>

          <button
            onClick={handleExportBankDisbursement}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-700" />
            <span>Export Bank Batch (CSV)</span>
          </button>

          <button
            onClick={onSendAllPayslips}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-indigo-700" />
            <span>Batch Email Payslips</span>
          </button>

          <button
            onClick={onDisbursePayroll}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve & Disburse (₦)</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold">Total Net Payroll (Disbursed)</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatNaira(totalNet)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            Across {payrollRecords.length} faculty and staff accounts
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold">Total Gross Earnings</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatNaira(totalGross)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            Base salaries + housing/transport allowances
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold">Statutory Pension Deductions (8%)</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">{formatNaira(totalPension)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            Remitted to PenCom compliant PFAs
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold">FCT PAYE Tax & Penalties</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{formatNaira(totalTax)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            FCT Internal Revenue Service compliance
          </span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, department or ID..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 max-w-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
          />
          <div className="text-xs text-slate-500 font-mono font-bold">
            {filtered.length} Employee Payslips Ready
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Base Salary</th>
                <th className="py-3.5 px-4">Allowances</th>
                <th className="py-3.5 px-4">Attendance Rec.</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Payable (₦)</th>
                <th className="py-3.5 px-4">Bank Routing</th>
                <th className="py-3.5 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900">{item.staffName}</p>
                      <span className="font-mono font-bold text-[11px] text-indigo-700">{item.employeeId}</span>
                      <span className="text-[11px] text-slate-500 block font-medium">{item.role}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {formatNaira(item.baseSalary)}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    +{formatNaira(item.totalAllowances)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 text-[11px]">
                      <span className="text-slate-700 font-mono font-bold">{item.daysPresent}/22 Days</span>
                      {item.daysLate > 0 && (
                        <span className="text-amber-700 block font-mono font-bold">({item.daysLate} Late)</span>
                      )}
                      {item.daysOnApprovedLeave > 0 && (
                        <span className="text-indigo-700 block font-mono font-bold">({item.daysOnApprovedLeave} Leave)</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                    -{formatNaira(item.totalDeductions)}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                    {formatNaira(item.netPay)}
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="text-slate-800 text-[11px] font-bold">{item.bankName}</p>
                    <p className="font-mono text-[11px] text-slate-500">{item.accountNumber}</p>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActivePayslip(item)}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold"
                      >
                        View Slip
                      </button>
                      <button
                        onClick={() => onSendSinglePayslip(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs"
                        title="Send Payslip Email Advice"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Official Payslip Modal */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[95vh] overflow-y-auto print:bg-white print:text-black print:p-0 print:border-none">
            {/* Header / Letterhead */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-amber-400 flex items-center justify-center font-serif font-black text-2xl shadow-sm border border-indigo-800">
                  HE
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-slate-900">
                    Heritage of Excellence Academy Abuja
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Plot 410, Maitama District, Abuja FCT • Official Confidential Payslip
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrintPayslip}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-indigo-700" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setActivePayslip(null)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Employee Name:</span>
                <strong className="text-slate-900 text-sm font-bold">{activePayslip.staffName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Staff Employee ID:</span>
                <span className="font-mono text-indigo-700 font-bold">{activePayslip.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Pay Period:</span>
                <span className="font-mono text-slate-800 font-bold">{activePayslip.month}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Designation / Role:</span>
                <span className="text-slate-800 font-medium">{activePayslip.role}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Department:</span>
                <span className="text-slate-800 font-medium">{activePayslip.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Payment Account:</span>
                <span className="text-slate-800 font-mono font-medium">
                  {activePayslip.bankName} ({activePayslip.accountNumber})
                </span>
              </div>
            </div>

            {/* Itemized Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Earnings Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Earnings & Allowances
                </h4>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Base Basic Salary</span>
                    <span className="font-mono font-bold text-slate-900">{formatNaira(activePayslip.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Housing Allowance</span>
                    <span className="font-mono">{formatNaira(activePayslip.allowancesBreakdown.housing || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Transport Allowance</span>
                    <span className="font-mono">{formatNaira(activePayslip.allowancesBreakdown.transport || 0)}</span>
                  </div>
                  {activePayslip.allowancesBreakdown.responsibility && (
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>Responsibility Allowance</span>
                      <span className="font-mono">{formatNaira(activePayslip.allowancesBreakdown.responsibility)}</span>
                    </div>
                  )}
                  {activePayslip.allowancesBreakdown.hazard && (
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>Hazard Allowance</span>
                      <span className="font-mono">{formatNaira(activePayslip.allowancesBreakdown.hazard)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Gross Earnings:</span>
                  <span className="font-mono font-black text-emerald-700">{formatNaira(activePayslip.grossPay)}</span>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Statutory & Attendance Deductions
                </h4>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>PenCom Pension (8%)</span>
                    <span className="font-mono">{formatNaira(activePayslip.deductions.pensionContribution)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>PAYE Income Tax</span>
                    <span className="font-mono">{formatNaira(activePayslip.deductions.payeTax)}</span>
                  </div>
                  {activePayslip.deductions.lateDeductions > 0 && (
                    <div className="flex justify-between text-amber-800 font-medium">
                      <span>Late Clock-In Penalty</span>
                      <span className="font-mono font-bold">{formatNaira(activePayslip.deductions.lateDeductions)}</span>
                    </div>
                  )}
                  {activePayslip.deductions.unexcusedAbsenceDeduction > 0 && (
                    <div className="flex justify-between text-rose-800 font-medium">
                      <span>Unexcused Absence Penalty</span>
                      <span className="font-mono font-bold">{formatNaira(activePayslip.deductions.unexcusedAbsenceDeduction)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Deductions:</span>
                  <span className="font-mono font-black text-rose-700">-{formatNaira(activePayslip.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-900 font-bold">NET AMOUNT PAYABLE</span>
                <p className="text-2xl font-black text-emerald-800 mt-0.5">{formatNaira(activePayslip.netPay)}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-mono">Disbursement Status:</span>
                <span className="block text-xs font-black text-emerald-800 uppercase">
                  ✓ {activePayslip.paymentStatus}
                </span>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500">
              <div>
                <p className="font-bold text-slate-900">Alh. Ibrahim Dantata</p>
                <p>Chief Bursar & Financial Controller</p>
                <div className="mt-4 pt-1 border-t border-slate-300 w-32 font-mono text-[9px] text-slate-600">
                  Bursary Stamp (Verified)
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">Dr. Mrs. Funmilayo Adeleke</p>
                <p>Executive Principal & Director</p>
                <div className="mt-4 pt-1 border-t border-slate-300 w-32 ml-auto font-mono text-[9px] text-slate-600">
                  Executive Signoff
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
