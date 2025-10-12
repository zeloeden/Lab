import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeDatabase } from './lib/database';

// Initialize database before rendering the app
const initApp = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Continue anyway to show error in UI
  }
  
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
};

initApp();