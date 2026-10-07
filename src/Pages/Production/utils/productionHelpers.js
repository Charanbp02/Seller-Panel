// Pages/Production/utils/productionHelpers.js
export const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const toDateString = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.toDate) return localDate(val.toDate());
  if (val instanceof Date) return localDate(val);
  return '';
};

export const num = (v) => Number(v) || 0;
export const fmt2 = (v) => num(v).toFixed(2);

export const emptyForm = () => ({
  date: localDate(),
  productName: '',
  produced: '',
  unit: 'kg',
  remarks: '',
  packingUsed: []   // [{ materialName, quantity, unit }]
});

export const stockStatus = (stock) => {
  if (!stock || stock.currentStock === undefined)
    return { color: 'text-gray-600 bg-gray-50', label: 'No Data' };
  if (stock.currentStock <= 10)
    return { color: 'text-red-600 bg-red-50', label: 'Critical' };
  if (stock.currentStock <= 25)
    return { color: 'text-yellow-600 bg-yellow-50', label: 'Low' };
  return { color: 'text-green-600 bg-green-50', label: 'Good' };
};

export const showToast = (text) => {
  const el = document.createElement('div');
  el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

export const PACKING_UNITS = ['pcs', 'rolls', 'sheets', 'meters', 'kg'];