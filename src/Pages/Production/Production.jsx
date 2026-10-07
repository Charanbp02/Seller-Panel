// Pages/Production/Production.jsx
import React, { useState, useEffect } from 'react';
import { Factory, Box } from 'lucide-react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, query, where, onSnapshot, getDocs, getDoc,
  runTransaction, serverTimestamp
} from 'firebase/firestore';

import {
  localDate, toDateString, num, emptyForm, showToast
} from './utils/productionHelpers';

import ProductionHeader from './widgets/ProductionHeader';
import SummaryCards from './widgets/SummaryCards';
import ProductionForm from './widgets/ProductionForm';
import ProductionTable from './widgets/ProductionTable';
import StockTable from './widgets/StockTable';
import ProductionViewModal from './widgets/ProductionViewModal';
import DeleteConfirmModal from './widgets/DeleteConfirmModal';

const Production = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('production');
  const [loading, setLoading] = useState(true);
  const [productionData, setProductionData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [productList, setProductList] = useState([]);
  const [packingList, setPackingList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  // ---------- Listeners ----------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'production'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const da = toDateString(a.date) || '';
        const db_ = toDateString(b.date) || '';
        if (da !== db_) return db_.localeCompare(da);
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
      setProductionData(rows);
      setLoading(false);
    }, (e) => { console.error('production listener:', e); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stock'), (snap) => {
      const stock = snap.docs.map(d => {
        const x = d.data();
        const produced = num(x.produced);
        const sold = num(x.sold);
        return { id: d.id, ...x, produced, sold, currentStock: produced - sold };
      });
      stock.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
      setStockData(stock);
      setProductList([...new Set(stock.map(s => s.productName).filter(Boolean))].sort());
    }, (e) => console.error('stock listener:', e));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'packingMaterials'), (snap) => {
      const list = snap.docs.map(d => {
        const x = d.data();
        return {
          id: d.id,
          materialName: x.materialName || '',
          unit: x.unit || 'pcs',
          currentStock: num(x.currentStock),
          size: x.size || ''
        };
      });
      list.sort((a, b) => a.materialName.localeCompare(b.materialName));
      setPackingList(list);
    }, (e) => console.error('packingMaterials listener:', e));
    return () => unsub();
  }, []);

  // ============================================================
  // RESOLVERS (must run OUTSIDE transaction)
  // ============================================================
  const resolveStockRefs = async (productNames) => {
    const unique = [...new Set(productNames.filter(Boolean))];
    const result = {};
    for (const name of unique) {
      const snap = await getDocs(query(collection(db, 'stock'), where('productName', '==', name)));
      result[name] = snap.empty ? null : snap.docs[0].ref;
    }
    return result;
  };

  const resolvePackingRefs = async (materialNames) => {
    const unique = [...new Set(materialNames.filter(Boolean))];
    const result = {};
    for (const name of unique) {
      const snap = await getDocs(query(collection(db, 'packingMaterials'), where('materialName', '==', name)));
      result[name] = snap.empty ? null : snap.docs[0].ref;
    }
    return result;
  };

  // ============================================================
  // SAVE (create or update)
  // ============================================================
  const saveProduction = async ({ isEdit, oldData, payload }) => {
    const stockNames = [payload.productName, ...(isEdit && oldData ? [oldData.productName] : [])];
    const stockRefs = await resolveStockRefs(stockNames);

    const packingNames = [
      ...(payload.packingUsed || []).map(p => p.materialName),
      ...(oldData?.packingUsed || []).map(p => p.materialName)
    ];
    const packingRefs = await resolvePackingRefs(packingNames);

    return runTransaction(db, async (tx) => {
      // ---- PHASE A: READS ----
      const stockSnaps = {};
      for (const [name, ref] of Object.entries(stockRefs)) {
        if (ref) stockSnaps[name] = await tx.get(ref);
      }

      const packingSnaps = {};
      for (const [name, ref] of Object.entries(packingRefs)) {
        if (ref) packingSnaps[name] = await tx.get(ref);
      }

      const prodRef = isEdit && oldData
        ? doc(db, 'production', oldData.id)
        : doc(collection(db, 'production'));
      const existing = isEdit ? await tx.get(prodRef) : null;

      // ---- VALIDATION ----
      const newProduced = num(payload.produced);
      if (newProduced <= 0) throw new Error('Production quantity must be greater than 0');

      const deltas = {};
      if (isEdit && oldData) {
        const oldName = oldData.productName;
        const oldQty = num(oldData.produced);
        if (oldName !== payload.productName) {
          deltas[oldName] = (deltas[oldName] || 0) - oldQty;
          deltas[payload.productName] = (deltas[payload.productName] || 0) + newProduced;
        } else {
          deltas[payload.productName] = (deltas[payload.productName] || 0) + (newProduced - oldQty);
        }
      } else {
        deltas[payload.productName] = (deltas[payload.productName] || 0) + newProduced;
      }

      for (const [name, delta] of Object.entries(deltas)) {
        const snap = stockSnaps[name];
        const ref = stockRefs[name];
        if (!ref || !snap?.exists()) {
          if (delta < 0) throw new Error(`Cannot reduce production for "${name}": no stock exists.`);
          continue;
        }
        const sd = snap.data();
        const newProd = num(sd.produced) + delta;
        const sold = num(sd.sold);
        if (newProd < 0) throw new Error(`Invalid: produced for "${name}" would become ${newProd.toFixed(3)}`);
        if (newProd < sold - 1e-9)
          throw new Error(`Cannot reduce production for "${name}". Already sold: ${sold.toFixed(3)} ${sd.unit || 'kg'}. Reverse some sales first.`);
      }

      const packingDeltas = {};
      const addPacking = (name, qty) => {
        if (!name) return;
        packingDeltas[name] = (packingDeltas[name] || 0) + qty;
      };
      (oldData?.packingUsed || []).forEach(p => addPacking(p.materialName, num(p.quantity)));
      (payload.packingUsed || []).forEach(p => addPacking(p.materialName, -num(p.quantity)));

      for (const [name, delta] of Object.entries(packingDeltas)) {
        if (delta >= 0) continue;
        const snap = packingSnaps[name];
        const ref = packingRefs[name];
        if (!ref || !snap?.exists()) {
          throw new Error(`Packing material "${name}" not found in Packing Materials page. Add it first.`);
        }
        const current = num(snap.data().currentStock);
        const after = current + delta;
        if (after < 0) {
          throw new Error(`Insufficient packing material "${name}". Available: ${current} ${snap.data().unit || 'pcs'}, needed: ${Math.abs(delta)}`);
        }
      }

      // ---- PHASE B: WRITES ----

      // B1. Production doc
      if (isEdit && existing?.exists()) {
        const update = { ...payload };
        delete update.createdAt;
        update.updatedAt = serverTimestamp();
        tx.update(prodRef, update);
      } else {
        tx.set(prodRef, payload);
      }

      // B2. Stock deltas
      for (const [name, delta] of Object.entries(deltas)) {
        const ref = stockRefs[name];
        const snap = stockSnaps[name];
        if (ref && snap?.exists()) {
          tx.update(ref, {
            produced: num(snap.data().produced) + delta,
            updatedAt: serverTimestamp()
          });
        } else if (delta > 0) {
          tx.set(doc(collection(db, 'stock')), {
            productName: name,
            produced: delta,
            sold: 0,
            unit: payload.unit || 'kg',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      // B3. Packing materials deltas
      for (const [name, delta] of Object.entries(packingDeltas)) {
        if (delta === 0) continue;
        const ref = packingRefs[name];
        const snap = packingSnaps[name];
        if (!ref || !snap?.exists()) continue;
        const sd = snap.data();
        const newStock = num(sd.currentStock) + delta;
        tx.update(ref, {
          currentStock: newStock,
          updatedAt: serverTimestamp()
        });
      }

      return prodRef.id;
    });
  };

  // ============================================================
  // DELETE
  // ============================================================
  const deleteProduction = async (id) => {
    const prodRef = doc(db, 'production', id);
    const preSnap = await getDoc(prodRef);
    if (!preSnap.exists()) throw new Error('Production record not found');
    const production = preSnap.data();

    const stockRefs = await resolveStockRefs([production.productName]);
    const packingRefs = await resolvePackingRefs((production.packingUsed || []).map(p => p.materialName));

    return runTransaction(db, async (tx) => {
      const prodSnap = await tx.get(prodRef);
      if (!prodSnap.exists()) throw new Error('Production record not found');

      const snaps = {};
      for (const [name, ref] of Object.entries(stockRefs)) {
        if (ref) snaps[name] = await tx.get(ref);
      }
      const pSnaps = {};
      for (const [name, ref] of Object.entries(packingRefs)) {
        if (ref) pSnaps[name] = await tx.get(ref);
      }

      const pData = prodSnap.data();
      const qty = num(pData.produced);
      const name = pData.productName;
      const ref = stockRefs[name];
      const snap = snaps[name];

      if (ref && snap?.exists()) {
        const sd = snap.data();
        const newProd = num(sd.produced) - qty;
        const sold = num(sd.sold);
        if (newProd < 0) throw new Error(`Cannot delete: produced for "${name}" would become ${newProd.toFixed(3)}`);
        if (newProd < sold - 1e-9)
          throw new Error(`Cannot delete. Already sold: ${sold.toFixed(3)} ${sd.unit || 'kg'}. Reverse some sales first.`);
      }

      // ---- WRITES ----
      tx.delete(prodRef);

      if (ref && snap?.exists()) {
        tx.update(ref, { produced: num(snap.data().produced) - qty, updatedAt: serverTimestamp() });
      }

      for (const p of (pData.packingUsed || [])) {
        const pref = packingRefs[p.materialName];
        const psnap = pSnaps[p.materialName];
        if (!pref || !psnap?.exists()) continue;
        tx.update(pref, {
          currentStock: num(psnap.data().currentStock) + num(p.quantity),
          updatedAt: serverTimestamp()
        });
      }

      return true;
    });
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      date: toDateString(item.date) || localDate(),
      productName: item.productName || '',
      produced: item.produced?.toString() || '',
      unit: item.unit || 'kg',
      remarks: item.remarks || '',
      packingUsed: (item.packingUsed || []).map(p => ({
        materialName: p.materialName || '',
        quantity: p.quantity?.toString() || '',
        unit: p.unit || 'pcs'
      }))
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formData.productName) return alert('Please select a product');
    if (!formData.produced || parseFloat(formData.produced) <= 0)
      return alert('Please enter production quantity');

    setSaving(true);
    try {
      const producedValue = parseFloat(formData.produced);

      const packingUsed = (formData.packingUsed || [])
        .filter(p => p.materialName && parseFloat(p.quantity) > 0)
        .map(p => ({
          materialName: p.materialName,
          quantity: parseFloat(p.quantity),
          unit: p.unit || 'pcs'
        }));

      if (isEditing && editingId) {
        const old = productionData.find(p => p.id === editingId);
        if (!old) throw new Error('Production record not found');
        await saveProduction({
          isEdit: true,
          oldData: {
            id: editingId,
            productName: old.productName,
            produced: num(old.produced),
            unit: old.unit,
            packingUsed: old.packingUsed || []
          },
          payload: {
            date: formData.date,
            productName: formData.productName,
            produced: producedValue,
            unit: formData.unit || 'kg',
            remarks: formData.remarks || '',
            packingUsed
          }
        });
      } else {
        await saveProduction({
          isEdit: false,
          oldData: null,
          payload: {
            date: formData.date,
            productName: formData.productName,
            produced: producedValue,
            unit: formData.unit || 'kg',
            remarks: formData.remarks || '',
            packingUsed,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        });
      }

      showToast('Production saved successfully!');
      handleCancel();
    } catch (e) {
      console.error('save production:', e);
      alert('Failed to save production: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteProduction(deleteId);
      setShowDelete(false);
      setDeleteId(null);
      showToast('Production deleted & packing reversed!');
    } catch (e) {
      console.error('delete production:', e);
      alert('Failed to delete production: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  // Packing row helpers
  const addPackingRow = () => {
    patchForm({
      packingUsed: [...(formData.packingUsed || []), { materialName: '', quantity: '', unit: 'pcs' }]
    });
  };

  const updatePackingRow = (idx, field, value) => {
    const rows = [...(formData.packingUsed || [])];
    rows[idx] = { ...rows[idx], [field]: value };
    if (field === 'materialName') {
      const found = packingList.find(p => p.materialName === value);
      if (found) rows[idx].unit = found.unit;
    }
    patchForm({ packingUsed: rows });
  };

  const removePackingRow = (idx) => {
    const rows = (formData.packingUsed || []).filter((_, i) => i !== idx);
    patchForm({ packingUsed: rows });
  };

  // ============================================================
  // DERIVED
  // ============================================================
  const filteredProduction = productionData
    .filter(item => toDateString(item.date) === selectedDate)
    .filter(item => item.productName?.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredStock = stockData.filter(item =>
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayProduction = productionData.filter(p => toDateString(p.date) === selectedDate);
  const totals = {
    today: todayProduction.reduce((s, p) => s + num(p.produced), 0),
    products: stockData.length,
    stock: stockData.reduce((s, x) => s + num(x.currentStock), 0),
    sold: stockData.reduce((s, x) => s + num(x.sold), 0)
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading production data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <ProductionHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onAdd={() => { setFormData(emptyForm()); setIsAdding(true); }}
      />

      <SummaryCards totals={totals} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'production', label: 'Production', Icon: Factory },
            { key: 'stock', label: 'Stock', Icon: Box }
          ].map(t => {
            const Icon = t.Icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  active
                    ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ---------- PRODUCTION TAB ---------- */}
        {activeTab === 'production' && (
          <div className="p-4 md:p-6">
            {isAdding && (
              <ProductionForm
                formData={formData}
                patchForm={patchForm}
                productList={productList}
                packingList={packingList}
                isEditing={isEditing}
                saving={saving}
                onSave={handleSave}
                onCancel={handleCancel}
                onReset={() => setFormData(emptyForm())}
                addPackingRow={addPackingRow}
                updatePackingRow={updatePackingRow}
                removePackingRow={removePackingRow}
              />
            )}

            <ProductionTable
              rows={filteredProduction}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onView={setSelectedProduction}
              onEdit={handleEdit}
              onDelete={(item) => { setDeleteId(item.id); setShowDelete(true); }}
            />
          </div>
        )}

        {/* ---------- STOCK TAB ---------- */}
        {activeTab === 'stock' && (
          <div className="p-4 md:p-6">
            <StockTable
              rows={filteredStock}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        )}
      </div>

      {/* View Modal */}
      <ProductionViewModal
        item={selectedProduction}
        onClose={() => setSelectedProduction(null)}
        onEdit={() => { const it = selectedProduction; setSelectedProduction(null); handleEdit(it); }}
        onDelete={() => { const it = selectedProduction; setSelectedProduction(null); setDeleteId(it.id); setShowDelete(true); }}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={showDelete}
        saving={saving}
        onCancel={() => setShowDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Production;