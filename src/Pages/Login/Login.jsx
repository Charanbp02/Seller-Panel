// Pages/Login/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  LogIn,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Building2,
  Shield,
  Users,
  Package,
  BarChart3,
  Flame,
  Sparkles
} from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Check Firebase Auth state - if already logged in, redirect to dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is already signed in
        console.log("Already logged in:", user.uid);
        navigate("/dashboard", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      console.log("Firebase login successful:", user.uid);

      setSuccess("Login successful! Redirecting...");

      // Store user info in localStorage
      localStorage.setItem(
        "businessUser",
        JSON.stringify({
          uid: user.uid,
          name: user.displayName || "Charan",
          email: user.email,
          role: "Admin",
        })
      );

      // Direct navigation without setTimeout
      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Firebase login error:", error);

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Invalid email or password.");
          break;

        case "auth/too-many-requests":
          setError("Too many login attempts. Please try again later.");
          break;

        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;

        default:
          setError(error.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-200">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Racha Ruchi</h1>
              <p className="text-red-600 font-medium">Spice & Masala Business Admin</p>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Manage Your<br />
              <span className="text-red-600">Spice Business</span>
            </h2>
            <p className="text-gray-500 mt-4 text-lg">
              Complete business management system for Racha Ruchi spices and masala powders.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="p-2 bg-red-50 rounded-lg">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Spice Sales</p>
                <p className="text-xs text-gray-500">Track revenue</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Masala Stock</p>
                <p className="text-xs text-gray-500">Manage inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Customers</p>
                <p className="text-xs text-gray-500">Manage relations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Reports</p>
                <p className="text-xs text-gray-500">Analytics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-500" /> Secure Login
            </span>
            <span className="w-px h-4 bg-gray-300" />
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4 text-orange-500" /> 24/7 Access
            </span>
            <span className="w-px h-4 bg-gray-300" />
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-red-500" /> Spice Business
            </span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Racha Ruchi</h1>
              <p className="text-xs text-red-600 font-medium">Spice Business Admin</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back! 👋</h2>
            <p className="text-gray-500 mt-1">Sign in to manage your spice business</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          <form id="loginForm" onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                />
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-medium 
                transition-all duration-200 flex items-center justify-center gap-2
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-red-200 hover:scale-[1.01]'}
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Secure Access</span>
            </div>
          </div>

          {/* Firebase Status */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Firebase Authentication Enabled
            </p>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              <Shield className="w-3 h-3 inline mr-1 text-green-500" />
              Your data is encrypted and secure
            </p>
            <p className="text-xs text-gray-400">
              © 2026 Racha Ruchi Spices. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;