import React from "react";

const topProducts = [
  {
    id: 1,
    name: "Men's Cotton Shirt",
    image: "https://thehouseofrare.com/cdn/shop/files/layerr-ls-mens-shirt-brown27624_f6199930-ca9b-4b37-934d-926105d528af.jpg?v=1739430631",
    sales: 120,
    revenue: 45000,
    rating: 4.5,
  },
  {
    id: 2,
    name: "Women's Summer Dress",
    image: "https://thenotebookofficial.com/cdn/shop/products/TNS-DR-79_1.png?v=1744802051&width=1000",
    sales: 98,
    revenue: 38000,
    rating: 4.2,
  },
  {
    id: 3,
    name: "Sports Shoes",
    image: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSSKn84M4ieeQ3AjoEdAhNMq5qE8zomHuSUZeb739urj22LcPV0LAMoIcWTxpLT9b-FEy_Z2Ge-WLj6_xIZ8UDUbXQa9trZVyyCrlnv9GYRH0UM64GNqkRaGyBuUMQdWS1m7S1vN2k&usqp=CAc",
    sales: 85,
    revenue: 30000,
    rating: 4.7,
  },
  {
    id: 4,
    name: "Wireless Headphones",
    image: "https://www.leafstudios.in/cdn/shop/files/1_a43c5e0b-3a47-497d-acec-b4764259b10e_800x.png?v=1750486829",
    sales: 72,
    revenue: 52000,
    rating: 4.8,
  },
  {
    id: 5,
    name: "Smart Watch",
    image: "https://www.gonoise.com/cdn/shop/files/1_c95e5561-4f66-413d-b143-42d31821e554.webp?v=1721392308",
    sales: 65,
    revenue: 48000,
    rating: 4.3,
  },
];

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {[...Array(4)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < fullStars ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id="half-star" x1="0" x2="100%" y1="0" y2="0">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-star)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      )}
      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({rating})</span>
    </div>
  );
};

export default function TopProducts() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Top Selling Products</h2>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {topProducts.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-gray-400 dark:text-gray-300 w-6">{index + 1}</span>

            <div className="flex items-center flex-1 min-w-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover mr-4"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-gray-800 dark:text-white truncate">{product.name}</h3>
                <StarRating rating={product.rating} />
              </div>
            </div>

            <div className="flex flex-col items-end ml-4">
              <span className="text-sm font-medium text-gray-800 dark:text-white">{product.sales} sold</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₹{product.revenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}