// Pages/PackingMaterials/utils/packingHelpers.js
export const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const MATERIAL_PRESETS = [
  '100g Pouch', '200g Pouch', '500g Pouch', '1kg Pouch',
  'Box (Small)', 'Box (Medium)', 'Box (Large)',
  'Jar (250ml)', 'Jar (500ml)', 'Jar (1L)',
  'Plastic Container', 'Glass Bottle', 'Tin Can',
  'Shrink Wrap', 'Tape Roll', 'Label Sticker'
];

export const PACKING_UNITS = ['pcs', 'rolls', 'sheets', 'meters', 'kg'];

export const emptyMaterialForm = () => ({
  materialName: '',
  size: '',
  unit: 'pcs',
  openingQuantity: '',
  rate: '',
  supplier: '',
  reorderLevel: '',
  remarks: ''
});

export const emptyPurchaseForm = () => ({
  date: localDate(),
  materialName: '',
  quantity: '',
  rate: '',
  amount: '',
  supplier: '',
  unit: 'pcs',
  invoiceNumber: '',
  remarks: ''
});

export const emptyUsageForm = () => ({
  date: localDate(),
  materialName: '',
  used: '',
  damaged: '',
  unit: 'pcs',
  purpose: '',
  remarks: ''
});

/**
 * Calculate stock for a material.
 * Priority: if `currentStock` field exists (updated by Production module),
 * use it; otherwise fall back to derived calculation.
 */
export const calculateStock = (item) => {
  const totalPurchased = item.purchases?.reduce(
    (sum, p) => sum + (Number(p.quantity) || 0), 0
  ) || 0;
  const totalUsed = item.usage?.reduce(
    (sum, u) => sum + (Number(u.used) || 0), 0
  ) || 0;
  const totalDamaged = item.usage?.reduce(
    (sum, u) => sum + (Number(u.damaged) || 0), 0
  ) || 0;
  const totalOut = totalUsed + totalDamaged;

  const derived = (Number(item.openingQuantity) || 0) + totalPurchased - totalOut;
  const currentStock = typeof item.currentStock === 'number'
    ? item.currentStock
    : derived;

  const totalValue = currentStock * (Number(item.rate) || 0);

  return {
    totalPurchased,
    totalUsed,
    totalDamaged,
    totalOut,
    currentStock,
    totalValue
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