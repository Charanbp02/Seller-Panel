import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiPlus, FiEye, FiEdit } from 'react-icons/fi';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';

const initialProducts = [
  { id: 1, name: 'Navy Blue Smart Watch', category: 'Men, Watch', price: 230, stock: 500, sold: 65, revenues: 14950, image: 'https://m.media-amazon.com/images/I/51Z85so76cL._UF1000,1000_QL80_.jpg' },
  { id: 2, name: 'Blue Grey Backpack', category: 'Men, Backpack', price: 150, stock: 380, sold: 74, revenues: 11100, image: 'https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/products/pictures/item/free/original/tumi/142479-2665/0/lt2-VyWOhK-410380612001_1_2300.webp' },
  { id: 3, name: 'Navy Blue Sneakers', category: 'Men, Shoes', price: 175, stock: 160, sold: 86, revenues: 15050, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772' },
  { id: 4, name: 'Fashion Ladies Bag', category: 'Women, Bag', price: 210, stock: 275, sold: 63, revenues: 13230, image: 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRmobu611WTEHYhf5qwjZ80CzLeh4wFaPa-XSaYTkufDmCKcuHhf6p2QUdL_wfYduy8CSBLC_4JVhqMqGJO_Mom4EoOxnnhcVbJ1Npz2qdV3xbmfTLeGUXl' },
  { id: 5, name: 'Brown Leather Bracelet', category: 'Men, Bracelet', price: 165, stock: 450, sold: 64, revenues: 10560, image: 'https://images.meesho.com/images/products/542695305/dq9jv_512.avif?width=512' },
  { id: 6, name: 'Fancy Ladies Leather Bag', category: 'Women, Bag', price: 350, stock: 325, sold: 36, revenues: 12600, image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6' },
  { id: 7, name: 'Brown Leather Watch', category: 'Men, Watch', price: 472, stock: 250, sold: 62, revenues: 29264, image: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0' },
  { id: 8, name: "Men's Leather Wallet", category: 'Men, Wallet', price: 399, stock: 320, sold: 59, revenues: 23541, image: 'https://encrypted-tbn2.gstatic.com/shopping?q=...&usqp=CAc' },
  { id: 9, name: 'Blue Fashion Backpack', category: 'Men, Backpack', price: 525, stock: 260, sold: 36, revenues: 18900, image: 'https://encrypted-tbn3.gstatic.com/shopping?q=...&usqp=CAc' },
  { id: 10, name: 'Plain Blue Cap', category: 'Men, Cap', price: 620, stock: 475, sold: 28, revenues: 17360, image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a' },
];

const categoryOptions = [...new Set(initialProducts.map(product => product.category.split(', ')[0]))];

const ProductsTable = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate API fetch on mount
  useEffect(() => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setProducts(initialProducts);
      setLoading(false);
    }, 1000);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || 
      product.category.includes(categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortConfig.key === 'name' || sortConfig.key === 'category') {
      const valueA = a[sortConfig.key].toLowerCase();
      const valueB = b[sortConfig.key].toLowerCase();
      return sortConfig.direction === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    } else {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];
      return sortConfig.direction === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = window.innerWidth < 640 ? 3 : 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) pages.push(1);
    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push('...');
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const updateStock = (id, newStock) => {
    const stockValue = Math.max(0, parseInt(newStock) || 0);
    setProducts(products.map(product => 
      product.id === id ? { ...product, stock: stockValue } : product
    ));
  };

  const csvData = sortedProducts.map(product => ({
    ID: product.id,
    Name: product.name,
    Category: product.category,
    Price: formatCurrency(product.price),
    Stock: product.stock,
    Sold: product.sold,
    Revenues: formatCurrency(product.revenues)
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className={`p-4 rounded-lg shadow-sm border ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-200'}`}>
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Product Management</h2>
        <p className="text-xs text-gray-500">{filteredProducts.length} products found</p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className={`pl-9 pr-3 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              className={`appearance-none pl-3 pr-8 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-2.5 text-gray-400 text-sm" />
          </div>
          
          <CSVLink
            data={csvData}
            filename="products.csv"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-sm"
          >
            <FiPlus size={14} />
            <span>Export</span>
          </CSVLink>
          
          <button 
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-sm"
            onClick={() => navigate("/add-product")}
          >
            <FiPlus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Table - Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>Product {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('category')}>Category {sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('price')}>Price {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('stock')}>Stock {sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('sold')}>Sold {sortConfig.key === 'sold' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => requestSort('revenues')}>Revenues {sortConfig.key === 'revenues' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {paginatedProducts.map((product) => (
              <tr key={product.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-md object-cover" src={product.image} alt={product.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium">{product.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.category}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(product.price)}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => updateStock(product.id, e.target.value)}
                    className={`w-20 px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    min="0"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.sold}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(product.revenues)}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  <button onClick={() => setSelectedProduct(product)} className="text-blue-600 hover:text-blue-800 mr-2">
                    <FiEye size={16} />
                  </button>
                  <button onClick={() => console.log('Edit product', product.id)} className="text-green-600 hover:text-green-800">
                    <FiEdit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {paginatedProducts.map((product) => (
          <div key={product.id} className={`p-3 border rounded-lg shadow-xs ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex gap-3">
              <img src={product.image} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium truncate">{product.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedProduct(product)} className="text-blue-600 hover:text-blue-800">
                      <FiEye size={14} />
                    </button>
                    <button onClick={() => console.log('Edit product', product.id)} className="text-green-600 hover:text-green-800">
                      <FiEdit size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{product.category}</p>
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-300">Price</p>
                <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-300">Stock</p>
                <input
                  type="number"
                  value={product.stock}
                  onChange={(e) => updateStock(product.id, e.target.value)}
                  className={`w-20 px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                  min="0"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-300">Sold</p>
                <p className="text-sm font-medium">{product.sold}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-300">Revenues</p>
                <p className="text-sm font-medium">{formatCurrency(product.revenues)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Product Details: {selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                <FiChevronRight size={20} className="rotate-180" />
              </button>
            </div>
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-md mb-4" />
            <p><strong>Category:</strong> {selectedProduct.category}</p>
            <p><strong>Price:</strong> {formatCurrency(selectedProduct.price)}</p>
            <p><strong>Stock:</strong> {selectedProduct.stock}</p>
            <p><strong>Sold:</strong> {selectedProduct.sold}</p>
            <p><strong>Revenues:</strong> {formatCurrency(selectedProduct.revenues)}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-8 text-center">
          <FiSearch className="mx-auto text-2xl text-gray-400" />
          <h3 className="mt-2 text-sm font-medium dark:text-gray-100">No products found</h3>
          <p className="mt-1 text-xs text-gray-500">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
            }}
            className="mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 dark:text-gray-300">Rows per page:</span>
            <select
              className={`border rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {paginatedProducts.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
              {Math.min(currentPage * rowsPerPage, filteredProducts.length)} of {filteredProducts.length}
            </span>
            
            <nav className="flex gap-1">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`p-2 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <FiChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-xs ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <FiChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductsPage = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Products Dashboard</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Manage and track all products</p>
        </div>
        <ProductsTable isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default ProductsPage;
