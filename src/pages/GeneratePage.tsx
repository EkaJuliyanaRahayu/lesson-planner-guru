import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TableEditor from "@/components/TableEditor";
import StepIndicator from "@/components/StepIndicator";
import UploadSection from "@/components/UploadSection";
import { DocumentRecord, STAGES, STAGE_LABELS, KELAS_OPTIONS, MATA_PELAJARAN_OPTIONS, StageData, TableRow } from "@/lib/types";
import { saveDocument } from "@/lib/storage";
import { generateStagePDF, generateFullPDF } from "@/lib/pdf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import RppEditor from "@/components/RppEditor";


const emptyStage = (): StageData => ({ rows: [] });

// 4 section × (Komponen, Deskripsi) = 8 kolom.
// Tiap entri: [namaKomponen, deskripsiDefault]. Deskripsi default berisi placeholder
// + contoh kecil agar mudah diedit guru.
const DPL_CHECKLIST = [
  "[ ] Beriman & Bertakwa kepada Tuhan YME",
  "[ ] Berkebinekaan Global",
  "[ ] Bergotong Royong",
  "[ ] Mandiri",
  "[ ] Bernalar Kritis",
  "[ ] Kreatif",
  "[ ] Berintegritas",
  "[ ] Sehat Jasmani & Rohani",
].join("\n");

const PERTEMUAN_TEMPLATE = (n: number) =>
  `Pertemuan ke-${n}\n` +
  `• AWAL: isi di sini… (contoh: salam, doa, apersepsi, penyampaian tujuan)\n` +
  `• INTI — Memahami: isi di sini… (contoh: peserta didik mengamati video/demonstrasi)\n` +
  `• INTI — Mengaplikasikan: isi di sini… (contoh: praktik kelompok / studi kasus)\n` +
  `• INTI — Merefleksikan: isi di sini… (contoh: diskusi hasil, tanya-jawab makna)\n` +
  `• PENUTUP: isi di sini… (contoh: kesimpulan, refleksi, penugasan)\n` +
  `\nPrinsip Pembelajaran Mendalam:\n` +
  `- Berkesadaran: isi di sini…\n` +
  `- Bermakna: isi di sini…\n` +
  `- Menggembirakan: isi di sini…`;

const RPP_SECTIONS_FLAT = [
  { kategori: "IDENTIFIKASI", komponen: "Murid (berdasarkan pre-test)", deskripsi: "Hasil pre-test: isi di sini...\nLink instrumen: https://..." },
  { kategori: "IDENTIFIKASI", komponen: "Materi Pelajaran", deskripsi: "isi di sini... (contoh: Sistem Rem Hidrolik)" },
  { kategori: "IDENTIFIKASI", komponen: "Dimensi Profil Lulusan (DPL)", deskripsi: `Centang yang relevan:\n${DPL_CHECKLIST}` },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Capaian Pembelajaran", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Lintas Disiplin Ilmu", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Tujuan Pembelajaran", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Topik Pembelajaran", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Praktik Pedagogis", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Kemitraan Pembelajaran", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Lingkungan Pembelajaran", deskripsi: "isi di sini..." },
  { kategori: "DESAIN PEMBELAJARAN", komponen: "Pemanfaatan Digital", deskripsi: "isi di sini..." },
  { kategori: "PENGALAMAN BELAJAR", komponen: "Pertemuan 1", deskripsi: PERTEMUAN_TEMPLATE(1) },
  { kategori: "PENGALAMAN BELAJAR", komponen: "Pertemuan 2", deskripsi: PERTEMUAN_TEMPLATE(2) },
  { kategori: "PENGALAMAN BELAJAR", komponen: "Pertemuan 3", deskripsi: PERTEMUAN_TEMPLATE(3) },
  { kategori: "ASESMEN PEMBELAJARAN", komponen: "Asesmen Awal (As Learning)", deskripsi: "isi di sini..." },
  { kategori: "ASESMEN PEMBELAJARAN", komponen: "Asesmen Proses (For Learning)", deskripsi: "isi di sini..." },
  { kategori: "ASESMEN PEMBELAJARAN", komponen: "Asesmen Akhir (Of Learning)", deskripsi: "isi di sini..." },
];

const buildRppTemplate = (): StageData => {
  const rows = RPP_SECTIONS_FLAT.map((item) => ({
    id: crypto.randomUUID(),
    values: [item.kategori, item.komponen, item.deskripsi]
  }));
  return { rows };
};

