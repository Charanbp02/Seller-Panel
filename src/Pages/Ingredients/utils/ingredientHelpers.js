// Pages/Ingredients/utils/ingredientHelpers.js
export const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const INGREDIENT_PRESETS = [
  'Byadgi Chilli',
  'Guntur Chilli',
  'Coriander Seeds',
  'Coriander Powder',
  'Cumin Seeds',
  'Fenugreek Seeds',
  'Black Pepper',
  'Mustard Seeds',
  'Chana Dal',
  'Urad Dal',
  'Turmeric Powder',
  'Asafoetida',
  'Dry Curry Leaves',
  'Cinnamon',
  'Cloves',
  'Star Anise',
  'Fennel Seeds',
  'Tamarind',
  'Rice',
  'Salt'
];

export const INVENTORY_UNITS = ['kg', 'g', 'L', 'ml', 'pcs'];

export const emptyInventoryForm = () => ({
  ingredientName: '',
  unit: 'kg',
  openingStock: '',
  purchaseRate: '',
  supplier: '',
  reorderLevel: '',
  remarks: ''
});

export const emptyPurchaseForm = () => ({
  date: localDate(),
  ingredientName: '',
  quantity: '',
  rate: '',
  amount: '',
  supplier: '',
  unit: 'kg',
  invoiceNumber: '',
  remarks: ''
});

export const emptyUsageForm = () => ({
  date: localDate(),
  ingredientName: '',
  productionUsage: '',
  wastage: '',
  unit: 'kg',
  purpose: '',
  remarks: ''
});

// Stock calculation (moved from component)
export const calculateStock = (item) => {
  const totalPurchased = item.purchases?.reduce((sum, p) => sum + p.quantity, 0) || 0;
  const totalProductionUsage = item.usage?.reduce((sum, u) => sum + u.productionUsage, 0) || 0;
  const totalWastage = item.usage?.reduce((sum, u) => sum + u.wastage, 0) || 0;
  const totalUsed = totalProductionUsage + totalWastage;
  const currentStock = item.openingStock + totalPurchased - totalUsed;
  const stockValue = currentStock * item.purchaseRate;
  return {
    totalPurchased,
    totalProductionUsage,
    totalWastage,
    totalUsed,
    currentStock,
    stockValue
  };
};

export const getStockStatus = (item) => {
  if (item.currentStock <= 0)
    return { color: 'text-red-600 bg-red-50 border-red-200', label: 'Out of Stock', iconName: 'AlertOctagon' };
  if (item.currentStock <= item.reorderLevel)
    return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Low Stock', iconName: 'AlertTriangle' };
  return { color: 'text-green-600 bg-green-50 border-green-200', label: 'In Stock', iconName: 'CheckCircle' };
};

export const TABS = [
  { key: 'inventory', label: 'Inventory', iconName: 'Box' },
  { key: 'purchase', label: 'Purchase', iconName: 'ShoppingCart' },
  { key: 'usage', label: 'Usage', iconName: 'TrendingDown' }
];