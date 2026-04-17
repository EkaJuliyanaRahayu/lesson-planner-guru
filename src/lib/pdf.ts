import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DocumentRecord, STAGE_LABELS, STAGES } from "./types";

export function generateStagePDF(doc: DocumentRecord, stage: string) {
  // Paksa RPP menggunakan landscape agar kolom deskripsi lebih luas
  const orientation = (stage === "rpp" || STAGE_LABELS[stage].columns.length > 4) ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation });
  const label = STAGE_LABELS[stage];

  pdf.setFontSize(16);
  pdf.text(label.title, 14, 20);

  pdf.setFontSize(11);
  pdf.text(`Kelas: ${doc.kelas}`, 14, 30);
  pdf.text(`Mata Pelajaran: ${doc.mataPelajaran}`, 14, 37);
  pdf.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 44);

  const stageData = doc[stage as keyof Pick<DocumentRecord, "cp" | "tp" | "atp" | "rpp">];

  if (stage === "rpp") {
    // --- LOGIKA CETAK KHUSUS RPP (ROWSPAN) ---
    const rows = stageData.rows;
    const body: any[] = [];
    
    // 1. Hitung jumlah baris per kategori untuk rowspan
    const categoryCount: Record<string, number> = {};
    rows.forEach((row) => {
      const cat = row.values[0];
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    let currentCategory = "";

    // 2. Susun array body untuk autoTable
    rows.forEach((row) => {
      const tableRow: any[] = [];
      const cat = row.values[0];

      // Jika kategori berubah, tambahkan sel dengan properti rowSpan
      if (cat !== currentCategory) {
        currentCategory = cat;
        tableRow.push({
          content: cat,
          rowSpan: categoryCount[cat],
          styles: { valign: "middle", halign: "center", fontStyle: "bold", fillColor: [240, 240, 240] }
        });
      }

      // Masukkan Komponen dan Deskripsi
      tableRow.push({ content: row.values[1] || "", styles: { fontStyle: "bold" } });
      tableRow.push({ content: row.values[2] || "" });

      body.push(tableRow);
    });

    autoTable(pdf, {
      startY: 52,
      head: [["Kategori", "Komponen", "Deskripsi"]],
      body: body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 170] },
      columnStyles: {
        0: { cellWidth: 40 }, // Lebar kolom Kategori
        1: { cellWidth: 50 }, // Lebar kolom Komponen
        // Kolom 2 (Deskripsi) otomatis mengambil sisa ruang
      }
    });

  } else {
    // --- LOGIKA CETAK STANDAR UNTUK CP, TP, ATP ---
    autoTable(pdf, {
      startY: 52,
      head: [label.columns],
      body: stageData.rows.map((r) =>
        label.columns.map((_, i) => r.values[i] ?? "")
      ),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 170] },
    });
  }

  pdf.save(`${stage.toUpperCase()}_${doc.mataPelajaran}_Kelas${doc.kelas}.pdf`);
}


export function generateFullPDF(doc: DocumentRecord) {
  const pdf = new jsPDF({ orientation: "landscape" });

  pdf.setFontSize(18);
  pdf.text("Laporan Pembelajaran", 14, 20);
  pdf.setFontSize(11);
  pdf.text(`Kelas: ${doc.kelas}`, 14, 30);
  pdf.text(`Mata Pelajaran: ${doc.mataPelajaran}`, 14, 37);
  pdf.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 44);

  let startY = 55;

  for (const stage of STAGES) {
    const label = STAGE_LABELS[stage];
    const stageData = doc[stage as keyof Pick<DocumentRecord, "cp" | "tp" | "atp" | "rpp">];

    if (stageData.rows.length === 0) continue;

    if (startY > 160) {
      pdf.addPage();
      startY = 20;
    }

    pdf.setFontSize(13);
    pdf.text(label.title, 14, startY);

    if (stage === "rpp") {
      // --- LOGIKA CETAK KHUSUS RPP (ROWSPAN) UNTUK FULL PDF ---
      const rows = stageData.rows;
      const body: any[] = [];
      const categoryCount: Record<string, number> = {};
      
      rows.forEach((row) => {
        const cat = row.values[0];
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      let currentCategory = "";

      rows.forEach((row) => {
        const tableRow: any[] = [];
        const cat = row.values[0];

        if (cat !== currentCategory) {
          currentCategory = cat;
          tableRow.push({
            content: cat,
            rowSpan: categoryCount[cat],
            styles: { valign: "middle", halign: "center", fontStyle: "bold", fillColor: [240, 240, 240] }
          });
        }
        tableRow.push({ content: row.values[1] || "", styles: { fontStyle: "bold" } });
        tableRow.push({ content: row.values[2] || "" });
        body.push(tableRow);
      });

      autoTable(pdf, {
        startY: startY + 5,
        head: [["Kategori", "Komponen", "Deskripsi"]],
        body: body,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 170] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
        }
      });

    } else {
      // --- LOGIKA CETAK STANDAR UNTUK FULL PDF ---
      autoTable(pdf, {
        startY: startY + 5,
        head: [label.columns],
        body: stageData.rows.map((r) =>
          label.columns.map((_, i) => r.values[i] ?? "")
        ),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 170] },
      });
    }

    // Update startY untuk tabel berikutnya di halaman yang sama
    startY = (pdf as any).lastAutoTable.finalY + 15;
  }

  pdf.save(`Laporan_${doc.mataPelajaran}_Kelas${doc.kelas}.pdf`);
}