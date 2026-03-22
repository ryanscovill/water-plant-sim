import { Outlet } from 'react-router-dom';

export function LandingLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Outlet />
    </div>
  );
}
