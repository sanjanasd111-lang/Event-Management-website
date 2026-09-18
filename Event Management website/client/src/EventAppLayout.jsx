import { Outlet } from 'react-router-dom';
import TopNav from './layouts/TopNav';

const EventAppLayout = () => {
  return (
    <>
      <TopNav />
      <Outlet />
    </>
  );
};

export default EventAppLayout;

