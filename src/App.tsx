import { useLocation } from './pages/router';
import { Landing } from './pages/Landing';
import { Chat } from './pages/Chat';
import { ListingDetail } from './pages/ListingDetail';
import { LeadSuccess } from './pages/LeadSuccess';
import { Admin } from './pages/Admin';

function App() {
  const path = useLocation();

  if (path === '/chat') {
    return <Chat />;
  }

  if (path.startsWith('/listing/')) {
    return <ListingDetail />;
  }

  if (path.startsWith('/lead/')) {
    return <LeadSuccess />;
  }

  if (path === '/admin') {
    return <Admin />;
  }

  return <Landing />;
}

export default App;
