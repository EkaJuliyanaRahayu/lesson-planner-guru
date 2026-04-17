import { useNavigate } from "react-router-dom";
import { FilePlus, FileText, Trash2, Download, BookOpen, ChevronDown, Eye, Search, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocuments, deleteDocument } from "@/lib/storage";
import { generateFullPDF, generateStagePDF } from "@/lib/pdf";
import { STAGE_LABELS, STAGES, DocumentRecord } from "@/lib/types";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function StagePreview({ doc, stage }: { doc: DocumentRecord; stage: typeof STAGES[number] }) {
  const label = STAGE_LABELS[stage];
  const data = doc[stage];

  if (data.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4 text-center">Belum ada data</p>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {label.columns.map((c, i) => (
              <TableHead key={i} className="text-xs font-semibold">{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row) => (
            <TableRow key={row.id}>
              {label.columns.map((_, i) => (
                <TableCell key={i} className="text-xs py-2">{row.values?.[i] ?? ""}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DocCard({ doc, onDelete }: { doc: DocumentRecord; onDelete: (id: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{doc.mataPelajaran}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded">
              Kelas {doc.kelas}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc.id)}
              className="text-destructive hover:text-destructive h-7 w-7 p-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {new Date(doc.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Stage badges */}
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((stage) => (
            <span
              key={stage}
              className={`text-xs px-2 py-1 rounded font-medium ${
                doc.completedStages.includes(stage)
                  ? "bg-step-completed/15 text-step-completed"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stage.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Preview toggle */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-3 w-3 mr-1.5" />
          {showPreview ? "Sembunyikan Isi" : "Lihat Isi Dokumen"}
        </Button>

        {/* Full document preview - all stages */}
        {showPreview && (
          <div className="space-y-4 bg-card border border-border rounded-lg p-4">
            {/* Document header */}
            <div className="text-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Laporan Pembelajaran</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {doc.mataPelajaran} — Kelas {doc.kelas}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* All stages rendered sequentially */}
            {STAGES.map((stage) => {
              const label = STAGE_LABELS[stage];
              const hasData = doc[stage].rows.length > 0;
              return (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary">{label.title}</h4>
                    {hasData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => generateStagePDF(doc, stage)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Unduh
                      </Button>
                    )}
                  </div>
                  <StagePreview doc={doc} stage={stage} />
                </div>
              );
            })}
          </div>
        )}


        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => generateFullPDF(doc)}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Unduh Semua
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState(getDocuments());
  const [search, setSearch] = useState("");

  const handleDelete = (id: string) => {
    deleteDocument(id);
    setDocs(getDocuments());
    toast.success("Dokumen dihapus");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.mataPelajaran.toLowerCase().includes(q) ||
        d.kelas.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, DocumentRecord[]>> = {};
    for (const doc of filteredDocs) {
      if (!map[doc.kelas]) map[doc.kelas] = {};
      if (!map[doc.kelas][doc.mataPelajaran]) map[doc.kelas][doc.mataPelajaran] = [];
      map[doc.kelas][doc.mataPelajaran].push(doc);
    }
    return map;
  }, [filteredDocs]);

  const sortedKelas = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistem Pembelajaran</h1>
              <p className="text-sm text-muted-foreground">Generate CP, TP, ATP & RPP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/generate")}>
              <FilePlus className="h-4 w-4 mr-2" /> Generate Baru
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Profil">
              <UserCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata pelajaran atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredDocs.length === 0 && docs.length > 0 ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Tidak Ditemukan</h2>
            <p className="text-muted-foreground">Tidak ada dokumen yang cocok dengan "{search}"</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Belum Ada Dokumen</h2>
            <p className="text-muted-foreground mb-6">Mulai dengan membuat dokumen pembelajaran baru</p>
            <Button onClick={() => navigate("/generate")}>
              <FilePlus className="h-4 w-4 mr-2" /> Generate Baru
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
              Dokumen Tersimpan ({filteredDocs.length})
            </h2>

            {sortedKelas.map((kelas) => (
              <Collapsible key={kelas} defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                  <h3 className="text-base font-semibold text-foreground">Kelas {kelas}</h3>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Object.keys(grouped[kelas]).length} mata pelajaran)
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 pl-7">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.keys(grouped[kelas]).sort().flatMap((mapel) =>
                      grouped[kelas][mapel].map((doc) => (
                        <DocCard key={doc.id} doc={doc} onDelete={handleDelete} />
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
