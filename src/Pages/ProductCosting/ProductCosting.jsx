// src/Pages/ProductCosting/ProductCosting.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase/firebaseConfig';
import {
  collection, doc, getDocs, setDoc, onSnapshot, query, where,
  serverTimestamp, runTransaction
} from 'firebase/firestore';

import {
  calculateIngredientCost, calculatePackingCost, computeTotals,
  scaleFactorFor, buildCostingSnapshot, showToast
} from './utils/costingHelpers';

import CostingHeader from './widgets/CostingHeader';
import NoProductPlaceholder from './widgets/NoProductPlaceholder';
import IngredientsTable from './widgets/IngredientsTable';
import PackingTable from './widgets/PackingTable';
import OtherCostsSection from './widgets/OtherCostsSection';
import SummaryPanel from './widgets/SummaryPanel';
import MobileSummaryBar from './widgets/MobileSummaryBar';
import ItemPickerModal from './widgets/ItemPickerModal';

// ============================================================
// EMPTY RECIPE
// ============================================================
const EMPTY_RECIPE = {
  ingredients: [],
  packing: [],
  otherCosts: { labour: '', gasElectricity: '', grinding: '', other: '' },
  sellingPrice: '',
  sellingPriceUnit: 'kg',
  baseBatchSize: 1000,
  baseBatchUnit: 'g',
  rateMethod: 'latest'
};

