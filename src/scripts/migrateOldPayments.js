// src/scripts/migrateOldPayments.js
import {
  collection, getDocs, doc, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// ============================================================
// MIGRATION — Convert old isPaymentOnly → sales_payments
// ============================================================

/**
 * Preview: how many old payments exist and what would happen.
 * Safe — does not write anything.
 */
export const previewOldPayments = async () => {
  console.log('🔍 Previewing old payments...');

  const salesSnap = await getDocs(collection(db, 'daily_sales'));
  const allDocs = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const oldPayments = allDocs.filter(x => x.isPaymentOnly === true);
  const realSales = allDocs.filter(x => !x.isPaymentOnly);

  const paySnap = await getDocs(collection(db, 'sales_payments'));
  const existingPayments = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const existingSourceIds = new Set(
    existingPayments.map(p => p.sourceId).filter(Boolean)
  );

  // Group real sales by customer for match preview
  const salesByCustomer = {};
  realSales.forEach(s => {
    const cid = s.customerId || `name:${s.customerName}`;
    if (!salesByCustomer[cid]) salesByCustomer[cid] = [];
    salesByCustomer[cid].push(s);
  });
  Object.values(salesByCustomer).forEach(arr => {
    arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  });

  // Track paid per sale (existing)
  const paidBySale = {};
  existingPayments.forEach(p => {
    if (!p.saleId) return;
    paidBySale[p.saleId] = (paidBySale[p.saleId] || 0) + (Number(p.amount) || 0);
  });

  // Simulate migration
  const sorted = [...oldPayments].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  );
  let willApplyToSale = 0;
  let willBeStandalone = 0;
  let willBeSkipped = 0;

  for (const payment of sorted) {
    if (existingSourceIds.has(payment.id)) {
      willBeSkipped++;
      continue;
    }
    const cid = payment.customerId || `name:${payment.customerName}`;
    const sales = salesByCustomer[cid] || [];
    let matched = null;
    for (const sale of sales) {
      if ((sale.date || '') > (payment.date || '')) continue;
      const paid = paidBySale[sale.id] || 0;
      const due = Math.max(0, (Number(sale.grandTotal) || 0) - paid);
      if (due > 0) { matched = sale; break; }
    }
    const amt = Number(payment.grandTotal) || Number(payment.amount) || 0;
    if (amt <= 0) { willBeSkipped++; continue; }
    if (matched) {
      paidBySale[matched.id] = (paidBySale[matched.id] || 0) + amt;
      willApplyToSale++;
    } else {
      willBeStandalone++;
    }
  }

  const summary = {
    oldPayments: oldPayments.length,
    realSales: realSales.length,
    existingPayments: existingPayments.length,
    willApplyToSale,
    willBeStandalone,
    willBeSkipped,
    willDelete: oldPayments.length - willBeSkipped
  };

  console.log('\n📊 Preview:');
  console.log(`   - Old payment entries found: ${summary.oldPayments}`);
  console.log(`   - Will apply to a sale:       ${summary.willApplyToSale}`);
  console.log(`   - Will become standalone:     ${summary.willBeStandalone}`);
  console.log(`   - Will be skipped:            ${summary.willBeSkipped}`);
  console.log(`   - Will be deleted:            ${summary.willDelete}`);

  if (oldPayments.length > 0) {
    console.log('\nFirst 10 old payments:');
    oldPayments.slice(0, 10).forEach(p => {
      console.log(`   ${p.date} • ${p.customerName} • ₹${p.grandTotal || p.amount} • mode=${p.paymentMode || 'cash'}`);
    });
  }

  return summary;
};

/**
 * Run migration — converts old isPaymentOnly → sales_payments.
 * Idempotent — dedup by sourceId.
 */
