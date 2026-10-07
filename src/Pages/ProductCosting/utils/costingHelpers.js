// src/Pages/ProductCosting/utils/costingHelpers.js

// ---------- Unit conversion ----------
const CONV = {
  'g->kg': 1e-3, 'mg->kg': 1e-6, 'mg->g': 1e-3,
  'ml->L': 1e-3, 'kg->g': 1e3, 'L->ml': 1e3
};

export const toBaseUnit = (qty, from, base) => {
  const q = Number(qty) || 0;
  if (!from || !base || from === base) return q;
  return q * (CONV[`${from}->${base}`] ?? 1);
};

// Mass-only helper — used to convert a batch (e.g. 5 kg) into a rate's unit (e.g. kg)
const MASS = { mg: 0.001, g: 1, kg: 1000 };
export const convertQty = (qty, fromUnit, toUnit) => {
  const q = Number(qty) || 0;
  if (MASS[fromUnit] && MASS[toUnit]) return (q * MASS[fromUnit]) / MASS[toUnit];
  return q;
};

export const fmt = (n, dec = 2) => `₹${(Number(n) || 0).toFixed(dec)}`;

// ============================================================
// RATE CALCULATION
// ============================================================
export const latestPurchaseRate = (doc) => {
  if (!doc) return 0;
  const purchases = doc.purchases || [];
  if (purchases.length > 0) {
    const sorted = [...purchases].sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || ''))
    );
    const r = Number(sorted[0]?.rate) || 0;
    if (r > 0) return r;
  }
  return Number(doc.purchaseRate ?? doc.rate) || 0;
};

export const weightedAverageRate = (doc) => {
  if (!doc) return 0;
  const purchases = doc.purchases || [];
  if (purchases.length === 0) {
    return Number(doc.purchaseRate ?? doc.rate) || 0;
  }
  let totalQty = 0;
  let totalValue = 0;
  purchases.forEach(p => {
    const q = Number(p.quantity) || 0;
    const r = Number(p.rate) || 0;
    totalQty += q;
    totalValue += q * r;
  });
  if (totalQty <= 0) return Number(doc.purchaseRate ?? doc.rate) || 0;
  return totalValue / totalQty;
};

export const resolveRate = (doc, method = 'latest', manualRate = 0) => {
  if (method === 'manual') return Number(manualRate) || 0;
  if (method === 'weighted') return weightedAverageRate(doc);
  return latestPurchaseRate(doc);
};

export const RATE_METHODS = [
  { value: 'latest',   label: 'Latest Purchase' },
  { value: 'weighted', label: 'Weighted Average' },
  { value: 'manual',   label: 'Manual Override' }
];

// ============================================================
// BATCH PRESETS
// ============================================================
export const BATCH_PRESETS = [
  { label: '100 g', value: 100,  unit: 'g' },
  { label: '200 g', value: 200,  unit: 'g' },
  { label: '250 g', value: 250,  unit: 'g' },
  { label: '500 g', value: 500,  unit: 'g' },
  { label: '1 kg',  value: 1000, unit: 'g' },
  { label: '2 kg',  value: 2000, unit: 'g' },
  { label: '5 kg',  value: 5000, unit: 'g' }
];

export const scaleFactorFor = (baseBatch, targetBatch) => {
  if (!baseBatch || !targetBatch) return 1;
  const baseInG = toBaseUnit(baseBatch.size, baseBatch.unit, 'g');
  const targInG = toBaseUnit(targetBatch.size, targetBatch.unit, 'g');
  if (baseInG <= 0) return 1;
  return targInG / baseInG;
};

// ============================================================
// INGREDIENT COST
// ============================================================
export const calculateIngredientCost = (
  recipeIngredients = [],
  ingredientsById = {},
  scaleFactor = 1,
  rateMethod = 'latest'
) => {
  const rows = [];
  const missing = [];
  let total = 0;

  recipeIngredients.forEach(ri => {
    const ing = ingredientsById[ri.ingredientId];
    const scaledQty = (Number(ri.quantity) || 0) * scaleFactor;

    if (!ing) {
      missing.push(ri.ingredientId);
      rows.push({
        ingredientId: ri.ingredientId,
        ingredientName: '(deleted ingredient)',
        recipeQty: scaledQty,
        recipeUnit: ri.unit,
        rate: 0,
        rateUnit: '',
        cost: 0,
        error: 'Ingredient was deleted'
      });
      return;
    }

    const baseUnit = ing.unit || 'kg';
    const baseQty = toBaseUnit(scaledQty, ri.unit, baseUnit);
    const rate = resolveRate(ing, ri.rateMethod || rateMethod, ri.manualRate);
    const cost = baseQty * rate;

    total += cost;
    rows.push({
      ingredientId: ri.ingredientId,
      ingredientName: ing.ingredientName || '(unnamed)',
      recipeQty: scaledQty,
      recipeUnit: ri.unit,
      baseQty,
      baseUnit,
      rate,
      rateUnit: baseUnit,
      rateMethod: ri.rateMethod || rateMethod,
      manualRate: ri.manualRate,
      cost
    });
  });

  return { rows, total, missing };
};

