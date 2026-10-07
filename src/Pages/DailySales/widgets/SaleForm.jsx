// Pages/DailySales/widgets/SaleForm.jsx
import React from 'react';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { fmt, recalcSale, emptySaleForm, previewInvoice } from '../utils/salesHelpers';

const SaleForm = ({
  formData, patchForm, setFormData,
  isEditing, saving,
  customerList, productList, stockMap,
  selectedDate,
  onSave, onCancel
}) => {
  const updateProduct = (id, field, value) => {
    const products = formData.products.map(p => {
      if (p.id !== id) return p;
      const u = { ...p, [field]: value };
      if (field === 'productName') {
        const found = productList.find(x => x.name === value);
        if (found) u.unit = found.unit;
      }
      u.total = (parseFloat(u.quantity) || 0) * (parseFloat(u.rate) || 0)
        - ((parseFloat(u.quantity) || 0) * (parseFloat(u.rate) || 0) * (parseFloat(u.discount) || 0)) / 100;
      return u;
    });
    patchForm({ products, ...recalcSale(products) });
  };

  const addProductRow = () => {
    patchForm({
      products: [...formData.products,
        { id: Date.now(), productName: '', quantity: '', rate: '', discount: '', total: '', unit: 'kg' }]
    });
  };

  const removeProductRow = (id) => {
    if (formData.products.length <= 1) return;
    const products = formData.products.filter(p => p.id !== id);
    patchForm({ products, ...recalcSale(products) });
  };

  const handleCustomerName = (value) => {
    const match = customerList.find(c => c.customerName === value);
    if (match) {
      patchForm({
        customerName: value, customerId: match.id,
        customerPhone: formData.customerPhone || match.mobile || '',
        customerAddress: formData.customerAddress || match.address || '',
        customerType: match.customerType || formData.customerType
      });
    } else {
      patchForm({ customerName: value, customerId: null });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Sale' : 'New Sale Entry'}</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
      </div>

      {/* Header fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Date *</label>
          <input type="date" value={formData.date}
            onChange={async (e) => {
              const d = e.target.value;
              patchForm({ date: d });
              if (!isEditing) patchForm({ invoiceNumber: await previewInvoice(d) });
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name *</label>
          <input type="text" list="customers-list" value={formData.customerName}
            onChange={e => handleCustomerName(e.target.value)}
            placeholder="Type or pick a saved customer"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          <datalist id="customers-list">
            {customerList.map(c => <option key={c.id} value={c.customerName}>{c.mobile ? `${c.customerName} — ${c.mobile}` : c.customerName}</option>)}
          </datalist>
          {formData.customerId
            ? <p className="text-xs text-green-600 mt-1">✓ Linked to saved customer</p>
            : formData.customerName.trim() && <p className="text-xs text-blue-600 mt-1">🆕 Will auto-create new customer</p>
          }
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Type</label>
          <select value={formData.customerType} onChange={e => patchForm({ customerType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg">
            <option value="hotel">🏨 Hotel / Restaurant</option>
            <option value="shop">🏪 Shop / Store</option>
            <option value="individual">👤 Individual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input type="text" value={formData.customerPhone} onChange={e => patchForm({ customerPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <input type="text" value={formData.customerAddress} onChange={e => patchForm({ customerAddress: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Products */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Products * (live stock)</label>
          <button onClick={addProductRow} className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Available', 'Qty', 'Unit', 'Rate', 'Disc %'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-2.5">{h}</th>
                ))}
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-3 py-2.5">Total</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.products.map(p => {
                const st = stockMap[p.productName];
                return (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <input type="text" list={`products-${p.id}`} value={p.productName}
                        onChange={e => updateProduct(p.id, 'productName', e.target.value)}
                        placeholder="Search product..."
                        className="w-40 px-2 py-1.5 border border-gray-200 rounded text-sm" />
                      <datalist id={`products-${p.id}`}>{productList.map(x => <option key={x.id} value={x.name} />)}</datalist>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {st ? `${st.currentStock.toFixed(3)} ${st.unit}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={p.quantity} onChange={e => updateProduct(p.id, 'quantity', e.target.value)}
                        placeholder="0" step="0.01" className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={p.unit} onChange={e => updateProduct(p.id, 'unit', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm">
                        {['kg', 'g', 'L', 'ml', 'pcs', 'box'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={p.rate} onChange={e => updateProduct(p.id, 'rate', e.target.value)}
                        placeholder="0" step="0.01" className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={p.discount} onChange={e => updateProduct(p.id, 'discount', e.target.value)}
                        placeholder="0" step="0.01" className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      ₹{p.total ? parseFloat(p.total).toFixed(2) : '0.00'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => removeProductRow(p.id)} disabled={formData.products.length <= 1}
                        className={`p-1 rounded-lg ${formData.products.length <= 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Subtotal</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(formData.subtotal)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Discount</p>
          <p className="text-2xl font-bold text-red-600">-{fmt(formData.totalDiscount)}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
          <p className="text-sm text-gray-600">Grand Total</p>
          <p className="text-2xl font-bold text-orange-600">{fmt(formData.grandTotal)}</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea value={formData.notes} onChange={e => patchForm({ notes: e.target.value })} rows="2"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
      </div>

      {/* Automation info */}
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-100 rounded-lg"><AlertCircle className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-sm font-medium text-blue-800">On save:</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {[
                'daily_sales (sale doc)',
                'stock (sold quantity)',
                'customers (auto-create + outstanding)',
                'counters (invoice seq)'
              ].map(t => (
                <span key={t} className="text-xs bg-white/80 px-2 py-1 rounded-full text-blue-700">{t}</span>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-2">
              💡 Record payments against this sale via the <b>Add Payment</b> action in the sales list.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button onClick={() => setFormData(emptySaleForm(selectedDate))}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Reset</button>
        <button onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button onClick={onSave} disabled={saving}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : (isEditing ? 'Update Sale' : 'Save Sale')}
        </button>
      </div>
    </div>
  );
};

export default SaleForm;