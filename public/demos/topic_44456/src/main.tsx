import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { AR } from './pages/AR';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<App />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ar" element={<AR />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
