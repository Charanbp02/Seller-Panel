import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import Dashboard from "../Pages/Dashboard/Dashboard";
import OrdersPage from "../Pages/Orders/Orders";
import ProductsTable from "../Pages/Products/Products";
import AddProductPage from "../Pages/AddProductPage/AddProductPage";
import CustomersPage from "../Pages/Customers/Customers";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/products" element={<ProductsTable />} />
            <Route path="/add-product" element={<AddProductPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            {/* Add more routes here as needed */}
          </Routes>
        </Layout>
      </div>
    </BrowserRouter>
  );
};

export default AppRoutes;