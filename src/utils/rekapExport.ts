import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { BLP_CATEGORIES } from '../data/activities';
import { UserProgress, BlpPeriod } from '../types';
import { SCHOOL_ONLY_ACTIVITY_IDS, isSchoolDay, isDateCountedForRecap } from './blpScoring';

const TOTAL_DAY_COLS = 31;
const BRAND_GREEN = 'FF107C57';
const LIGHT_GREEN = 'FFDCEFE6';
const GREY = 'FFF2F2F2';

// A day only "counts" for an activity row if it's within the class's active
// BLP period for that month, and — for school-only activities like "Datang
// ke sekolah tepat waktu" — only if it's also a school day (Mon-Fri).
function isDayCountedForActivity(day: Date, activityId: string, kelas: string, blpPeriods?: Record<string, BlpPeriod>): boolean {
  if (!isDateCountedForRecap(day, kelas, blpPeriods)) return false;
  if (SCHOOL_ONLY_ACTIVITY_IDS.includes(activityId) && !isSchoolDay(day)) return false;
  return true;
}

function buildRekapRows(user: UserProgress, monthDate: Date, blpPeriods?: Record<string, BlpPeriod>) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = getDaysInMonth(monthDate);

  const rows: { no: number; name: string; target: string; marks: boolean[]; counted: boolean[]; capaian: number; targetCount: number }[][] = [];

  BLP_CATEGORIES.forEach((cat) => {
    const catRows = cat.activities.map((activity, idx) => {
      const counted = daysInMonth.map((day) => isDayCountedForActivity(day, activity.id, user.kelas, blpPeriods));
      const marks = daysInMonth.map((day, i) => {
        if (!counted[i]) return false;
        const key = format(day, 'yyyy-MM-dd');
        const rec = user.records[key];
        return !!rec && rec.completedActivities.includes(activity.id);
      });
      const capaian = marks.filter(Boolean).length;
      const targetCount = counted.filter(Boolean).length;
      return {
        no: idx + 1,
        name: activity.name,
        target: activity.target,
        marks,
        counted,
        capaian,
        targetCount,
      };
    });
    rows.push(catRows);
  });

  return { rows, totalDays, daysInMonth };
}

