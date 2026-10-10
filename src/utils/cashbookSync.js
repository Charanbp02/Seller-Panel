// src/utils/cashbookSync.js
import {
  collection, doc, getDocs, query, where, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const CASH_MODES = new Set(['cash', 'upi', 'bank']);

const computeDayTotals = (entries) => {
  const t = { sales: 0, expense: 0, owner: 0, investment: 0 };
  (entries || []).forEach(e => {
    const amt = Number(e.amount) || 0;
    if (!CASH_MODES.has(e.paymentMode)) return;
    if (t[e.type] !== undefined) t[e.type] += amt;
  });
  return t;
};

const computeClosing = (opening, totals) =>
  opening + totals.sales + totals.investment - totals.expense - totals.owner;

const buildEntryId = (source, sourceId) => {
  const src = String(source || 'manual').trim();
  const id = String(sourceId || '');
  return id ? `${src}_${id}` : `${src}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const findDayRefByDate = async (date) => {
  const snap = await getDocs(query(
    collection(db, 'cashbook'),
    where('date', '==', date)
  ));
  return snap.empty ? null : snap.docs[0].ref;
};

const findEarlierDayRefs = async (date) => {
  const snap = await getDocs(query(
    collection(db, 'cashbook'),
    where('date', '<', date)
  ));
  return snap.docs
    .map(d => ({ ref: d.ref, date: d.data().date }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
};

const findLaterDayRefs = async (date) => {
  const snap = await getDocs(query(
    collection(db, 'cashbook'),
    where('date', '>', date)
  ));
  return snap.docs
    .map(d => ({ ref: d.ref, date: d.data().date }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
};

// ============================================================
// SYNC — add or remove a single entry, cascade later days
// ============================================================
export const syncCashbookEntry = async ({
  date,
  type,
  amount = 0,
  paymentMode = 'cash',
  description = '',
  source = 'manual',
  sourceId = null,
  reference = '',
  mode = 'add'
}) => {
  if (!date) throw new Error('Date required');

  // GUARDS (only for 'add')
  if (mode === 'add') {
    if (!CASH_MODES.has(paymentMode)) return;
    if ((Number(amount) || 0) <= 0) return;
  }

  const nowISO = new Date().toISOString();
  const entryId = buildEntryId(source, sourceId);

  const dayRef = await findDayRefByDate(date);
  const earlierRefs = await findEarlierDayRefs(date);
  const laterRefs = await findLaterDayRefs(date);

  await runTransaction(db, async (tx) => {
    // ============ PHASE A: ALL READS ============
    const daySnap = dayRef ? await tx.get(dayRef) : null;
    const earlierSnaps = [];
    for (const r of earlierRefs) earlierSnaps.push({ ref: r.ref, snap: await tx.get(r.ref) });
    const laterSnaps = [];
    for (const r of laterRefs) laterSnaps.push({ ref: r.ref, snap: await tx.get(r.ref) });

    // ============ PHASE B: ALL WRITES ============
    const dayData = daySnap?.exists() ? daySnap.data() : null;
    let entries = dayData?.entries ? [...dayData.entries] : [];

    entries = entries.filter(e => e.id !== entryId);

    if (mode === 'add') {
      entries.push({
        id: entryId,
        date,
        type,
        amount: Number(amount) || 0,
        paymentMode,
        description,
        reference,
        source,
        sourceId,
        createdAt: nowISO,
        updatedAt: nowISO
      });
    }

    const totals = computeDayTotals(entries);

    let opening = 0;
    if (dayData) {
      opening = Number(dayData.openingBalance) || 0;
    } else if (earlierSnaps.length > 0) {
      const last = earlierSnaps[earlierSnaps.length - 1];
      if (last.snap?.exists()) {
        opening = Number(last.snap.data().closingBalance) || 0;
      }
    }

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
      updatedAt: nowISO
    };

    if (dayRef && daySnap?.exists()) {
      tx.update(dayRef, payload);
    } else if (mode === 'add') {
      const newRef = doc(collection(db, 'cashbook'));
      tx.set(newRef, { ...payload, createdAt: nowISO });
    }

    let carry = closing;
    for (const { ref, snap } of laterSnaps) {
      if (!snap?.exists()) continue;
      const d = snap.data();
      const t = computeDayTotals(d.entries || []);
      const op = carry;
      const cl = computeClosing(op, t);
      tx.update(ref, {
        openingBalance: op,
        sales: t.sales,
        expense: t.expense,
        owner: t.owner,
        investment: t.investment,
        closingBalance: cl,
        updatedAt: nowISO
      });
      carry = cl;
    }
  });

  return entryId;
};

export const removeCashbookBySource = async (source, sourceId) => {
  if (!source || !sourceId) return;
  const entryId = buildEntryId(source, sourceId);

  const allSnap = await getDocs(collection(db, 'cashbook'));
  const allDocs = allSnap.docs
    .map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const targetDay = allDocs.find(d =>
    (d.entries || []).some(e => e.id === entryId)
  );
  if (!targetDay) return;

  await syncCashbookEntry({
    date: targetDay.date,
    source,
    sourceId,
    mode: 'remove'
  });
};