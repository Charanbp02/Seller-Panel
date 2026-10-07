// src/utils/cashbookSync.js
import { db } from '../firebase/firebaseConfig';
import {
  collection, doc, query, where, getDocs, addDoc, updateDoc
} from 'firebase/firestore';

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

/**
 * Add / remove a cashbook entry tied to a source document.
 * Idempotent: same (source, sourceId) replaces the previous entry.
 */
export async function syncCashbookEntry({
  date,
  type,                // 'sales' | 'expense' | 'owner' | 'investment'
  amount,
  paymentMode,
  description = '',
  source,              // 'investments' | 'assets' | 'customer_payment' | 'daily_sales' | ...
  sourceId,
  reference = '',
  mode = 'add'         // 'add' | 'remove'
}) {
  // Credit → no cash impact
  if (!CASH_MODES.has(paymentMode)) return;
  const amt = Number(amount) || 0;
  if (amt <= 0) return;

  const nowISO = new Date().toISOString();
  const q = query(collection(db, 'cashbook'), where('date', '==', date));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const cbDoc = snap.docs[0];
    const cb = cbDoc.data();

    // Remove prior entry from same source
    let entries = (cb.entries || []).filter(
      e => !(e.source === source && e.sourceId === sourceId)
    );

    if (mode === 'add') {
      entries.push({
        type, amount: amt, paymentMode, description,
        source, sourceId, reference, createdAt: nowISO
      });
    }

    // Recompute totals from entries
    const totals = { sales: 0, expense: 0, owner: 0, investment: 0 };
    entries.forEach(e => {
      if (!CASH_MODES.has(e.paymentMode)) return;
      const a = Number(e.amount) || 0;
      if (totals[e.type] !== undefined) totals[e.type] += a;
    });

    const opening = Number(cb.openingBalance) || 0;
    const closing = opening + totals.sales + totals.investment - totals.expense - totals.owner;

    await updateDoc(doc(db, 'cashbook', cbDoc.id), {
      entries,
      sales: totals.sales,
      expense: totals.expense,
      owner: totals.owner,
      investment: totals.investment,
      closingBalance: closing,
      updatedAt: nowISO
    });
  } else if (mode === 'add') {
    // Create a new day doc
    const prevSnap = await getDocs(
      query(collection(db, 'cashbook'), where('date', '<', date))
    );
    const rows = prevSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const opening = rows.length ? Number(rows[0].closingBalance) || 0 : 0;

    const entry = {
      type, amount: amt, paymentMode, description,
      source, sourceId, reference, createdAt: nowISO
    };
    const totals = { sales: 0, expense: 0, owner: 0, investment: 0 };
    totals[type] = amt;
    const closing = opening + totals.sales + totals.investment - totals.expense - totals.owner;

    await addDoc(collection(db, 'cashbook'), {
      date,
      openingBalance: opening,
      ...totals,
      closingBalance: closing,
      entries: [entry],
      createdAt: nowISO,
      updatedAt: nowISO
    });
  }
}