// ============================================================
// MAIN
// ============================================================
const ProductCosting = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [batchSize, setBatchSize] = useState(1000);
  const [batchUnit, setBatchUnit] = useState('g');

  const [ingredients, setIngredients] = useState([]);
  const [packing, setPacking] = useState([]);
  const [products, setProducts] = useState([]);

  const [recipe, setRecipe] = useState(EMPTY_RECIPE);
  const [recipeDocId, setRecipeDocId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Picker
  const [pickerMode, setPickerMode] = useState(null); // 'ingredient' | 'packing'
  const [pickerIdx, setPickerIdx] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // ============================================================
  // LISTENERS
  // ============================================================
  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'ingredients'), (snap) => {
      setIngredients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => console.error('ingredients:', e));
    const u2 = onSnapshot(collection(db, 'packingMaterials'), (snap) => {
      setPacking(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, e => console.error('packingMaterials:', e));
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      if (snap.empty) {
        (async () => {
          try {
            const stockSnap = await getDocs(collection(db, 'stock'));
            const names = [
              ...new Set(stockSnap.docs.map(d => d.data().productName).filter(Boolean))
            ];
            if (names.length === 0) { setLoading(false); return; }
            await Promise.all(names.map(name => {
              const ref = doc(collection(db, 'products'));
              return setDoc(ref, {
                productName: name,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }));
          } catch (e) {
            console.error('products seed:', e);
            setLoading(false);
          }
        })();
      } else {
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.isActive !== false)
          .sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
        setProducts(list);
        setLoading(false);
      }
    }, e => { console.error('products:', e); setLoading(false); });
    return () => unsub();
  }, []);

  // Load recipe for selected product (prefer exact batch match)
  useEffect(() => {
    if (!selectedProductId) {
      setRecipe(EMPTY_RECIPE);
      setRecipeDocId(null);
      return;
    }
    const q = query(
      collection(db, 'productRecipes'),
      where('productId', '==', selectedProductId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const recipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const exact = recipes.find(r =>
        Number(r.batchSize) === Number(batchSize) &&
        (r.batchUnit || 'g') === (batchUnit || 'g') &&
        r.isActive !== false
      );
      const anyActive = recipes.find(r => r.isActive !== false);
      const chosen = exact || anyActive;

      if (chosen) {
        setRecipeDocId(chosen.id);
        setRecipe({
          ingredients: chosen.ingredients || [],
          packing: chosen.packing || [],
          otherCosts: chosen.otherCosts || { labour: '', gasElectricity: '', grinding: '', other: '' },
          sellingPrice: chosen.sellingPrice ?? '',
          sellingPriceUnit: chosen.sellingPriceUnit || 'kg',
          baseBatchSize: chosen.batchSize ?? 1000,
          baseBatchUnit: chosen.batchUnit ?? 'g',
          rateMethod: chosen.rateMethod || 'latest'
        });
        if (chosen.batchSize) setBatchSize(chosen.batchSize);
        if (chosen.batchUnit) setBatchUnit(chosen.batchUnit);
      } else {
        setRecipeDocId(null);
        setRecipe(EMPTY_RECIPE);
      }
    }, e => console.error('recipe:', e));
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  // ============================================================
  // DERIVED
  // ============================================================
  const ingredientsById = useMemo(
    () => Object.fromEntries(ingredients.map(i => [i.id, i])),
    [ingredients]
  );
  const packingById = useMemo(
    () => Object.fromEntries(packing.map(p => [p.id, p])),
    [packing]
  );

  const scaleFactor = useMemo(
    () => scaleFactorFor(
      { size: recipe.baseBatchSize ?? 1000, unit: recipe.baseBatchUnit ?? 'g' },
      { size: batchSize, unit: batchUnit }
    ),
    [recipe.baseBatchSize, recipe.baseBatchUnit, batchSize, batchUnit]
  );

  const rateMethod = recipe.rateMethod || 'latest';

  const ingResult = useMemo(
    () => calculateIngredientCost(recipe.ingredients, ingredientsById, scaleFactor, rateMethod),
    [recipe.ingredients, ingredientsById, scaleFactor, rateMethod]
  );

  const packResult = useMemo(
    () => calculatePackingCost(recipe.packing, packingById, scaleFactor, rateMethod),
    [recipe.packing, packingById, scaleFactor, rateMethod]
  );

  const totals = useMemo(
    () => computeTotals({
      ingredientTotal: ingResult.total,
      packingTotal: packResult.total,
      otherCosts: recipe.otherCosts,
      sellingPriceRate: recipe.sellingPrice,
      sellingPriceUnit: recipe.sellingPriceUnit || 'kg',
      batchSize,
      batchUnit,
      scaleFactor
    }),
    [
      ingResult.total, packResult.total, recipe.otherCosts,
      recipe.sellingPrice, recipe.sellingPriceUnit,
      batchSize, batchUnit, scaleFactor
    ]
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleCreateProduct = async (name) => {
    const dup = products.find(
      p => (p.productName || '').toLowerCase() === name.toLowerCase()
    );
    let productId;
    if (dup) {
      productId = dup.id;
    } else {
      const ref = doc(collection(db, 'products'));
      await setDoc(ref, {
        productName: name,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      productId = ref.id;
    }
    setSelectedProductId(productId);
    setIsEditing(true);
    showToast('Product added! Add recipe below.');
  };

  const updateIngredient = (idx, field, value) => {
    setRecipe(r => {
      const arr = [...r.ingredients];
      const cur = { ...arr[idx] };
      if (field === 'ingredientId') cur.ingredientId = value;
      else if (field === 'recipeQty') cur.quantity = value;
      else if (field === 'recipeUnit') cur.unit = value;
      arr[idx] = cur;
      return { ...r, ingredients: arr };
    });
  };
  const addIngredient = () => setRecipe(r => ({
    ...r,
    ingredients: [...r.ingredients, { ingredientId: '', quantity: '', unit: 'g' }]
  }));
  const removeIngredient = (idx) => setRecipe(r => ({
    ...r,
    ingredients: r.ingredients.filter((_, i) => i !== idx)
  }));

  const updatePacking = (idx, field, value) => {
    setRecipe(r => {
      const arr = [...r.packing];
      const cur = { ...arr[idx] };
      if (field === 'packingId') cur.packingId = value;
      else if (field === 'qty') cur.quantity = value;
      else if (field === 'unit') cur.unit = value;
      arr[idx] = cur;
      return { ...r, packing: arr };
    });
  };
  const addPacking = () => setRecipe(r => ({
    ...r,
    packing: [...r.packing, { packingId: '', quantity: '', unit: 'pcs' }]
  }));
  const removePacking = (idx) => setRecipe(r => ({
    ...r,
    packing: r.packing.filter((_, i) => i !== idx)
  }));

  const updateOtherCost = (key, value) => setRecipe(r => ({
    ...r,
    otherCosts: { ...r.otherCosts, [key]: value }
  }));

  const updateSellingPrice = (value) => setRecipe(r => ({ ...r, sellingPrice: value }));
  const updateSellingPriceUnit = (unit) => setRecipe(r => ({ ...r, sellingPriceUnit: unit }));
  const updateRateMethod = (method) => setRecipe(r => ({ ...r, rateMethod: method }));

  const openPicker = (mode, idx) => {
    setPickerMode(mode);
    setPickerIdx(idx);
    setPickerSearch('');
  };
  const closePicker = () => {
    setPickerMode(null);
    setPickerIdx(null);
    setPickerSearch('');
  };
  const handlePick = (item) => {
    if (pickerMode === 'ingredient') {
      updateIngredient(pickerIdx, 'ingredientId', item.id);
      if (!recipe.ingredients[pickerIdx]?.unit) {
        updateIngredient(pickerIdx, 'recipeUnit', 'g');
      }
    } else {
      updatePacking(pickerIdx, 'packingId', item.id);
      if (!recipe.packing[pickerIdx]?.unit) {
        updatePacking(pickerIdx, 'unit', 'pcs');
      }
    }
    closePicker();
  };

  const handleSave = async () => {
    if (!selectedProductId) return alert('Select a product first');

    for (const [i, r] of recipe.ingredients.entries()) {
      if (!r.ingredientId) return alert(`Ingredient row ${i + 1}: pick an ingredient`);
      if (!Number(r.quantity)) return alert(`Ingredient row ${i + 1}: quantity must be > 0`);
    }
    for (const [i, r] of recipe.packing.entries()) {
      if (!r.packingId) return alert(`Packing row ${i + 1}: pick a material`);
      if (!Number(r.quantity)) return alert(`Packing row ${i + 1}: quantity must be > 0`);
    }
    if (recipe.ingredients.length === 0 && recipe.packing.length === 0) {
      return alert('Add at least one ingredient or packing material');
    }

    setSaving(true);
    try {
      const recipeRef = recipeDocId
        ? doc(db, 'productRecipes', recipeDocId)
        : doc(collection(db, 'productRecipes'));

      const recipePayload = {
        productId: selectedProductId,
        batchSize: Number(batchSize) || 1000,
        batchUnit: batchUnit || 'g',
        rateMethod,
        ingredients: recipe.ingredients.map(r => ({
          ingredientId: r.ingredientId,
          quantity: Number(r.quantity) || 0,
          unit: r.unit || 'g'
        })),
        packing: recipe.packing.map(r => ({
          packingId: r.packingId,
          quantity: Number(r.quantity) || 0,
          unit: r.unit || 'pcs'
        })),
        otherCosts: {
          labour:         Number(recipe.otherCosts.labour) || 0,
          gasElectricity: Number(recipe.otherCosts.gasElectricity) || 0,
          grinding:       Number(recipe.otherCosts.grinding) || 0,
          other:          Number(recipe.otherCosts.other) || 0
        },
        sellingPrice: Number(recipe.sellingPrice) || 0,
        sellingPriceUnit: recipe.sellingPriceUnit || 'kg',
        isActive: true,
        updatedAt: serverTimestamp()
      };

      await runTransaction(db, async (tx) => {
        const existing = await tx.get(recipeRef);
        if (existing.exists()) tx.update(recipeRef, recipePayload);
        else tx.set(recipeRef, { ...recipePayload, createdAt: serverTimestamp() });

        const snapshot = buildCostingSnapshot({
          product: selectedProduct,
          recipe: { id: recipeRef.id, ...recipePayload },
          ingResult,
          packResult,
          totals,
          batchSize,
          batchUnit,
          rateMethod,
          savedBy: 'admin'
        });
        tx.set(doc(collection(db, 'costingSnapshots')), {
          ...snapshot,
          savedAt: serverTimestamp()
        });
      });

      showToast('Product costing saved!');
      setRecipeDocId(recipeRef.id);
      setIsEditing(false);
    } catch (e) {
      console.error('save:', e);
      showToast('Failed to save: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading costing data...</p>
        </div>
      </div>
    );
  }

  const hasRecipe = recipe.ingredients.length > 0 || recipe.packing.length > 0;

  const pickerItems = pickerMode === 'ingredient' ? ingredients : packing;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 md:space-y-6 pb-32 lg:pb-6">

      <CostingHeader
        products={products}
        selectedProductId={selectedProductId}
        onProductChange={(id) => {
          setSelectedProductId(id);
          setIsEditing(false);
        }}
        batchSize={batchSize}
        batchUnit={batchUnit}
        onBatchChange={(s, u) => { setBatchSize(s); setBatchUnit(u); }}
        rateMethod={rateMethod}
        onRateMethodChange={updateRateMethod}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(v => !v)}
        onSave={handleSave}
        saving={saving}
        hasRecipe={hasRecipe}
        onCreateProduct={handleCreateProduct}
      />

      {!selectedProduct && <NoProductPlaceholder />}

      {selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {/* LEFT — tables */}
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            <IngredientsTable
              rows={ingResult.rows}
              total={ingResult.total}
              isEditing={isEditing}
              scaleFactor={scaleFactor}
              onAdd={addIngredient}
              onUpdate={updateIngredient}
              onRemove={removeIngredient}
              onOpenPicker={(idx) => openPicker('ingredient', idx)}
            />

            <PackingTable
              rows={packResult.rows}
              total={packResult.total}
              isEditing={isEditing}
              scaleFactor={scaleFactor}
              onAdd={addPacking}
              onUpdate={updatePacking}
              onRemove={removePacking}
              onOpenPicker={(idx) => openPicker('packing', idx)}
            />

            <OtherCostsSection
              otherCosts={recipe.otherCosts}
              otherTotal={totals.otherTotal}
              onChange={updateOtherCost}
              scaleFactor={scaleFactor}
              isEditing={isEditing}
            />
          </div>

          {/* RIGHT — sticky summary */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4">
              <SummaryPanel
                selectedProduct={selectedProduct}
                batchSize={batchSize}
                batchUnit={batchUnit}
                ingResult={ingResult}
                packResult={packResult}
                totals={totals}
                isEditing={isEditing}
                updateSellingPrice={updateSellingPrice}
                updateSellingPriceUnit={updateSellingPriceUnit}
                sellingPrice={recipe.sellingPrice}
                sellingPriceUnit={recipe.sellingPriceUnit || 'kg'}
                rateMethod={rateMethod}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom bar */}
      {selectedProduct && (
        <MobileSummaryBar
          totals={totals}
          isEditing={isEditing}
          sellingPrice={recipe.sellingPrice}
          updateSellingPrice={updateSellingPrice}
        />
      )}

      {/* Picker modal */}
      <ItemPickerModal
        open={pickerMode !== null}
        mode={pickerMode || 'ingredient'}
        items={pickerItems}
        search={pickerSearch}
        onSearchChange={setPickerSearch}
        onPick={handlePick}
        onClose={closePicker}
        rateMethod={rateMethod}
      />
    </div>
  );
};

export default ProductCosting;