function getSemesterLabel(monthDate: Date) {
  const month = monthDate.getMonth() + 1;
  const year = monthDate.getFullYear();
  if (month >= 7) {
    return `SEMESTER 1 T.A ${year}-${year + 1}`;
  }
  return `SEMESTER 2 T.A ${year - 1}-${year}`;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadRekapPDF(user: UserProgress, monthDate: Date, blpPeriods?: Record<string, BlpPeriod>) {
  const { rows, totalDays } = buildRekapRows(user, monthDate, blpPeriods);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LEMBAR BUILDING LEARNING POWER ( BLP )', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
  doc.text('SISWA SMP TISA ISLAMIC SCHOOL', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(getSemesterLabel(monthDate), doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`NAMA : ${user.name}`, 10, 27);
  doc.text(`KELAS : ${user.kelas}`, 10, 32);
  doc.text(`BULAN : ${format(monthDate, 'MMMM yyyy', { locale: localeId })}`, 140, 27);

  const dayHeaders = Array.from({ length: TOTAL_DAY_COLS }).map((_, i) => String(i + 1));
  const head = [
    [
      { content: 'NO.', rowSpan: 2 },
      { content: 'AKTIVITAS AMALIYAH', rowSpan: 2 },
      { content: 'TARGET', rowSpan: 2 },
      { content: 'PELAKSANAAN', colSpan: TOTAL_DAY_COLS },
      { content: 'CAPAIAN', rowSpan: 2 },
      { content: 'TARGET', rowSpan: 2 },
    ],
    dayHeaders.map((d) => ({ content: d })),
  ];

  const body: any[] = [];
  BLP_CATEGORIES.forEach((cat, catIdx) => {
    body.push([
      { content: cat.name, colSpan: 3 + TOTAL_DAY_COLS + 2, styles: { fillColor: [16, 122, 87], textColor: 255, fontStyle: 'bold', halign: 'left' } },
    ]);
    rows[catIdx].forEach((r) => {
      const cells = Array.from({ length: TOTAL_DAY_COLS }).map((_, i) => {
        if (i >= totalDays || !r.counted[i]) {
          return { content: '', styles: { fillColor: [230, 230, 230] } };
        }
        return r.marks[i] ? 'v' : '';
      });
      body.push([r.no, r.name, r.target, ...cells, r.capaian, r.targetCount]);
    });
  });

  let grandCapaian = 0;
  let grandTarget = 0;
  rows.forEach((catRows) => {
    catRows.forEach((r) => {
      grandCapaian += r.capaian;
      grandTarget += r.targetCount;
    });
  });
  body.push([
    { content: 'JUMLAH', colSpan: 3 + TOTAL_DAY_COLS, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: String(grandCapaian), styles: { fontStyle: 'bold' } },
    { content: String(grandTarget), styles: { fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: 36,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 5.2, cellPadding: 1, halign: 'center', valign: 'middle', lineColor: [150, 150, 150], lineWidth: 0.1 },
    headStyles: { fillColor: [16, 122, 87], textColor: 255, fontStyle: 'bold', fontSize: 5.8 },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 44, halign: 'left' },
      2: { cellWidth: 13 },
    },
    margin: { left: 8, right: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 36;
  doc.setFontSize(8);
  doc.text(`Nilai : ${Math.round((grandTarget > 0 ? grandCapaian / grandTarget : 0) * 100)}`, doc.internal.pageSize.getWidth() - 40, finalY + 10);

  const footerY = finalY + 20;
  doc.setFontSize(8);
  doc.text('MENGETAHUI', 10, footerY);
  doc.text('KEPALA SEKOLAH SMP', 10, footerY + 5);
  doc.text('WAKASEK KURIKULUM SMP', 100, footerY + 5);
  doc.text('GURU BIDANG STUDY', 200, footerY + 5);

  doc.text('_____________________________', 10, footerY + 25);
  doc.text('_____________________________', 100, footerY + 25);
  doc.text('_____________________________', 200, footerY + 25);

  doc.save(`Rekap_BLP_${user.name}_${format(monthDate, 'MMMM_yyyy', { locale: localeId })}.pdf`);
}

export async function downloadRekapExcel(user: UserProgress, monthDate: Date, blpPeriods?: Record<string, BlpPeriod>) {
  const { rows, totalDays } = buildRekapRows(user, monthDate, blpPeriods);
  const TOTAL_COLS = 3 + TOTAL_DAY_COLS + 2;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BLP Harian';
  workbook.created = new Date();
  const ws = workbook.addWorksheet('Rekap BLP', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });

  ws.columns = [
    { width: 5 },
    { width: 34 },
    { width: 12 },
    ...Array.from({ length: TOTAL_DAY_COLS }).map(() => ({ width: 3.2 })),
    { width: 9 },
    { width: 9 },
  ];

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF999999' } },
    left: { style: 'thin', color: { argb: 'FF999999' } },
    bottom: { style: 'thin', color: { argb: 'FF999999' } },
    right: { style: 'thin', color: { argb: 'FF999999' } },
  };

  function mergeAndSet(r1: number, c1: number, r2: number, c2: number, value: any, opts: {
    bold?: boolean; size?: number; align?: 'left' | 'center' | 'right'; fill?: string; color?: string; border?: boolean;
  } = {}) {
    ws.mergeCells(r1, c1, r2, c2);
    const cell = ws.getCell(r1, c1);
    cell.value = value;
    cell.font = { bold: opts.bold ?? false, size: opts.size ?? 10, color: { argb: opts.color ?? 'FF000000' } };
    cell.alignment = { horizontal: opts.align ?? 'left', vertical: 'middle', wrapText: true };
    if (opts.fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
    }
    if (opts.border) {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          ws.getCell(r, c).border = thinBorder;
        }
      }
    }
    return cell;
  }

  let r = 1;
  mergeAndSet(r, 1, r, TOTAL_COLS, 'LEMBAR BUILDING LEARNING POWER ( BLP )', { bold: true, size: 13, align: 'center' });
  r++;
  mergeAndSet(r, 1, r, TOTAL_COLS, 'SISWA SMP TISA ISLAMIC SCHOOL', { bold: true, size: 11, align: 'center' });
  r++;
  mergeAndSet(r, 1, r, TOTAL_COLS, getSemesterLabel(monthDate), { size: 10, align: 'center' });
  r++;
  r++; // blank spacer row

  const infoRow = r;
  ws.getCell(infoRow, 1).value = 'NAMA';
  ws.getCell(infoRow, 1).font = { bold: true, size: 10 };
  ws.getCell(infoRow, 2).value = ':';
  mergeAndSet(infoRow, 3, infoRow, 10, user.name, { size: 10 });
  ws.getCell(infoRow, 11).value = 'KELAS';
  ws.getCell(infoRow, 11).font = { bold: true, size: 10 };
  ws.getCell(infoRow, 12).value = ':';
  mergeAndSet(infoRow, 13, infoRow, 18, user.kelas, { size: 10 });
  r++;

  const bulanRow = r;
  ws.getCell(bulanRow, 1).value = 'BULAN';
  ws.getCell(bulanRow, 1).font = { bold: true, size: 10 };
  ws.getCell(bulanRow, 2).value = ':';
  mergeAndSet(bulanRow, 3, bulanRow, 10, format(monthDate, 'MMMM yyyy', { locale: localeId }), { size: 10 });
  r++;

  const headerRow1 = r;
  const headerRow2 = r + 1;
  mergeAndSet(headerRow1, 1, headerRow2, 1, 'NO.', { bold: true, align: 'center', fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
  mergeAndSet(headerRow1, 2, headerRow2, 2, 'AKTIVITAS AMALIYAH', { bold: true, align: 'center', fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
  mergeAndSet(headerRow1, 3, headerRow2, 3, 'TARGET', { bold: true, align: 'center', fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
  mergeAndSet(headerRow1, 4, headerRow1, 3 + TOTAL_DAY_COLS, 'PELAKSANAAN', { bold: true, align: 'center', fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
  mergeAndSet(headerRow1, 4 + TOTAL_DAY_COLS, headerRow2, 4 + TOTAL_DAY_COLS, 'CAPAIAN', { bold: true, align: 'center', fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
  mergeAndSet(headerRow1, 5 + TOTAL_DAY_COLS, headerRow2, 5 + TOTAL_DAY_COLS, 'TARGET', { bold: true, align: 'center', fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
  for (let d = 1; d <= TOTAL_DAY_COLS; d++) {
    const cell = ws.getCell(headerRow2, 3 + d);
    cell.value = d;
    cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN } };
    cell.border = thinBorder;
  }
  r = headerRow2 + 1;

  let grandCapaian = 0;
  let grandTarget = 0;

  BLP_CATEGORIES.forEach((cat, catIdx) => {
    mergeAndSet(r, 1, r, TOTAL_COLS, cat.name, { bold: true, fill: BRAND_GREEN, color: 'FFFFFFFF', border: true });
    r++;
    rows[catIdx].forEach((activityRow) => {
      const noCell = ws.getCell(r, 1);
      noCell.value = activityRow.no;
      noCell.alignment = { horizontal: 'center', vertical: 'middle' };
      noCell.border = thinBorder;

      const nameCell = ws.getCell(r, 2);
      nameCell.value = activityRow.name;
      nameCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      nameCell.font = { size: 9 };
      nameCell.border = thinBorder;

      const targetCell = ws.getCell(r, 3);
      targetCell.value = activityRow.target;
      targetCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      targetCell.font = { size: 8 };
      targetCell.border = thinBorder;

      for (let d = 0; d < TOTAL_DAY_COLS; d++) {
        const cell = ws.getCell(r, 4 + d);
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (d >= totalDays || !activityRow.counted[d]) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
        } else if (activityRow.marks[d]) {
          cell.value = '✓';
          cell.font = { bold: true, color: { argb: BRAND_GREEN }, size: 9 };
        }
      }

      const capaianCell = ws.getCell(r, 4 + TOTAL_DAY_COLS);
      capaianCell.value = activityRow.capaian;
      capaianCell.alignment = { horizontal: 'center', vertical: 'middle' };
      capaianCell.font = { bold: true, size: 9 };
      capaianCell.border = thinBorder;

      const targetCountCell = ws.getCell(r, 5 + TOTAL_DAY_COLS);
      targetCountCell.value = activityRow.targetCount;
      targetCountCell.alignment = { horizontal: 'center', vertical: 'middle' };
      targetCountCell.font = { size: 9 };
      targetCountCell.border = thinBorder;

      grandCapaian += activityRow.capaian;
      grandTarget += activityRow.targetCount;
      r++;
    });
  });

  mergeAndSet(r, 1, r, 3 + TOTAL_DAY_COLS, 'JUMLAH', { bold: true, align: 'right', fill: LIGHT_GREEN, border: true });
  const jumlahCapaian = ws.getCell(r, 4 + TOTAL_DAY_COLS);
  jumlahCapaian.value = grandCapaian;
  jumlahCapaian.font = { bold: true };
  jumlahCapaian.alignment = { horizontal: 'center', vertical: 'middle' };
  jumlahCapaian.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };
  jumlahCapaian.border = thinBorder;
  const jumlahTarget = ws.getCell(r, 5 + TOTAL_DAY_COLS);
  jumlahTarget.value = grandTarget;
  jumlahTarget.font = { bold: true };
  jumlahTarget.alignment = { horizontal: 'center', vertical: 'middle' };
  jumlahTarget.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };
  jumlahTarget.border = thinBorder;
  r += 2;

  const nilaiScore = Math.round((grandTarget > 0 ? grandCapaian / grandTarget : 0) * 100);
  const nilaiBoxRow = r;
  mergeAndSet(nilaiBoxRow, TOTAL_COLS - 5, nilaiBoxRow + 3, TOTAL_COLS, `Nilai :\n\n${nilaiScore}`, {
    bold: true, align: 'center', border: true, size: 12,
  });
  ws.getCell(nilaiBoxRow, TOTAL_COLS - 5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  mergeAndSet(r, 2, r, 10, 'MENGETAHUI', { bold: true, align: 'left' });
  r += 1;
  mergeAndSet(r, 2, r, 10, 'KEPALA SEKOLAH SMP', { align: 'left' });
  mergeAndSet(r, 13, r, 20, 'WAKASEK KURIKULUM SMP', { align: 'left' });
  mergeAndSet(r, 24, r, TOTAL_COLS - 6, 'GURU BIDANG STUDY', { align: 'left' });
  r += 4;
  mergeAndSet(r, 2, r, 10, '_____________________________', { align: 'left' });
  mergeAndSet(r, 13, r, 20, '_____________________________', { align: 'left' });
  mergeAndSet(r, 24, r, TOTAL_COLS - 6, '_____________________________', { align: 'left' });

  ws.getRow(headerRow1).height = 18;
  ws.getRow(headerRow2).height = 16;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveBlob(blob, `Rekap_BLP_${user.name}_${format(monthDate, 'MMMM_yyyy', { locale: localeId })}.xlsx`);
}
