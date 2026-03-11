import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import GlobalBgmPlayer from './components/GlobalBgmPlayer.tsx';
import GameViewport from './components/GameViewport.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <GameViewport>
        <App />
      </GameViewport>
      <GlobalBgmPlayer />
    </>
  </StrictMode>,
);
