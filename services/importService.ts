// @ts-ignore - xlsx types may not be perfect
import * as XLSX from 'xlsx';
import { Gig, GigStatus } from '../types';

export interface ImportRow {
  data: string;
  banda: string;
  evento: string;
}

export const importService = {
  // Parse Excel/CSV file
  parseFile: async (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
          
          // Normalize column names (case insensitive, remove accents)
          const normalizeColumn = (col: string) => {
            return col.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim();
          };
          
          const rows: ImportRow[] = jsonData.map((row: any) => {
            // Find columns by normalized names
            const dataCol = Object.keys(row).find(k => 
              normalizeColumn(k).includes('data') || normalizeColumn(k).includes('date')
            );
            const bandaCol = Object.keys(row).find(k => 
              normalizeColumn(k).includes('banda') || normalizeColumn(k).includes('band')
            );
            const eventoCol = Object.keys(row).find(k => 
              normalizeColumn(k).includes('evento') || normalizeColumn(k).includes('event')
            );
            
            return {
              data: dataCol ? String(row[dataCol] || '').trim() : '',
              banda: bandaCol ? String(row[bandaCol] || '').trim() : '',
              evento: eventoCol ? String(row[eventoCol] || '').trim() : ''
            };
          }).filter(row => row.data && row.evento); // Filter empty rows
          
          resolve(rows);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo. Verifique se o formato está correto.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  },

  // Convert import rows to Gig objects
  convertToGigs: (rows: ImportRow[], userId: string): Omit<Gig, 'id'>[] => {
    return rows.map(row => {
      // Parse date - try multiple formats
      let dateStr = '';
      
      // Try DD/MM/YYYY format
      if (row.data.includes('/')) {
        const parts = row.data.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          dateStr = `${year}-${month}-${day}`;
        }
      } else {
        // Try YYYY-MM-DD format
        dateStr = row.data;
      }
      
      // Validate date
      if (!dateStr || isNaN(Date.parse(dateStr))) {
        throw new Error(`Data inválida: ${row.data}`);
      }
      
      return {
        user_id: userId,
        title: row.evento || 'Evento sem título',
        date: dateStr,
        location: '',
        value: 0,
        status: GigStatus.PENDING,
        band_name: row.banda || '',
        notes: ''
      };
    });
  }
};
