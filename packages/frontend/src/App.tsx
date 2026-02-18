import { useEffect, useState } from 'react';
import Scene from './components/Scene';
import { UIOverlay } from './components/ui';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { tokens } from './styles/tokens';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setApiStatus(`Connected: ${data.status}`))
      .catch(err => setApiStatus(`Error: ${err.message}`));
  }, []);

  return (
    <OrganizationProvider>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
              position: 'absolute', 
              top: 10, 
              left: 10, 
              zIndex: 10, 
              background: tokens.colors.backgroundOverlay, 
              color: tokens.colors.text.primary, 
              padding: tokens.layout.spacing.sm,
              borderRadius: tokens.layout.borderRadius,
              pointerEvents: 'none'
          }}>
              API: {apiStatus}
          </div>
          <Scene />
          <UIOverlay />
      </div>
    </OrganizationProvider>
  );
}

export default App;
