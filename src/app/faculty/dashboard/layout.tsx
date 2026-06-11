'use client';

import React from 'react';
import { DashboardLayout, NavItem } from '@/components/layout/dashboard-layout';
import { BarChart2, Calendar, Users, BookOpen, Cpu } from 'lucide-react';

const facultyNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/faculty/dashboard',
    icon: BarChart2,
  },
  {
    label: 'Attendance Calendar',
    href: '/faculty/dashboard/calendar',
    icon: Calendar,
  },
  {
    label: 'Assigned Students',
    href: '/faculty/dashboard/students',
    icon: Users,
  },
  {
    label: 'Attendance Reports',
    href: '/faculty/dashboard/reports',
    icon: BookOpen,
  },
  {
    label: 'Smart Insights (SAI)',
    href: '/faculty/dashboard/insights',
    icon: Cpu,
  },
];

export default function FacultyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Faculty Portal" navItems={facultyNavItems}>
      {children}
    </DashboardLayout>
  );
}
