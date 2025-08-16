import React, { useState } from "react";

export default function SellerRegister() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    aadhaar: "",
    pan: "",
    gst: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    address: "",
  });

  const [sellerId, setSellerId] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Generate Seller ID (KA-SLR-XXXX)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newSellerId = `KA-SLR-${randomNum}`;
    setSellerId(newSellerId);

    alert(`Seller Registered! Your Seller ID: ${newSellerId}`);
    // Here you can send data to backend (API call)
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-4">
          Karnataka Seller Registration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "fullName", label: "Full Name" },
            { name: "phone", label: "Mobile Number" },
            { name: "email", label: "Email Address" },
            { name: "aadhaar", label: "Aadhaar Number" },
            { name: "pan", label: "PAN Number" },
            { name: "gst", label: "GST Number (Optional)" },
            { name: "bankName", label: "Bank Name" },
            { name: "accountNumber", label: "Account Number" },
            { name: "ifsc", label: "IFSC Code" },
            { name: "address", label: "Pickup Address" },
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
                required={field.name !== "gst"}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Register
          </button>
        </form>

        {sellerId && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
            🎉 Your Seller ID: <strong>{sellerId}</strong>
          </div>
        )}
      </div>
    </div>
  );
}