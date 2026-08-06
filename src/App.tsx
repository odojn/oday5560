/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import DashboardLayout from './pages/dashboard/Layout';
import Overview from './pages/dashboard/Overview';
import Inventory from './pages/dashboard/Inventory';
import Categories from './pages/dashboard/Categories';
import RetailPOS from './pages/dashboard/RetailPOS';
import WholesalePOS from './pages/dashboard/WholesalePOS';
import Sales from './pages/dashboard/Sales';
import Debts from './pages/dashboard/Debts';
import Financials from './pages/dashboard/Financials';
import Damaged from './pages/dashboard/Damaged';
import Settings from './pages/dashboard/Settings';
import About from './pages/dashboard/About';
import SuperAdmin from './pages/SuperAdmin';
import { useDB } from './store/dbStore';

export default function App() {
  const fetchServerDB = useDB((state) => state.fetchServerDB);

  useEffect(() => {
    fetchServerDB();
  }, [fetchServerDB]);

  return (
    <BrowserRouter>
      <div dir="rtl" className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="categories" element={<Categories />} />
            <Route path="retail-pos" element={<RetailPOS />} />
            <Route path="wholesale-pos" element={<WholesalePOS />} />
            <Route path="sales" element={<Sales />} />
            <Route path="debts" element={<Debts />} />
            <Route path="financials" element={<Financials />} />
            <Route path="damaged" element={<Damaged />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
