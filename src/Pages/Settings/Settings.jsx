import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  User,
  Store,
  KeyRound,
  Bell,
  CreditCard,
  Truck,
  Calculator,
  Code2,
  AlertTriangle,
  Save,
  Undo2,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

// Custom hook for stable input handling
const useFormField = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const onChange = useCallback((e) => setValue(e.target.value), []);
  return [value, onChange, setValue];
};

// Custom hook for password strength
const usePasswordStrength = (password) => {
  const [strength, setStrength] = useState(0);
  const [criteria, setCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    setCriteria(criteria);
    setStrength(Object.values(criteria).filter(Boolean).length);
  }, [password]);

  return { strength, criteria };
};

// Default state objects
const defaultProfile = { ownerName: "", email: "", phone: "", avatarUrl: "" };
const defaultStore = {
  storeName: "",
  slug: "",
  description: "",
  supportEmail: "",
  supportPhone: "",
  address: { line1: "", line2: "", city: "", state: "", country: "India", zip: "" },
};
const defaultSecurity = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
  twoFA: false,
  loginAlerts: true,
};
const defaultNotify = { orderUpdates: true, lowStock: true, weeklyDigest: false, marketing: false };
const defaultPayments = {
  payoutMethod: "bank",
  accountHolder: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  gstin: "",
};
const defaultShipping = { shipFromZip: "", defaultCourier: "", freeShippingMin: "", returnWindowDays: 7 };
const defaultTax = { gstEnabled: true, gstPercent: 18, pan: "", businessType: "individual" };
const defaultApi = { publicKey: "", secretKey: "", webhookUrl: "", sandbox: true };
const defaultErrors = {
  profile: {},
  store: {},
  security: {},
  payments: {},
};

