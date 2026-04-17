import { DocumentRecord } from "./types";

const STORAGE_KEY = "pembelajaran-documents";

export function getDocuments(): DocumentRecord[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const docs: DocumentRecord[] = JSON.parse(data);
    for (const doc of docs) {
      for (const stage of ["cp", "tp", "atp", "rpp"] as const) {
        if (!doc[stage] || !Array.isArray(doc[stage]?.rows)) {
          doc[stage] = { rows: [] };
          continue;
        }
        doc[stage].rows = doc[stage].rows.map((r: any) => {
          if (Array.isArray(r.values)) return r;
          const values = [r.col1 ?? "", r.col2 ?? "", r.col3 ?? "", r.col4 ?? ""];
          return { id: r.id ?? crypto.randomUUID(), values };
        });
      }
    }
    return docs;
  } catch {
    return [];
  }
}

export function saveDocument(doc: DocumentRecord) {
  const docs = getDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    docs[idx] = doc;
  } else {
    docs.push(doc);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function deleteDocument(id: string) {
  const docs = getDocuments().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}
