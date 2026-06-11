import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const batchParam = searchParams.get('batch') || '';
    const studentIdParam = searchParams.get('studentId') || '';
    const format = searchParams.get('export') || 'json'; // json, excel, csv

    // Default dates: last 30 days if not specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    // End date should extend to end of day
    endDate.setHours(23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // 1. Query students based on role and filters
    const studentsWhere: any = {};
    if (session.role === 'faculty') {
      studentsWhere.facultyId = session.id;
    }

    if (batchParam) {
      studentsWhere.batch = batchParam;
    }

    if (studentIdParam) {
      studentsWhere.id = studentIdParam;
    }

    const students = await prisma.student.findMany({
      where: studentsWhere,
      select: {
        id: true,
        name: true,
        rollNumber: true,
        batch: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    if (students.length === 0) {
      if (format === 'json') {
        return NextResponse.json({ report: [] });
      }
      // Return empty file for files
      return NextResponse.json({ error: 'No student data found for the selected criteria' }, { status: 404 });
    }

    // 2. Fetch all attendance records for these students in the date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        studentId: true,
        date: true,
        status: true,
      },
    });

    // 3. Aggregate results per student
    const reportData = students.map((student) => {
      const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
      const totalDays = studentRecords.length;
      const presentDays = studentRecords.filter(r => r.status === 'PRESENT').length;
      const absentDays = studentRecords.filter(r => r.status === 'ABSENT').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      return {
        name: student.name,
        rollNumber: student.rollNumber,
        batch: student.batch,
        presentDays,
        absentDays,
        totalDays,
        attendancePercentage,
      };
    });

    // 4. Handle EXCEL format
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      // Title Block
      worksheet.mergeCells('A1:G1');
      const titleRow = worksheet.getRow(1);
      titleRow.getCell(1).value = `UniSmart Attendance Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
      titleRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // Slate Blue (tailwind indigo-600)
      };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 40;

      // Header Row
      worksheet.getRow(3).values = [
        'Student Name',
        'Roll Number',
        'Batch',
        'Present Days',
        'Absent Days',
        'Total Days',
        'Attendance Percentage',
      ];
      worksheet.getRow(3).font = { bold: true };
      worksheet.getRow(3).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' },
        };
        cell.border = {
          bottom: { style: 'medium' },
          top: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      worksheet.getRow(3).height = 25;

      // Add Data Rows
      reportData.forEach((row) => {
        worksheet.addRow([
          row.name,
          row.rollNumber,
          row.batch,
          row.presentDays,
          row.absentDays,
          row.totalDays,
          `${row.attendancePercentage}%`,
        ]);
      });

      // Borders and alignments for data cells
      for (let i = 4; i <= reportData.length + 3; i++) {
        const row = worksheet.getRow(i);
        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
          if (colNumber >= 4) {
            cell.alignment = { horizontal: 'center' };
          }
        });
      }

      // Column widths
      worksheet.columns.forEach((col, index) => {
        let maxLen = 15;
        worksheet.getColumn(index + 1).eachCell((cell) => {
          const val = cell.value ? String(cell.value) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        col.width = maxLen + 4;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Attendance_Report_${Date.now()}.xlsx"`,
        },
      });
    }

    // 5. Handle CSV format
    if (format === 'csv') {
      const csvHeader = 'Student Name,Roll Number,Batch,Present Days,Absent Days,Total Days,Attendance Percentage\n';
      const csvRows = reportData.map(row => 
        `"${row.name.replace(/"/g, '""')}","${row.rollNumber}","${row.batch}",${row.presentDays},${row.absentDays},${row.totalDays},${row.attendancePercentage}%`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="Attendance_Report_${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      report: reportData,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
