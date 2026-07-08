import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { BLP_CATEGORIES } from '../data/activities';
import { UserProgress } from '../types';

function buildRekapRows(user: UserProgress, monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = getDaysInMonth(monthDate);

  const rows: { no: number; name: string; target: string; marks: boolean[]; capaian: number; targetCount: number }[][] = [];

  BLP_CATEGORIES.forEach((cat) => {
    const catRows = cat.activities.map((activity, idx) => {
      const marks = daysInMonth.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const rec = user.records[key];
        return !!rec && rec.completedActivities.includes(activity.id);
      });
      const capaian = marks.filter(Boolean).length;
      return {
        no: idx + 1,
        name: activity.name,
        target: activity.target,
        marks,
        capaian,
        targetCount: totalDays,
      };
    });
    rows.push(catRows);
  });

  return { rows, totalDays, daysInMonth };
}

export function downloadRekapPDF(user: UserProgress, monthDate: Date) {
  const { rows, totalDays } = buildRekapRows(user, monthDate);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LEMBAR BUILDING LEARNING POWER ( BLP )', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
  doc.text('SISWA SMP TISA ISLAMIC SCHOOL', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bulan: ${format(monthDate, 'MMMM yyyy', { locale: localeId })}`, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`NAMA : ${user.name}`, 10, 27);
  doc.text(`KELAS : ${user.kelas}`, 10, 32);
  doc.text(`BULAN : ${format(monthDate, 'MMMM yyyy', { locale: localeId })}`, 100, 27);

  const dayHeaders = Array.from({ length: totalDays }).map((_, i) => String(i + 1));
  const head = [
    [
      { content: 'NO.', rowSpan: 2 },
      { content: 'AKTIVITAS AMALIYAH', rowSpan: 2 },
      { content: 'TARGET', rowSpan: 2 },
      { content: 'PELAKSANAAN', colSpan: totalDays },
      { content: 'CAPAIAN', rowSpan: 2 },
      { content: 'TARGET', rowSpan: 2 },
    ],
    dayHeaders.map((d) => ({ content: d })),
  ];

  const body: any[] = [];
  BLP_CATEGORIES.forEach((cat, catIdx) => {
    body.push([
      { content: cat.name, colSpan: 3 + totalDays + 2, styles: { fillColor: [16, 122, 87], textColor: 255, fontStyle: 'bold', halign: 'left' } },
    ]);
    rows[catIdx].forEach((r) => {
      body.push([
        r.no,
        r.name,
        r.target,
        ...r.marks.map((m) => (m ? 'v' : '')),
        r.capaian,
        r.targetCount,
      ]);
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
    { content: 'JUMLAH', colSpan: 3 + totalDays, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: String(grandCapaian), styles: { fontStyle: 'bold' } },
    { content: String(grandTarget), styles: { fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: 36,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 5.5, cellPadding: 1, halign: 'center', valign: 'middle', lineColor: [180, 180, 180], lineWidth: 0.1 },
    headStyles: { fillColor: [16, 122, 87], textColor: 255, fontStyle: 'bold', fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 42, halign: 'left' },
      2: { cellWidth: 14 },
    },
    margin: { left: 10, right: 10 },
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

export function downloadRekapExcel(user: UserProgress, monthDate: Date) {
  const { rows, totalDays } = buildRekapRows(user, monthDate);

  const sheetData: any[][] = [];
  sheetData.push(['LEMBAR BUILDING LEARNING POWER ( BLP )']);
  sheetData.push(['SISWA SMP TISA ISLAMIC SCHOOL']);
  sheetData.push([]);
  sheetData.push(['NAMA', user.name]);
  sheetData.push(['KELAS', user.kelas]);
  sheetData.push(['BULAN', format(monthDate, 'MMMM yyyy', { locale: localeId })]);
  sheetData.push([]);

  const dayHeaders = Array.from({ length: totalDays }).map((_, i) => String(i + 1));
  sheetData.push(['NO.', 'AKTIVITAS AMALIYAH', 'TARGET', ...dayHeaders, 'CAPAIAN', 'TARGET']);

  let grandCapaian = 0;
  let grandTarget = 0;

  BLP_CATEGORIES.forEach((cat, catIdx) => {
    sheetData.push([cat.name]);
    rows[catIdx].forEach((r) => {
      sheetData.push([
        r.no,
        r.name,
        r.target,
        ...r.marks.map((m) => (m ? 'v' : '')),
        r.capaian,
        r.targetCount,
      ]);
      grandCapaian += r.capaian;
      grandTarget += r.targetCount;
    });
  });

  sheetData.push(['JUMLAH', '', '', ...Array(totalDays).fill(''), grandCapaian, grandTarget]);
  sheetData.push([]);
  sheetData.push(['NILAI', Math.round((grandTarget > 0 ? grandCapaian / grandTarget : 0) * 100)]);
  sheetData.push([]);
  sheetData.push(['MENGETAHUI']);
  sheetData.push(['KEPALA SEKOLAH SMP', '', 'WAKASEK KURIKULUM SMP', '', 'GURU BIDANG STUDY']);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 32 },
    { wch: 12 },
    ...Array(totalDays).fill({ wch: 3 }),
    { wch: 8 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap BLP');
  XLSX.writeFile(workbook, `Rekap_BLP_${user.name}_${format(monthDate, 'MMMM_yyyy', { locale: localeId })}.xlsx`);
}
