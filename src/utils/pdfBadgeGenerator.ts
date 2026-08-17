import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Student, Staff, SchoolSettings } from '../types';
import { getBackupDateSlug } from './exportUtils';

export interface BulkPDFOptions {
  schoolSettings: SchoolSettings;
  students: Student[];
  staff: Staff[];
  layout: 'grid-6' | 'grid-4' | 'grid-8' | 'stickers-12';
  includeMotto?: boolean;
  includeParentContact?: boolean;
  includeBloodGroup?: boolean;
  includeSignatures?: boolean;
  onProgress?: (progress: number, statusText: string) => void;
}

export interface BadgeEntityItem {
  id: string;
  type: 'student' | 'staff';
  fullName: string;
  idNumber: string;
  secondaryInfo: string; // Class or Department/Role
  houseOrShift?: string;
  houseColorHex?: string;
  parentOrEmail?: string;
  bloodGroup?: string;
  qrPayload: string;
}

/**
 * Generate a complete multi-page PDF document with all QR badges
 */
export async function generateBulkBadgesPDF(options: BulkPDFOptions): Promise<jsPDF> {
  const {
    schoolSettings,
    students,
    staff,
    layout,
    includeMotto = true,
    includeParentContact = true,
    includeBloodGroup = true,
    onProgress,
  } = options;

  // Build unified item list
  const badgeItems: BadgeEntityItem[] = [];

  students.forEach((s) => {
    // find house color
    const matchedHouse = schoolSettings.houses?.find(
      (h) => h.name.toLowerCase() === s.houseColor.toLowerCase()
    );
    badgeItems.push({
      id: s.id,
      type: 'student',
      fullName: `${s.firstName} ${s.lastName}`,
      idNumber: s.admissionNumber,
      secondaryInfo: `Class: ${s.classSection}`,
      houseOrShift: `${s.houseColor} House`,
      houseColorHex: matchedHouse ? matchedHouse.color : '#10B981',
      parentOrEmail: `Parent: ${s.parentPhone}`,
      bloodGroup: s.bloodGroup || 'O+',
      qrPayload: s.qrCodePayload,
    });
  });

  staff.forEach((st) => {
    badgeItems.push({
      id: st.id,
      type: 'staff',
      fullName: `${st.firstName} ${st.lastName}`,
      idNumber: st.employeeId,
      secondaryInfo: `${st.role} • ${st.department}`,
      houseOrShift: `Shift: ${st.shiftSchedule?.start || '07:30'} - ${st.shiftSchedule?.end || '16:00'}`,
      houseColorHex: '#4F46E5', // indigo
      parentOrEmail: st.phone,
      bloodGroup: 'Staff',
      qrPayload: st.qrCodePayload,
    });
  });

  const total = badgeItems.length;
  if (total === 0) {
    throw new Error('No students or staff selected for badge generation.');
  }

  // Pre-generate all QR code Data URLs
  const qrDataUrls: Record<string, string> = {};
  for (let i = 0; i < badgeItems.length; i++) {
    const item = badgeItems[i];
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / (total * 2)) * 100),
        `Encoding encrypted QR badge ${i + 1} of ${total}...`
      );
    }
    try {
      const qr = await QRCode.toDataURL(item.qrPayload, {
        width: 250,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      qrDataUrls[item.id] = qr;
    } catch (e) {
      console.error('Failed to generate QR for ' + item.fullName, e);
    }
  }

  // Create A4 PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Layout parameters
  let cols = 2;
  let rows = 3;
  let marginX = 12;
  let marginY = 12;
  let gapX = 6;
  let gapY = 6;

  if (layout === 'grid-4') {
    cols = 2;
    rows = 2;
    marginX = 14;
    marginY = 16;
    gapX = 8;
    gapY = 10;
  } else if (layout === 'grid-8') {
    cols = 2;
    rows = 4;
    marginX = 10;
    marginY = 10;
    gapX = 6;
    gapY = 5;
  } else if (layout === 'stickers-12') {
    cols = 3;
    rows = 4;
    marginX = 10;
    marginY = 10;
    gapX = 5;
    gapY = 5;
  }

  const cardWidth = (pageWidth - marginX * 2 - gapX * (cols - 1)) / cols;
  const cardHeight = (pageHeight - marginY * 2 - gapY * (rows - 1)) / rows;
  const itemsPerPage = cols * rows;

  for (let i = 0; i < badgeItems.length; i++) {
    const item = badgeItems[i];
    const pageIndex = Math.floor(i / itemsPerPage);
    const indexOnPage = i % itemsPerPage;

    if (i > 0 && indexOnPage === 0) {
      doc.addPage();
    }

    if (onProgress) {
      onProgress(
        50 + Math.round(((i + 1) / (total * 2)) * 100),
        `Rendering printable badge card ${i + 1} of ${total}...`
      );
    }

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);
    const x = marginX + col * (cardWidth + gapX);
    const y = marginY + row * (cardHeight + gapY);

    const isStudent = item.type === 'student';
    const primaryColor = isStudent ? [30, 27, 75] : [15, 23, 42]; // Indigo-950 or Slate-900
    const qrImg = qrDataUrls[item.id];

    if (layout === 'stickers-12') {
      // COMPACT STICKER LAYOUT
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

      // Top colored accent bar
      doc.setFillColor(isStudent ? 16 : 79, isStudent ? 185 : 70, isStudent ? 129 : 229);
      doc.roundedRect(x, y, cardWidth, 3, 1, 1, 'F');

      // QR Code
      const qrSize = 22;
      const qrX = x + (cardWidth - qrSize) / 2;
      const qrY = y + 5;
      if (qrImg) {
        doc.addImage(qrImg, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // Name & ID
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const truncatedName = item.fullName.length > 20 ? item.fullName.substring(0, 18) + '...' : item.fullName;
      doc.text(truncatedName, x + cardWidth / 2, y + 31, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(item.idNumber, x + cardWidth / 2, y + 35, { align: 'center' });
      doc.text(schoolSettings.shortName || 'HEA Abuja', x + cardWidth / 2, y + 39, { align: 'center' });
    } else {
      // STANDARD FULL BADGE LAYOUT (CR80 / LANYARD)
      
      // Card Background & Outer Border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

      // Header Banner Background
      const headerHeight = cardHeight > 70 ? 16 : 13;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(x, y, cardWidth, headerHeight, 3, 3, 'F');
      // Fix bottom corners of header
      doc.rect(x, y + headerHeight - 3, cardWidth, 3, 'F');

      // Header School Crest Box (Acronym or Logo Image)
      const crestSize = headerHeight - 4;
      let drewLogoImage = false;
      if (schoolSettings.logoUrl && schoolSettings.logoUrl.startsWith('data:image/')) {
        try {
          doc.addImage(schoolSettings.logoUrl, 'PNG', x + 2.5, y + 2, crestSize, crestSize);
          drewLogoImage = true;
        } catch (e) {
          drewLogoImage = false;
        }
      }

      if (!drewLogoImage) {
        doc.setFillColor(251, 191, 36); // Amber-400
        doc.roundedRect(x + 2.5, y + 2, crestSize, crestSize, 1.5, 1.5, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(crestSize > 10 ? 8 : 7);
        doc.setTextColor(15, 23, 42);
        const acronym = schoolSettings.shortName ? schoolSettings.shortName.slice(0, 3) : 'HEA';
        doc.text(acronym, x + 2.5 + crestSize / 2, y + 2 + crestSize / 2 + 1.2, { align: 'center' });
      }

      // School Name & Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      const schoolTitleSize = cardWidth > 85 ? 8 : 7;
      doc.setFontSize(schoolTitleSize);
      const maxSchoolNameLen = cardWidth > 85 ? 30 : 24;
      const cleanSchoolName = schoolSettings.schoolName.length > maxSchoolNameLen 
        ? schoolSettings.schoolName.substring(0, maxSchoolNameLen - 2) + '...' 
        : schoolSettings.schoolName.toUpperCase();
      doc.text(cleanSchoolName, x + 3.5 + crestSize + 2, y + 6);

      // Subtitle (Type & City)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(251, 191, 36); // Amber-400
      const subHeader = isStudent 
        ? `${schoolSettings.stateCity.split(',')[0]} • STUDENT SMART ID` 
        : `${schoolSettings.stateCity.split(',')[0]} • FACULTY / STAFF CREDENTIAL`;
      doc.text(subHeader, x + 3.5 + crestSize + 2, y + 10.5);

      // House / Department colored accent stripe
      const stripeY = y + headerHeight;
      const stripeHeight = 1.5;
      if (isStudent && item.houseColorHex) {
        // convert hex to rgb
        const hex = item.houseColorHex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 16;
        const g = parseInt(hex.substring(2, 4), 16) || 185;
        const b = parseInt(hex.substring(4, 6), 16) || 129;
        doc.setFillColor(r, g, b);
      } else {
        doc.setFillColor(79, 70, 229); // indigo
      }
      doc.rect(x, stripeY, cardWidth, stripeHeight, 'F');

      // Main Content Area
      const contentY = stripeY + stripeHeight + 3;
      const qrSize = cardHeight > 70 ? 28 : 23;
      const qrX = x + cardWidth - qrSize - 3.5;
      const qrY = contentY + 1;

      // Draw QR Code Image
      if (qrImg) {
        // QR Container Box
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(0.2);
        doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1.5, 1.5, 'FD');
        doc.addImage(qrImg, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      // Left Info Block
      const textX = x + 3.5;
      let curTextY = contentY + 4;

      // Student/Staff Full Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(cardWidth > 85 ? 10 : 8.5);
      doc.setTextColor(15, 23, 42);
      const nameText = item.fullName.length > 22 ? item.fullName.substring(0, 20) + '...' : item.fullName;
      doc.text(nameText, textX, curTextY);

      // ID Badge Pill
      curTextY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(67, 56, 202); // Indigo-700
      doc.text(`ID: ${item.idNumber}`, textX, curTextY);

      // Secondary Info (Class or Role)
      curTextY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(item.secondaryInfo, textX, curTextY);

      // House / Shift Info
      if (item.houseOrShift) {
        curTextY += 3.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(item.houseOrShift, textX, curTextY);
      }

      // Parent Phone or Emergency contact
      if (includeParentContact && item.parentOrEmail) {
        curTextY += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text(item.parentOrEmail, textX, curTextY);
      }

      // Blood group / Session
      if (includeBloodGroup && isStudent) {
        curTextY += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Blood: ${item.bloodGroup} • Valid ${schoolSettings.academicSession.split(' ')[0]}`, textX, curTextY);
      }

      // Card Footer
      const footerY = y + cardHeight - 5.5;
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(x + 2, footerY, x + cardWidth - 2, footerY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      const campusText = schoolSettings.campusAddress.split(',')[0] || 'Abuja Campus';
      doc.text(campusText, x + 3.5, footerY + 3.5);

      if (includeMotto) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(180, 83, 9); // Amber-700
        const mottoShort = schoolSettings.motto.split('(')[0].trim() || 'Excellence';
        doc.text(mottoShort, x + cardWidth - 3.5, footerY + 3.5, { align: 'right' });
      }
    }
  }

  return doc;
}

/**
 * Convenience helper to download the PDF directly
 */
export async function downloadBulkBadgesPDF(options: BulkPDFOptions, filenamePrefix?: string) {
  const doc = await generateBulkBadgesPDF(options);
  const prefix = filenamePrefix || `${options.schoolSettings.shortName || 'School'}_Bulk_QR_Badges`;
  const filename = `${prefix}_${getBackupDateSlug()}.pdf`;
  doc.save(filename);
  return filename;
}
