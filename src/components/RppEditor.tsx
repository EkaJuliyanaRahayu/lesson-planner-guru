import { TableRow } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button"; // IMPORT BUTTON
import { Trash2, Plus } from "lucide-react"; // IMPORT IKON TRASH DAN PLUS

interface RppEditorProps {
  rows: TableRow[];
  onChange: (rows: TableRow[]) => void;
}

export default function RppEditor({ rows, onChange }: RppEditorProps) {
  // 1. Kelompokkan data berdasarkan Nama Kategori
  const groupedData = rows.reduce((acc, row) => {
    const category = row.values[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(row);
    return acc;
  }, {} as Record<string, TableRow[]>);

  // 2. Fungsi Mengubah Teks
  const handleValueChange = (rowId: string, colIndex: number, newValue: string) => {
    const updatedRows = rows.map((row) => {
      if (row.id === rowId) {
        const newValues = [...row.values];
        newValues[colIndex] = newValue;
        return { ...row, values: newValues };
      }
      return row;
    });
    onChange(updatedRows);
  };

  // 3. Fungsi Menghapus Baris
  const handleDeleteRow = (rowId: string) => {
    const updatedRows = rows.filter((row) => row.id !== rowId);
    onChange(updatedRows);
  };

  // 4. FUNGSI BARU: Menambah Baris Berdasarkan Kategori
  const handleAddRow = (categoryName: string) => {
    const newRow: TableRow = {
      id: crypto.randomUUID(),
      // Format array: [Nama Kategori, Nama Komponen Kosong, Deskripsi Kosong]
      values: [categoryName, "", ""], 
    };
    
    // Cari index terakhir dari kategori ini di dalam array utama untuk menyisipkan baris baru
    const lastIndex = rows.map(r => r.values[0]).lastIndexOf(categoryName);
    
    // Buat salinan array data
    const updatedRows = [...rows];
    // Sisipkan baris baru tepat setelah baris terakhir dari kategori tersebut
    if (lastIndex !== -1) {
      updatedRows.splice(lastIndex + 1, 0, newRow);
    } else {
      // Jika kategorinya kosong (semua terhapus), push ke paling bawah
      updatedRows.push(newRow);
    }
    
    onChange(updatedRows);
  };

  return (
    <div className="border border-border rounded-md overflow-hidden flex flex-col bg-card text-sm">
      {Object.entries(groupedData).map(([category, items]) => (
        <div key={category} className="flex border-b border-border last:border-b-0 flex-col md:flex-row">
          
          {/* Kolom Kiri: Nama Kategori */}
          <div className="md:w-[20%] bg-muted/30 p-4 font-bold md:border-r border-b md:border-b-0 border-border flex items-center justify-center text-center tracking-wider text-xs md:text-sm uppercase">
            {category}
          </div>

          {/* Kolom Kanan: Daftar Komponen, Input Area, dan Tombol Tambah */}
          <div className="md:w-[80%] flex flex-col">
            
            {/* Render semua baris yang ada di kategori ini */}
            {items.map((item) => (
              <div key={item.id} className="flex border-b border-border flex-col md:flex-row group bg-background">
                
                {/* Nama Komponen */}
                <div className="md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col justify-start relative">
                  
                  <button
                    onClick={() => handleDeleteRow(item.id)}
                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                    title="Hapus komponen ini"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <Textarea
                    className="min-h-[60px] pr-8 resize-y w-full font-semibold focus-visible:ring-1 bg-transparent border-transparent hover:border-input focus:border-input transition-colors shadow-none"
                    value={item.values[1]}
                    onChange={(e) => handleValueChange(item.id, 1, e.target.value)}
                    placeholder="Nama komponen..."
                  />
                </div>
                
                {/* Deskripsi */}
                <div className="md:w-2/3 p-4">
                  <Textarea
                    className="min-h-[100px] resize-y w-full focus-visible:ring-1 bg-transparent border-muted"
                    value={item.values[2]}
                    onChange={(e) => handleValueChange(item.id, 2, e.target.value)}
                    placeholder={item.values[1] ? `Isi detail untuk ${item.values[1]}...` : "Isi detail..."}
                  />
                </div>
                
              </div>
            ))}

            {/* FUNGSI BARU: Tombol Tambah Baris di Bawah Kategori */}
            <div className="p-3 bg-muted/10 flex justify-start">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleAddRow(category)}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Komponen di {category}
              </Button>
            </div>

          </div>

        </div>
      ))}
    </div>
  );
}