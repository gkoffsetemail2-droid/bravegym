/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdminPortal } from './components/AdminPortal';
import { ClassesPage } from './components/ClassesPage';
import { DashboardPage } from './components/DashboardPage';
import { LockersPage } from './components/LockersPage';
import { LoginPage } from './components/LoginPage';
import { MemberLayout } from './components/MemberLayout';
import { MyBookingsPage } from './components/MyBookingsPage';
import { NotificationsPage } from './components/NotificationsPage';
import { PaymentsPage } from './components/PaymentsPage';
import { ProfilePage } from './components/ProfilePage';
import { PTPackagesPage } from './components/PTPackagesPage';
import { PTSchedulePage } from './components/PTSchedulePage';
import { SaunaPage } from './components/SaunaPage';
import { TrainersPage } from './components/TrainersPage';
import { YogaPage } from './components/YogaPage';
import { BraveProvider, useBrave } from './context/BraveContext';

const PortalRouter: React.FC = () => {
  const { currentUser, activePage } = useBrave();

  // Authentication Guard: Always gate on LoginPage before rendering any member or admin screen
  if (!currentUser) {
    return <LoginPage />;
  }

  // Separate Admin Interface
  if (currentUser.role === 'admin') {
    return <AdminPortal />;
  }

  // Protected Member Portal Pages
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'classes':
        return <ClassesPage />;
      case 'trainers':
        return <TrainersPage />;
      case 'pt-schedule':
        return <PTSchedulePage />;
      case 'yoga':
        return <YogaPage />;
      case 'packages':
        return <PTPackagesPage />;
      case 'sauna':
        return <SaunaPage />;
      case 'lockers':
        return <LockersPage />;
      case 'bookings':
        return <MyBookingsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  return <MemberLayout>{renderPage()}</MemberLayout>;
};

export default function App() {
  return (
    <BraveProvider>
      <PortalRouter />
    </BraveProvider>
  );
}
