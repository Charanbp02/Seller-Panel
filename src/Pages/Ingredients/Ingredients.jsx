// Pages/Ingredients/Ingredients.jsx
import React, { useState, useEffect } from 'react';
import { Box, ShoppingCart, TrendingDown, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query, where,
  orderBy, onSnapshot, serverTimestamp, getDocs
} from 'firebase/firestore';

import {
  localDate, calculateStock,
  emptyInventoryForm, emptyPurchaseForm, emptyUsageForm
} from './utils/ingredientHelpers';

import IngredientsHeader from './widgets/IngredientsHeader';
import SummaryCards from './widgets/SummaryCards';
import InventoryForm from './widgets/InventoryForm';
import PurchaseForm from './widgets/PurchaseForm';
import UsageForm from './widgets/UsageForm';
import InventoryTable from './widgets/InventoryTable';
import PurchasesTable from './widgets/PurchasesTable';
import UsageTable from './widgets/UsageTable';
import IngredientViewModal from './widgets/IngredientViewModal';
import DeleteConfirmModal from './widgets/DeleteConfirmModal';

const TAB_ICONS = { inventory: Box, purchase: ShoppingCart, usage: TrendingDown };
const TAB_LABELS = { inventory: 'Inventory', purchase: 'Purchase', usage: 'Usage' };

