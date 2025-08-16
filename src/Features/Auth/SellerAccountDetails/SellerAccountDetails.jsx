import React, { useState } from "react";

export default function SellerAccountDetails() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    gstAvailable: "no",
    gstNumber: "",
  });

  const [sellerId, setSellerId] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.gstAvailable === "no") {
      // Generate unique seller ID if no GST
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newSellerId = `KA-SLR-${randomNum}`;
      setSellerId(newSellerId);
      alert(`Seller Registered! Your Seller ID: ${newSellerId}`);
    } else {
      alert(`Seller Registered with GST: ${formData.gstNumber}`);
    }

    // TODO: Send this data to your backend or database
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-4">
          Seller Account Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "fullName", label: "Full Name" },
            { name: "phone", label: "Mobile Number" },
            { name: "email", label: "Email Address" },
            { name: "bankName", label: "Bank Name" },
            { name: "accountNumber", label: "Account Number" },
            { name: "ifsc", label: "IFSC Code" },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-gray-700 font-medium mb-1">
                {field.label}
              </label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}

          {/* GST Availability */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Do you have a GST number?
            </label>
            <select
              name="gstAvailable"
              value={formData.gstAvailable}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          {/* GST Number Field if GST Available */}
          {formData.gstAvailable === "yes" && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Register Seller
          </button>
        </form>

        {/* Show Generated Seller ID if no GST */}
        {sellerId && formData.gstAvailable === "no" && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
            🎉 Your Seller ID: <strong>{sellerId}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
