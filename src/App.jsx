import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { WeightUnitProvider } from '@/lib/weightUnitContext';
import AppLayout from '@/components/AppLayout';
import Home from '@/pages/Home';
import Fuel from '@/pages/Fuel';
import Maintenance from '@/pages/Maintenance';
import GoalPacing from '@/pages/GoalPacing';
import Train from '@/pages/Train';
import Habits from '@/pages/Habits';
import Journey from '@/pages/Journey';
import Mirror from '@/pages/Mirror';
import Gate from '@/pages/Gate';
import Settings from '@/pages/Settings';
import Coach from '@/pages/Coach';

// All data lives on this device (see src/api/db.js), so there is no sign-in:
// the app opens straight to the dashboard. HashRouter keeps deep links working
// on static hosting (GitHub Pages) and when launched from the home screen.
function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <WeightUnitProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/fuel" element={<Fuel />} />
              <Route path="/fuel/maintenance" element={<Maintenance />} />
              <Route path="/fuel/goal" element={<GoalPacing />} />
              <Route path="/train" element={<Train />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/mirror" element={<Mirror />} />
              <Route path="/gate" element={<Gate />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/coach" element={<Coach />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </WeightUnitProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
