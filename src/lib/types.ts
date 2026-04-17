export interface TableRow {
  id: string;
  values: string[];
}

export interface StageData {
  rows: TableRow[];
}

export interface DocumentRecord {
  id: string;
  kelas: string;
  mataPelajaran: string;
  cp: StageData;
  tp: StageData;
  atp: StageData;
  rpp: StageData;
  completedStages: string[];
  createdAt: string;
}

export const KELAS_OPTIONS = ["10", "11", "12"] as const;

export const MATA_PELAJARAN_OPTIONS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah",
  "Geografi",
  "Ekonomi",
  "Sosiologi",
  "Pendidikan Pancasila",
  "Seni Budaya",
  "PJOK",
  "Informatika",
] as const;

export interface StageConfig {
  title: string;
  columns: string[];
}

export const STAGE_LABELS: Record<string, StageConfig> = {
  cp: {
    title: "Capaian Pembelajaran (CP)",
    columns: ["Elemen", "Capaian Pembelajaran", "Kompetensi", "Ruang Lingkup/Materi"],
  },
  tp: {
    title: "Tujuan Pembelajaran (TP)",
    columns: ["Elemen", "Capaian Pembelajaran", "Tujuan Pembelajaran"],
  },
  atp: {
    title: "Alur Tujuan Pembelajaran (ATP)",
    columns: ["Kode", "Tujuan Pembelajaran", "Materi", "Jam Pertemuan", "Tatap Muka", "Dimensi Profil Lulusan"],
  },
  rpp: {
    title: "Rencana Pelaksanaan Pembelajaran (RPP)",
    columns: [
      "Identifikasi — Komponen",
      "Identifikasi — Deskripsi",
      "Desain Pembelajaran — Komponen",
      "Desain Pembelajaran — Deskripsi",
      "Pengalaman Belajar — Komponen",
      "Pengalaman Belajar — Deskripsi",
      "Asesmen Pembelajaran — Komponen",
      "Asesmen Pembelajaran — Deskripsi",
    ],
  },
};

export const STAGES = ["cp", "tp", "atp", "rpp"] as const;

export function createEmptyRow(stageKey: string): TableRow {
  const cols = STAGE_LABELS[stageKey].columns.length;
  return { id: crypto.randomUUID(), values: Array(cols).fill("") };
}
