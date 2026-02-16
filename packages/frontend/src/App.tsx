import { useEffect, useState } from 'react';
import Scene from './components/Scene';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');

  useEffect(() => {
    fetch('/health')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setApiStatus(`Connected: ${data.status}`))
      .catch(err => setApiStatus(`Error: ${err.message}`));
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <div style={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            zIndex: 10, 
            background: 'rgba(0,0,0,0.5)', 
            color: 'white', 
            padding: '5px',
            pointerEvents: 'none'
        }}>
            API: {apiStatus}
        </div>
        <Scene />
    </div>
  );
}

export default App;
