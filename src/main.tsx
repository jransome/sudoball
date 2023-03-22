import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css';
import 'webrtc-adapter'; // shim for compatibility of WebRTC api on different browsers

ReactDOM
  .createRoot(document.getElementById('root') as HTMLElement)
  .render(<App />);