// ============================================================
// PACKING COST
// ============================================================
export const calculatePackingCost = (
  recipePacking = [],
  packingById = {},
  scaleFactor = 1,
  rateMethod = 'latest'
) => {
  const rows = [];
  const missing = [];
  let total = 0;

  recipePacking.forEach(rp => {
    const pack = packingById[rp.packingId];
    const scaledQty = (Number(rp.quantity) || 0) * scaleFactor;

    if (!pack) {
      missing.push(rp.packingId);
      rows.push({
        packingId: rp.packingId,
        materialName: '(deleted material)',
        qty: scaledQty,
        unit: rp.unit,
        rate: 0,
        baseUnit: '',
        cost: 0,
        error: 'Packing material was deleted'
      });
      return;
    }

    const baseUnit = pack.unit || 'pcs';
    const baseQty = toBaseUnit(scaledQty, rp.unit, baseUnit);
    const rate = resolveRate(pack, rp.rateMethod || rateMethod, rp.manualRate);
    const cost = baseQty * rate;

    total += cost;
    rows.push({
      packingId: rp.packingId,
      materialName: pack.materialName || '(unnamed)',
      qty: scaledQty,
      unit: rp.unit,
      baseQty,
      baseUnit,
      rate,
      rateMethod: rp.rateMethod || rateMethod,
      manualRate: rp.manualRate,
      cost
    });
  });

  return { rows, total, missing };
};

// ============================================================
// TOTALS + PROFIT
// ★ sellingPrice is now a RATE per sellingPriceUnit
// ★ Total selling price = rate × (batchSize converted to rate's unit)
// ============================================================
export const computeTotals = ({
  ingredientTotal = 0,
  packingTotal = 0,
  otherCosts = {},
  sellingPriceRate = 0,       // ₹ per sellingPriceUnit (e.g. per kg)
  sellingPriceUnit = 'kg',    // 'kg' | 'g' | 'pcs'
  batchSize = 0,
  batchUnit = 'g',
  scaleFactor = 1
}) => {
  const labour         = (Number(otherCosts.labour) || 0) * scaleFactor;
  const gasElectricity = (Number(otherCosts.gasElectricity) || 0) * scaleFactor;
  const grinding       = (Number(otherCosts.grinding) || 0) * scaleFactor;
  const other          = (Number(otherCosts.other) || 0) * scaleFactor;
  const otherTotal     = labour + gasElectricity + grinding + other;

  const totalCost = (Number(ingredientTotal) || 0)
                  + (Number(packingTotal) || 0)
                  + otherTotal;

  // ★ THE FIX — multiply the rate by the batch size (in the rate's unit)
  const batchInRateUnit = convertQty(batchSize, batchUnit, sellingPriceUnit);
  const sellingPrice = (Number(sellingPriceRate) || 0) * batchInRateUnit;

  const profit = sellingPrice - totalCost;
  const profitMarginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const profitMarkupPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return {
    labour, gasElectricity, grinding, other, otherTotal,
    totalCost, sellingPrice, profit,
    profitMarginPct,
    profitMarkupPct,
    profitPct: profitMarginPct,
    batchInRateUnit
  };
};

// ============================================================
// SNAPSHOT
// ============================================================
export const buildCostingSnapshot = ({
  product, recipe, ingResult, packResult, totals,
  batchSize, batchUnit, savedBy, rateMethod
}) => ({
  productId: product.id,
  productName: product.productName,
  recipeId: recipe.id || null,
  batchSize,
  batchUnit,
  rateMethod: rateMethod || 'latest',

  ingredientCosts: ingResult.rows.map(r => ({
    ingredientId: r.ingredientId,
    ingredientName: r.ingredientName,
    quantity: r.recipeQty,
    unit: r.recipeUnit,
    ratePerBaseUnit: r.rate,
    baseUnit: r.baseUnit,
    cost: r.cost
  })),
  packingCosts: packResult.rows.map(r => ({
    packingId: r.packingId,
    materialName: r.materialName,
    quantity: r.qty,
    unit: r.unit,
    ratePerBaseUnit: r.rate,
    baseUnit: r.baseUnit,
    cost: r.cost
  })),
  otherCosts: {
    labour: totals.labour,
    gasElectricity: totals.gasElectricity,
    grinding: totals.grinding,
    other: totals.other
  },

  totals: {
    ingredientTotal: ingResult.total,
    packingTotal: packResult.total,
    otherTotal: totals.otherTotal,
    totalCost: totals.totalCost,
    sellingPrice: totals.sellingPrice,
    profit: totals.profit,
    profitMarginPct: totals.profitMarginPct,
    profitMarkupPct: totals.profitMarkupPct
  },

  savedBy: savedBy || 'unknown'
});

// ============================================================
// TOAST
// ============================================================
export const showToast = (text, type = 'success') => {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };
  const el = document.createElement('div');
  el.className = `fixed top-4 right-4 ${colors[type] || colors.success} text-white px-4 py-2 rounded-lg shadow-lg z-[60]`;
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};