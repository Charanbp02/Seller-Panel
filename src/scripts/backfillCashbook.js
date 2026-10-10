// src/scripts/backfillCashbook.js
import {
  collection, getDocs, doc, setDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

// ============================================================
// 🎯 INVESTMENT KEYWORDS — ಇವು ಕಂಡರೆ Investment ಎಂದು ಗುರುತಿಸುತ್ತದೆ
//    (ನಿಮ್ಮ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ಬದಲಾಯಿಸಿ)
// ============================================================
const INVESTMENT_KEYWORDS = [
  // ಪದಾರ್ಥಗಳು (ingredients) — ಕನ್ನಡ + ಇಂಗ್ಲಿಷ್
  'ingredient', 'ingredients', 'flour', 'rice', 'sugar', 'salt', 'oil', 'ghee',
  'masala', 'spice', 'spices', 'dal', 'dhal', 'gram', 'wheat', 'maida',
  'raw material', 'raw materials', 'rawmaterial', 'raw',
  'ಹಿಟ್ಟು', 'ಅಕ್ಕಿ', 'ಸಕ್ಕರೆ', 'ಉಪ್ಪು', 'ಎಣ್ಣೆ', 'ತುಪ್ಪ', 'ಮಸಾಲೆ', 'ಪದಾರ್ಥ',
  'ಬೇಳೆ', 'ಗೋಧಿ', 'ಮೈದಾ', 'ಖಾದ್ಯ', 'ಆಹಾರ',

  // ಪ್ಯಾಕಿಂಗ್ (packing)
  'packing', 'package', 'packaging', 'cover', 'covers', 'box', 'boxes',
  'pouch', 'pouches', 'bag', 'bags', 'label', 'labels', 'sticker', 'stickers',
  'carton', 'cartons', 'wrapper', 'wrappers', 'film', 'plastic',
  'ಪ್ಯಾಕಿಂಗ್', 'ಪ್ಯಾಕೆಟ್', 'ಪೊಟ್ಟಣ', 'ಡಬ್ಬ', 'ಡಬ್ಬಿ', 'ಚೀಲ', 'ಲೇಬಲ್',

  // ಯಂತ್ರ/ಆಸ್ತಿ (assets)
  'machine', 'machinery', 'equipment', 'tool', 'tools', 'vehicle', 'furniture',
  'asset', 'assets', 'purchase of', 'bought',
  'ಯಂತ್ರ', 'ಉಪಕರಣ', 'ಪರಿಕರ', 'ವಾಹನ', 'ಆಸ್ತಿ', 'ಖರೀದಿ',

  // ತಯಾರಿಕೆಗೆ ಸಂಬಂಧಿಸಿದ ಇತರೆ
  'production', 'manufacturing', 'stock', 'inventory', 'material', 'materials',
  'ಉತ್ಪಾದನೆ', 'ತಯಾರಿಕೆ', 'ಸ್ಟಾಕ್', 'ಮೆಟೀರಿಯಲ್'
];

// ============================================================
// 🎯 EXPENSE KEYWORDS — ಇವು ಕಂಡರೆ Expense ಎಂದು ಗುರುತಿಸುತ್ತದೆ
//    (ಇವುಗಳನ್ನು ಬೇರೆ ಎಲ್ಲಾದರೂ ಇದ್ದರೆ, ಅದು Expense)
// ============================================================
const EXPENSE_KEYWORDS = [
  'travel', 'travelling', 'traveling', 'trip', 'fuel', 'petrol', 'diesel',
  'transport', 'transportation', 'bus', 'train', 'flight', 'taxi', 'auto',
  'salary', 'wages', 'labour', 'labor', 'staff', 'employee',
  'rent', 'electricity', 'water', 'internet', 'phone', 'mobile', 'recharge',
  'maintenance', 'repair', 'service', 'cleaning', 'laundry',
  'marketing', 'advertising', 'ads', 'promotion',
  'office', 'stationery', 'printing', 'postage', 'courier',
  'tax', 'gst', 'insurance', 'license', 'fees',
  'medical', 'health', 'medicine',
  'food', 'tea', 'coffee', 'snacks', 'lunch', 'dinner',
  'donation', 'charity', 'festival', 'puja', 'pooja',
  'ಪ್ರಯಾಣ', 'ಪೆಟ್ರೋಲ್', 'ಡೀಸೆಲ್', 'ವಾಹನ ಖರ್ಚು',
  'ಸಂಬಳ', 'ಕೂಲಿ', 'ಕಾರ್ಮಿಕ', 'ಉದ್ಯೋಗಿ',
  'ಬಾಡಿಗೆ', 'ಕರೆಂಟ್', 'ವಿದ್ಯುತ್', 'ನೀರು', 'ಇಂಟರ್ನೆಟ್', 'ಫೋನ್', 'ಮೊಬೈಲ್',
  'ದುರಸ್ತಿ', 'ಸೇವೆ', 'ಸ್ವಚ್ಛತೆ',
  'ಜಾಹೀರಾತು', 'ಮಾರ್ಕೆಟಿಂಗ್',
  'ಕಚೇರಿ', 'ಸ್ಟೇಷನರಿ', 'ಅಚ್ಚು',
  'ತೆರಿಗೆ', 'ಜಿಎಸ್‌ಟಿ', 'ವಿಮೆ', 'ಪರವಾನಗಿ',
  'ಔಷಧ', 'ಆರೋಗ್ಯ', 'ವೈದ್ಯಕೀಯ',
  'ಊಟ', 'ತಿಂಡಿ', 'ಕಾಫಿ', 'ಟೀ',
  'ದೇಣಿಗೆ', 'ಹಬ್ಬ', 'ಪೂಜೆ'
];

// ---------- Classification ----------
const classifyExpense = (x) => {
  // 1. Explicit category field (best case)
  const cat = String(x.category || x.type || '').toLowerCase().trim();
  if (cat) {
    if (cat.includes('travel') || cat.includes('salary') || cat.includes('rent') ||
        cat.includes('bill') || cat.includes('office') || cat.includes('maintenance') ||
        cat.includes('ಪ್ರಯಾಣ') || cat.includes('ಸಂಬಳ') || cat.includes('ಬಾಡಿಗೆ')) {
      return 'expense';
    }
    if (cat.includes('ingredient') || cat.includes('packing') ||
        cat.includes('product') || cat.includes('asset') || cat.includes('raw') ||
        cat.includes('ಪದಾರ್ಥ') || cat.includes('ಪ್ಯಾಕಿಂಗ್') || cat.includes('ಉತ್ಪನ್ನ')) {
      return 'investment';
    }
  }

  // 2. Description keyword match
  const desc = String(x.description || x.notes || x.title || '').toLowerCase();

  // First check EXPENSE keywords (explicit)
  for (const kw of EXPENSE_KEYWORDS) {
    if (desc.includes(kw.toLowerCase())) return 'expense';
  }

  // Then check INVESTMENT keywords
  for (const kw of INVESTMENT_KEYWORDS) {
    if (desc.includes(kw.toLowerCase())) return 'investment';
  }

  // 3. Default — if nothing matched, treat as expense (safer)
  return 'expense';
};

// ---------- Helpers ----------
const localDate = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const extractDate = (x) => {
  if (!x) return '';
  const v = x.date || x.purchaseDate || x.createdAt || '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v?.toDate) return localDate(v.toDate());
  if (v instanceof Date) return localDate(v);
  return '';
};

const num = (v) => Number(v) || 0;

const buildEntryId = (source, sourceId) => {
  const src = String(source || 'manual').trim();
  const id = String(sourceId || '');
  return id ? `${src}_${id}` : `${src}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const computeDayTotals = (entries) => {
  const t = { sales: 0, expense: 0, owner: 0, investment: 0 };
  (entries || []).forEach(e => {
    const amt = num(e.amount);
    if (!CASH_MODES.has(e.paymentMode)) return;
    if (t[e.type] !== undefined) t[e.type] += amt;
  });
  return t;
};

const computeClosing = (opening, t) =>
  opening + t.sales + t.investment - t.expense - t.owner;

// ============================================================
// MAIN BACKFILL
// ============================================================
export const backfillCashbook = async (onProgress) => {
  const log = (m) => {
    console.log('[backfill]', m);
    onProgress?.(m);
  };

  log('Starting backfill...');

  // ---------- Read all source collections ----------
  const [salesPaySnap, assetsSnap, packingSnap, ingSnap, expSnap, investSnap, ownerSnap] = await Promise.all([
    getDocs(collection(db, 'sales_payments')),
    getDocs(collection(db, 'assets')),
    getDocs(collection(db, 'packingMaterials')),
    getDocs(collection(db, 'ingredients')),
    getDocs(collection(db, 'expenses')),
    getDocs(collection(db, 'investments')),
    getDocs(collection(db, 'owner_withdrawals')).catch(() => ({ docs: [] }))
  ]);

  log(`Read: sales_payments=${salesPaySnap.size}, assets=${assetsSnap.size}, packing=${packingSnap.size}, ingredients=${ingSnap.size}, expenses=${expSnap.size}, invest_meta=${investSnap.size}`);

  // ---------- Bucket by date ----------
  const byDate = {};
  const push = (date, entry) => {
    if (!date) return;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(entry);
  };

  // ============ 1. SALES ============
  salesPaySnap.forEach((d) => {
    const p = d.data();
    if (!CASH_MODES.has(p.mode)) return;
    const date = extractDate(p);
    if (!date) return;
    push(date, {
      id: buildEntryId('sales_payments', d.id),
      date,
      type: 'sales',
      amount: num(p.amount),
      paymentMode: p.mode,
      description: `Payment ${p.invoiceNumber || ''} — ${p.customerName || ''}`.trim(),
      reference: p.invoiceNumber || '',
      source: 'sales_payments',
      sourceId: d.id,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  log(`Sales entries: ${salesPaySnap.size}`);

  // ============ 2. EXPENSES → split into Expense + Investment ============
  let expenseCount = 0;
  let investmentCount = 0;

  expSnap.forEach((d) => {
    const x = d.data();
    const date = extractDate(x);
    if (!date) return;
    if (!CASH_MODES.has(x.paymentMode || 'cash')) return;
    const amt = num(x.amount);
    if (amt <= 0) return;

    const kind = classifyExpense(x);
    const desc = x.description || x.notes || x.category || '';

    if (kind === 'investment') {
      push(date, {
        id: buildEntryId('investments', d.id),
        date,
        type: 'investment',
        amount: amt,
        paymentMode: x.paymentMode || 'cash',
        description: `Investment — ${desc}`.trim(),
        reference: x.reference || '',
        source: 'investments',
        sourceId: d.id,
        createdAt: x.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      investmentCount++;
    } else {
      push(date, {
        id: buildEntryId('expenses', d.id),
        date,
        type: 'expense',
        amount: amt,
        paymentMode: x.paymentMode || 'cash',
        description: `Expense — ${desc}`.trim(),
        reference: x.reference || '',
        source: 'expenses',
        sourceId: d.id,
        createdAt: x.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      expenseCount++;
    }
  });

  log(`Expenses: ${expenseCount} → Expense, ${investmentCount} → Investment`);

  // ============ 3. ASSETS → Investment ============
  assetsSnap.forEach((d) => {
    const x = d.data();
    const date = extractDate(x);
    if (!date) return;
    const value = num(x.purchasePrice) * (num(x.quantity) || 1);
    if (value <= 0) return;

    push(date, {
      id: buildEntryId('assets', d.id),
      date,
      type: 'investment',
      amount: value,
      paymentMode: x.paymentMode || 'cash',
      description: `Asset — ${x.productName || x.name || ''}`.trim(),
      reference: x.reference || '',
      source: 'assets',
      sourceId: d.id,
      createdAt: x.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // ============ 4. PACKING → Investment ============
  packingSnap.forEach((d) => {
    const x = d.data();
    (x.purchases || []).forEach((p, idx) => {
      const dt = extractDate(p);
      if (!dt) return;
      const amt = num(p.amount);
      if (amt <= 0) return;

      push(dt, {
        id: buildEntryId('packing', `${d.id}_${idx}`),
        date: dt,
        type: 'investment',
        amount: amt,
        paymentMode: p.paymentMode || x.paymentMode || 'cash',
        description: `Packing — ${p.itemName || x.productName || ''}`.trim(),
        reference: p.reference || '',
        source: 'packing',
        sourceId: `${d.id}_${idx}`,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  });

  // ============ 5. INGREDIENTS → Investment ============
  ingSnap.forEach((d) => {
    const x = d.data();
    (x.purchases || []).forEach((p, idx) => {
      const dt = extractDate(p);
      if (!dt) return;
      const amt = num(p.amount);
      if (amt <= 0) return;

      push(dt, {
        id: buildEntryId('ingredients', `${d.id}_${idx}`),
        date: dt,
        type: 'investment',
        amount: amt,
        paymentMode: p.paymentMode || x.paymentMode || 'cash',
        description: `Ingredient — ${p.itemName || x.productName || ''}`.trim(),
        reference: p.reference || '',
        source: 'ingredients',
        sourceId: `${d.id}_${idx}`,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  });

  // ============ 6. OWNER WITHDRAWALS ============
  (ownerSnap.docs || []).forEach((d) => {
    const x = d.data();
    const date = extractDate(x);
    if (!date) return;
    if (!CASH_MODES.has(x.paymentMode || 'cash')) return;
    const amt = num(x.amount);
    if (amt <= 0) return;

    push(date, {
      id: buildEntryId('owner_withdrawals', d.id),
      date,
      type: 'owner',
      amount: amt,
      paymentMode: x.paymentMode || 'cash',
      description: `Owner withdrawal — ${x.notes || x.description || ''}`.trim(),
      reference: x.reference || '',
      source: 'owner_withdrawals',
      sourceId: d.id,
      createdAt: x.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // ============ 7. Read existing cashbook (preserve MANUAL entries) ============
  const existingSnap = await getDocs(collection(db, 'cashbook'));
  const existingByDate = {};
  existingSnap.forEach((d) => {
    const x = d.data();
    if (x.date) existingByDate[x.date] = { id: d.id, ...x };
  });

  // ============ 8. Write days in order with cascade ============
  const allDates = [...new Set([
    ...Object.keys(existingByDate),
    ...Object.keys(byDate)
  ])].sort();

  let carry = 0;
  let writtenDays = 0;
  let writtenEntries = 0;

  const AUTO_SOURCES = new Set([
    'sales_payments', 'expenses', 'investments', 'assets',
    'packing', 'ingredients', 'owner_withdrawals'
  ]);

  for (const date of allDates) {
    const existing = existingByDate[date];
    const newEntries = byDate[date] || [];

    let entries = [];
    if (existing?.entries) {
      // Keep MANUAL entries; drop auto entries (they will be replaced)
      entries = existing.entries.filter(e => !AUTO_SOURCES.has(e.source));
    }

    // Add backfilled entries
    entries = [...entries, ...newEntries];

    // Dedupe by id
    const seen = new Set();
    entries = entries.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    const totals = computeDayTotals(entries);
    const opening = carry;
    const closing = computeClosing(opening, totals);

    const payload = {
      date,
      openingBalance: opening,
      sales: totals.sales,
      expense: totals.expense,
      owner: totals.owner,
      investment: totals.investment,
      closingBalance: closing,
      entries,
      updatedAt: new Date().toISOString(),
      backfilledAt: new Date().toISOString()
    };

    if (existing) {
      await setDoc(doc(db, 'cashbook', existing.id), payload, { merge: false });
    } else {
      await setDoc(doc(collection(db, 'cashbook')), {
        ...payload,
        createdAt: new Date().toISOString()
      });
    }

    writtenDays++;
    writtenEntries += newEntries.length;

    if (writtenDays % 20 === 0) {
      log(`Written ${writtenDays}/${allDates.length} days...`);
    }

    carry = closing;
  }

  log(`✅ Backfill complete: ${writtenDays} days, ${writtenEntries} entries`);

  return {
    days: writtenDays,
    entries: writtenEntries,
    expenseCount,
    investmentCount
  };
};

// ============================================================
// PREVIEW — ತೋರಿಸುತ್ತದೆ ಏನು ವಿಂಗಡಣೆ ಆಗುತ್ತದೆ ಎಂದು (ಡೇಟಾ ಬದಲಾಗುವುದಿಲ್ಲ)
// ============================================================
export const previewBackfill = async () => {
  const [expSnap, salesPaySnap] = await Promise.all([
    getDocs(collection(db, 'expenses')),
    getDocs(collection(db, 'sales_payments'))
  ]);

  let expenseTotal = 0, expenseCount = 0;
  let investmentTotal = 0, investmentCount = 0;
  const samples = { expense: [], investment: [] };

  expSnap.forEach((d) => {
    const x = d.data();
    const amt = num(x.amount);
    if (amt <= 0) return;
    const kind = classifyExpense(x);
    const desc = x.description || x.notes || x.category || '(no description)';
    const date = extractDate(x);

    if (kind === 'investment') {
      investmentTotal += amt;
      investmentCount++;
      if (samples.investment.length < 10) {
        samples.investment.push({ date, amount: amt, description: desc });
      }
    } else {
      expenseTotal += amt;
      expenseCount++;
      if (samples.expense.length < 10) {
        samples.expense.push({ date, amount: amt, description: desc });
      }
    }
  });

  let salesTotal = 0;
  salesPaySnap.forEach((d) => {
    const p = d.data();
    if (CASH_MODES.has(p.mode)) salesTotal += num(p.amount);
  });

  return {
    expenseCount,
    expenseTotal,
    investmentCount,
    investmentTotal,
    salesTotal,
    samples
  };
};