export default function SellerSettingsPage({ isDarkMode = false }) {
  const [active, setActive] = useState("profile");
  const [profile, setProfile] = useState(defaultProfile);
  const [store, setStore] = useState(defaultStore);
  const [security, setSecurity] = useState(defaultSecurity);
  const [notify, setNotify] = useState(defaultNotify);
  const [payments, setPayments] = useState(defaultPayments);
  const [shipping, setShipping] = useState(defaultShipping);
  const [tax, setTax] = useState(defaultTax);
  const [api, setApi] = useState(defaultApi);
  const [errors, setErrors] = useState(defaultErrors);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const savedSettings = JSON.parse(localStorage.getItem("sellerSettings") || "{}");
        setProfile(savedSettings.profile || defaultProfile);
        setStore(savedSettings.store || defaultStore);
        setSecurity(savedSettings.security || defaultSecurity);
        setNotify(savedSettings.notify || defaultNotify);
        setPayments(savedSettings.payments || defaultPayments);
        setShipping(savedSettings.shipping || defaultShipping);
        setTax(savedSettings.tax || defaultTax);
        setApi(savedSettings.api || defaultApi);
      } catch (error) {
        console.error("Failed to load settings:", error);
        setToast({ show: true, message: "Failed to load settings", type: "error" });
      }
    }
  }, []);

  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const settings = {
          profile,
          store,
          security: { ...security, currentPassword: "", newPassword: "", confirmNewPassword: "" },
          notify,
          payments,
          shipping,
          tax,
          api,
        };
        localStorage.setItem("sellerSettings", JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings:", error);
        setToast({ show: true, message: "Failed to save settings", type: "error" });
      }
    }
  }, [profile, store, security, notify, payments, shipping, tax, api]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  const fakeSave = useCallback(
    (section, payload) => {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        saveToLocalStorage();
        showToast(`${section} settings saved successfully`, "success");
        console.log(`Saved ${section}:`, payload);
      }, 1000);
    },
    [saveToLocalStorage, showToast]
  );

  const nav = useMemo(
    () => [
      { id: "profile", label: "Profile", icon: User },
      { id: "store", label: "Store", icon: Store },
      { id: "security", label: "Security", icon: KeyRound },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "payments", label: "Payments", icon: CreditCard },
      { id: "shipping", label: "Shipping", icon: Truck },
      { id: "tax", label: "Tax", icon: Calculator },
      { id: "api", label: "API", icon: Code2 },
      { id: "danger", label: "Danger Zone", icon: AlertTriangle },
    ],
    []
  );

  // Component definitions
  function SectionContainer({ title, description, children, className = "" }) {
    return (
      <section
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </div>
        {children}
      </section>
    );
  }

  function Field({ label, hint, required, error, children, id, className = "" }) {
    return (
      <label className={`block space-y-2 ${className}`} htmlFor={id}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {children}
        {(hint || error) && (
          <span
            id={`${id}-description`}
            className={`text-xs ${error ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
          >
            {error || hint}
          </span>
        )}
      </label>
    );
  }

  function Input({ id, value, onChange, className = "", disabled, type = "text", ...props }) {
    return (
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed ${className}`}
        aria-invalid={!!props["aria-invalid"]}
        aria-describedby={`${id}-description`}
        {...props}
      />
    );
  }

  function Textarea({ id, value, onChange, className = "", disabled, ...props }) {
    return (
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed ${className}`}
        aria-describedby={`${id}-description`}
        {...props}
      />
    );
  }

  function Toggle({ checked, onChange, id, label }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={id}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => e.key === "Enter" && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  function Select({ id, value, onChange, children, className = "", disabled }) {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed ${className}`}
        aria-describedby={`${id}-description`}
      >
        {children}
      </select>
    );
  }

  function SectionActions({ onSave, onReset, saving }) {
    return (
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end dark:border-gray-700">
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          <Undo2 className="h-4 w-4" /> Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    );
  }

  function PasswordStrengthMeter({ strength }) {
    const strengthText = ["Very weak", "Weak", "Moderate", "Strong", "Very strong"][strength];
    const strengthColor = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ][strength];

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs">
          <span>Password strength:</span>
          <span
            className={`font-medium ${
              strength <= 1 ? "text-red-500" : strength <= 2 ? "text-orange-500" : strength <= 3 ? "text-blue-500" : "text-green-500"
            }`}
          >
            {strengthText}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
          <div
            className={`h-full rounded-full ${strengthColor}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  function PasswordCriteria({ criteria }) {
    return (
      <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <p className="font-medium">Password must contain:</p>
        <ul className="space-y-1">
          {[
            { key: "length", text: "At least 8 characters" },
            { key: "uppercase", text: "At least one uppercase letter" },
            { key: "lowercase", text: "At least one lowercase letter" },
            { key: "number", text: "At least one number" },
            { key: "special", text: "At least one special character" },
          ].map(({ key, text }) => (
            <li
              key={key}
              className={`flex items-center ${criteria[key] ? "text-green-600 dark:text-green-400" : ""}`}
            >
              {criteria[key] ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
              {text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Validation functions
  const validateProfile = useCallback(() => {
    const newErrors = {};
    if (!profile.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!profile.email.match(/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/)) newErrors.email = "Invalid email format";
    if (profile.phone && !profile.phone.match(/^\+?[\d\s-]{10,15}$/)) newErrors.phone = "Invalid phone format";
    setErrors((prev) => ({ ...prev, profile: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [profile]);

  const validateStore = useCallback(() => {
    const newErrors = {};
    if (!store.storeName.trim()) newErrors.storeName = "Store name is required";
    if (!store.slug.trim()) newErrors.slug = "Store slug is required";
    setErrors((prev) => ({ ...prev, store: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [store]);

  const validateSecurity = useCallback(() => {
    const newErrors = {};
    if (!security.currentPassword) newErrors.currentPassword = "Current password is required";
    if (security.newPassword && security.newPassword !== security.confirmNewPassword)
      newErrors.confirmNewPassword = "Passwords do not match";
    if (security.newPassword && passwordStrength < 4) newErrors.newPassword = "Password is too weak";
    setErrors((prev) => ({ ...prev, security: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [security]);

  const validatePayments = useCallback(() => {
    const newErrors = {};
    if (payments.payoutMethod === "bank") {
      if (!payments.accountHolder.trim()) newErrors.accountHolder = "Account holder name is required";
      if (!payments.accountNumber.trim()) newErrors.accountNumber = "Account number is required";
      if (!payments.ifsc.trim()) newErrors.ifsc = "IFSC is required";
    } else if (payments.payoutMethod === "upi") {
      if (!payments.upiId.trim()) newErrors.upiId = "UPI ID is required";
    }
    setErrors((prev) => ({ ...prev, payments: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [payments]);

  // Section components
  function ProfileSection() {
    const [ownerName, onOwnerNameChange] = useFormField(profile.ownerName);
    const [email, onEmailChange] = useFormField(profile.email);
    const [phone, onPhoneChange] = useFormField(profile.phone);
    const [avatarUrl, onAvatarUrlChange] = useFormField(profile.avatarUrl);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedProfile = { ownerName, email, phone, avatarUrl };
      setProfile(updatedProfile);
      if (validateProfile()) fakeSave("profile", updatedProfile);
    };

    return (
      <form key="profile-form" onSubmit={handleSubmit}>
        <SectionContainer title="Profile" description="Public-facing owner details. Used on invoices and support.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Owner name" required error={errors.profile?.ownerName} id="ownerName">
              <Input
                id="ownerName"
                value={ownerName}
                onChange={onOwnerNameChange}
                placeholder="e.g., John Doe"
                aria-invalid={!!errors.profile?.ownerName}
              />
            </Field>
            <Field label="Email" required error={errors.profile?.email} id="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={onEmailChange}
                placeholder="owner@shop.com"
                aria-invalid={!!errors.profile?.email}
              />
            </Field>
            <Field label="Phone" error={errors.profile?.phone} id="phone">
              <Input
                id="phone"
                value={phone}
                onChange={onPhoneChange}
                placeholder="+91 98xxxxxxx"
                aria-invalid={!!errors.profile?.phone}
              />
            </Field>
            <Field label="Avatar URL" hint="Square image ≥ 256px recommended" id="avatarUrl">
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={onAvatarUrlChange}
                placeholder="https://..."
              />
            </Field>
            {avatarUrl && (
              <div className="sm:col-span-2 flex items-center justify-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-600">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                    onError={(e) => (e.target.src = "")}
                  />
                </div>
              </div>
            )}
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setProfile(defaultProfile)} onSave={handleSubmit} />
      </form>
    );
  }

  function StoreSection() {
    const [storeName, onStoreNameChange] = useFormField(store.storeName);
    const [slug, onSlugChange] = useFormField(store.slug);
    const [description, onDescriptionChange] = useFormField(store.description);
    const [supportEmail, onSupportEmailChange] = useFormField(store.supportEmail);
    const [supportPhone, onSupportPhoneChange] = useFormField(store.supportPhone);
    const [line1, onLine1Change] = useFormField(store.address.line1);
    const [line2, onLine2Change] = useFormField(store.address.line2);
    const [city, onCityChange] = useFormField(store.address.city);
    const [state, onStateChange] = useFormField(store.address.state);
    const [country, onCountryChange] = useFormField(store.address.country);
    const [zip, onZipChange] = useFormField(store.address.zip);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedStore = {
        storeName,
        slug,
        description,
        supportEmail,
        supportPhone,
        address: { line1, line2, city, state, country, zip },
      };
      setStore(updatedStore);
      if (validateStore()) fakeSave("store", updatedStore);
    };

    return (
      <form key="store-form" onSubmit={handleSubmit}>
        <SectionContainer title="Store" description="Storefront and support information.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Store name" required error={errors.store?.storeName} id="storeName">
              <Input
                id="storeName"
                value={storeName}
                onChange={onStoreNameChange}
                placeholder="TrendZone"
                aria-invalid={!!errors.store?.storeName}
              />
            </Field>
            <Field label="Store URL slug" hint="letters, numbers, hyphens" error={errors.store?.slug} id="slug">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => onSlugChange({ target: { value: e.target.value.replace(/\s+/g, "-").toLowerCase() } })}
                placeholder="trendzone"
                aria-invalid={!!errors.store?.slug}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" id="description">
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={onDescriptionChange}
                  placeholder="What do you sell? Policies, highlights, etc."
                />
              </Field>
            </div>
            <Field label="Support email" id="supportEmail">
              <Input
                id="supportEmail"
                value={supportEmail}
                onChange={onSupportEmailChange}
                placeholder="support@trendzone.in"
              />
            </Field>
            <Field label="Support phone" id="supportPhone">
              <Input
                id="supportPhone"
                value={supportPhone}
                onChange={onSupportPhoneChange}
                placeholder="+91 9xxxxxxxxx"
              />
            </Field>
          </div>
          <div className="mt-6 space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-700/30">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pickup / Return Address</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Address line 1" id="line1">
                <Input id="line1" value={line1} onChange={onLine1Change} placeholder="Flat / House no., Building" />
              </Field>
              <Field label="Address line 2" id="line2">
                <Input id="line2" value={line2} onChange={onLine2Change} placeholder="Street, Area" />
              </Field>
              <Field label="City" id="city">
                <Input id="city" value={city} onChange={onCityChange} />
              </Field>
              <Field label="State" id="state">
                <Input id="state" value={state} onChange={onStateChange} />
              </Field>
              <Field label="Country" id="country">
                <Input id="country" value={country} onChange={onCountryChange} />
              </Field>
              <Field label="PIN / ZIP" id="zip">
                <Input id="zip" value={zip} onChange={onZipChange} />
              </Field>
            </div>
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setStore(defaultStore)} onSave={handleSubmit} />
      </form>
    );
  }

  function SecuritySection() {
    const [currentPassword, onCurrentPasswordChange] = useFormField(security.currentPassword);
    const [newPassword, onNewPasswordChange] = useFormField(security.newPassword);
    const [confirmNewPassword, onConfirmNewPasswordChange] = useFormField(security.confirmNewPassword);
    const { strength, criteria } = usePasswordStrength(newPassword);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedSecurity = {
        ...security,
        currentPassword,
        newPassword,
        confirmNewPassword,
      };
      setSecurity(updatedSecurity);
      if (validateSecurity()) fakeSave("security", updatedSecurity);
    };

    return (
      <form key="security-form" onSubmit={handleSubmit}>
        <SectionContainer title="Security" description="Password & sign-in protection.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Current password" required error={errors.security?.currentPassword} id="currentPassword">
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={onCurrentPasswordChange}
                autoComplete="current-password"
                aria-invalid={!!errors.security?.currentPassword}
              />
            </Field>
            <div className="sm:col-span-2"></div>
            <Field label="New password" required error={errors.security?.newPassword} id="newPassword">
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={onNewPasswordChange}
                autoComplete="new-password"
                aria-invalid={!!errors.security?.newPassword}
              />
              {newPassword && (
                <>
                  <PasswordStrengthMeter strength={strength} />
                  <PasswordCriteria criteria={criteria} />
                </>
              )}
            </Field>
            <Field
              label="Confirm new password"
              required
              error={errors.security?.confirmNewPassword}
              id="confirmNewPassword"
            >
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={onConfirmNewPasswordChange}
                autoComplete="new-password"
                aria-invalid={!!errors.security?.confirmNewPassword}
              />
            </Field>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="twoFA" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Two-factor authentication
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Adds an extra layer of security to your account
                </p>
              </div>
              <Toggle
                checked={security.twoFA}
                onChange={(v) => setSecurity((prev) => ({ ...prev, twoFA: v }))}
                id="twoFA"
                label="Toggle two-factor authentication"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="loginAlerts"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Login alerts
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when someone logs in to your account
                </p>
              </div>
              <Toggle
                checked={security.loginAlerts}
                onChange={(v) => setSecurity((prev) => ({ ...prev, loginAlerts: v }))}
                id="loginAlerts"
                label="Toggle login alerts"
              />
            </div>
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setSecurity(defaultSecurity)} onSave={handleSubmit} />
      </form>
    );
  }

  function NotificationsSection() {
    const handleSubmit = (e) => {
      e.preventDefault();
      fakeSave("notifications", notify);
    };

    return (
      <form key="notifications-form" onSubmit={handleSubmit}>
        <SectionContainer title="Notifications" description="Email & in-app alerts.">
          <div className="space-y-4">
            {[
              { key: "orderUpdates", label: "Order updates", description: "Get notified when customers place new orders" },
              { key: "lowStock", label: "Low stock warnings", description: "Receive alerts when inventory is running low" },
              {
                key: "weeklyDigest",
                label: "Weekly performance digest",
                description: "Weekly summary of your store's performance",
              },
              {
                key: "marketing",
                label: "Product & feature announcements",
                description: "Updates about new features and promotions",
              },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <label htmlFor={n.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {n.label}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{n.description}</p>
                </div>
                <Toggle
                  checked={notify[n.key]}
                  onChange={(v) => setNotify((prev) => ({ ...prev, [n.key]: v }))}
                  id={n.key}
                  label={`Toggle ${n.label}`}
                />
              </div>
            ))}
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setNotify(defaultNotify)} onSave={handleSubmit} />
      </form>
    );
  }

  function PaymentsSection() {
    const [payoutMethod, onPayoutMethodChange] = useFormField(payments.payoutMethod);
    const [accountHolder, onAccountHolderChange] = useFormField(payments.accountHolder);
    const [accountNumber, onAccountNumberChange] = useFormField(payments.accountNumber);
    const [ifsc, onIfscChange] = useFormField(payments.ifsc);
    const [upiId, onUpiIdChange] = useFormField(payments.upiId);
    const [gstin, onGstinChange] = useFormField(payments.gstin);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedPayments = { payoutMethod, accountHolder, accountNumber, ifsc, upiId, gstin };
      setPayments(updatedPayments);
      if (validatePayments()) fakeSave("payments", updatedPayments);
    };

    return (
      <form key="payments-form" onSubmit={handleSubmit}>
        <SectionContainer title="Payments & Payouts" description="Bank/UPI details for settlements.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Payout method" id="payoutMethod">
              <Select id="payoutMethod" value={payoutMethod} onChange={onPayoutMethodChange}>
                <option value="bank">Bank Transfer</option>
                <option value="upi">UPI</option>
              </Select>
            </Field>
            <Field label="GSTIN" hint="If registered for GST" id="gstin">
              <Input
                id="gstin"
                value={gstin}
                onChange={(e) => onGstinChange({ target: { value: e.target.value.toUpperCase() } })}
                placeholder="22AAAAA0000A1Z5"
              />
            </Field>
            {payoutMethod === "bank" ? (
              <>
                <Field label="Account holder name" error={errors.payments?.accountHolder} id="accountHolder">
                  <Input
                    id="accountHolder"
                    value={accountHolder}
                    onChange={onAccountHolderChange}
                    aria-invalid={!!errors.payments?.accountHolder}
                  />
                </Field>
                <Field label="Account number" error={errors.payments?.accountNumber} id="accountNumber">
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={onAccountNumberChange}
                    aria-invalid={!!errors.payments?.accountNumber}
                  />
                </Field>
                <Field label="IFSC" error={errors.payments?.ifsc} id="ifsc">
                  <Input
                    id="ifsc"
                    value={ifsc}
                    onChange={(e) => onIfscChange({ target: { value: e.target.value.toUpperCase() } })}
                    placeholder="HDFC0001234"
                    aria-invalid={!!errors.payments?.ifsc}
                  />
                </Field>
              </>
            ) : (
              <Field label="UPI ID" error={errors.payments?.upiId} id="upiId">
                <Input
                  id="upiId"
                  value={upiId}
                  onChange={onUpiIdChange}
                  placeholder="name@bank"
                  aria-invalid={!!errors.payments?.upiId}
                />
              </Field>
            )}
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setPayments(defaultPayments)} onSave={handleSubmit} />
      </form>
    );
  }

  function ShippingSection() {
    const [shipFromZip, onShipFromZipChange] = useFormField(shipping.shipFromZip);
    const [defaultCourier, onDefaultCourierChange] = useFormField(shipping.defaultCourier);
    const [freeShippingMin, onFreeShippingMinChange] = useFormField(shipping.freeShippingMin);
    const [returnWindowDays, onReturnWindowDaysChange] = useFormField(shipping.returnWindowDays);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedShipping = {
        shipFromZip,
        defaultCourier,
        freeShippingMin,
        returnWindowDays: Number(returnWindowDays),
      };
      setShipping(updatedShipping);
      fakeSave("shipping", updatedShipping);
    };

    return (
      <form key="shipping-form" onSubmit={handleSubmit}>
        <SectionContainer title="Shipping & Returns" description="Default shipping preferences and return policy.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Ship-from PIN / ZIP" id="shipFromZip">
              <Input id="shipFromZip" value={shipFromZip} onChange={onShipFromZipChange} />
            </Field>
            <Field label="Preferred courier" id="defaultCourier">
              <Input
                id="defaultCourier"
                value={defaultCourier}
                onChange={onDefaultCourierChange}
                placeholder="Delhivery / Bluedart / DTDC"
              />
            </Field>
            <Field label="Free shipping minimum (₹)" id="freeShippingMin">
              <Input
                id="freeShippingMin"
                type="number"
                value={freeShippingMin}
                onChange={onFreeShippingMinChange}
                placeholder="999"
              />
            </Field>
            <Field label="Return window (days)" id="returnWindowDays">
              <Input
                id="returnWindowDays"
                type="number"
                value={returnWindowDays}
                onChange={onReturnWindowDaysChange}
                placeholder="7"
              />
            </Field>
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setShipping(defaultShipping)} onSave={handleSubmit} />
      </form>
    );
  }

  function TaxSection() {
    const [gstPercent, onGstPercentChange] = useFormField(tax.gstPercent);
    const [pan, onPanChange] = useFormField(tax.pan);
    const [businessType, onBusinessTypeChange] = useFormField(tax.businessType);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedTax = { ...tax, gstPercent: Number(gstPercent), pan, businessType };
      setTax(updatedTax);
      fakeSave("tax", updatedTax);
    };

    return (
      <form key="tax-form" onSubmit={handleSubmit}>
        <SectionContainer title="Tax (India)" description="GST settings for invoices and orders.">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <label htmlFor="gstEnabled" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Collect GST
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enable if you're registered for GST</p>
              </div>
              <Toggle
                checked={tax.gstEnabled}
                onChange={(v) => setTax((prev) => ({ ...prev, gstEnabled: v }))}
                id="gstEnabled"
                label="Toggle GST collection"
              />
            </div>
            {tax.gstEnabled && (
              <Field label="GST %" id="gstPercent">
                <Input
                  id="gstPercent"
                  type="number"
                  value={gstPercent}
                  onChange={onGstPercentChange}
                />
              </Field>
            )}
            <Field label="PAN" id="pan">
              <Input
                id="pan"
                value={pan}
                onChange={(e) => onPanChange({ target: { value: e.target.value.toUpperCase() } })}
                placeholder="ABCDE1234F"
              />
            </Field>
            <Field label="Business type" id="businessType">
              <Select id="businessType" value={businessType} onChange={onBusinessTypeChange}>
                <option value="individual">Individual</option>
                <option value="sole">Sole Proprietor</option>
                <option value="llp">LLP</option>
                <option value="pvtltd">Private Limited</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setTax(defaultTax)} onSave={handleSubmit} />
      </form>
    );
  }

  function ApiSection() {
    const [publicKey, onPublicKeyChange] = useFormField(api.publicKey);
    const [secretKey, onSecretKeyChange] = useFormField(api.secretKey);
    const [webhookUrl, onWebhookUrlChange] = useFormField(api.webhookUrl);

    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedApi = { publicKey, secretKey, webhookUrl, sandbox: api.sandbox };
      setApi(updatedApi);
      fakeSave("api", updatedApi);
    };

    return (
      <form key="api-form" onSubmit={handleSubmit}>
        <SectionContainer title="API & Webhooks" description="For custom integrations with your store.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Public key" id="publicKey">
              <Input
                id="publicKey"
                value={publicKey}
                onChange={onPublicKeyChange}
                placeholder="pk_live_..."
              />
            </Field>
            <Field label="Secret key" id="secretKey">
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={onSecretKeyChange}
                placeholder="sk_live_..."
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Webhook URL" hint="We'll POST order events to this URL" id="webhookUrl">
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={onWebhookUrlChange}
                  placeholder="https://api.yourdomain.com/webhooks/orders"
                />
              </Field>
            </div>
            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <label htmlFor="sandbox" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use sandbox mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Test API calls without affecting live data
                </p>
              </div>
              <Toggle
                checked={api.sandbox}
                onChange={(v) => setApi((prev) => ({ ...prev, sandbox: v }))}
                id="sandbox"
                label="Toggle sandbox mode"
              />
            </div>
          </div>
        </SectionContainer>
        <SectionActions saving={saving} onReset={() => setApi(defaultApi)} onSave={handleSubmit} />
      </form>
    );
  }

  function DangerSection() {
    const [deleteConfirm, onDeleteConfirmChange] = useFormField("");

    const handleSubmit = (e) => {
      e.preventDefault();
      if (deleteConfirm === "DELETE") {
        localStorage.removeItem("sellerSettings");
        setProfile(defaultProfile);
        setStore(defaultStore);
        setSecurity(defaultSecurity);
        setNotify(defaultNotify);
        setPayments(defaultPayments);
        setShipping(defaultShipping);
        setTax(defaultTax);
        setApi(defaultApi);
        onDeleteConfirmChange({ target: { value: "" } });
        showToast("Store deleted successfully", "success");
      } else {
        showToast("Confirmation text does not match", "error");
      }
    };

    return (
      <form key="danger-form" onSubmit={handleSubmit}>
        <SectionContainer title="Danger Zone" description="Irreversible actions. Handle with care.">
          <div className="space-y-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Delete store</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    This will permanently remove your store, products, and orders.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:w-96">
                  <Input
                    id="deleteConfirm"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirm}
                    onChange={onDeleteConfirmChange}
                    className="border-red-300 focus:border-red-500 focus:ring-red-500"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete Store
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </form>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Settings</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Manage your account, store details, payments, and more
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onKeyDown={(e) => e.key === "Enter" && setMobileMenuOpen(!mobileMenuOpen)}
            className="mb-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm lg:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <span>{nav.find((item) => item.id === active)?.label || "Menu"}</span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${mobileMenuOpen ? "rotate-90" : ""}`}
            />
          </button>

          <aside className="hidden lg:col-span-3 lg:block">
            <nav className="space-y-1">
              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  onKeyDown={(e) => e.key === "Enter" && setActive(item.id)}
                  className={`group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active === item.id
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      active === item.id
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                    }`}
                  />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {mobileMenuOpen && (
            <div className="lg:hidden">
              <nav className="mb-6 space-y-1 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {nav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActive(item.id);
                      setMobileMenuOpen(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (setActive(item.id), setMobileMenuOpen(false))}
                    className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active === item.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        active === item.id
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400"
                      }`}
                    />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          <main className="lg:col-span-9">
            {active === "profile" && <ProfileSection />}
            {active === "store" && <StoreSection />}
            {active === "security" && <SecuritySection />}
            {active === "notifications" && <NotificationsSection />}
            {active === "payments" && <PaymentsSection />}
            {active === "shipping" && <ShippingSection />}
            {active === "tax" && <TaxSection />}
            {active === "api" && <ApiSection />}
            {active === "danger" && <DangerSection />}
          </main>
        </div>
      </div>

      {toast.show && (
        <div
          role="alert"
          className={`fixed bottom-4 right-4 z-50 flex items-center rounded-md border px-4 py-3 shadow-lg sm:bottom-6 sm:right-6 ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
          ) : (
            <X className="h-5 w-5 text-red-500 dark:text-red-400" />
          )}
          <span className="ml-2 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="ml-4 text-sm font-medium"
            aria-label="Close toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
