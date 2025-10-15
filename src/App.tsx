import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { SoundProvider } from '@/contexts/SoundContext';
import { IconProvider } from '@/contexts/IconContext';
import { useClickSound } from '@/hooks/useClickSound';
import { Layout } from '@/components/Layout';
import { DashboardNew as Dashboard } from '@/pages/DashboardNew';
import { Samples } from '@/pages/Samples';
// Test pages removed - all functionality moved to TestManagement
import { TestManagement } from '@/pages/TestManagement';
import { Suppliers } from '@/pages/Suppliers';
import { Purchasing } from '@/pages/Purchasing';
import { RequestedItems } from '@/pages/RequestedItems';
import { Settings } from '@/pages/Settings';
import { Tasks } from '@/pages/Tasks';
import { Analytics } from '@/pages/Analytics';
import { Formulas } from '@/pages/Formulas';
import FinishedGoods from '@/pages/FinishedGoods';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
// Legacy label pages replaced by LabelStudio
import LabelStudio from '@/pages/LabelStudio';
import { RawMaterials } from '@/pages/RawMaterials';
import FormulaFirst from '@/pages/FormulaFirst';
// Removed legacy labels routes
import { TestPhase2 } from '@/pages/TestPhase2';
import { PreparationDetail } from '@/pages/PreparationDetail';
import { AppearanceProvider } from '@/providers/AppearanceProvider';
import { useEffect } from 'react';
import { pushOutbox } from '@/lib/sync';
import { useEffect as useReactEffect } from 'react';
import { useScale } from '@/lib/scale/useScale';
import { DebugErrorBoundary } from '@/components/DebugErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to initialize click sounds
const ClickSoundInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useClickSound();
  return <>{children}</>;
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Error
            </h1>
            <p className="text-gray-600 mb-4">
              Something went wrong. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <TaskProvider>
                <SoundProvider>
                  <IconProvider>
                    <AppearanceProvider>
                    <RootOutbox>
                    <ClickSoundInitializer>
                    <Toaster />
                    <BrowserRouter>
                      <DebugErrorBoundary>
                      <ScaleBridgeKeeper />
                      <BootMigrator />
                      <Routes>
                        {/* Redirect root to dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* Dashboard route - use Dashboard component directly */}
                        <Route path="/dashboard" element={
                          <Layout>
                            <Dashboard />
                          </Layout>
                        } />
                        
                        <Route path="/samples" element={
                          <Layout>
                            <Samples />
                          </Layout>
                        } />
                        
                        {/* Redirect tests to test-management */}
                        <Route path="/tests" element={<Navigate to="/test-management" replace />} />
                        
                        <Route path="/test-management" element={
                          <Layout>
                            <TestManagement />
                          </Layout>
                        } />
                        <Route path="/preparations/:id" element={
                          <Layout>
                            <PreparationDetail />
                          </Layout>
                        } />
                        
                        <Route path="/formulas" element={
                          <Layout>
                            <Formulas />
                          </Layout>
                        } />
                        <Route path="/formula-first" element={
                          <Layout>
                            <FormulaFirst />
                          </Layout>
                        } />
                        <Route path="/raw-materials" element={
                          <Layout>
                            <RawMaterials />
                          </Layout>
                        } />
                        <Route path="/labels" element={
                          <Layout>
                            <LabelStudio />
                          </Layout>
                        } />
                        <Route path="/finished-goods" element={
                          <Layout>
                            <FinishedGoods />
                          </Layout>
                        } />
                        
                        <Route path="/suppliers" element={
                          <Layout>
                            <Suppliers />
                          </Layout>
                        } />
                        
                        <Route path="/purchasing" element={
                          <Layout>
                            <Purchasing />
                          </Layout>
                        } />
                        
                        <Route path="/requested-items" element={
                          <Layout>
                            <RequestedItems />
                          </Layout>
                        } />
                        
                        <Route path="/tasks" element={
                          <Layout>
                            <Tasks />
                          </Layout>
                        } />
                        
                        <Route path="/analytics" element={
                          <Layout>
                            <Analytics />
                          </Layout>
                        } />
                        
                        <Route path="/settings" element={
                          <Layout>
                            <Settings />
                          </Layout>
                        } />
                        
                        {/* Profile route - redirect to settings */}
                        <Route path="/profile" element={<Navigate to="/settings" replace />} />
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      </DebugErrorBoundary>
                    </BrowserRouter>
                    </ClickSoundInitializer>
                    </RootOutbox>
                    </AppearanceProvider>
                  </IconProvider>
                </SoundProvider>
              </TaskProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

function RootOutbox({ children }:{ children: React.ReactNode }){
  useEffect(()=>{
    const id = setInterval(() => { pushOutbox().catch(()=>{}); }, 10_000);
    const onFocus = () => pushOutbox().catch(()=>{});
    const onOnline = () => pushOutbox().catch(()=>{});
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => clearInterval(id);
  }, []);
  return <>{children}</>;
}

// Keeps the Bridge WebSocket connected globally so navigation doesn’t drop it
function ScaleBridgeKeeper(){
  const { mode, setMode, autoConnect, connected, wsUrl } = useScale();
  useEffect(()=>{
    // Do not force bridge mode globally; respect user's last choice
    // When user selects bridge in scale settings, the keeper will maintain it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(()=>{
    (async ()=>{
      try { if (mode === 'bridge' && !connected) await autoConnect(); } catch {}
    })();
  }, [connected, wsUrl, autoConnect, mode]);
  return null;
}

function BootMigrator(){
  useReactEffect(()=>{
    try {
      const guardKey = 'migratedSampleSourceV2';
      if (localStorage.getItem(guardKey) === 'true') return;
      // Strip legacy formula batch fields from stored formulas and drafts
      try {
        const fRaw = localStorage.getItem('nbslims_formulas');
        if (fRaw){ const arr = JSON.parse(fRaw); arr.forEach((f:any)=> { delete f.batchSize; delete f.batchUnit; }); localStorage.setItem('nbslims_formulas', JSON.stringify(arr)); }
        const dRaw = localStorage.getItem('nbslims_formula_drafts');
        if (dRaw){ const arr = JSON.parse(dRaw); arr.forEach((d:any)=> { delete d.batchSize; delete d.batchUnit; }); localStorage.setItem('nbslims_formula_drafts', JSON.stringify(arr)); }
      } catch {}
      const raw = localStorage.getItem('nbslims_enhanced_samples');
      if (!raw) { localStorage.setItem(guardKey,'true'); return; }
      const samples = JSON.parse(raw);
      let changed = false;
      for (const s of samples){
        if (s && s.source === 'PERSONAL'){ s.source = 'SAMPLE'; changed = true; }
      }
      if (changed){ localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(samples)); }
      localStorage.setItem(guardKey,'true');
    } catch {}
  }, []);
  return null;
}