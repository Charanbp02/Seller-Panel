// Pages/PackingMaterials/PackingMaterials.jsx
import React, { useState, useEffect } from 'react';
import { Box, ShoppingCart, TrendingDown } from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  where, onSnapshot, getDocs
} from 'firebase/firestore';

import {
  calculateStock,
  emptyMaterialForm, emptyPurchaseForm, emptyUsageForm
} from './utils/packingHelpers';

import PackingHeader from './widgets/PackingHeader';
import SummaryCards from './widgets/SummaryCards';
import MaterialForm from './widgets/MaterialForm';
import PurchaseForm from './widgets/PurchaseForm';
import UsageForm from './widgets/UsageForm';
import InventoryTable from './widgets/InventoryTable';
import PurchasesTable from './widgets/PurchasesTable';
import UsageTable from './widgets/UsageTable';
import MaterialViewModal from './widgets/MaterialViewModal';
import DeleteConfirmModal from './widgets/DeleteConfirmModal';

const TAB_ICONS = { inventory: Box, purchase: ShoppingCart, usage: TrendingDown };
const TAB_LABELS = { inventory: 'Inventory', purchase: 'Purchase', usage: 'Usage' };

const PackingMaterials = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  // formType: null | 'inventory' | 'purchase' | 'usage' — replaces ambiguous `isAdding`
  const [formType, setFormType] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inventoryData, setInventoryData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [usageData, setUsageData] = useState([]);

  const [inventoryFormData, setInventoryFormData] = useState(emptyMaterialForm());
  const [purchaseFormData, setPurchaseFormData] = useState(emptyPurchaseForm());
  const [usageFormData, setUsageFormData] = useState(emptyUsageForm());

  // ---------- Listeners ----------
  useEffect(() => {
    const materialsRef = collection(db, 'packingMaterials');
    const unsub = onSnapshot(
      materialsRef,
      (snap) => {
        const materials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        materials.sort((a, b) => {
          const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return db_ - da;
        });
        setInventoryData(materials);
        setLoading(false);
      },
      (e) => { console.error('packingMaterials listener:', e); setLoading(false); }
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
          materialName: item.materialName,
          unit: item.unit,
          size: item.size,
          supplier: p.supplier || item.supplier
        });
      });
      (item.usage || []).forEach(u => {
        allUsage.push({
          ...u,
          materialName: item.materialName,
          unit: item.unit,
          size: item.size
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
    item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.size && item.size.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredPurchases = purchaseData.filter(item =>
    item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredUsage = usageData.filter(item =>
    item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.purpose && item.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalItems = inventoryData.length;
  const totalStockValue = inventoryWithStock.reduce((s, i) => s + (i.totalValue || 0), 0);
  const lowStockItems = inventoryWithStock.filter(i => i.currentStock <= i.reorderLevel);
  const outOfStockItems = inventoryWithStock.filter(i => i.currentStock <= 0);

  // ---------- Handlers ----------
  const findMaterialByName = async (name) => {
    const q = query(collection(db, 'packingMaterials'), where('materialName', '==', name));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].id;
  };

  const handleAddMaterial = async () => {
    if (!inventoryFormData.materialName || !inventoryFormData.openingQuantity) {
      alert('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const opening = parseFloat(inventoryFormData.openingQuantity);
      const newMaterial = {
        materialName: inventoryFormData.materialName,
        size: inventoryFormData.size || '',
        unit: inventoryFormData.unit || 'pcs',
        openingQuantity: opening,
        currentStock: opening,
        rate: parseFloat(inventoryFormData.rate) || 0,
        supplier: inventoryFormData.supplier || '',
        reorderLevel: parseFloat(inventoryFormData.reorderLevel) || 0,
        remarks: inventoryFormData.remarks || '',
        purchases: [],
        usage: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'packingMaterials'), newMaterial);
      closeForm();
      alert('Material added successfully!');
    } catch (e) {
      console.error('add material:', e);
      alert('Failed to add material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!inventoryFormData.materialName || !inventoryFormData.openingQuantity) {
      alert('Please fill all required fields');
      return;
    }
    if (!editingId) {
      alert('No material selected for editing');
      return;
    }
    setSaving(true);
    try {
      const updateData = {
        materialName: inventoryFormData.materialName,
        size: inventoryFormData.size || '',
        unit: inventoryFormData.unit || 'pcs',
        openingQuantity: parseFloat(inventoryFormData.openingQuantity),
        rate: parseFloat(inventoryFormData.rate) || 0,
        supplier: inventoryFormData.supplier || '',
        reorderLevel: parseFloat(inventoryFormData.reorderLevel) || 0,
        remarks: inventoryFormData.remarks || '',
        updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, 'packingMaterials', editingId), updateData);
      closeForm();
      alert('Material updated successfully!');
    } catch (e) {
      console.error('update material:', e);
      alert('Failed to update material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPurchase = async () => {
    if (!purchaseFormData.materialName || !purchaseFormData.quantity || !purchaseFormData.rate) {
      alert('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const materialRef = await findMaterialByName(purchaseFormData.materialName);
      if (!materialRef) { alert('Material not found'); return; }

      const newPurchase = {
        date: purchaseFormData.date,
        quantity: parseFloat(purchaseFormData.quantity),
        rate: parseFloat(purchaseFormData.rate),
        amount: parseFloat(purchaseFormData.quantity) * parseFloat(purchaseFormData.rate),
        invoice: purchaseFormData.invoiceNumber || `INV-${Date.now()}`,
        supplier: purchaseFormData.supplier || '',
        remarks: purchaseFormData.remarks || ''
      };

      const currentData = inventoryData.find(i => i.id === materialRef);
      const updatedPurchases = [...(currentData?.purchases || []), newPurchase];

      await updateDoc(doc(db, 'packingMaterials', materialRef), {
        purchases: updatedPurchases,
        currentStock: (Number(currentData?.currentStock) || 0) + Number(purchaseFormData.quantity),
        updatedAt: new Date().toISOString()
      });

      closeForm();
      alert('Purchase added successfully!');
    } catch (e) {
      console.error('add purchase:', e);
      alert('Failed to add purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUsage = async () => {
    if (!usageFormData.materialName || (!usageFormData.used && !usageFormData.damaged)) {
      alert('Please fill at least one usage field');
      return;
    }
    setSaving(true);
    try {
      const materialRef = await findMaterialByName(usageFormData.materialName);
      if (!materialRef) { alert('Material not found'); return; }

      const currentData = inventoryData.find(i => i.id === materialRef);
      const stock = calculateStock(currentData);
      const used = parseFloat(usageFormData.used) || 0;
      const damaged = parseFloat(usageFormData.damaged) || 0;
      const totalOut = used + damaged;

      if (stock.currentStock < totalOut) {
        alert(`Insufficient stock! Available: ${stock.currentStock.toFixed(1)} ${currentData.unit}`);
        return;
      }

      const newUsage = {
        date: usageFormData.date,
        used,
        damaged,
        purpose: usageFormData.purpose || '',
        remarks: usageFormData.remarks || ''
      };

      const updatedUsage = [...(currentData?.usage || []), newUsage];

      await updateDoc(doc(db, 'packingMaterials', materialRef), {
        usage: updatedUsage,
        currentStock: stock.currentStock - totalOut,
        updatedAt: new Date().toISOString()
      });

      closeForm();
      alert('Usage added successfully!');
    } catch (e) {
      console.error('add usage:', e);
      alert('Failed to add usage. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMaterial = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setInventoryFormData({
      materialName: item.materialName || '',
      size: item.size || '',
      unit: item.unit || 'pcs',
      openingQuantity: item.openingQuantity?.toString() || '',
      rate: item.rate?.toString() || '',
      supplier: item.supplier || '',
      reorderLevel: item.reorderLevel?.toString() || '',
      remarks: item.remarks || ''
    });
    setActiveTab('inventory');
    setFormType('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'packingMaterials', deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      alert('Material deleted successfully!');
    } catch (e) {
      console.error('delete material:', e);
      alert('Failed to delete material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Form state ----------
  const openForm = (type) => {
    setFormType(type);
    setActiveTab(type);
    if (type === 'inventory') setInventoryFormData(emptyMaterialForm());
    if (type === 'purchase') setPurchaseFormData(emptyPurchaseForm());
    if (type === 'usage') setUsageFormData(emptyUsageForm());
  };

  const closeForm = () => {
    setFormType(null);
    setIsEditing(false);
    setEditingId(null);
    setInventoryFormData(emptyMaterialForm());
    setPurchaseFormData(emptyPurchaseForm());
    setUsageFormData(emptyUsageForm());
  };

  // Placeholder delete handlers for purchase/usage (same no-op as original)
  const handleDeletePurchaseRow = () => {
    // TODO: implement nested array delete + stock reversal via updateDoc/transaction
  };
  const handleDeleteUsageRow = () => {
    // TODO: implement nested array delete + stock restore via updateDoc/transaction
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading packing materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <PackingHeader
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
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {TAB_LABELS[key]}
              </button>
            );
          })}
        </div>

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div className="p-4 md:p-6">
            {formType === 'inventory' && (
              <MaterialForm
                data={inventoryFormData}
                setData={setInventoryFormData}
                isEditing={isEditing}
                saving={saving}
                onSave={isEditing ? handleUpdateMaterial : handleAddMaterial}
                onCancel={closeForm}
                onReset={() => setInventoryFormData(emptyMaterialForm())}
              />
            )}

            <InventoryTable
              rows={filteredInventory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onView={setSelectedItem}
              onEdit={handleEditMaterial}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* Purchase */}
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
              onDelete={handleDeletePurchaseRow}
            />
          </div>
        )}

        {/* Usage */}
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
              onDelete={handleDeleteUsageRow}
            />
          </div>
        )}
      </div>

      <MaterialViewModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        saving={saving}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default PackingMaterials;