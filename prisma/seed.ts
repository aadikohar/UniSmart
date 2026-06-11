import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing database...');
  await prisma.attendanceRisk.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.oTP.deleteMany();

  console.log('Seeding Admins...');
  const admin = await prisma.admin.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'admin@unismart.edu',
    },
  });
  console.log(`Created admin: ${admin.email}`);

  console.log('Seeding Faculty...');
  const faculties = [
    {
      name: 'Dr. Alan Turing',
      email: 'alan.turing@unismart.edu',
      department: 'Computer Science & Engineering',
      academicYear: '2025-2026',
      status: 'ACTIVE',
    },
    {
      name: 'Prof. Grace Hopper',
      email: 'grace.hopper@unismart.edu',
      department: 'Computer Science & Engineering',
      academicYear: '2025-2026',
      status: 'ACTIVE',
    },
    {
      name: 'Dr. Richard Feynman',
      email: 'richard.feynman@unismart.edu',
      department: 'Physics & Applied Mathematics',
      academicYear: '2025-2026',
      status: 'ACTIVE',
    },
    {
      name: 'Prof. Ada Lovelace',
      email: 'ada.lovelace@unismart.edu',
      department: 'Information Technology',
      academicYear: '2025-2026',
      status: 'ACTIVE',
    },
  ];

  const createdFaculties = [];
  for (const f of faculties) {
    const faculty = await prisma.faculty.create({ data: f });
    createdFaculties.push(faculty);
    console.log(`Created faculty: ${faculty.name} (${faculty.email})`);
  }

  console.log('Seeding Students...');
  // 3 batches: Batch A (CSE-2025), Batch B (CSE-2026), Batch C (PHYS-2025)
  const studentTemplates = [
    // Assigned to Dr. Alan Turing (CSE-2025)
    { name: 'John Doe', rollNumber: 'CS2025001', email: 'john.doe@student.unismart.edu', batch: 'CSE-2025', facultyIndex: 0, attendanceRate: 0.92 },
    { name: 'Jane Smith', rollNumber: 'CS2025002', email: 'jane.smith@student.unismart.edu', batch: 'CSE-2025', facultyIndex: 0, attendanceRate: 0.68 }, // High Risk
    { name: 'Bob Johnson', rollNumber: 'CS2025003', email: 'bob.johnson@student.unismart.edu', batch: 'CSE-2025', facultyIndex: 0, attendanceRate: 0.88 },
    { name: 'Alice Williams', rollNumber: 'CS2025004', email: 'alice.williams@student.unismart.edu', batch: 'CSE-2025', facultyIndex: 0, attendanceRate: 0.55 }, // High Risk
    { name: 'Charlie Brown', rollNumber: 'CS2025005', email: 'charlie.brown@student.unismart.edu', batch: 'CSE-2025', facultyIndex: 0, attendanceRate: 0.81 }, // Medium Risk

    // Assigned to Prof. Grace Hopper (CSE-2026)
    { name: 'David Miller', rollNumber: 'CS2026001', email: 'david.miller@student.unismart.edu', batch: 'CSE-2026', facultyIndex: 1, attendanceRate: 0.95 },
    { name: 'Eva Davis', rollNumber: 'CS2026002', email: 'eva.davis@student.unismart.edu', batch: 'CSE-2026', facultyIndex: 1, attendanceRate: 0.73 }, // High Risk
    { name: 'Frank Wilson', rollNumber: 'CS2026003', email: 'frank.wilson@student.unismart.edu', batch: 'CSE-2026', facultyIndex: 1, attendanceRate: 0.89 },
    { name: 'Grace Moore', rollNumber: 'CS2026004', email: 'grace.moore@student.unismart.edu', batch: 'CSE-2026', facultyIndex: 1, attendanceRate: 0.91 },
    { name: 'Henry Taylor', rollNumber: 'CS2026005', email: 'henry.taylor@student.unismart.edu', batch: 'CSE-2026', facultyIndex: 1, attendanceRate: 0.78 }, // Medium Risk

    // Assigned to Dr. Richard Feynman (PHYS-2025)
    { name: 'Ivy Thomas', rollNumber: 'PH2025001', email: 'ivy.thomas@student.unismart.edu', batch: 'PHYS-2025', facultyIndex: 2, attendanceRate: 0.97 },
    { name: 'Jack Anderson', rollNumber: 'PH2025002', email: 'jack.anderson@student.unismart.edu', batch: 'PHYS-2025', facultyIndex: 2, attendanceRate: 0.84 }, // Medium Risk
    { name: 'Kate Jackson', rollNumber: 'PH2025003', email: 'kate.jackson@student.unismart.edu', batch: 'PHYS-2025', facultyIndex: 2, attendanceRate: 0.62 }, // High Risk
    { name: 'Leo White', rollNumber: 'PH2025004', email: 'leo.white@student.unismart.edu', batch: 'PHYS-2025', facultyIndex: 2, attendanceRate: 0.90 },
    { name: 'Mia Harris', rollNumber: 'PH2025005', email: 'mia.harris@student.unismart.edu', batch: 'PHYS-2025', facultyIndex: 2, attendanceRate: 0.93 },

    // Assigned to Prof. Ada Lovelace (IT-2026)
    { name: 'Noah Martin', rollNumber: 'IT2026001', email: 'noah.martin@student.unismart.edu', batch: 'IT-2026', facultyIndex: 3, attendanceRate: 0.86 },
    { name: 'Olivia Garcia', rollNumber: 'IT2026002', email: 'olivia.garcia@student.unismart.edu', batch: 'IT-2026', facultyIndex: 3, attendanceRate: 0.58 }, // High Risk
    { name: 'Peter Martinez', rollNumber: 'IT2026003', email: 'peter.martinez@student.unismart.edu', batch: 'IT-2026', facultyIndex: 3, attendanceRate: 0.94 },
    { name: 'Quinn Robinson', rollNumber: 'IT2026004', email: 'quinn.robinson@student.unismart.edu', batch: 'IT-2026', facultyIndex: 3, attendanceRate: 0.80 }, // Medium Risk
    { name: 'Ryan Clark', rollNumber: 'IT2026005', email: 'ryan.clark@student.unismart.edu', batch: 'IT-2026', facultyIndex: 3, attendanceRate: 0.91 },
  ];

  const createdStudents = [];
  for (const st of studentTemplates) {
    const faculty = createdFaculties[st.facultyIndex];
    const student = await prisma.student.create({
      data: {
        name: st.name,
        rollNumber: st.rollNumber,
        email: st.email,
        batch: st.batch,
        facultyId: faculty.id,
      },
    });
    createdStudents.push({ ...student, targetRate: st.attendanceRate });
    console.log(`Created student: ${student.name} assigned to ${faculty.name}`);
  }

  console.log('Generating Attendance History (Last 20 weekdays)...');
  const weekdays = [];
  let current = new Date();
  // Go back 30 calendar days, collect up to 20 weekdays
  for (let i = 0; weekdays.length < 20 && i < 35; i++) {
    const d = new Date();
    d.setDate(current.getDate() - i);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      weekdays.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0, 0));
    }
  }
  // Reverse to seed in chronological order
  weekdays.reverse();

  for (const student of createdStudents) {
    let presentCount = 0;
    const markedBy = createdFaculties.find(f => f.id === student.facultyId)?.email || 'system@unismart.edu';

    for (const date of weekdays) {
      // Decide status based on target attendance rate
      const isPresent = Math.random() < student.targetRate;
      if (isPresent) {
        presentCount++;
      }

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          date: date,
          status: isPresent ? 'PRESENT' : 'ABSENT',
          markedBy: markedBy,
        },
      });
    }

    // Calculate actual rate
    const actualRate = presentCount / weekdays.length;
    console.log(`Generated attendance for ${student.name}: ${presentCount}/${weekdays.length} (${(actualRate * 100).toFixed(1)}%)`);

    // Create AI Risk analysis entry
    let riskLevel = 'Green';
    let riskScore = 1 - actualRate;
    let prediction = `Attendance is stable at ${(actualRate * 100).toFixed(0)}%. No risk of dropping below 75% detected.`;
    let recommendation = 'No action required. Maintain standard tracking.';

    if (actualRate < 0.75) {
      riskLevel = 'Red';
      prediction = `High risk! Student attendance has dropped to ${(actualRate * 100).toFixed(0)}% (below the 75% threshold).`;
      recommendation = 'Schedule academic intervention and send parent/guardian notification immediately.';
    } else if (actualRate < 0.85) {
      riskLevel = 'Yellow';
      prediction = `Warning! Student attendance is currently at ${(actualRate * 100).toFixed(0)}% and showing high absenteeism vulnerability.`;
      recommendation = 'Send attendance warning email and schedule one-on-one advising session.';
    }

    await prisma.attendanceRisk.create({
      data: {
        studentId: student.id,
        riskScore: parseFloat(riskScore.toFixed(2)),
        riskLevel: riskLevel,
        prediction: prediction,
        recommendation: recommendation,
      },
    });
  }

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
