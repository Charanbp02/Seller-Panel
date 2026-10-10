// src/scripts/migratePackingUsage.js
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * One-time migration: read all production records and ensure
 * each packing material has a matching auto-usage entry.
 *
 * Safe to run multiple times — dedup by sourceId.
 */
export const migratePackingUsage = async () => {
  console.log('🔄 Starting packing usage migration...');

  // 1. Load all productions
  const prodSnap = await getDocs(collection(db, 'production'));
  const productions = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`📦 Found ${productions.length} production records`);

  // 2. Load all packing materials
  const packSnap = await getDocs(collection(db, 'packingMaterials'));
  const packingMap = {}; // materialName → { id, usage: [] }
  packSnap.docs.forEach(d => {
    const x = d.data();
    if (!x.materialName) return;
    packingMap[x.materialName] = {
      id: d.id,
      originalUsage: [...(x.usage || [])],
      usage: [...(x.usage || [])]
    };
  });

  // 3. For each production, ensure auto-usage entries exist
  let added = 0;
  let skipped = 0;

  for (const prod of productions) {
    const prodId = prod.id;
    const usedList = prod.packingUsed || [];
    if (usedList.length === 0) continue;

    for (const p of usedList) {
      const name = p.materialName;
      const qty = Number(p.quantity) || 0;
      if (!name || qty <= 0) continue;

      const target = packingMap[name];
      if (!target) {
        console.warn(`⚠️ Packing material "${name}" not found — skipping`);
        continue;
      }

      // Already migrated?
      const alreadyHas = target.usage.some(
        u => u.source === 'production' && u.sourceId === prodId
      );
      if (alreadyHas) {
        skipped++;
        continue;
      }

      // Add new entry
      target.usage.push({
        date: prod.date,
        used: qty,
        damaged: 0,
        purpose: 'Production',
        remarks: `Auto: ${prod.productName} — ${prod.produced}${prod.unit || 'kg'}`,
        source: 'production',
        sourceId: prodId,
        unit: p.unit || 'pcs',
        createdAt: new Date().toISOString(),
        migrated: true
      });
      added++;
    }
  }

  // 4. Write back changed packing materials
  let updated = 0;
  for (const [name, data] of Object.entries(packingMap)) {
    if (data.usage.length !== data.originalUsage.length) {
      try {
        await updateDoc(doc(db, 'packingMaterials', data.id), {
          usage: data.usage,
          updatedAt: new Date().toISOString()
        });
        updated++;
        const delta = data.usage.length - data.originalUsage.length;
        console.log(`✅ Updated "${name}": ${delta} entries added`);
      } catch (e) {
        console.error(`❌ Failed to update "${name}":`, e.message);
      }
    }
  }

  console.log(`\n📊 Migration complete:`);
  console.log(`   - Packing materials updated: ${updated}`);
  console.log(`   - Usage entries added: ${added}`);
  console.log(`   - Already existing (skipped): ${skipped}`);

  return { updated, added, skipped };
};

/**
 * Optional: Cleanup — remove the `migrated: true` flag from all entries
 * after verifying migration succeeded. Safe to run any time.
 */
export const cleanupMigrationFlags = async () => {
  const packSnap = await getDocs(collection(db, 'packingMaterials'));
  let cleaned = 0;

  for (const d of packSnap.docs) {
    const x = d.data();
    const usage = x.usage || [];
    const hasMigrated = usage.some(u => u.migrated === true);
    if (!hasMigrated) continue;

    const cleanedUsage = usage.map(u => {
      if (u.migrated) {
        const { migrated, ...rest } = u;
        return rest;
      }
      return u;
    });

    await updateDoc(doc(db, 'packingMaterials', d.id), {
      usage: cleanedUsage,
      updatedAt: new Date().toISOString()
    });
    cleaned++;
  }

  console.log(`🧹 Cleaned ${cleaned} packing materials`);
  return cleaned;
};