export default function GeneratePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"select" | "form">("select");
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  const [currentStage, setCurrentStage] = useState(0);
  const [doc, setDoc] = useState<DocumentRecord | null>(null);

  const startGenerate = () => {
    if (!kelas || !mapel) {
      toast.error("Pilih kelas dan mata pelajaran terlebih dahulu");
      return;
    }
    const newDoc: DocumentRecord = {
      id: crypto.randomUUID(),
      kelas,
      mataPelajaran: mapel,
      cp: emptyStage(),
      tp: emptyStage(),
      atp: emptyStage(),
      rpp: emptyStage(),
      completedStages: [],
      createdAt: new Date().toISOString(),
    };
    setDoc(newDoc);
    setCurrentStage(0);
    setStep("form");
  };

  const currentStageKey = STAGES[currentStage];
  const stageLabel = STAGE_LABELS[currentStageKey];

  // Prefill RPP with template the first time user lands on it
  useEffect(() => {
    if (!doc) return;
    if (currentStageKey === "rpp" && doc.rpp.rows.length === 0) {
      setDoc({ ...doc, rpp: buildRppTemplate() });
    }
  }, [currentStageKey, doc]);

  const updateStageData = (rows: TableRow[]) => {
    if (!doc) return;
    setDoc({ ...doc, [currentStageKey]: { rows } });
  };

  const downloadStage = () => {
    if (!doc) return;
    generateStagePDF(doc, currentStageKey);
    toast.success(`${stageLabel.title} berhasil diunduh`);
  };

  const saveAndNext = () => {
    if (!doc) return;
    const stageData = doc[currentStageKey as keyof Pick<DocumentRecord, "cp" | "tp" | "atp" | "rpp">];
    if (stageData.rows.length === 0) {
      toast.error("Tambahkan minimal 1 baris data");
      return;
    }
    const updated = {
      ...doc,
      completedStages: [...new Set([...doc.completedStages, currentStageKey])],
    };
    setDoc(updated);
    saveDocument(updated);

    if (currentStage < STAGES.length - 1) {
      setCurrentStage(currentStage + 1);
      toast.success(`${stageLabel.title} tersimpan`);
    } else {
      toast.success("Semua tahap selesai!");
      navigate("/");
    }
  };

  if (step === "select") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Generate Dokumen Pembelajaran</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-10 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Kelas & Mata Pelajaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Kelas</label>
                <Select value={kelas} onValueChange={setKelas}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {KELAS_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>Kelas {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mata Pelajaran</label>
                <Select value={mapel} onValueChange={setMapel}>
                  <SelectTrigger><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
                  <SelectContent>
                    {MATA_PELAJARAN_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" size="lg" onClick={startGenerate}>
                Mulai Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setStep("select")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Kelas {kelas} — {mapel}</h1>
              <p className="text-sm text-muted-foreground">{stageLabel.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STAGES.map((s) => {
              const hasData = doc?.[s as keyof Pick<DocumentRecord, "cp" | "tp" | "atp" | "rpp">]?.rows.length > 0;
              return (
                <Button
                  key={s}
                  variant={s === currentStageKey ? "default" : "outline"}
                  size="sm"
                  disabled={!hasData}
                  onClick={() => { if (doc) { generateStagePDF(doc, s); toast.success(`${STAGE_LABELS[s].title} berhasil diunduh`); } }}
                >
                  <Download className="h-4 w-4 mr-1" /> {s.toUpperCase()}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <StepIndicator currentStage={currentStage} completedStages={doc?.completedStages || []} />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{stageLabel.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStageKey === "rpp" ? (
              <RppEditor 
                rows={doc?.[currentStageKey]?.rows || []} 
                onChange={updateStageData} 
              />
            ) : (
              <TableEditor
                columns={stageLabel.columns}
                rows={doc?.[currentStageKey as keyof Pick<DocumentRecord, "cp" | "tp" | "atp">]?.rows || []}
                onChange={updateStageData}
              />
            )}
        </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentStage === 0}
            onClick={() => setCurrentStage(currentStage - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Sebelumnya
          </Button>
          <Button onClick={saveAndNext}>
            {currentStage < STAGES.length - 1 ? (
              <>
                Simpan & Lanjut <ArrowRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" /> Selesai
              </>
            )}
          </Button>
        </div>

        {doc && doc.completedStages.length === STAGES.length && (
          <div className="mt-8">
            <UploadSection kelas={kelas} mataPelajaran={mapel} />
          </div>
        )}
      </div>
    </div>
  );
}
