import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import ExcelJS from 'exceljs';

function getCellValue(cell: any): string {
  if (!cell) return '';
  if (typeof cell.value === 'object' && cell.value !== null) {
    if ('text' in cell.value) return String(cell.value.text).trim();
    if ('result' in cell.value) return String(cell.value.result).trim();
    return JSON.stringify(cell.value);
  }
  return String(cell.value || '').trim();
}

// Simple split that handles comma in double quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const facultyId = formData.get('facultyId') as string;
    const isPreview = formData.get('preview') === 'true'; // If true, only return preview validation

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!facultyId) {
      return NextResponse.json({ error: 'Please select a faculty advisor to assign these students to' }, { status: 400 });
    }

    // Verify faculty advisor exists
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return NextResponse.json({ error: 'Selected faculty advisor does not exist' }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    
    let rawRows: string[][] = [];

    // Parse Excel or CSV
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return NextResponse.json({ error: 'Uploaded Excel sheet is empty' }, { status: 400 });
      }

      worksheet.eachRow((row) => {
        const rowCells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowCells.push(getCellValue(cell));
        });
        rawRows.push(rowCells);
      });
    } else if (fileName.endsWith('.csv')) {
      const csvContent = buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/);
      rawRows = lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => parseCSVLine(line));
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload .xlsx, .xls, or .csv' }, { status: 400 });
    }

    if (rawRows.length <= 1) {
      return NextResponse.json({ error: 'File contains no data rows (only header or empty)' }, { status: 400 });
    }

    // Identify header indexes
    const headers = rawRows[0].map(h => h.toLowerCase().trim());
    
    // Find index for roll number, name, email, batch
    const rollIdx = headers.findIndex(h => h.includes('roll') || h.includes('number') || h.includes('id'));
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const batchIdx = headers.findIndex(h => h.includes('batch') || h.includes('class') || h.includes('year'));

    if (rollIdx === -1 || nameIdx === -1 || emailIdx === -1 || batchIdx === -1) {
      return NextResponse.json({ 
        error: `Invalid file headers. Could not identify all required columns. File must contain columns for: Roll Number, Name, Email, Batch. Detected columns: ${rawRows[0].join(', ')}` 
      }, { status: 400 });
    }

    const parsedRows = rawRows.slice(1);
    const validatedStudents: any[] = [];
    const errors: { row: number; details: string }[] = [];
    
    // Set to track duplicates inside the sheet itself
    const sheetRollNumbers = new Set<string>();
    const sheetEmails = new Set<string>();

    // Query existing students in database for collision checks
    const dbStudents = await prisma.student.findMany({
      select: { rollNumber: true, email: true }
    });
    const dbRollNumbers = new Set(dbStudents.map(s => s.rollNumber.toLowerCase()));
    const dbEmails = new Set(dbStudents.map(s => s.email.toLowerCase()));

    for (let i = 0; i < parsedRows.length; i++) {
      const rowNum = i + 2; // Header is row 1, 0-indexed is +2
      const row = parsedRows[i];

      // Pad row if columns are missing in some rows
      const rollNumber = (row[rollIdx] || '').trim();
      const name = (row[nameIdx] || '').trim();
      const email = (row[emailIdx] || '').trim();
      const batch = (row[batchIdx] || '').trim();

      const rowErrors: string[] = [];

      // Validations
      if (!rollNumber) rowErrors.push('Missing Roll Number');
      if (!name) rowErrors.push('Missing Name');
      if (!email) {
        rowErrors.push('Missing Email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push('Invalid Email Format');
      }
      if (!batch) rowErrors.push('Missing Batch');

      // Collisions within the spreadsheet
      if (rollNumber) {
        const lowerRoll = rollNumber.toLowerCase();
        if (sheetRollNumbers.has(lowerRoll)) {
          rowErrors.push(`Duplicate Roll Number in spreadsheet: ${rollNumber}`);
        } else {
          sheetRollNumbers.add(lowerRoll);
        }

        // Collision with DB
        if (dbRollNumbers.has(lowerRoll)) {
          rowErrors.push(`Roll Number already exists in database: ${rollNumber}`);
        }
      }

      if (email) {
        const lowerEmail = email.toLowerCase();
        if (sheetEmails.has(lowerEmail)) {
          rowErrors.push(`Duplicate Email in spreadsheet: ${email}`);
        } else {
          sheetEmails.add(lowerEmail);
        }

        // Collision with DB
        if (dbEmails.has(lowerEmail)) {
          rowErrors.push(`Email already exists in database: ${email}`);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          details: rowErrors.join(', '),
        });
      } else {
        validatedStudents.push({
          rollNumber,
          name,
          email,
          batch,
          facultyId,
        });
      }
    }

    if (isPreview) {
      return NextResponse.json({
        totalRows: parsedRows.length,
        validCount: validatedStudents.length,
        invalidCount: errors.length,
        previewData: validatedStudents.slice(0, 10), // return first 10 valid records for display
        errors,
      });
    }

    // Save mode (bulk insert)
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot save because the file contains validation errors. Please preview and fix all errors first.', 
        errors 
      }, { status: 400 });
    }

    if (validatedStudents.length === 0) {
      return NextResponse.json({ error: 'No valid student records found to import' }, { status: 400 });
    }

    // Perform bulk insertion in a transaction
    const result = await prisma.$transaction(
      validatedStudents.map(student => 
        prisma.student.create({
          data: student
        })
      )
    );

    // Seed default AttendanceRisk (Green/Low Risk) for newly uploaded students
    await prisma.$transaction(
      result.map(student =>
        prisma.attendanceRisk.create({
          data: {
            studentId: student.id,
            riskScore: 0.0,
            riskLevel: 'Green',
            prediction: 'New student account. No attendance history recorded yet.',
            recommendation: 'Mark attendance to begin AI risk monitoring.'
          }
        })
      )
    );

    return NextResponse.json({
      message: `Successfully imported ${result.length} students.`,
      count: result.length,
    });
  } catch (error) {
    console.error('Error uploading students:', error);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}
