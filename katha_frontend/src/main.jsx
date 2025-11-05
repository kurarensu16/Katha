import React from 'react'; // <-- THIS LINE IS ESSENTIAL
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);