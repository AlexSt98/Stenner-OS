import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { NexusPage } from './pages/NexusPage';
import { TeopmWorkdayPage } from './pages/TeopmWorkdayPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { TimeTrackerPage } from './pages/TimeTrackerPage';
import { BoardsPage } from './pages/BoardsPage';
import { IdeasVaultPage } from './pages/IdeasVaultPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { EnglishLabPage } from './pages/EnglishLabPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MarketingLabPage } from './pages/marketing/MarketingLabPage';
import { WorkspaceLayout } from './pages/marketing/WorkspaceLayout';
import { ControlCenterPage } from './pages/marketing/ControlCenterPage';
import { PhaseWorkbenchPage } from './pages/marketing/PhaseWorkbenchPage';
import { EvidencePage } from './pages/marketing/EvidencePage';
import { HypothesesPage } from './pages/marketing/HypothesesPage';
import { DecisionsPage } from './pages/marketing/DecisionsPage';
import { GapsPage } from './pages/marketing/GapsPage';
import { KnowledgePage } from './pages/marketing/KnowledgePage';
import { StrategyPage } from './pages/marketing/StrategyPage';
import { BookPage } from './pages/marketing/BookPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/nexus" element={<NexusPage />} />
          <Route path="/teopm" element={<TeopmWorkdayPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/time-tracker" element={<TimeTrackerPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/:boardId" element={<BoardsPage />} />
          <Route path="/ideas" element={<IdeasVaultPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/english" element={<EnglishLabPage />} />

          {/* Marketing Lab — the workspace layout owns loading one project's
              data, so every child route reads only that project's records. */}
          <Route path="/marketing" element={<MarketingLabPage />} />
          <Route path="/marketing/:workspaceId" element={<WorkspaceLayout />}>
            <Route index element={<ControlCenterPage />} />
            <Route path="phase/:phaseKey" element={<PhaseWorkbenchPage />} />
            <Route path="evidence" element={<EvidencePage />} />
            <Route path="hypotheses" element={<HypothesesPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="gaps" element={<GapsPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="strategy" element={<StrategyPage />} />
            <Route path="book" element={<BookPage />} />
          </Route>

          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
