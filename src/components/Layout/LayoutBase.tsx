import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import ScrollPopup from '../ScrollPopup/ScrollPopup';

interface LayoutBaseProps {
  withBottomNav?: boolean;
  children?: React.ReactNode;
}

const LayoutBase = ({ withBottomNav = true, children }: LayoutBaseProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16">
        {children || <Outlet />}
      </main>
      {/* Bottom Navigation */}
      {withBottomNav && <BottomNav />}
      
      {/* Scroll Popup */}
      <ScrollPopup />
    </div>
  );
};

export default LayoutBase;
