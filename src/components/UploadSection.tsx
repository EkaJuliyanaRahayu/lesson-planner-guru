import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UploadedFile {
  name: string;
  size: number;
  stage: string;
}

interface UploadSectionProps {
  kelas: string;
  mataPelajaran: string;
}

export default function UploadSection({ kelas, mataPelajaran }: UploadSectionProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, stage: string) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size,
      stage,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const stages = ["CP", "TP", "ATP", "RPP"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Dokumen — Kelas {kelas} / {mataPelajaran}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stages.map((stage) => (
            <label
              key={stage}
              className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Upload {stage}</span>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleUpload(e, stage)} multiple />
            </label>
          ))}
        </div>

        {files.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">File Terupload</h4>
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{file.stage}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(i)} className="h-7 w-7">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
