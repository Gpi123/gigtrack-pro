// @ts-ignore - xlsx types may not be perfect
import * as XLSX from 'xlsx';
import { Gig, GigStatus } from '../types';

export interface ImportRow {
  data: string;
  banda: string;
  evento: string;
  valor?: string;
}

export const importService = {
  // Parse Excel/CSV file
  parseFile: async (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: false });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Get raw values to detect Excel serial dates
          const jsonDataRaw = XLSX.utils.sheet_to_json(firstSheet, { raw: true, defval: '' }) as any[];
          const jsonDataFormatted = XLSX.utils.sheet_to_json(firstSheet, { raw: false, defval: '' }) as any[];
          
          // Helper function to normalize date string formats
          const normalizeDateString = (dateStr: string): string => {
            // Handle D/M/YY or DD/MM/YY format (2-digit year)
            const matchYY = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
            if (matchYY) {
              const [, day, month, year] = matchYY;
              // Convert 2-digit year to 4-digit (assume 2000s for years < 50, 1900s for >= 50)
              const fullYear = parseInt(year, 10) < 50 ? `20${year}` : `19${year}`;
              return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`;
            }
            
            // Handle D/M/YYYY or DD/MM/YYYY format (already 4-digit year)
            const matchYYYY = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (matchYYYY) {
              const [, day, month, year] = matchYYYY;
              return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
            
            return dateStr;
          };

          // Helper function to convert Excel date - PRIORITIZE serial number for accuracy
          const convertExcelDate = (rawValue: any, formattedValue: any): string => {
            // PRIORITY 1: If raw value is a number (Excel serial date) - MOST ACCURATE
            if (typeof rawValue === 'number' && rawValue > 0 && rawValue < 1000000) {
              // Convert Excel serial number directly without timezone issues
              // Excel epoch: January 1, 1900 = serial 1
              // But Excel incorrectly treats 1900 as leap year, so adjust
              const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Dec 30, 1899 UTC
              let date = new Date(excelEpoch.getTime() + rawValue * 24 * 60 * 60 * 1000);
              
              // Adjust for Excel's leap year bug (1900 is not a leap year)
              if (rawValue >= 60) {
                date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
              }
              
              // Use UTC methods to avoid timezone conversion
              const year = date.getUTCFullYear();
              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
              const day = String(date.getUTCDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
            
            // PRIORITY 2: Use formatted value if available, but normalize it
            if (formattedValue !== undefined && formattedValue !== null && formattedValue !== '') {
              const formattedStr = String(formattedValue).trim();
              
              // Normalize date string formats (D/M/YY -> DD/MM/YYYY, etc)
              const normalized = normalizeDateString(formattedStr);
              
              // If it's now in DD/MM/YYYY format, return as-is
              if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
                return normalized;
              }
              
              // If it's in YYYY-MM-DD format, return as-is
              if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
                return normalized;
              }
              
              return normalized;
            }
            
            // PRIORITY 3: Use raw value as string and normalize
            const dateString = String(rawValue).trim();
            const normalized = normalizeDateString(dateString);
            
            return normalized;
          };
          
          // Normalize column names (case insensitive, remove accents)
          const normalizeColumn = (col: string) => {
            return col.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim();
          };
          
          const rows: ImportRow[] = jsonDataRaw.map((rowRaw: any, index: number) => {
            const rowFormatted = jsonDataFormatted[index] || {};
            
            // Find columns by normalized names
            const dataCol = Object.keys(rowRaw).find(k => 
              normalizeColumn(k).includes('data') || normalizeColumn(k).includes('date')
            );
            const bandaCol = Object.keys(rowRaw).find(k => 
              normalizeColumn(k).includes('banda') || normalizeColumn(k).includes('band')
            );
            const eventoCol = Object.keys(rowRaw).find(k => 
              normalizeColumn(k).includes('evento') || normalizeColumn(k).includes('event')
            );
            const valorCol = Object.keys(rowRaw).find(k => 
              normalizeColumn(k).includes('valor') || normalizeColumn(k).includes('value') || 
              normalizeColumn(k).includes('preco') || normalizeColumn(k).includes('price') ||
              normalizeColumn(k).includes('cache') || normalizeColumn(k).includes('cachê')
            );
            
            // Get raw and formatted values for date column
            const rawDateValue = dataCol ? rowRaw[dataCol] : null;
            const formattedDateValue = dataCol ? rowFormatted[dataCol] : null;
            
            // Parse value - try to extract number from string or use raw number
            let valorStr = '';
            if (valorCol) {
              const rawValor = rowRaw[valorCol];
              const formattedValor = rowFormatted[valorCol];
              
              if (typeof rawValor === 'number') {
                valorStr = rawValor.toString();
              } else if (formattedValor) {
                // Remove currency symbols and spaces, keep only numbers and decimal separator
                valorStr = String(formattedValor).replace(/[^\d,.-]/g, '').replace(',', '.');
              } else if (rawValor) {
                valorStr = String(rawValor).replace(/[^\d,.-]/g, '').replace(',', '.');
              }
            }
            
            const dateResult = dataCol ? convertExcelDate(rawDateValue, formattedDateValue) : '';
            
            // Debug log - remove after fixing
            if (dateResult && index < 3) {
              console.log(`Row ${index + 2}: rawValue=${rawDateValue}, formattedValue=${formattedDateValue}, result=${dateResult}`);
            }
            
            return {
              data: dateResult,
              banda: bandaCol ? String(rowRaw[bandaCol] || '').trim() : '',
              evento: eventoCol ? String(rowRaw[eventoCol] || '').trim() : '',
              valor: valorStr
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
    return rows.map((row, index) => {
      // Parse date - SIMPLE AND DIRECT: just parse the string, no Date() conversion
      let finalDate = '';
      
      const dateStr = row.data.trim();
      
      // If already in YYYY-MM-DD format, use directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        finalDate = dateStr;
      }
      // Parse DD/MM/YYYY or D/M/YYYY format (Brazilian format - MOST COMMON)
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const day = parts[0].padStart(2, '0');   // Day comes first
        const month = parts[1].padStart(2, '0');   // Month comes second
        const year = parts[2].trim();              // Year comes third
        
        // Validate
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) || 
            dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
          throw new Error(`Data inválida na linha ${index + 2}: "${row.data}"`);
        }
        
        // Validate day based on month
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
        const maxDay = monthNum === 2 && isLeapYear ? 29 : daysInMonth[monthNum - 1];
        
        if (dayNum > maxDay) {
          throw new Error(`Data inválida na linha ${index + 2}: "${row.data}"`);
        }
        
          // Build YYYY-MM-DD directly - NO Date() conversion, just string manipulation
          finalDate = `${year}-${month}-${day}`;
          
          // Debug log - remove after fixing
          if (index < 3) {
            console.log(`convertToGigs Row ${index + 2}: input="${row.data}", output="${finalDate}"`);
          }
      }
      // Try MM/DD/YYYY format (US format)
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2].trim();
        
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        const yearNum = parseInt(year, 10);
        
        if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) || 
            dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
          throw new Error(`Data inválida na linha ${index + 2}: "${row.data}"`);
        }
        
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
        const maxDay = monthNum === 2 && isLeapYear ? 29 : daysInMonth[monthNum - 1];
        
        if (dayNum > maxDay) {
          throw new Error(`Data inválida na linha ${index + 2}: "${row.data}"`);
        }
        
        finalDate = `${year}-${month}-${day}`;
      }
      else {
        throw new Error(`Data inválida na linha ${index + 2}: "${row.data}". Formato esperado: DD/MM/YYYY ou YYYY-MM-DD`);
      }
      
      // Final validation
      if (!finalDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
        throw new Error(`Data inválida na linha ${index + 2}: "${row.data}". Formato esperado: DD/MM/YYYY ou YYYY-MM-DD`);
      }
      
      // Parse value
      let value = 0;
      if (row.valor && row.valor.trim()) {
        const parsedValue = parseFloat(row.valor);
        if (!isNaN(parsedValue) && parsedValue > 0) {
          value = parsedValue;
        }
      }
      
      // Ensure date is in correct format (YYYY-MM-DD) - no timezone conversion
      const gigDate = finalDate; // Already validated as YYYY-MM-DD
      
      return {
        user_id: userId,
        title: row.evento || 'Evento sem título',
        date: gigDate, // Send as string directly to Supabase
        location: '',
        value: value,
        status: GigStatus.PENDING,
        band_name: row.banda || '',
        notes: ''
      };
    });
  }
};
