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
          
          // Helper function to convert Excel date serial number to YYYY-MM-DD
          const convertExcelDate = (rawValue: any, formattedValue: any): string => {
            // PRIORITY 1: Check formatted value first (usually a string like "23/01/2026")
            if (formattedValue !== undefined && formattedValue !== null && formattedValue !== '') {
              const formattedStr = String(formattedValue).trim();
              
              // If it's already in DD/MM/YYYY format, return as-is (will be parsed in convertToGigs)
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(formattedStr)) {
                return formattedStr;
              }
              
              // If it's in YYYY-MM-DD format, return as-is
              if (/^\d{4}-\d{2}-\d{2}$/.test(formattedStr)) {
                return formattedStr;
              }
            }
            
            // PRIORITY 2: If raw value is a number (Excel serial date) - typically between 1 and 1000000
            if (typeof rawValue === 'number' && rawValue > 0 && rawValue < 1000000) {
              // Excel epoch starts on January 1, 1900
              // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
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
            
            // PRIORITY 3: If it's already a Date object
            if (rawValue instanceof Date) {
              // Use UTC methods to avoid timezone conversion
              const year = rawValue.getUTCFullYear();
              const month = String(rawValue.getUTCMonth() + 1).padStart(2, '0');
              const day = String(rawValue.getUTCDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
            
            // PRIORITY 4: Use raw value as string
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
            
            return {
              data: dataCol ? convertExcelDate(rawDateValue, formattedDateValue) : '',
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
      // Parse date - try multiple formats WITHOUT using Date() to avoid timezone issues
      let finalDate = '';
      
      // If already in YYYY-MM-DD format (from Excel conversion)
      if (/^\d{4}-\d{2}-\d{2}$/.test(row.data)) {
        // Use directly without any Date conversion
        finalDate = row.data;
      }
      // Try DD/MM/YYYY format (Brazilian format)
      else if (row.data.includes('/')) {
        const parts = row.data.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].trim();
          
          // Validate numeric values
          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);
          
          // Basic validation
          if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) || 
              dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
            throw new Error(`Data inválida na linha ${index + 2}: "${row.data}". Formato esperado: DD/MM/YYYY`);
          }
          
          // Use Date.UTC only for validation, but keep the original string format
          const testDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
          if (testDate.getUTCFullYear() !== yearNum || 
              testDate.getUTCMonth() !== monthNum - 1 || 
              testDate.getUTCDate() !== dayNum) {
            throw new Error(`Data inválida na linha ${index + 2}: "${row.data}"`);
          }
          
          // Build YYYY-MM-DD directly from parsed components (no Date conversion)
          finalDate = `${year}-${month}-${day}`;
        } else {
          throw new Error(`Data inválida na linha ${index + 2}: "${row.data}". Formato esperado: DD/MM/YYYY`);
        }
      }
      // Try MM/DD/YYYY format (US format)
      else if (row.data.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = row.data.split('/');
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
        
        const testDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
        if (testDate.getUTCFullYear() !== yearNum || 
            testDate.getUTCMonth() !== monthNum - 1 || 
            testDate.getUTCDate() !== dayNum) {
          throw new Error(`Data inválida na linha ${index + 2}: "${row.data}"`);
        }
        
        finalDate = `${year}-${month}-${day}`;
      }
      // Try YYYY-MM-DD format
      else if (/^\d{4}-\d{2}-\d{2}$/.test(row.data.trim())) {
        finalDate = row.data.trim();
      }
      else {
        throw new Error(`Data inválida na linha ${index + 2}: "${row.data}". Formato esperado: DD/MM/YYYY ou YYYY-MM-DD`);
      }
      
      // Final validation - ensure format is correct
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
      
      return {
        user_id: userId,
        title: row.evento || 'Evento sem título',
        date: finalDate,
        location: '',
        value: value,
        status: GigStatus.PENDING,
        band_name: row.banda || '',
        notes: ''
      };
    });
  }
};
