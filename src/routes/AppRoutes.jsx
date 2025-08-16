import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import Dashboard from "../Pages/Dashboard/Dashboard";
import OrdersPage from "../Pages/Orders/Orders";
import ProductsTable from "../Pages/Products/Products";
import AddProductPage from "../Pages/AddProductPage/AddProductPage";
import CustomersPage from "../Pages/Customers/Customers";
import SellerSettingsPage from "../Pages/Settings/Settings";
import Signup from "../Features/Auth/Signup page/Signup page";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("sellerToken"); // example check
  return isLoggedIn ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Signup />} />

        {/* Protected Seller Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <Layout>
                <OrdersPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Layout>
                <ProductsTable />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <PrivateRoute>
              <Layout>
                <AddProductPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <Layout>
                <CustomersPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <SellerSettingsPage />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