export const migrateOldPayments = async (onProgress = null) => {
  console.log('🔄 Starting old payment migration...');

  const report = (msg) => {
    console.log(msg);
    if (onProgress) onProgress(msg);
  };

  // ============ 1. Load raw data ============
  report('📥 Loading daily_sales...');
  const salesSnap = await getDocs(collection(db, 'daily_sales'));
  const allDocs = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const oldPayments = allDocs.filter(x => x.isPaymentOnly === true);
  const realSales = allDocs.filter(x => !x.isPaymentOnly);

  report(`   → ${allDocs.length} total, ${oldPayments.length} old payments, ${realSales.length} real sales`);

  if (oldPayments.length === 0) {
    report('✅ No old payments to migrate.');
    return {
      total: 0, created: 0, standalone: 0, skipped: 0, deleted: 0
    };
  }

  report('📥 Loading existing sales_payments...');
  const paySnap = await getDocs(collection(db, 'sales_payments'));
  const existingPayments = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const existingSourceIds = new Set(
    existingPayments.map(p => p.sourceId).filter(Boolean)
  );
  report(`   → ${existingPayments.length} existing payments`);

  // ============ 2. Group real sales by customer ============
  const salesByCustomer = {};
  realSales.forEach(s => {
    const cid = s.customerId || `name:${s.customerName}`;
    if (!salesByCustomer[cid]) salesByCustomer[cid] = [];
    salesByCustomer[cid].push(s);
  });
  Object.values(salesByCustomer).forEach(arr => {
    arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  });

  // ============ 3. Track paid per sale ============
  const paidBySale = {};
  existingPayments.forEach(p => {
    if (!p.saleId) return;
    paidBySale[p.saleId] = (paidBySale[p.saleId] || 0) + (Number(p.amount) || 0);
  });

  // ============ 4. Process each old payment ============
  const sorted = [...oldPayments].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  );

  const toCreate = [];      // sales_payments docs
  const toDelete = [];      // daily_sales doc ids
  let created = 0;
  let standalone = 0;
  let skipped = 0;

  for (const payment of sorted) {
    // Skip if already migrated
    if (existingSourceIds.has(payment.id)) {
      skipped++;
      toDelete.push(payment.id);
      continue;
    }

    const amount = Number(payment.grandTotal) || Number(payment.amount) || 0;
    if (amount <= 0) {
      skipped++;
      continue;
    }

    const cid = payment.customerId || `name:${payment.customerName}`;
    const sales = salesByCustomer[cid] || [];

    // Find first unpaid sale with date <= payment.date
    let matchedSale = null;
    for (const sale of sales) {
      if ((sale.date || '') > (payment.date || '')) continue;
      const alreadyPaid = paidBySale[sale.id] || 0;
      const due = Math.max(0, (Number(sale.grandTotal) || 0) - alreadyPaid);
      if (due > 0) { matchedSale = sale; break; }
    }

    const nowISO = new Date().toISOString();
    const paymentDoc = {
      saleId: matchedSale?.id || null,
      invoiceNumber: matchedSale?.invoiceNumber || payment.invoiceNumber || '',
      customerId: payment.customerId || null,
      customerName: payment.customerName || '',
      amount,
      date: payment.date,
      mode: payment.paymentMode || 'cash',
      notes: payment.notes || (matchedSale
        ? 'Migrated from old data'
        : 'Migrated from old data (standalone)'),
      reference: payment.reference || '',
      source: 'customers_migrated',
      sourceId: payment.id,
      createdAt: nowISO,
      updatedAt: nowISO
    };

    if (matchedSale) {
      paidBySale[matchedSale.id] = (paidBySale[matchedSale.id] || 0) + amount;
      created++;
    } else {
      standalone++;
    }

    toCreate.push(paymentDoc);
    toDelete.push(payment.id);
  }

  report(`\n📝 Prepared ${toCreate.length} new sales_payments (${created} applied, ${standalone} standalone)`);
  report(`🗑️  Preparing to delete ${toDelete.length} old entries`);

  // ============ 5. Create sales_payments in batches ============
  report('💾 Writing sales_payments...');
  for (let i = 0; i < toCreate.length; i += 400) {
    const chunk = toCreate.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(docData => {
      const ref = doc(collection(db, 'sales_payments'));
      batch.set(ref, docData);
    });
    await batch.commit();
    report(`   → Batch ${Math.floor(i / 400) + 1}: ${chunk.length} entries written`);
  }

  // ============ 6. Delete old daily_sales entries ============
  report('🗑️  Deleting old isPaymentOnly entries...');
  for (let i = 0; i < toDelete.length; i += 400) {
    const chunk = toDelete.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      batch.delete(doc(db, 'daily_sales', id));
    });
    await batch.commit();
    report(`   → Batch ${Math.floor(i / 400) + 1}: ${chunk.length} entries deleted`);
  }

  const summary = {
    total: oldPayments.length,
    created,
    standalone,
    skipped,
    deleted: toDelete.length
  };

  report('\n📊 Migration complete:');
  report(`   - Old payments processed: ${summary.total}`);
  report(`   - Applied to sales:        ${summary.created}`);
  report(`   - Standalone payments:     ${summary.standalone}`);
  report(`   - Skipped:                 ${summary.skipped}`);
  report(`   - Old entries deleted:     ${summary.deleted}`);

  return summary;
};

/**
 * Cleanup: remove migrated flag (not strictly needed).
 */
export const cleanupMigratedFlag = async () => {
  const snap = await getDocs(collection(db, 'sales_payments'));
  let cleaned = 0;
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    const x = d.data();
    if (x.source === 'customers_migrated' && x.migrated) {
      batch.update(d.ref, { migrated: false });
      cleaned++;
    }
  });
  if (cleaned > 0) await batch.commit();
  console.log(`Cleaned ${cleaned} entries`);
  return cleaned;
};