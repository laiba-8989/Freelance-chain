import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Freelancer/Cards/Navbar';
import Footer from '../components/Freelancer/Cards/footer';
import { useEffect, useState } from 'react';

const Layout = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  // List of routes where the footer should be hidden
  const hideFooterRoutes = ['/messages'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <div className="app-container min-h-screen flex flex-col">
      <Navbar />
      <main className={`main-content flex-grow ${isAdmin ? 'pt-0' : ''}`}>
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default Layout;
