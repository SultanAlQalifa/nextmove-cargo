/**
 * Exports an array of objects to a CSV file.
 *
 * @param data Array of objects to export
 * @param headers Array of objects defining the headers and keys.
 *                Example: [{ label: 'Name', key: 'name' }, { label: 'Email', key: 'email' }]
 * @param filename Name of the file to download (without extension)
 */
export const exportToCSV = (
  data: any[],
  headers: { label: string; key: string | ((item: any) => any) }[],
  filename: string,
) => {
  if (!data || !data.length) {
    console.warn("Aucune donnée à exporter");
    return;
  }

  const csvRows = [];

  // Add headers
  const headerLabels = headers.map((h) => h.label);
  csvRows.push(headerLabels.join(","));

  // Add data
  for (const row of data) {
    const values = headers.map((header) => {
      let val;
      if (typeof header.key === "function") {
        val = header.key(row);
      } else {
        // Handle nested properties (e.g., 'user.name')
        val = header.key
          .split(".")
          .reduce(
            (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : null),
            row,
          );
      }

      // Escape quotes and wrap in quotes if necessary
      const stringVal = val === null || val === undefined ? "" : String(val);
      const escaped = stringVal.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  // Create blob and download
  const csvString = csvRows.join("\n");
  // Add BOM (Byte Order Mark) for Excel compatibility
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Exporter des données au format Excel (.xlsx)
 * @param data Les données JSON à exporter
 * @param fileName Le nom du fichier de sortie (sans l'extension)
 */
export const exportToExcel = (data: any[], fileName: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');
    XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    throw new Error('Échec de la génération Excel');
  }
};

/**
 * Exporter des données sous forme de tableau dans un fichier PDF
 * @param title Le titre du document
 * @param head Les entêtes des colonnes (ex: [["Nom", "Email", "Rôle"]])
 * @param body Les lignes de données (ex: [["John", "john@mail.com", "Admin"]])
 * @param fileName Le nom du fichier
 */
export const exportToPDF = (title: string, head: string[][], body: (string | number)[][], fileName: string) => {
  try {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    // Branding
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('NextMove Cargo', pageWidth - 14, 22, { align: 'right' });

    // Table
    autoTable(doc as any, {
      head: head,
      body: body,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`${fileName}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw new Error('Échec de la génération PDF');
  }
};