const Ingredients = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [formType, setFormType] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  // ★ New: unified delete target for ingredient OR nested row
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'purchase' | 'usage', row, ingredientId }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inventoryData, setInventoryData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [usageData, setUsageData] = useState([]);

  const [inventoryFormData, setInventoryFormData] = useState(emptyInventoryForm());
  const [purchaseFormData, setPurchaseFormData] = useState(emptyPurchaseForm());
  const [usageFormData, setUsageFormData] = useState(emptyUsageForm());

  // ---------- Listeners ----------
  useEffect(() => {
    const q = query(collection(db, 'ingredients'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      (snap) => {
        setInventoryData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => { console.error('ingredients listener:', e); setLoading(false); }
    );
    return () => unsub();
  }, []);

  // Flatten purchases + usage
  useEffect(() => {
    if (inventoryData.length === 0) {
      setPurchaseData([]);
      setUsageData([]);
      return;
    }
    const allPurchases = [];
    const allUsage = [];
    inventoryData.forEach(item => {
      (item.purchases || []).forEach(p => {
        allPurchases.push({
          ...p,
          ingredientId: item.id,                 // ★ track parent
          ingredientName: item.ingredientName,
          unit: item.unit,
          supplier: p.supplier || item.supplier
        });
      });
      (item.usage || []).forEach(u => {
        allUsage.push({
          ...u,
          ingredientId: item.id,                 // ★ track parent
          ingredientName: item.ingredientName,
          unit: item.unit
        });
      });
    });
    setPurchaseData(allPurchases.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setUsageData(allUsage.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, [inventoryData]);

  // ---------- Derived ----------
  const inventoryWithStock = inventoryData.map(item => ({
    ...item,
    ...calculateStock(item)
  }));

  const filteredInventory = inventoryWithStock.filter(item =>
    item.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPurchases = purchaseData.filter(item =>
    item.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredUsage = usageData.filter(item =>
    item.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.purpose && item.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalItems = inventoryData.length;
  const totalStockValue = inventoryWithStock.reduce((s, i) => s + (i.stockValue || 0), 0);
  const lowStockItems = inventoryWithStock.filter(i => i.currentStock <= i.reorderLevel);
  const outOfStockItems = inventoryWithStock.filter(i => i.currentStock <= 0);

  // ---------- Ingredient Handlers ----------
  const handleAddIngredient = async () => {
    if (!inventoryFormData.ingredientName || !inventoryFormData.openingStock) {
      alert('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ingredientName: inventoryFormData.ingredientName,
        unit: inventoryFormData.unit || 'kg',
        openingStock: parseFloat(inventoryFormData.openingStock),
        purchaseRate: parseFloat(inventoryFormData.purchaseRate) || 0,
        supplier: inventoryFormData.supplier || '',
        reorderLevel: parseFloat(inventoryFormData.reorderLevel) || 0,
        remarks: inventoryFormData.remarks || '',
        updatedAt: serverTimestamp()
      };

      if (isEditing && editingId) {
        await updateDoc(doc(db, 'ingredients', editingId), payload);
      } else {
        await addDoc(collection(db, 'ingredients'), {
          ...payload,
          purchases: [],
          usage: [],
          createdAt: serverTimestamp()
        });
      }

      closeForm();
      alert(`Ingredient ${isEditing ? 'updated' : 'added'} successfully!`);
    } catch (e) {
      console.error('save ingredient:', e);
      alert('Failed to save ingredient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPurchase = async () => {
    if (!purchaseFormData.ingredientName || !purchaseFormData.quantity || !purchaseFormData.rate) {
      alert('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const ingredientRef = await findIngredientByName(purchaseFormData.ingredientName);
      if (!ingredientRef) { alert('Ingredient not found'); return; }

      const newPurchase = {
        date: purchaseFormData.date,
        quantity: parseFloat(purchaseFormData.quantity),
        rate: parseFloat(purchaseFormData.rate),
        amount: parseFloat(purchaseFormData.quantity) * parseFloat(purchaseFormData.rate),
        invoice: purchaseFormData.invoiceNumber || `INV-${Date.now()}`,
        supplier: purchaseFormData.supplier || '',
        remarks: purchaseFormData.remarks || ''
      };

      const currentData = inventoryData.find(i => i.id === ingredientRef);
      const updatedPurchases = [...(currentData?.purchases || []), newPurchase];

      await updateDoc(doc(db, 'ingredients', ingredientRef), {
        purchases: updatedPurchases,
        updatedAt: serverTimestamp()
      });

      closeForm();
      alert('Purchase added successfully!');
    } catch (e) {
      console.error('save purchase:', e);
      alert('Failed to add purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUsage = async () => {
    if (!usageFormData.ingredientName || (!usageFormData.productionUsage && !usageFormData.wastage)) {
      alert('Please fill at least one usage field');
      return;
    }
    setSaving(true);
    try {
      const ingredientRef = await findIngredientByName(usageFormData.ingredientName);
      if (!ingredientRef) { alert('Ingredient not found'); return; }

      const currentData = inventoryData.find(i => i.id === ingredientRef);
      const stock = calculateStock(currentData);
      const productionUsage = parseFloat(usageFormData.productionUsage) || 0;
      const wastage = parseFloat(usageFormData.wastage) || 0;
      const totalUsed = productionUsage + wastage;

      if (stock.currentStock < totalUsed) {
        alert(`Insufficient stock! Available: ${stock.currentStock.toFixed(1)} ${currentData.unit}`);
        return;
      }

      const newUsage = {
        date: usageFormData.date,
        productionUsage,
        wastage,
        purpose: usageFormData.purpose || '',
        remarks: usageFormData.remarks || ''
      };

      const updatedUsage = [...(currentData?.usage || []), newUsage];

      await updateDoc(doc(db, 'ingredients', ingredientRef), {
        usage: updatedUsage,
        updatedAt: serverTimestamp()
      });

      closeForm();
      alert('Usage added successfully!');
    } catch (e) {
      console.error('save usage:', e);
      alert('Failed to add usage. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditIngredient = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setInventoryFormData({
      ingredientName: item.ingredientName,
      unit: item.unit,
      openingStock: item.openingStock.toString(),
      purchaseRate: item.purchaseRate.toString(),
      supplier: item.supplier || '',
      reorderLevel: item.reorderLevel?.toString() || '',
      remarks: item.remarks || ''
    });
    setActiveTab('inventory');
    setFormType('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------- Ingredient DELETE ----------
  const handleDelete = (id) => {
    setDeleteId(id);
    setDeleteTarget(null);       // ★ clear row target
    setShowDeleteModal(true);
  };

  // ---------- Purchase Row DELETE ----------
  const handleDeletePurchaseRow = (purchaseRow) => {
    if (!purchaseRow || !purchaseRow.ingredientId) {
      alert('Cannot identify parent ingredient for this purchase.');
      return;
    }
    setDeleteTarget({ type: 'purchase', row: purchaseRow });
    setDeleteId(null);
    setShowDeleteModal(true);
  };

  // ---------- Usage Row DELETE ----------
  const handleDeleteUsageRow = (usageRow) => {
    if (!usageRow || !usageRow.ingredientId) {
      alert('Cannot identify parent ingredient for this usage entry.');
      return;
    }
    setDeleteTarget({ type: 'usage', row: usageRow });
    setDeleteId(null);
    setShowDeleteModal(true);
  };

  // ---------- Unified confirmDelete ----------
  const confirmDelete = async () => {
    setSaving(true);
    try {
      // ============ Case 1: Ingredient ============
      if (!deleteTarget && deleteId) {
        await deleteDoc(doc(db, 'ingredients', deleteId));
        setShowDeleteModal(false);
        setDeleteId(null);
        alert('Ingredient deleted successfully!');
        return;
      }

      // ============ Case 2: Purchase or Usage row ============
      if (deleteTarget) {
        const { type, row } = deleteTarget;
        const ingredientId = row.ingredientId;
        const parentDoc = inventoryData.find(i => i.id === ingredientId);
        if (!parentDoc) throw new Error('Ingredient not found');

        const isSamePurchase = (a, b) =>
          a.date === b.date &&
          Number(a.quantity) === Number(b.quantity) &&
          Number(a.rate) === Number(b.rate) &&
          (a.invoice || '') === (b.invoice || '');

        const isSameUsage = (a, b) =>
          a.date === b.date &&
          Number(a.productionUsage || 0) === Number(b.productionUsage || 0) &&
          Number(a.wastage || 0) === Number(b.wastage || 0) &&
          (a.purpose || '') === (b.purpose || '');

        if (type === 'purchase') {
          const updatedPurchases = (parentDoc.purchases || [])
            .filter(p => !isSamePurchase(p, row));

          if (updatedPurchases.length === (parentDoc.purchases || []).length) {
            throw new Error('Purchase not found (already deleted?)');
          }

          await updateDoc(doc(db, 'ingredients', ingredientId), {
            purchases: updatedPurchases,
            updatedAt: serverTimestamp()
          });
          alert('Purchase deleted successfully!');
        } else if (type === 'usage') {
          const updatedUsage = (parentDoc.usage || [])
            .filter(u => !isSameUsage(u, row));

          if (updatedUsage.length === (parentDoc.usage || []).length) {
            throw new Error('Usage entry not found (already deleted?)');
          }

          await updateDoc(doc(db, 'ingredients', ingredientId), {
            usage: updatedUsage,
            updatedAt: serverTimestamp()
          });
          alert('Usage entry deleted successfully!');
        }

        setShowDeleteModal(false);
        setDeleteTarget(null);
        return;
      }

      // Nothing to delete
      setShowDeleteModal(false);
    } catch (e) {
      console.error('delete:', e);
      alert('Failed to delete: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const findIngredientByName = async (name) => {
    const q = query(collection(db, 'ingredients'), where('ingredientName', '==', name));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].id;
  };

  // ---------- Form state ----------
  const openForm = (type) => {
    setFormType(type);
    setActiveTab(type);
    if (type === 'inventory') setInventoryFormData(emptyInventoryForm());
    if (type === 'purchase') setPurchaseFormData(emptyPurchaseForm());
    if (type === 'usage') setUsageFormData(emptyUsageForm());
  };

  const closeForm = () => {
    setFormType(null);
    setIsEditing(false);
    setEditingId(null);
    setInventoryFormData(emptyInventoryForm());
    setPurchaseFormData(emptyPurchaseForm());
    setUsageFormData(emptyUsageForm());
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <IngredientsHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onAdd={() => openForm('inventory')}
      />

      <SummaryCards
        totalItems={totalItems}
        totalStockValue={totalStockValue}
        lowStockCount={lowStockItems.length}
        outOfStockCount={outOfStockItems.length}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {['inventory', 'purchase', 'usage'].map(key => {
            const Icon = TAB_ICONS[key];
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearchTerm(''); }}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                  active
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {TAB_LABELS[key]}
              </button>
            );
          })}
        </div>

        {/* Inventory tab */}
        {activeTab === 'inventory' && (
          <div className="p-4 md:p-6">
            {formType === 'inventory' && (
              <InventoryForm
                data={inventoryFormData}
                setData={setInventoryFormData}
                isEditing={isEditing}
                saving={saving}
                onSave={handleAddIngredient}
                onCancel={closeForm}
                onReset={() => setInventoryFormData(emptyInventoryForm())}
              />
            )}

            <InventoryTable
              rows={filteredInventory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onView={setSelectedItem}
              onEdit={handleEditIngredient}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* Purchase tab */}
        {activeTab === 'purchase' && (
          <div className="p-4 md:p-6">
            {formType === 'purchase' && (
              <PurchaseForm
                data={purchaseFormData}
                setData={setPurchaseFormData}
                inventoryData={inventoryData}
                saving={saving}
                onSave={handleAddPurchase}
                onCancel={closeForm}
                onReset={() => setPurchaseFormData(emptyPurchaseForm())}
              />
            )}

            <PurchasesTable
              rows={filteredPurchases}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAdd={() => openForm('purchase')}
              onDelete={handleDeletePurchaseRow}   // ★ now functional
            />
          </div>
        )}

        {/* Usage tab */}
        {activeTab === 'usage' && (
          <div className="p-4 md:p-6">
            {formType === 'usage' && (
              <UsageForm
                data={usageFormData}
                setData={setUsageFormData}
                inventoryData={inventoryData}
                saving={saving}
                onSave={handleAddUsage}
                onCancel={closeForm}
                onReset={() => setUsageFormData(emptyUsageForm())}
              />
            )}

            <UsageTable
              rows={filteredUsage}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAdd={() => openForm('usage')}
              onDelete={handleDeleteUsageRow}      // ★ now functional
            />
          </div>
        )}
      </div>

      <IngredientViewModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Ingredient Delete Modal */}
      {!deleteTarget && (
        <DeleteConfirmModal
          open={showDeleteModal}
          saving={saving}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteId(null);
          }}
          onConfirm={confirmDelete}
        />
      )}

      {/* Row Delete Modal (Purchase / Usage) */}
      {deleteTarget && showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {deleteTarget.type === 'purchase' ? 'Delete Purchase' : 'Delete Usage Entry'}
              </h3>
              <p className="text-gray-500 mb-6">
                {deleteTarget.type === 'purchase' ? (
                  <>
                    Delete purchase of{' '}
                    <b>
                      {deleteTarget.row.quantity} {deleteTarget.row.unit || ''}
                    </b>{' '}
                    on <b>{deleteTarget.row.date}</b> for{' '}
                    <b>{deleteTarget.row.ingredientName}</b>?
                  </>
                ) : (
                  <>
                    Delete usage on <b>{deleteTarget.row.date}</b> for{' '}
                    <b>{deleteTarget.row.ingredientName}</b>?
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;