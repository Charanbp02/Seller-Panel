import React, { useState, useEffect } from "react";
import { ChevronDown, MoreVertical, Star, ArrowUpDown, Filter, Search } from "lucide-react";

const initialProducts = [
  {
    id: 1,
    name: "Men's Cotton Shirt",
    image: "https://thehouseofrare.com/cdn/shop/files/layerr-ls-mens-shirt-brown27624_f6199930-ca9b-4b37-934d-926105d528af.jpg?v=1739430631",
    sales: 120,
    revenue: 45000,
    rating: 4.5,
    category: "Clothing",
    stock: 42,
    lastUpdated: "2023-05-15",
  },
  {
    id: 2,
    name: "Women's Summer Dress",
    image: "https://thenotebookofficial.com/cdn/shop/products/TNS-DR-79_1.png?v=1744802051&width=1000",
    sales: 98,
    revenue: 38000,
    rating: 4.2,
    category: "Clothing",
    stock: 28,
    lastUpdated: "2023-06-20",
  },
  {
    id: 3,
    name: "Sports Shoes",
    image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSSKn84M4ieeQ3AjoEdAhNMq5qE8zomHuSUZeb739urj22LcPV0LAMoIcWTxpLT9b-FEy_Z2Ge-WLj6_xIZ8UDUbXQa9trZVyyCrlnv9GYRH0UM64GNqkRaGyBuUMQdWS1m7S1vN2k&usqp=CAc",
    sales: 85,
    revenue: 30000,
    rating: 4.7,
    category: "Footwear",
    stock: 15,
    lastUpdated: "2023-04-10",
  },
  {
    id: 4,
    name: "Wireless Headphones",
    image: "https://www.leafstudios.in/cdn/shop/files/1_a43c5e0b-3a47-497d-acec-b4764259b10e_800x.png?v=1750486829",
    sales: 72,
    revenue: 52000,
    rating: 4.8,
    category: "Electronics",
    stock: 36,
    lastUpdated: "2023-07-05",
  },
  {
    id: 5,
    name: "Smart Watch",
    image: "https://www.gonoise.com/cdn/shop/files/1_c95e5561-4f66-413d-b143-42d31821e554.webp?v=1721392308",
    sales: 65,
    revenue: 48000,
    rating: 4.3,
    category: "Electronics",
    stock: 19,
    lastUpdated: "2023-06-30",
  },
];

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
          fill={i < rating ? "currentColor" : "none"}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({rating.toFixed(1)})</span>
    </div>
  );
};

const ProductRow = ({ product, index, expandedRow, toggleExpand, viewMode }) => {
  return (
    <div
      className={`${viewMode === 'list' ? 'flex items-center p-3' : 'p-3'} hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-100 dark:border-gray-700 mb-2`}
    >
      {viewMode === 'list' ? (
        <>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-300 w-6">{index + 1}</span>

          <div className="flex items-center flex-1 min-w-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover mr-4"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-800 dark:text-white truncate">{product.name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{product.category}</span>
                <StarRating rating={product.rating} />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end ml-4">
            <span className="text-sm font-medium text-gray-800 dark:text-white">{product.sales} sold</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              ₹{product.revenue.toLocaleString("en-IN")}
            </span>
          </div>

          <button 
            onClick={() => toggleExpand(product.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover mr-4"
            />
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white">{product.name}</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{product.category}</span>
                <StarRating rating={product.rating} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sales</p>
              <p className="font-medium text-gray-800 dark:text-white">{product.sales}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                ₹{product.revenue.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock</p>
              <p className={`font-medium ${
                product.stock < 10 ? 'text-red-600 dark:text-red-400' : 
                product.stock < 20 ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-green-600 dark:text-green-400'
              }`}>
                {product.stock}
              </p>
            </div>
          </div>
        </div>
      )}

      {expandedRow === product.id && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Category</p>
            <p className="text-gray-800 dark:text-white">{product.category}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Stock Available</p>
            <p className="text-gray-800 dark:text-white">{product.stock} units</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="text-gray-800 dark:text-white">{product.lastUpdated}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Revenue per Unit</p>
            <p className="text-gray-800 dark:text-white">
              ₹{Math.round(product.revenue / product.sales).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TopProducts() {
  const [products, setProducts] = useState(initialProducts);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'sales', direction: 'desc' });
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');

  const categories = ['All', ...new Set(initialProducts.map(p => p.category))];

  const toggleExpand = (productId) => {
    setExpandedRow(expandedRow === productId ? null : productId);
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = React.useMemo(() => {
    let sortableProducts = [...products];
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, sortConfig]);

  const filteredProducts = React.useMemo(() => {
    return sortedProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesStock = 
        stockFilter === 'all' || 
        (stockFilter === 'low' && product.stock < 10) ||
        (stockFilter === 'medium' && product.stock >= 10 && product.stock < 20) ||
        (stockFilter === 'high' && product.stock >= 20);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [sortedProducts, searchTerm, selectedCategory, stockFilter]);

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Top Selling Products</h2>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {viewMode === 'list' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock (&lt;10)</option>
            <option value="medium">Medium Stock (10-20)</option>
            <option value="high">High Stock (20+)</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
            <button 
              onClick={() => requestSort('sales')}
              className={`flex items-center text-sm px-3 py-1 rounded-lg ${
                sortConfig.key === 'sales' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Sales {getSortIndicator('sales')}
            </button>
            <button 
              onClick={() => requestSort('revenue')}
              className={`flex items-center text-sm px-3 py-1 rounded-lg ${
                sortConfig.key === 'revenue' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Revenue {getSortIndicator('revenue')}
            </button>
            <button 
              onClick={() => requestSort('rating')}
              className={`flex items-center text-sm px-3 py-1 rounded-lg ${
                sortConfig.key === 'rating' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Rating {getSortIndicator('rating')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <ProductRow
              key={product.id}
              product={product}
              index={index}
              expandedRow={expandedRow}
              toggleExpand={toggleExpand}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No products found matching your criteria</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredProducts.length} of {initialProducts.length} products
        </p>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
          View All Products
        </button>
      </div>
    </div>
  );
}