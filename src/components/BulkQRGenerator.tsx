import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckSquare, 
  Square, 
  Filter, 
  Search, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Grid3X3, 
  Grid2X2, 
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  School,
  Building2,
  GraduationCap,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Student, Staff, SchoolSettings } from '../types';
import { generateBulkBadgesPDF, downloadBulkBadgesPDF, BulkPDFOptions } from '../utils/pdfBadgeGenerator';

interface BulkQRGeneratorProps {
  students: Student[];
  staff: Staff[];
  schoolSettings: SchoolSettings;
}

export const BulkQRGenerator: React.FC<BulkQRGeneratorProps> = ({
  students,
  staff,
  schoolSettings,
}) => {
  // Target Audience Filter
  const [audienceType, setAudienceType] = useState<'all' | 'students' | 'staff'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedHouse, setSelectedHouse] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection Set (Entity IDs)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Layout Configuration
  const [layout, setLayout] = useState<'grid-6' | 'grid-4' | 'grid-8' | 'stickers-12'>('grid-6');

  // Customization Options
  const [includeMotto, setIncludeMotto] = useState<boolean>(true);
  const [includeParentContact, setIncludeParentContact] = useState<boolean>(true);
  const [includeBloodGroup, setIncludeBloodGroup] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // QR Code Cache
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  // PDF Generation State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ percent: number; status: string }>({ percent: 0, status: '' });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination Preview State
  const [previewPage, setPreviewPage] = useState<number>(0);

  // Pre-generate QR Data URLs for all students and staff
  useEffect(() => {
    let isMounted = true;
    const generateQRs = async () => {
      const urls: Record<string, string> = {};
      for (const s of students) {
        try {
          urls[s.id] = await QRCode.toDataURL(s.qrCodePayload, {
            width: 260,
            margin: 1,
            color: { dark: '#020617', light: '#ffffff' },
          });
        } catch (e) {
          console.error(e);
        }
      }
      for (const st of staff) {
        try {
          urls[st.id] = await QRCode.toDataURL(st.qrCodePayload, {
            width: 260,
            margin: 1,
            color: { dark: '#020617', light: '#ffffff' },
          });
        } catch (e) {
          console.error(e);
        }
      }
      if (isMounted) {
        setQrCodeUrls(urls);
      }
    };
    generateQRs();
    return () => {
      isMounted = false;
    };
  }, [students, staff]);

  // Initial selection: select all by default
  useEffect(() => {
    const allIds = new Set<string>();
    students.forEach((s) => allIds.add(s.id));
    staff.forEach((st) => allIds.add(st.id));
    setSelectedIds(allIds);
  }, [students, staff]);

  // Filtered pool of entities based on current audience filters
  const filteredEntities = React.useMemo(() => {
    let pool: Array<{
      id: string;
      type: 'student' | 'staff';
      studentObj?: Student;
      staffObj?: Staff;
      name: string;
      idNumber: string;
      meta: string;
      house?: string;
      dept?: string;
    }> = [];

    if (audienceType === 'all' || audienceType === 'students') {
      students.forEach((s) => {
        if (selectedClass !== 'all' && s.classSection !== selectedClass) return;
        if (selectedHouse !== 'all' && s.houseColor !== selectedHouse) return;
        if (
          searchQuery &&
          !`${s.firstName} ${s.lastName} ${s.admissionNumber} ${s.classSection}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return;
        }
        pool.push({
          id: s.id,
          type: 'student',
          studentObj: s,
          name: `${s.firstName} ${s.lastName}`,
          idNumber: s.admissionNumber,
          meta: `Class: ${s.classSection}`,
          house: s.houseColor,
        });
      });
    }

    if (audienceType === 'all' || audienceType === 'staff') {
      staff.forEach((st) => {
        if (selectedDept !== 'all' && st.department !== selectedDept) return;
        if (
          searchQuery &&
          !`${st.firstName} ${st.lastName} ${st.employeeId} ${st.role} ${st.department}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return;
        }
        pool.push({
          id: st.id,
          type: 'staff',
          staffObj: st,
          name: `${st.firstName} ${st.lastName}`,
          idNumber: st.employeeId,
          meta: `${st.role} • ${st.department}`,
          dept: st.department,
        });
      });
    }

    return pool;
  }, [students, staff, audienceType, selectedClass, selectedHouse, selectedDept, searchQuery]);

  // Items actually selected for generating
  const activeSelectedItems = filteredEntities.filter((e) => selectedIds.has(e.id));

  // Selection handlers
  const handleSelectAllVisible = () => {
    const updated = new Set(selectedIds);
    filteredEntities.forEach((e) => updated.add(e.id));
    setSelectedIds(updated);
  };

  const handleDeselectAllVisible = () => {
    const updated = new Set(selectedIds);
    filteredEntities.forEach((e) => updated.delete(e.id));
    setSelectedIds(updated);
  };

  const handleToggleItem = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // Pagination calculation for preview
  const itemsPerPage = layout === 'grid-4' ? 4 : layout === 'grid-8' ? 8 : layout === 'stickers-12' ? 12 : 6;
  const totalPages = Math.ceil(activeSelectedItems.length / itemsPerPage) || 1;
  const safePreviewPage = Math.min(previewPage, totalPages - 1);
  const currentPaginatedItems = activeSelectedItems.slice(
    safePreviewPage * itemsPerPage,
    (safePreviewPage + 1) * itemsPerPage
  );

  // Generate & Download PDF
  const handleDownloadPDF = async () => {
    if (activeSelectedItems.length === 0) {
      alert('Please select at least one student or staff member.');
      return;
    }

    setIsGeneratingPDF(true);
    setPdfProgress({ percent: 10, status: 'Initializing PDF document...' });

    try {
      const selectedStudents = activeSelectedItems
        .filter((i) => i.type === 'student' && i.studentObj)
        .map((i) => i.studentObj!);

      const selectedStaff = activeSelectedItems
        .filter((i) => i.type === 'staff' && i.staffObj)
        .map((i) => i.staffObj!);

      const filename = await downloadBulkBadgesPDF({
        schoolSettings,
        students: selectedStudents,
        staff: selectedStaff,
        layout,
        includeMotto,
        includeParentContact,
        includeBloodGroup,
        includeSignatures,
        onProgress: (percent, status) => {
          setPdfProgress({ percent, status });
        },
      });

      setSuccessMessage(`Successfully generated and downloaded: ${filename}`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert(`PDF Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  // Unique classes, houses, departments for filter dropdowns
  const uniqueClasses = Array.from(new Set(students.map((s) => s.classSection))).sort();
  const uniqueHouses = schoolSettings.houses.map((h) => h.name);
  const uniqueDepts = Array.from(new Set(staff.map((st) => st.department))).sort();

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden during native print) */}
      <div className="space-y-6 print:hidden">
        {/* Banner Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-900 text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Bulk QR Generator & Printable PDF Studio
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Generate unified multi-page printable PDF sheets of smart ID badges for all students and faculty with {schoolSettings.schoolName} crest, official motto, and high-density encrypted QR codes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrintBrowser}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-indigo-700" />
              <span>Print Sheet via Browser</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || activeSelectedItems.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-200 disabled:text-slate-400 text-indigo-950 font-black rounded-xl text-xs transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGeneratingPDF ? 'Compiling PDF...' : `Download PDF (${activeSelectedItems.length} Badges)`}
              </span>
            </button>
          </div>
        </div>

        {/* Progress or Success Alerts */}
        {isGeneratingPDF && (
          <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-sm space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{pdfProgress.status}</span>
              </span>
              <span className="font-mono">{pdfProgress.percent}%</span>
            </div>
            <div className="w-full bg-indigo-950 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pdfProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2-Column Configuration Grid: Filters & Layout Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Audience & Filter Settings */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-700" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  1. Target Audience & Cohort Selection
                </h3>
              </div>
              <div className="text-xs text-slate-500 font-bold">
                Selected: <span className="text-indigo-900 font-mono font-black">{activeSelectedItems.length}</span> of {filteredEntities.length}
              </div>
            </div>

            {/* Audience Scope Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAudienceType('all')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  audienceType === 'all'
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All (Students & Staff)
              </button>
              <button
                type="button"
                onClick={() => setAudienceType('students')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  audienceType === 'students'
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Students Only ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setAudienceType('staff')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  audienceType === 'staff'
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Staff & Faculty ({staff.length})
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {(audienceType === 'all' || audienceType === 'students') && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Class Section</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                  >
                    <option value="all">All Classes ({uniqueClasses.length})</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(audienceType === 'all' || audienceType === 'students') && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">School House</label>
                  <select
                    value={selectedHouse}
                    onChange={(e) => setSelectedHouse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                  >
                    <option value="all">All Houses</option>
                    {uniqueHouses.map((h) => (
                      <option key={h} value={h}>
                        {h} House
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(audienceType === 'all' || audienceType === 'staff') && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                  >
                    <option value="all">All Departments</option>
                    {uniqueDepts.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Search & Select/Deselect All buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick filter by name or ID number..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllVisible}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Deselect</span>
                </button>
              </div>
            </div>

            {/* Quick Scrollable Entity Checklist */}
            <div className="border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50">
              {filteredEntities.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'bg-white border border-indigo-300 shadow-2xs'
                        : 'bg-transparent hover:bg-slate-200/50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.id)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {item.idNumber} • {item.meta}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Column 3: Layout & Branding Customization */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-indigo-700" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  2. Layout & Card Formatting
                </h3>
              </div>

              {/* Layout Format Selection */}
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-800 block">Printable Sheet Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayout('grid-6')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      layout === 'grid-6'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">6 per Sheet</span>
                      <span className="text-[10px] text-slate-500">85×55mm (Standard Lanyard)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayout('grid-4')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      layout === 'grid-4'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Grid2X2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">4 per Sheet</span>
                      <span className="text-[10px] text-slate-500">95×65mm (Executive Large)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayout('grid-8')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      layout === 'grid-8'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">8 per Sheet</span>
                      <span className="text-[10px] text-slate-500">85×45mm (CR80 Pocket)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayout('stickers-12')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      layout === 'stickers-12'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">12 QR Stickers</span>
                      <span className="text-[10px] text-slate-500">60×40mm (Notebook Labels)</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Branding Toggles */}
              <div className="pt-2 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">Institutional Branding Fields:</span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMotto}
                    onChange={(e) => setIncludeMotto(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span className="text-slate-700">Include School Motto & Crest</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeParentContact}
                    onChange={(e) => setIncludeParentContact(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span className="text-slate-700">Include Parent Emergency Phone</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBloodGroup}
                    onChange={(e) => setIncludeBloodGroup(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
                  <span className="text-slate-700">Include Blood Group & Academic Session</span>
                </label>
              </div>
            </div>

            {/* School Branding Preview Tag */}
            <div className="p-3 bg-indigo-950 text-white rounded-xl border border-indigo-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{schoolSettings.schoolName}</span>
              </div>
              <p className="text-indigo-200 text-[10px] font-mono truncate">
                {schoolSettings.campusAddress.split(',')[0]} • {schoolSettings.academicSession}
              </p>
            </div>
          </div>
        </div>

        {/* Live A4 Print Sheet Preview Header */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-700" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Live A4 Page Sheet Preview
            </h3>
            <span className="text-xs text-slate-500 font-medium ml-2">
              (Page {safePreviewPage + 1} of {totalPages})
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                disabled={safePreviewPage === 0}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-700 px-2">
                {safePreviewPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePreviewPage >= totalPages - 1}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RENDERED BADGE SHEET (Both Screen Preview & Native Print) */}
      <div className="space-y-8">
        {/* On screen: shows current preview page. During browser window.print(): shows all pages. */}
        <div
          className={`grid gap-4 print:gap-4 ${
            layout === 'grid-4'
              ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
              : layout === 'grid-8'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-2'
              : layout === 'stickers-12'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2'
          }`}
        >
          {/* If printing, render all active selected items; otherwise render the paginated preview */}
          {activeSelectedItems.map((item, idx) => {
            const isStudent = item.type === 'student';
            const qrUrl = qrCodeUrls[item.id];
            const matchedHouse = isStudent
              ? schoolSettings.houses.find(
                  (h) => h.name.toLowerCase() === item.studentObj?.houseColor.toLowerCase()
                )
              : null;
            const houseColor = matchedHouse ? matchedHouse.color : '#10B981';

            return (
              <div
                key={item.id}
                className="print-avoid-break bg-white border border-slate-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                style={{ minHeight: layout === 'stickers-12' ? '180px' : '220px' }}
              >
                {/* Top House / Department Accent Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: isStudent ? houseColor : '#4F46E5' }}
                />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    {schoolSettings.logoUrl ? (
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 p-0.5 flex items-center justify-center shrink-0 border border-indigo-800 shadow-2xs overflow-hidden">
                        <img
                          src={schoolSettings.logoUrl}
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-indigo-900 text-amber-400 flex items-center justify-center font-serif font-black text-xs shadow-2xs border border-indigo-800 shrink-0">
                        {schoolSettings.shortName ? schoolSettings.shortName.slice(0, 3) : 'HEA'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-serif font-black text-[11px] text-slate-900 uppercase truncate max-w-[170px]">
                        {schoolSettings.schoolName}
                      </h4>
                      <p className="text-[9px] text-indigo-700 font-mono font-bold uppercase tracking-wider truncate">
                        {schoolSettings.stateCity.split(',')[0]} • {isStudent ? 'Student ID' : 'Faculty Pass'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h5 className="font-black text-sm text-slate-900 truncate">
                      {item.name}
                    </h5>
                    <div className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono font-bold text-[10px]">
                      ID: {item.idNumber}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium truncate">
                      {item.meta}
                    </p>
                    {isStudent && item.studentObj && (
                      <p className="text-[10px] text-slate-500 truncate">
                        House: <span className="font-bold text-slate-800">{item.studentObj.houseColor}</span>
                      </p>
                    )}
                    {includeParentContact && isStudent && item.studentObj && (
                      <p className="text-[9px] text-slate-500 font-mono truncate">
                        Parent: {item.studentObj.parentPhone}
                      </p>
                    )}
                    {includeBloodGroup && isStudent && item.studentObj && (
                      <p className="text-[9px] text-slate-400 font-mono">
                        Blood: {item.studentObj.bloodGroup || 'O+'} • {schoolSettings.academicSession.split(' ')[0]}
                      </p>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="shrink-0 p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                    {qrUrl ? (
                      <img src={qrUrl} alt="Encrypted QR Badge" className="w-16 h-16" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-lg" />
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                  <span className="truncate max-w-[130px]">{schoolSettings.campusAddress.split(',')[0]}</span>
                  {includeMotto && (
                    <span className="text-amber-700 font-bold truncate max-w-[130px]">
                      {schoolSettings.motto.split('(')[0].trim()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {activeSelectedItems.length === 0 && (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Badges Selected</h4>
            <p className="text-xs text-slate-500">
              Please adjust your filters or click "Select All" to generate printable QR badges.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
