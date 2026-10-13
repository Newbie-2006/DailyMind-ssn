import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './hooks/AppDataProvider';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './layouts/AppShell';
import { LoadingState } from './components/ui/EmptyState';
import { Entry } from './pages/Entry';
import { Welcome } from './pages/Welcome';

// The five tabs load with the app, so moving between them is instant.
import { Home } from './pages/Home';
import { Memories } from './pages/Memories';
import { Routines } from './pages/Routines';
import { Assistant } from './pages/Assistant';
import { Profile } from './pages/Profile';

// Everything reached from a tab is fetched on the way there, which keeps the
// first load small on a mid-range phone.
const AddMemory = lazy(() => import('./pages/AddMemory').then((m) => ({ default: m.AddMemory })));
const MemoryDetails = lazy(() =>
  import('./pages/MemoryDetails').then((m) => ({ default: m.MemoryDetails })),
);
const AddRoutine = lazy(() =>
  import('./pages/AddRoutine').then((m) => ({ default: m.AddRoutine })),
);
const RoutineDetails = lazy(() =>
  import('./pages/RoutineDetails').then((m) => ({ default: m.RoutineDetails })),
);
const Insights = lazy(() => import('./pages/Insights').then((m) => ({ default: m.Insights })));
const CaregiverAccess = lazy(() =>
  import('./pages/CaregiverAccess').then((m) => ({ default: m.CaregiverAccess })),
);
const PrivacySharing = lazy(() =>
  import('./pages/PrivacySharing').then((m) => ({ default: m.PrivacySharing })),
);
const PersonalInformation = lazy(() =>
  import('./pages/ProfileDetails').then((m) => ({ default: m.PersonalInformation })),
);
const NotificationSettingsPage = lazy(() =>
  import('./pages/ProfileDetails').then((m) => ({ default: m.NotificationSettingsPage })),
);
const Family = lazy(() => import('./pages/Family').then((m) => ({ default: m.Family })));
const GarySettingsPage = lazy(() =>
  import('./pages/GarySettings').then((m) => ({ default: m.GarySettingsPage })),
);
const HelpSupport = lazy(() =>
  import('./pages/ProfileDetails').then((m) => ({ default: m.HelpSupport })),
);

export default function App() {
  return (
    <AppDataProvider>
      <ToastProvider>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route path="/" element={<Entry />} />
            <Route path="/welcome" element={<Welcome />} />

            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />

              <Route path="/memories" element={<Memories />} />
              <Route path="/memories/new" element={<AddMemory />} />
              <Route path="/memories/:memoryId" element={<MemoryDetails />} />
              <Route path="/memories/:memoryId/edit" element={<AddMemory />} />

              <Route path="/routines" element={<Routines />} />
              <Route path="/routines/new" element={<AddRoutine />} />
              <Route path="/routines/:routineId" element={<RoutineDetails />} />
              <Route path="/routines/:routineId/edit" element={<AddRoutine />} />

              <Route path="/assistant" element={<Assistant />} />
              <Route path="/insights" element={<Insights />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/personal" element={<PersonalInformation />} />
              <Route path="/profile/notifications" element={<NotificationSettingsPage />} />
              <Route path="/profile/help" element={<HelpSupport />} />
              <Route path="/profile/gary" element={<GarySettingsPage />} />
              <Route path="/family" element={<Family />} />
              <Route path="/caregivers" element={<CaregiverAccess />} />
              <Route path="/privacy" element={<PrivacySharing />} />
            </Route>

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AppDataProvider>
  );
}
