import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, FiPhone, FiMail, FiCreditCard, FiEye, FiEyeOff, FiCheck
} from 'react-icons/fi';

// Step 1: Personal Details Component
const PersonalDetails = ({ formData, handleChange, errors, nextStep }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b pb-2">Personal Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter your full name"
          />
        </div>
        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiPhone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            maxLength="10"
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter 10-digit mobile number"
          />
        </div>
        {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter your email address"
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Aadhaar Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiCreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            name="aadhaar"
            value={formData.aadhaar}
            onChange={handleChange}
            maxLength="12"
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.aadhaar ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter 12-digit Aadhaar number"
          />
        </div>
        {errors.aadhaar && <p className="text-red-500 text-xs mt-1">{errors.aadhaar}</p>}
      </div>

      <button
        onClick={nextStep}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mt-6 transition-colors"
      >
        Continue to Business Details
      </button>
    </div>
  );
};

// Step 2: Business Details Component
const BusinessDetails = ({ formData, handleChange, errors, prevStep, nextStep }) => {
  const businessTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'proprietorship', label: 'Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llp', label: 'LLP' },
    { value: 'pvt-ltd', label: 'Private Limited' },
    { value: 'public-ltd', label: 'Public Limited' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b pb-2">Business Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Business Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiCreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.businessName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter your business name"
          />
        </div>
        {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Business Type <span className="text-red-500">*</span>
        </label>
        <select
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {businessTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          GSTIN {formData.businessType === 'proprietorship' && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiCreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.gstin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter 15-digit GSTIN"
          />
        </div>
        {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          PAN Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiCreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            name="pan"
            value={formData.pan}
            onChange={handleChange}
            maxLength="10"
            className={`pl-10 w-full border rounded-md px-3 py-2 text-sm ${errors.pan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Enter 10-character PAN (e.g., ABCDE1234F)"
          />
        </div>
        {errors.pan && <p className="text-red-500 text-xs mt-1">{errors.pan}</p>}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
        >
          Continue to Account Setup
        </button>
      </div>
    </div>
  );
};

// Step 3: Account Setup Component
const AccountSetup = ({ formData, handleChange, errors, prevStep, handleSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b pb-2">Account Security</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full border rounded-md px-3 py-2 text-sm ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Create password (min 8 characters)"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <FiEye className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full border rounded-md px-3 py-2 text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FiEyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <FiEye className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Security Question <span className="text-red-500">*</span>
        </label>
        <select
          name="securityQuestion"
          value={formData.securityQuestion}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Select a security question</option>
          <option value="pet">What was the name of your first pet?</option>
          <option value="school">What was the name of your elementary school?</option>
          <option value="city">In which city were you born?</option>
        </select>
        {errors.securityQuestion && <p className="text-red-500 text-xs mt-1">{errors.securityQuestion}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Security Answer <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="securityAnswer"
          value={formData.securityAnswer}
          onChange={handleChange}
          className={`w-full border rounded-md px-3 py-2 text-sm ${errors.securityAnswer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          placeholder="Enter your answer"
        />
        {errors.securityAnswer && <p className="text-red-500 text-xs mt-1">{errors.securityAnswer}</p>}
      </div>

      <div className="flex items-start mt-4">
        <input
          type="checkbox"
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleChange}
          className="mt-1 text-blue-600 dark:text-blue-400"
        />
        <label className="ml-3 text-sm text-gray-700 dark:text-gray-300">
          I agree to the <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms and Conditions</a> and <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
        </label>
      </div>
      {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted}</p>}

      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
        >
          Complete Registration
        </button>
      </div>
    </div>
  );
};

// Main Seller Registration Component
const SellerRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    try {
      return parseInt(localStorage.getItem('registrationStep')) || 1;
    } catch (e) {
      console.warn('Could not access localStorage for step:', e);
      return 1;
    }
  });

  const [formData, setFormData] = useState(() => {
    try {
      const savedData = localStorage.getItem('sellerRegistrationData');
      return savedData ? JSON.parse(savedData) : {
        fullName: '',
        mobile: '',
        email: '',
        aadhaar: '',
        businessName: '',
        businessType: 'individual',
        gstin: '',
        pan: '',
        password: '',
        confirmPassword: '',
        securityQuestion: '',
        securityAnswer: '',
        termsAccepted: false,
      };
    } catch (e) {
      console.warn('Could not access localStorage for form data:', e);
      return {
        fullName: '',
        mobile: '',
        email: '',
        aadhaar: '',
        businessName: '',
        businessType: 'individual',
        gstin: '',
        pan: '',
        password: '',
        confirmPassword: '',
        securityQuestion: '',
        securityAnswer: '',
        termsAccepted: false,
      };
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem('sellerRegistrationData', JSON.stringify(formData));
      localStorage.setItem('registrationStep', step.toString());
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [formData, step]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.mobile.match(/^\d{10}$/)) newErrors.mobile = 'Enter valid 10-digit mobile number';
      if (!formData.email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) newErrors.email = 'Enter valid email';
      if (!formData.aadhaar.match(/^\d{12}$/)) newErrors.aadhaar = 'Enter valid 12-digit Aadhaar number';
    } else if (step === 2) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (formData.businessType === 'proprietorship' && !formData.gstin.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/)) {
        newErrors.gstin = 'Enter valid 15-digit GSTIN';
      }
      if (!formData.pan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) newErrors.pan = 'Enter valid PAN (e.g., ABCDE1234F)';
    } else if (step === 3) {
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.securityQuestion) newErrors.securityQuestion = 'Select a security question';
      if (!formData.securityAnswer.trim()) newErrors.securityAnswer = 'Security answer is required';
      if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      try {
        // Save seller data and token
        localStorage.setItem('sellerToken', 'mock-token');
        localStorage.setItem('sellerData', JSON.stringify({
          fullName: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
          aadhaar: formData.aadhaar,
          businessName: formData.businessName,
          businessType: formData.businessType,
          gstin: formData.gstin,
          pan: formData.pan,
        }));
        // Clear temporary registration data
        localStorage.removeItem('sellerRegistrationData');
        localStorage.removeItem('registrationStep');
        console.log('Form submitted:', formData);
        navigate('/dashboard');
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Seller Registration</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          {['Personal', 'Business', 'Account'].map((label, index) => (
            <div key={label} className="flex flex-col items-center z-10">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                step > index + 1 ? 'bg-green-500 text-white' : 
                step === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {step > index + 1 ? <FiCheck className="h-5 w-5" /> : index + 1}
              </div>
              <div className={`text-xs mt-2 ${
                step >= index + 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {label}
              </div>
            </div>
          ))}
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600 -z-1">
            <div 
              className="h-1 bg-blue-600 transition-all duration-300" 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <PersonalDetails 
            formData={formData} 
            handleChange={handleChange} 
            errors={errors} 
            nextStep={nextStep} 
          />
        )}

        {step === 2 && (
          <BusinessDetails 
            formData={formData} 
            handleChange={handleChange} 
            errors={errors} 
            prevStep={prevStep} 
            nextStep={nextStep} 
          />
        )}

        {step === 3 && (
          <AccountSetup 
            formData={formData} 
            handleChange={handleChange} 
            errors={errors} 
            prevStep={prevStep} 
            handleSubmit={handleSubmit} 
          />
        )}
      </div>
    </div>
  );
};

export default SellerRegistration;