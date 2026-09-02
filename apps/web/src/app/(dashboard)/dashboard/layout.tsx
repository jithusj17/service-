import React from 'react';
import Link from 'next/link';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Platform</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/customers"
            className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            Customers
          </Link>
          <Link
            href="/inventory"
            className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            Inventory
          </Link>
          <Link
            href="/invoices"
            className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            Invoices
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-end px-8 border-b border-gray-200 bg-white">
          <NotificationDropdown />
        </header>
        
        {/* Page Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
