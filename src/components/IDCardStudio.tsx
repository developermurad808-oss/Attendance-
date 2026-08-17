import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  IdCard, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  Check, 
  Layers,
  ShieldCheck,
  LayoutGrid,
  FileSpreadsheet
} from 'lucide-react';
import { Student, Staff, SchoolSettings } from '../types';
import { BulkQRGenerator } from './BulkQRGenerator';

interface IDCardStudioProps {
  students: Student[];
  staff: Staff[];
  schoolSettings: SchoolSettings;
}

export const IDCardStudio: React.FC<IDCardStudioProps> = ({ students, staff, schoolSettings }) => {
  const [studioMode, setStudioMode] = useState<'bulk-generator' | 'interactive-cards'>('bulk-generator');
  const [selectedType, setSelectedType] = useState<'students' | 'staff'>('students');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [selectedSingleId, setSelectedSingleId] = useState<string | null>(null);

  // Generate QR code Data URLs for all entities
  useEffect(() => {
    const generateAllQRs = async () => {
      const urls: Record<string, string> = {};

      for (const std of students) {
        try {
          const url = await QRCode.toDataURL(std.qrCodePayload, {
            width: 300,
            margin: 1,
            color: {
              dark: '#020617',
              light: '#ffffff',
            },
          });
          urls[std.id] = url;
        } catch (err) {
          console.error(err);
        }
      }

      for (const st of staff) {
        try {
          const url = await QRCode.toDataURL(st.qrCodePayload, {
            width: 300,
            margin: 1,
            color: {
              dark: '#020617',
              light: '#ffffff',
            },
          });
          urls[st.id] = url;
        } catch (err) {
          console.error(err);
        }
      }

      setQrCodeUrls(urls);
    };

    generateAllQRs();
  }, [students, staff]);

  const handlePrintSheet = () => {
    window.print();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.classSection.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staff.filter(
    (st) =>
      st.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Studio Mode Selector (Hidden in print) */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStudioMode('bulk-generator')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              studioMode === 'bulk-generator'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Bulk QR Generator & PDF Print</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('interactive-cards')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              studioMode === 'interactive-cards'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Individual Card Gallery</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:flex items-center gap-2 px-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Branding: {schoolSettings.schoolName}</span>
        </div>
      </div>

      {studioMode === 'bulk-generator' ? (
        /* Dedicated Bulk QR & Multi-Page Printable PDF Studio */
        <BulkQRGenerator
          students={students}
          staff={staff}
          schoolSettings={schoolSettings}
        />
      ) : (
        /* Interactive Cards Grid & Single Print */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm print:hidden">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-indigo-700" />
                <span>Digital ID Card Gallery</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Official PVC credential badges with high-resolution encrypted QR codes ready for lanyard holders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
                <button
                  onClick={() => setSelectedType('students')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedType === 'students'
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Students ({students.length})
                </button>
                <button
                  onClick={() => setSelectedType('staff')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedType === 'staff'
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Staff & Faculty ({staff.length})
                </button>
              </div>

              <button
                onClick={handlePrintSheet}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Badge Sheet (A4)</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm print:hidden">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search badge by name, admission no, role..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono font-bold">
              Standard CR80 PVC Format (85.6mm × 54mm)
            </span>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {selectedType === 'students' ? (
              filteredStudents.map((std) => {
                const qrUrl = qrCodeUrls[std.id];
                const matchedHouse = schoolSettings.houses.find(
                  (h) => h.name.toLowerCase() === std.houseColor.toLowerCase()
                );
                const houseColor = matchedHouse ? matchedHouse.color : '#10B981';

                return (
                  <div
                    key={std.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden print:bg-white print:border-slate-400 print:text-black hover:border-indigo-300 transition-colors"
                  >
                    {/* School Top Crest Strip */}
                    <div className="flex items-center justify-between border-b border-slate-200 print:border-slate-300 pb-3">
                      <div className="flex items-center gap-2.5">
                        {schoolSettings.logoUrl ? (
                          <div className="w-9 h-9 rounded-xl bg-indigo-950 p-0.5 flex items-center justify-center shadow-xs border border-indigo-800 shrink-0 overflow-hidden">
                            <img
                              src={schoolSettings.logoUrl}
                              alt="School Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-900 text-amber-400 flex items-center justify-center font-serif font-black text-sm shadow-xs border border-indigo-800 shrink-0">
                            {schoolSettings.shortName ? schoolSettings.shortName.slice(0, 3) : 'HEA'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-serif font-black text-xs text-slate-900 print:text-black uppercase truncate max-w-[200px]">
                            {schoolSettings.schoolName}
                          </h4>
                          <p className="text-[10px] text-indigo-700 font-mono font-bold uppercase tracking-wider print:text-indigo-900">
                            {schoolSettings.stateCity.split(',')[0]} • Student Identity Card
                          </p>
                        </div>
                      </div>
                      <span 
                        className="w-3.5 h-3.5 rounded-full shadow-xs" 
                        style={{ backgroundColor: houseColor }} 
                        title={`House: ${std.houseColor}`} 
                      />
                    </div>

                    {/* Card Body */}
                    <div className="flex items-center gap-3.5">
                      <img
                        src={std.photoUrl}
                        alt={std.firstName}
                        className="w-20 h-24 rounded-xl object-cover border-2 border-indigo-200 shadow-sm shrink-0 print:border-slate-600"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h5 className="font-black text-sm text-slate-900 print:text-black truncate">
                          {std.firstName} {std.lastName}
                        </h5>
                        <p className="text-xs font-bold text-indigo-800 print:text-indigo-900">{std.classSection}</p>
                        <p className="font-mono text-[11px] text-slate-700 font-bold print:text-slate-800">
                          ID: <span className="text-indigo-950 font-black">{std.admissionNumber}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium print:text-slate-600 truncate">
                          Parent: {std.parentPhone}
                        </p>
                        <div className="text-[9px] text-slate-500 print:text-slate-700 font-mono font-medium">
                          Blood: {std.bloodGroup || 'O+'} • Valid {schoolSettings.academicSession.split(' ')[0]}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="shrink-0 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR Code" className="w-16 h-16" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-lg" />
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 print:text-slate-700 pt-2.5 border-t border-slate-100 print:border-slate-300 font-mono font-semibold">
                      <span className="truncate max-w-[140px]">{schoolSettings.campusAddress.split(',')[0]}</span>
                      <span className="text-amber-700 font-bold truncate max-w-[140px]">{schoolSettings.motto.split('(')[0]}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Staff Badges */
              filteredStaff.map((st) => {
                const qrUrl = qrCodeUrls[st.id];

                return (
                  <div
                    key={st.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden print:bg-white print:border-slate-400 print:text-black hover:border-indigo-300 transition-colors"
                  >
                    {/* School Top Crest Strip */}
                    <div className="flex items-center justify-between border-b border-slate-200 print:border-slate-300 pb-3">
                      <div className="flex items-center gap-2.5">
                        {schoolSettings.logoUrl ? (
                          <div className="w-9 h-9 rounded-xl bg-indigo-950 p-0.5 flex items-center justify-center shadow-xs border border-indigo-800 shrink-0 overflow-hidden">
                            <img
                              src={schoolSettings.logoUrl}
                              alt="School Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-900 text-amber-400 flex items-center justify-center font-serif font-black text-sm shadow-xs border border-indigo-800 shrink-0">
                            {schoolSettings.shortName ? schoolSettings.shortName.slice(0, 3) : 'HEA'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-serif font-black text-xs text-slate-900 print:text-black uppercase truncate max-w-[200px]">
                            {schoolSettings.schoolName}
                          </h4>
                          <p className="text-[10px] text-amber-700 font-mono font-bold uppercase tracking-wider print:text-amber-900">
                            {schoolSettings.stateCity.split(',')[0]} • Faculty & Staff Credential
                          </p>
                        </div>
                      </div>
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-xs" />
                    </div>

                    {/* Card Body */}
                    <div className="flex items-center gap-3.5">
                      <img
                        src={st.photoUrl}
                        alt={st.firstName}
                        className="w-20 h-24 rounded-xl object-cover border-2 border-amber-300 shadow-sm shrink-0 print:border-slate-600"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h5 className="font-black text-sm text-slate-900 print:text-black truncate">
                          {st.firstName} {st.lastName}
                        </h5>
                        <p className="text-xs font-bold text-indigo-800 print:text-indigo-900">{st.role}</p>
                        <p className="font-mono text-[11px] text-slate-700 font-bold print:text-slate-800">
                          EMP ID: <span className="text-indigo-950 font-black">{st.employeeId}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium print:text-slate-600 truncate">
                          Dept: {st.department}
                        </p>
                        <div className="text-[9px] text-slate-500 print:text-slate-700 font-mono font-medium">
                          Shift: {st.shiftSchedule.start} - {st.shiftSchedule.end}
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="shrink-0 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR Code" className="w-16 h-16" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-lg" />
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 print:text-slate-700 pt-2.5 border-t border-slate-100 print:border-slate-300 font-mono font-semibold">
                      <span className="truncate max-w-[140px]">{schoolSettings.campusAddress.split(',')[0]}</span>
                      <span className="text-indigo-700 font-bold">Official Authorization</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
