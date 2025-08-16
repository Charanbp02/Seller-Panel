import { useState } from "react";

export default function GmailLogin({ onContinue }) {
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    if (!email.endsWith("@gmail.com")) {
      alert("Please enter a valid Gmail address");
      return;
    }
    onContinue(email);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img
            src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r2.png"
            alt="Gmail Logo"
            className="h-10"
          />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Sign in
        </h2>
        <p className="text-gray-600 mb-6">Use your Gmail account</p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email or phone"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
