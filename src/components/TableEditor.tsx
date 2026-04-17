import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TableRow } from "@/lib/types";

interface TableEditorProps {
  columns: string[];
  rows: TableRow[];
  onChange: (rows: TableRow[]) => void;
}

export default function TableEditor({ columns, rows, onChange }: TableEditorProps) {
  const addRow = () => {
    onChange([
      ...rows,
      { id: crypto.randomUUID(), values: Array(columns.length).fill("") },
    ]);
  };

  const deleteRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, colIdx: number, value: string) => {
    onChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        // ensure values array length matches columns
        const values = [...r.values];
        while (values.length < columns.length) values.push("");
        values[colIdx] = value;
        return { ...r, values };
      })
    );
  };

  const minWidth = Math.max(800, columns.length * 180);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" style={{ minWidth: `${minWidth}px` }}>
          <thead>
            <tr className="bg-primary text-primary-foreground">
              {columns.map((label, i) => (
                <th key={i} className="px-3 py-3 text-left font-medium">
                  {label}
                </th>
              ))}
              <th className="px-3 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Belum ada data. Klik tombol "Tambah Baris" untuk menambahkan.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                {columns.map((label, ci) => (
                  <td key={ci} className="px-2 py-2 align-top">
                    <Textarea
                      value={row.values[ci] ?? ""}
                      onChange={(e) => updateRow(row.id, ci, e.target.value)}
                      placeholder={`${label}...`}
                      className="border-border min-h-[60px] resize-y"
                    />
                  </td>
                ))}
                <td className="px-2 py-2 align-top">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(row.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4 mr-1" /> Tambah Baris
      </Button>
    </div>
  );
}
