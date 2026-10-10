// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import ProtectedRoute from "../components/Auth/ProtectedRoute";

// Pages
import Login from "../Pages/Login/Login";
import Dashboard from "../Pages/Dashboard/Dashboard";
import DailySales from "../Pages/DailySales/DailySales";
import Production from "../Pages/Production/Production";
import Ingredients from "../Pages/Ingredients/Ingredients";
import PackingMaterials from "../Pages/PackingMaterials/PackingMaterials";
import Cashbook from "../Pages/Cashbook/Cashbook";
import Expenses from "../Pages/Expenses/Expenses";
import Investments from "../Pages/Investments/Investments";
import AssetsPurchase from "../Pages/AssetsPurchase/AssetsPurchase";
import Customers from "../Pages/Customers/Customers";
import Reports from "../Pages/Reports/Reports";
import Excel from "../Pages/Excel/Excel";
import Alerts from "../Pages/Alerts/Alerts";
import AuditHistory from "../Pages/AuditHistory/AuditHistory";
import Settings from "../Pages/Settings/Settings";
import ProductCosting from "../Pages/ProductCosting/ProductCosting";
import Resume from "../Pages/Resume/Resume";   // 🆕 RESUME ಸೇರಿಸಿ

// Fallback/Placeholder pages
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
      <p className="text-gray-500 mt-2">This page is under construction</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Root - Redirect to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes - All pages wrapped with ProtectedRoute */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/daily-sales"
          element={
            <ProtectedRoute>
              <Layout>
                <DailySales />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/production"
          element={
            <ProtectedRoute>
              <Layout>
                <Production />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/product-costing"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductCosting />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ingredients"  
          element={
            <ProtectedRoute>
              <Layout>
                <Ingredients />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/packing-materials"
          element={
            <ProtectedRoute>
              <Layout>
                <PackingMaterials />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashbook"
          element={
            <ProtectedRoute>
              <Layout>
                <Cashbook />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/investments"
          element={
            <ProtectedRoute>
              <Layout>
                <Investments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets-purchase"
          element={
            <ProtectedRoute>
              <Layout>
                <AssetsPurchase />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/excel"
          element={
            <ProtectedRoute>
              <Layout>
                <Excel />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Layout>
                <Alerts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-history"
          element={
            <ProtectedRoute>
              <Layout>
                <AuditHistory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🆕 RESUME ROUTE — Settings ನಂತರ, Catch-all ಮೊದಲು */}
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Layout>
                <Resume />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;