'use client';

import React from 'react';
import { DashboardLayout, NavItem } from '@/components/layout/dashboard-layout';
import { BarChart2, Users, BookOpen, Cpu } from 'lucide-react';

const adminNavItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/admin/dashboard',
    icon: BarChart2,
  },
  {
    label: 'Faculty Management',
    href: '/admin/dashboard/faculty',
    icon: Users,
  },
  {
    label: 'Student Directory',
    href: '/admin/dashboard/students',
    icon: BookOpen,
  },
  {
    label: 'AI Risk Center',
    href: '/admin/dashboard/risk',
    icon: Cpu,
  },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout title="Admin Control Center" navItems={adminNavItems}>
      {children}
    </DashboardLayout>
  );
}
