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
          
          // Helper function to convert Excel date - ALWAYS prioritize formatted string
          const convertExcelDate = (rawValue: any, formattedValue: any): string => {
            // PRIORITY 1: ALWAYS use formatted value if available (Excel's display format)
            if (formattedValue !== undefined && formattedValue !== null && formattedValue !== '') {
              const formattedStr = String(formattedValue).trim();
              
              // If it's in DD/MM/YYYY format, return as-is (most common case)
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(formattedStr)) {
                return formattedStr;
              }
              
              // If it's in YYYY-MM-DD format, return as-is
              if (/^\d{4}-\d{2}-\d{2}$/.test(formattedStr)) {
                return formattedStr;
              }
              
              // Try to parse other formats
              return formattedStr;
            }
            
            // PRIORITY 2: If raw value is a number (Excel serial date)
            if (typeof rawValue === 'number' && rawValue > 0 && rawValue < 1000000) {
              // Convert Excel serial number directly without timezone issues
              // Excel epoch: January 1, 1900 = serial 1
              // But Excel incorrectly treats 1900 as leap year, so adjust
              const excelEpochDays = 25569; // Days between 1900-01-01 and 1970-01-01 (accounting for Excel bug)
              const daysSince1900 = rawValue - 1; // Excel serial starts at 1, not 0
              const totalDays = excelEpochDays + daysSince1900;
              
              // Adjust for Excel's leap year bug (1900 is not a leap year)
              if (rawValue >= 60) {
                // Subtract 1 day for dates after Feb 28, 1900
                const adjustedDays = totalDays - 1;
                const date = new Date(adjustedDays * 24 * 60 * 60 * 1000);
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              } else {
                const date = new Date(totalDays * 24 * 60 * 60 * 1000);
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              }
            }
            
            // PRIORITY 3: Use raw value as string
            const dateString = String(rawValue).trim();
            
            // If it's already in DD/MM/YYYY format, return as-is
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
              return dateString;
            }
            
            // If it's in YYYY-MM-DD format, return as-is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
              return dateString;
            }
            
            return dateString;
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
      // Parse DD/MM/YYYY format (Brazilian format - MOST COMMON)
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
