// Pages/Settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Store,
  Package,
  Ruler,
  Tag,
  CreditCard,
  Wallet,
  Users,
  Database,
  FileSpreadsheet,
  Save,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  Shield,
  UserPlus,
  UserMinus,
  Key,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Percent,
  Box,
  Carrot,
  ShoppingBag,
  Truck,
  Factory,
  BarChart3,
  Download,
  Upload,
  HardDrive,
  Clock,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Printer,
  Calendar,
  FileText,
  User,
  Ruler as RulerIcon
} from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('business');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);

  // Business Details
  const [businessDetails, setBusinessDetails] = useState({
    name: 'Racha Ruchi',
    owner: 'Rakshitha',
    email: 'racharuchi@email.com',
    phone: '9876543210',
    address: 'M.G. Road, Bangalore - 560001',
    gst: 'GSTIN123456789',
    pan: 'ABCDE1234F',
    fssai: 'FSSAI123456',
    website: 'www.racharuchi.com',
    currency: '₹',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    businessType: 'Food Manufacturing & Retail'
  });

  // Collections Data
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [users, setUsers] = useState([]);

  // Backup Settings
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '23:00',
    backupLocation: 'cloud',
    retentionDays: 30,
    lastBackup: '2026-09-07 11:00 PM',
    backupSize: '45.2 MB',
    includeImages: true
  });

  // Excel Settings
  const [excelSettings, setExcelSettings] = useState({
    defaultExportFormat: 'xlsx',
    includeHeaders: true,
    includeImages: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'currency',
    autoExport: false,
    exportTime: '18:00',
    emailReports: false,
    emailRecipients: 'racharuchi@email.com'
  });

  // Fetch business details from Firebase
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const businessQuery = query(collection(db, 'settings'), where('type', '==', 'business'));
        const snapshot = await getDocs(businessQuery);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setBusinessDetails({
            name: data.name || 'Racha Ruchi',
            owner: data.owner || 'Rakshitha',
            email: data.email || 'racharuchi@email.com',
            phone: data.phone || '9876543210',
            address: data.address || 'M.G. Road, Bangalore - 560001',
            gst: data.gst || 'GSTIN123456789',
            pan: data.pan || 'ABCDE1234F',
            fssai: data.fssai || 'FSSAI123456',
            website: data.website || 'www.racharuchi.com',
            currency: data.currency || '₹',
            timezone: data.timezone || 'Asia/Kolkata',
            dateFormat: data.dateFormat || 'DD/MM/YYYY',
            businessType: data.businessType || 'Food Manufacturing & Retail'
          });
        }
      } catch (error) {
        console.error('Error fetching business details:', error);
      }
    };
    fetchBusinessDetails();
  }, []);

  // Fetch products from Firebase
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setProducts(items);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch units from Firebase
  useEffect(() => {
    const q = query(collection(db, 'units'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setUnits(items);
    }, (error) => {
      console.error('Error fetching units:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch categories from Firebase
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCategories(items);
    }, (error) => {
      console.error('Error fetching categories:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch payment modes from Firebase
  useEffect(() => {
    const q = query(collection(db, 'paymentModes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setPaymentModes(items);
    }, (error) => {
      console.error('Error fetching payment modes:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch expense categories from Firebase
  useEffect(() => {
    const q = query(collection(db, 'expenseCategories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setExpenseCategories(items);
    }, (error) => {
      console.error('Error fetching expense categories:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch users from Firebase
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setUsers(items);
    }, (error) => {
      console.error('Error fetching users:', error);
    });
    return () => unsubscribe();
  }, []);

  // Save Business Details
  const handleBusinessSave = async () => {
    setIsSaving(true);
    try {
      const businessQuery = query(collection(db, 'settings'), where('type', '==', 'business'));
      const snapshot = await getDocs(businessQuery);
      
      const businessData = {
        type: 'business',
        ...businessDetails,
        updatedAt: new Date().toISOString()
      };

      if (!snapshot.empty) {
        await updateDoc(doc(db, 'settings', snapshot.docs[0].id), businessData);
      } else {
        await addDoc(collection(db, 'settings'), {
          ...businessData,
          createdAt: new Date().toISOString()
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving business details:', error);
      alert('Failed to save business details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Product
  const handleAddProduct = async (productData) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    }
  };

  // Update Product
  const handleUpdateProduct = async (id, productData) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        ...productData,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Generic handlers
  const handleAddItem = (section) => {
    setEditingSection(section);
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const getRoleBadge = (role) => {
    const configs = {
      Admin: 'bg-red-50 text-red-700',
      Manager: 'bg-blue-50 text-blue-700',
      Staff: 'bg-green-50 text-green-700'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${configs[role] || configs.Staff}`}>{role}</span>;
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: 'bg-green-50 text-green-700',
      inactive: 'bg-gray-50 text-gray-700'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${configs[status] || configs.inactive}`}>{status}</span>;
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'business':
        return renderBusinessTab();
      case 'products':
        return renderProductsTab();
      case 'units':
        return renderUnitsTab();
      case 'categories':
        return renderCategoriesTab();
      case 'payment':
        return renderPaymentTab();
      case 'expenses':
        return renderExpensesTab();
      case 'users':
        return renderUsersTab();
      case 'backup':
        return renderBackupTab();
      case 'excel':
        return renderExcelTab();
      default:
        return renderBusinessTab();
    }
  };

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
            <p className="text-sm text-gray-500">Manage your business information</p>
          </div>
          <button
            onClick={handleBusinessSave}
            disabled={isSaving}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700">Business details saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Store className="w-4 h-4 inline mr-1.5" /> Business Name
            </label>
            <input
              type="text"
              value={businessDetails.name}
              onChange={(e) => setBusinessDetails({...businessDetails, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <User className="w-4 h-4 inline mr-1.5" /> Owner Name
            </label>
            <input
              type="text"
              value={businessDetails.owner}
              onChange={(e) => setBusinessDetails({...businessDetails, owner: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="w-4 h-4 inline mr-1.5" /> Email
            </label>
            <input
              type="email"
              value={businessDetails.email}
              onChange={(e) => setBusinessDetails({...businessDetails, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="w-4 h-4 inline mr-1.5" /> Phone Number
            </label>
            <input
              type="text"
              value={businessDetails.phone}
              onChange={(e) => setBusinessDetails({...businessDetails, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1.5" /> Address
            </label>
            <input
              type="text"
              value={businessDetails.address}
              onChange={(e) => setBusinessDetails({...businessDetails, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Building2 className="w-4 h-4 inline mr-1.5" /> GST Number
            </label>
            <input
              type="text"
              value={businessDetails.gst}
              onChange={(e) => setBusinessDetails({...businessDetails, gst: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1.5" /> PAN Number
            </label>
            <input
              type="text"
              value={businessDetails.pan}
              onChange={(e) => setBusinessDetails({...businessDetails, pan: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Shield className="w-4 h-4 inline mr-1.5" /> FSSAI Number
            </label>
            <input
              type="text"
              value={businessDetails.fssai}
              onChange={(e) => setBusinessDetails({...businessDetails, fssai: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Globe className="w-4 h-4 inline mr-1.5" /> Website
            </label>
            <input
              type="text"
              value={businessDetails.website}
              onChange={(e) => setBusinessDetails({...businessDetails, website: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <DollarSign className="w-4 h-4 inline mr-1.5" /> Currency
            </label>
            <select
              value={businessDetails.currency}
              onChange={(e) => setBusinessDetails({...businessDetails, currency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-4 h-4 inline mr-1.5" /> Timezone
            </label>
            <select
              value={businessDetails.timezone}
              onChange={(e) => setBusinessDetails({...businessDetails, timezone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
              <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1.5" /> Date Format
            </label>
            <select
              value={businessDetails.dateFormat}
              onChange={(e) => setBusinessDetails({...businessDetails, dateFormat: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Store className="w-4 h-4 inline mr-1.5" /> Business Type
            </label>
            <input
              type="text"
              value={businessDetails.businessType}
              onChange={(e) => setBusinessDetails({...businessDetails, businessType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Products</h3>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <button
          onClick={() => handleAddItem('product')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Unit</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Rate</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">GST %</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{product.unit}</td>
                <td className="px-4 py-3 text-right font-medium">₹{product.rate}</td>
                <td className="px-4 py-3 text-center text-sm">{product.gst}%</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditItem(product)} className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteItem(product)} className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUnitsTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Units</h3>
          <p className="text-sm text-gray-500">Manage measurement units</p>
        </div>
        <button
          onClick={() => handleAddItem('unit')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => (
          <div key={unit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <RulerIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{unit.name}</p>
                  <p className="text-sm text-gray-500">{unit.short} • {unit.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEditItem(unit)} className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                  <Edit className="w-3 h-3" />
                </button>
                <button onClick={() => handleDeleteItem(unit)} className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <p className="text-sm text-gray-500">Manage product and inventory categories</p>
        </div>
        <button
          onClick={() => handleAddItem('category')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEditItem(category)} className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                  <Edit className="w-3 h-3" />
                </button>
                <button onClick={() => handleDeleteItem(category)} className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaymentTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Modes</h3>
          <p className="text-sm text-gray-500">Enable/disable payment methods</p>
        </div>
        <button
          onClick={() => handleAddItem('payment')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Payment Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentModes.map(mode => (
          <div key={mode.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{mode.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPaymentModes(paymentModes.map(m => 
                    m.id === mode.id ? { ...m, enabled: !m.enabled } : m
                  ));
                }}
                className={`relative w-10 h-6 rounded-full transition-colors ${mode.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${mode.enabled ? 'transform translate-x-4' : ''}`} />
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEditItem(mode)} className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                  <Edit className="w-3 h-3" />
                </button>
                <button onClick={() => handleDeleteItem(mode)} className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExpensesTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
          <p className="text-sm text-gray-500">Manage expense categories</p>
        </div>
        <button
          onClick={() => handleAddItem('expense')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenseCategories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEditItem(category)} className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                  <Edit className="w-3 h-3" />
                </button>
                <button onClick={() => handleDeleteItem(category)} className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-500">Manage users and permissions</p>
        </div>
        <button
          onClick={() => handleAddItem('user')}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Role</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Last Login</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-center">{getRoleBadge(user.role)}</td>
                <td className="px-4 py-3 text-center">{getStatusBadge(user.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.lastLogin || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEditItem(user)} className="p-1 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteItem(user)} className="p-1 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Backup Settings</h3>
            <p className="text-sm text-gray-500">Configure automatic backups</p>
          </div>
          <button
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Backup Now
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Auto Backup</span>
              <button
                onClick={() => setBackupSettings({...backupSettings, autoBackup: !backupSettings.autoBackup})}
                className={`relative w-10 h-6 rounded-full transition-colors ${backupSettings.autoBackup ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${backupSettings.autoBackup ? 'transform translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Frequency</span>
              <select
                value={backupSettings.backupFrequency}
                onChange={(e) => setBackupSettings({...backupSettings, backupFrequency: e.target.value})}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Backup Time</span>
              <input
                type="time"
                value={backupSettings.backupTime}
                onChange={(e) => setBackupSettings({...backupSettings, backupTime: e.target.value})}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Location</span>
              <select
                value={backupSettings.backupLocation}
                onChange={(e) => setBackupSettings({...backupSettings, backupLocation: e.target.value})}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="cloud">Cloud</option>
                <option value="local">Local Drive</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Retention (days)</span>
              <input
                type="number"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings({...backupSettings, retentionDays: parseInt(e.target.value)})}
                className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Include Images</span>
              <button
                onClick={() => setBackupSettings({...backupSettings, includeImages: !backupSettings.includeImages})}
                className={`relative w-10 h-6 rounded-full transition-colors ${backupSettings.includeImages ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${backupSettings.includeImages ? 'transform translate-x-4' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Last Backup</p>
              <p className="font-medium text-gray-900">{backupSettings.lastBackup}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Backup Size</p>
              <p className="font-medium text-gray-900">{backupSettings.backupSize}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Storage Used</p>
              <p className="font-medium text-gray-900">2.4 GB</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Backups Available</p>
              <p className="font-medium text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExcelTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Excel Settings</h3>
            <p className="text-sm text-gray-500">Configure Excel export preferences</p>
          </div>
          <button
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Default Export Format</span>
              <select
                value={excelSettings.defaultExportFormat}
                onChange={(e) => setExcelSettings({...excelSettings, defaultExportFormat: e.target.value})}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="xlsx">.xlsx (Excel)</option>
                <option value="xls">.xls (Excel 97-2003)</option>
                <option value="csv">.csv (CSV)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Include Headers</span>
              <button
                onClick={() => setExcelSettings({...excelSettings, includeHeaders: !excelSettings.includeHeaders})}
                className={`relative w-10 h-6 rounded-full transition-colors ${excelSettings.includeHeaders ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${excelSettings.includeHeaders ? 'transform translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Include Images</span>
              <button
                onClick={() => setExcelSettings({...excelSettings, includeImages: !excelSettings.includeImages})}
                className={`relative w-10 h-6 rounded-full transition-colors ${excelSettings.includeImages ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${excelSettings.includeImages ? 'transform translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Date Format</span>
              <select
                value={excelSettings.dateFormat}
                onChange={(e) => setExcelSettings({...excelSettings, dateFormat: e.target.value})}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Number Format</span>
              <select
                value={excelSettings.numberFormat}
                onChange={(e) => setExcelSettings({...excelSettings, numberFormat: e.target.value})}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="currency">Currency</option>
                <option value="number">Number</option>
                <option value="accounting">Accounting</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Auto Export</span>
              <button
                onClick={() => setExcelSettings({...excelSettings, autoExport: !excelSettings.autoExport})}
                className={`relative w-10 h-6 rounded-full transition-colors ${excelSettings.autoExport ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${excelSettings.autoExport ? 'transform translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          {excelSettings.autoExport && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Export Time</span>
                <input
                  type="time"
                  value={excelSettings.exportTime}
                  onChange={(e) => setExcelSettings({...excelSettings, exportTime: e.target.value})}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Email Reports</span>
              <button
                onClick={() => setExcelSettings({...excelSettings, emailReports: !excelSettings.emailReports})}
                className={`relative w-10 h-6 rounded-full transition-colors ${excelSettings.emailReports ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${excelSettings.emailReports ? 'transform translate-x-4' : ''}`} />
              </button>
            </div>
          </div>

          {excelSettings.emailReports && (
            <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Email Recipients</span>
                <input
                  type="text"
                  value={excelSettings.emailRecipients}
                  onChange={(e) => setExcelSettings({...excelSettings, emailRecipients: e.target.value})}
                  placeholder="Enter email addresses separated by comma"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur rounded-xl">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 text-sm">Manage your business configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-xl border border-white/20">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white">Last updated: Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {[
            { id: 'business', label: 'Business', icon: Store },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'units', label: 'Units', icon: RulerIcon },
            { id: 'categories', label: 'Categories', icon: Tag },
            { id: 'payment', label: 'Payment', icon: CreditCard },
            { id: 'expenses', label: 'Expenses', icon: Wallet },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'backup', label: 'Backup', icon: Database },
            { id: 'excel', label: 'Excel', icon: FileSpreadsheet }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 md:p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;