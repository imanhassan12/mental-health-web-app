// App.js
import React from 'react';
import AppRouter from './AppRouter';
import './styles/App.css';    // your global styling or theming
import RemindersPage from './pages/RemindersPage';
import { Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <AppRouter />
    </div>
  );
}

export default App;
