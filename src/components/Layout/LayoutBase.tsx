import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

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
      {withBottomNav && <BottomNav />}
    </div>
  );
};

export default LayoutBase;
