// scripts/seed_oem_finished_goods.js
// Ingests OEM Finished Goods Product Master + August 2025 Inventory Report
// Maps to: oem → model → product → inventory + inventory_txn tables
// Run with: node scripts/seed_oem_finished_goods.js

import db from '../src/utils/db.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function upsertOEM(oem_name) {
  const ex = await db.query('SELECT oem_id FROM oem WHERE oem_name = $1', [oem_name]);
  if (ex.rows.length) return ex.rows[0].oem_id;
  const res = await db.query(
    `INSERT INTO oem (oem_id, oem_name) VALUES (gen_random_uuid(), $1) RETURNING oem_id`,
    [oem_name]
  );
  return res.rows[0].oem_id;
}

async function upsertModel(oem_id, model_name) {
  const ex = await db.query('SELECT model_id FROM model WHERE oem_id=$1 AND model_name=$2', [oem_id, model_name]);
  if (ex.rows.length) return ex.rows[0].model_id;
  const res = await db.query(
    `INSERT INTO model (model_id, oem_id, model_name) VALUES (gen_random_uuid(), $1, $2) RETURNING model_id`,
    [oem_id, model_name]
  );
  return res.rows[0].model_id;
}

async function upsertProduct(product_code, part_name, model_id, oem_id) {
  const ex = await db.query('SELECT product_id FROM product WHERE product_code=$1', [product_code]);
  if (ex.rows.length) return ex.rows[0].product_id;
  const res = await db.query(
    `INSERT INTO product (product_id, product_code, part_name, model_id, oem_id, description)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Finished Good – OEM')
     RETURNING product_id`,
    [product_code, part_name, model_id, oem_id]
  );
  return res.rows[0].product_id;
}

async function upsertInventory(product_id, quantity) {
  const ex = await db.query('SELECT inventory_id FROM inventory WHERE product_id=$1', [product_id]);
  if (ex.rows.length) {
    await db.query('UPDATE inventory SET quantity=$1, updated_at=NOW() WHERE product_id=$2', [quantity, product_id]);
    return ex.rows[0].inventory_id;
  }
  const res = await db.query(
    `INSERT INTO inventory (inventory_id, product_id, quantity, status, updated_at, created_at)
     VALUES (gen_random_uuid(), $1, $2, 'AVAILABLE', NOW(), NOW()) RETURNING inventory_id`,
    [product_id, Math.max(0, quantity)]
  );
  return res.rows[0].inventory_id;
}

async function insertTxns(inventory_id, product_id, { op, prod, sold }) {
  const ref = `AUG25-${product_id.slice(0, 8)}`;
  const alreadyExists = await db.query(
    `SELECT txn_id FROM inventory_txn WHERE product_id=$1 AND reference LIKE 'AUG25-%' LIMIT 1`,
    [product_id]
  );
  if (alreadyExists.rows.length) return; // idempotent

  // Opening stock → ADJUSTMENT (no OPENING_BALANCE enum in TxnType)
  if (op > 0) {
    await db.query(
      `INSERT INTO inventory_txn (txn_id, inventory_id, product_id, txn_type, quantity, reference, created_by, created_at)
       VALUES (gen_random_uuid(),$1,$2,'ADJUSTMENT',$3,$4,'DATA_IMPORT','2025-08-01')`,
      [inventory_id, product_id, op, `${ref}-OPN`]
    );
  }
  // Production → RECEIVE
  if (prod > 0) {
    await db.query(
      `INSERT INTO inventory_txn (txn_id, inventory_id, product_id, txn_type, quantity, reference, created_by, created_at)
       VALUES (gen_random_uuid(),$1,$2,'RECEIVE',$3,$4,'DATA_IMPORT','2025-08-15')`,
      [inventory_id, product_id, prod, `${ref}-PROD`]
    );
  }
  // Sales → ISSUE
  if (sold > 0) {
    await db.query(
      `INSERT INTO inventory_txn (txn_id, inventory_id, product_id, txn_type, quantity, reference, created_by, created_at)
       VALUES (gen_random_uuid(),$1,$2,'ISSUE',$3,$4,'DATA_IMPORT','2025-08-20')`,
      [inventory_id, product_id, sold, `${ref}-SALE`]
    );
  }
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const DATA = [
  // GAL – J-1091
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1091', sku:'8500020 Q13AA',        part:'Bracket Lamp Assy',             op:27,  prod:0,   sold:0,   cl:27 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1091', sku:'8500020 Q13AB',        part:'License Link Plate',            op:0,   prod:0,   sold:0,   cl:0 },
  // GAL – J-1042
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'2801110LD010',         part:'1st Cross Beam',                op:72,  prod:0,   sold:36,  cl:36 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'2801150D800',          part:'4th Cross Beam + Assy (Set)',   op:36,  prod:0,   sold:36,  cl:0 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'2801161D800',          part:'5th Cross Beam',                op:72,  prod:0,   sold:36,  cl:36 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'2801181D800',          part:'7th Cross Beam',                op:36,  prod:0,   sold:36,  cl:0 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'3105070L D010',        part:'Spare Wheel Beam',              op:72,  prod:0,   sold:72,  cl:0 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'J1042-8500020 Q13AB',  part:'License Link Plate',            op:91,  prod:0,   sold:36,  cl:55 },
  { oem_name:'Ghandhara Automobiles Ltd.', model:'J-1042', sku:'J1042-8500020 Q13AA',  part:'Bracket Lamp Assy',             op:57,  prod:0,   sold:36,  cl:21 },
  // GDF – Reiling M
  { oem_name:'Ghandhara DF Ltd.', model:'Reiling M', sku:'37DJ88-17115',          part:'LICENSE LINK PLATE',           op:94,  prod:0,   sold:0,   cl:94 },
  { oem_name:'Ghandhara DF Ltd.', model:'Reiling M', sku:'37BC26-17118',          part:'LICENSE PLATE LIGHTS',         op:14,  prod:0,   sold:0,   cl:14 },
  // GDF – CaptC C72
  { oem_name:'Ghandhara DF Ltd.', model:'CaptC C72', sku:'C72-37DJ88-17115',      part:'LICENSE LINK PLATE',           op:21,  prod:0,   sold:0,   cl:21 },
  { oem_name:'Ghandhara DF Ltd.', model:'CaptC C72', sku:'3513910-CA0101',        part:'AIR TANK CAP C72 (2/V)',       op:50,  prod:0,   sold:0,   cl:50 },
  // GDF – CM 90
  { oem_name:'Ghandhara DF Ltd.', model:'CM 90', sku:'CM90-37DJ88-17115',         part:'License Link Plate',           op:60,  prod:0,   sold:60,  cl:0 },
  { oem_name:'Ghandhara DF Ltd.', model:'CM 90', sku:'CM90-37BC26-17118',         part:'License Plate Lights Fixed',   op:61,  prod:0,   sold:24,  cl:37 },
  { oem_name:'Ghandhara DF Ltd.', model:'CM 90', sku:'3513CB12-002',              part:'AIR TANK Assy CM90',           op:84,  prod:0,   sold:0,   cl:84 },
  { oem_name:'Ghandhara DF Ltd.', model:'CM 90', sku:'8509033-CA0301',            part:'BRACKET LH REAR GUARD RAIL',   op:54,  prod:0,   sold:42,  cl:12 },
  { oem_name:'Ghandhara DF Ltd.', model:'CM 90', sku:'8509034-CA0301',            part:'BRACKET RH REAR GUARD RAIL',   op:54,  prod:0,   sold:42,  cl:12 },
  { oem_name:'Ghandhara DF Ltd.', model:'CM 90', sku:'8509035-CA4202-B',          part:'REAR GUARD RAIL CM90',         op:42,  prod:0,   sold:24,  cl:18 },
  // GDF – DF-375
  { oem_name:'Ghandhara DF Ltd.', model:'DF-375', sku:'3513010-T12H0',            part:'AIR RESERVIOR ASSEMBLY',       op:0,   prod:0,   sold:0,   cl:0 },
  { oem_name:'Ghandhara DF Ltd.', model:'DF-375', sku:'3513210-T1700',            part:'AIR TANK ASSY PURJE',          op:0,   prod:0,   sold:0,   cl:0 },
  { oem_name:'Ghandhara DF Ltd.', model:'DF-375', sku:'3513B40B-010',             part:'AIR TANK ASSY',                op:0,   prod:0,   sold:0,   cl:0 },
  // GIL – NMR
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898486-3830',         part:'CM 1st',                       op:173, prod:0,   sold:0,   cl:173 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898344-6020',         part:'CM 2nd',                       op:0,   prod:50,  sold:0,   cl:50 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897924-3430',         part:'CM 4th',                       op:42,  prod:0,   sold:0,   cl:42 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897924-3440',         part:'CM 5th',                       op:52,  prod:0,   sold:0,   cl:52 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898035-8253',         part:'CM Spr',                       op:138, prod:0,   sold:138, cl:0 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897924-3530',         part:'CM End',                       op:23,  prod:0,   sold:0,   cl:23 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'89836-2420',          part:'Brkt ASM Air',                 op:1,   prod:180, sold:180, cl:1 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898072-1481',         part:'Brkt Exh',                     op:183, prod:223, sold:0,   cl:406 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898-091-8020',        part:'Brkt W/Paint (NMR/NLR) LH',   op:171, prod:102, sold:40,  cl:233 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898-091-8030',        part:'Bkt W/Paint (R)',              op:241, prod:32,  sold:0,   cl:273 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897205-9120',         part:'Brkt RR SPG FRT',              op:452, prod:240, sold:234, cl:458 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897924-3450',         part:'GIL Gusset (NLR/NMR)',         op:151, prod:34,  sold:185, cl:0 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'898323-4500',         part:'Brkt Fuel Fil',                op:100, prod:0,   sold:0,   cl:100 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897169-2311',         part:'Band ASM F Tank NMR',          op:320, prod:0,   sold:0,   cl:320 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'1010030005-11-1337',  part:'WASHER 3 mm 50 mm - BODY',     op:1768,prod:0,   sold:0,   cl:1768 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897-384-060M',        part:'Brkt F/Tank 100 L NMR',        op:105, prod:0,   sold:0,   cl:105 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NMR', sku:'897-384-062M',        part:'Brkt F/Tank 100 L NMR (62)',   op:105, prod:0,   sold:0,   cl:105 },
  // GIL – NPR
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'897205-9N20',         part:'Brkt Rr Spr n20',              op:473, prod:240, sold:121, cl:592 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'898126-2341',         part:'Brkt Gear Control/TM',         op:261, prod:80,  sold:230, cl:111 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'897016-5901',         part:'Brkt Lic Plate COMMON',        op:411, prod:0,   sold:0,   cl:411 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'897035517M',          part:'Brkt; F/TANK (517)',           op:301, prod:0,   sold:43,  cl:258 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'897035518M',          part:'Brkt; F/TANK (518)',           op:301, prod:0,   sold:43,  cl:258 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'897 035 1RB',         part:'Rubber Brkt F Tank',           op:50,  prod:0,   sold:0,   cl:50 },
  { oem_name:'Ghandhara Industries Ltd.', model:'NPR', sku:'89716923 AL',         part:'Band F Tank ALUM',             op:392, prod:0,   sold:72,  cl:320 },
  // GIL – FVR/FVZ
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'898112-2160',     part:'Air Tank ASM;WO/-FVZ/FVR',    op:84,  prod:0,   sold:0,   cl:84 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'898173-4540',     part:'Brkt ASM; Air-FVZ/FVR',       op:185, prod:92,  sold:0,   cl:277 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'153485-0740',     part:'Brkt; RR Lic Plt-FVZ/FVR',   op:334, prod:0,   sold:0,   cl:334 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'897610-8527',     part:'Crossmember; 1st-FVZ/FVR',   op:0,   prod:120, sold:0,   cl:120 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'897610-8535',     part:'Crossmember; 2nd-FVZ/FVR',   op:0,   prod:120, sold:0,   cl:120 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'148370-1811',     part:'AIR TANK ASM 710041',         op:22,  prod:0,   sold:0,   cl:22 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'898184-7830',     part:'AIR TANK ASM 710042',         op:15,  prod:0,   sold:0,   cl:15 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FVR/FVZ', sku:'898-081-8701',    part:'AIR TANK ASSY PURJE (WP29)',  op:15,  prod:0,   sold:0,   cl:15 },
  // GIL – FTS
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'148330-5980',         part:'Air Tank ASM (5980)',          op:9,   prod:0,   sold:7,   cl:2 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'148370-5410',         part:'Air Tank ASM (5410)',          op:7,   prod:0,   sold:6,   cl:1 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'897618-6081',         part:'CROSSMEMBER;END',              op:28,  prod:0,   sold:12,  cl:16 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'897618-6100',         part:'MEMBER;PINTLE HOOK',           op:36,  prod:0,   sold:0,   cl:36 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'898050-1220',         part:'Brkt Rr S/ABS (1220)',         op:1,   prod:0,   sold:0,   cl:1 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'898050-1230',         part:'Brkt Rr S/ABS (1230)',         op:1,   prod:0,   sold:0,   cl:1 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'897612-2640',         part:'Gusset (2640)',                 op:0,   prod:28,  sold:0,   cl:28 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'897612-2651',         part:'Gusset (2651)',                 op:0,   prod:28,  sold:0,   cl:28 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'897612-2661',         part:'Gusset (2661)',                 op:28,  prod:0,   sold:0,   cl:28 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'897612-2671',         part:'Gusset (2671)',                 op:27,  prod:0,   sold:0,   cl:27 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'171220-0432',         part:'Bar ASM Bmpr-FTS-COMM',        op:55,  prod:0,   sold:0,   cl:55 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FTS', sku:'898017-4280',         part:'Brkt M/T Sel. Lvr. FTS-COMM', op:56,  prod:0,   sold:56,  cl:0 },
  // GIL – MT
  { oem_name:'Ghandhara Industries Ltd.', model:'MT',  sku:'898322-0361',         part:'Crossmember; 1st MT',          op:31,  prod:0,   sold:0,   cl:31 },
  { oem_name:'Ghandhara Industries Ltd.', model:'MT',  sku:'898297-0991',         part:'AIR TANK ASM 530011',          op:46,  prod:0,   sold:0,   cl:46 },
  { oem_name:'Ghandhara Industries Ltd.', model:'MT',  sku:'898297-1000',         part:'AIR TANK ASM 530012',          op:48,  prod:0,   sold:0,   cl:48 },
  // GIL – FXZ
  { oem_name:'Ghandhara Industries Ltd.', model:'FXZ', sku:'898487-6220',         part:'Air Tank ASM - PURJE',         op:15,  prod:0,   sold:0,   cl:15 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FXZ', sku:'898486-0580',         part:'AIR TANK ASM - FXZ',           op:6,   prod:0,   sold:11,  cl:-5 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FXZ', sku:'897491-2710',         part:'AIR TANK ASM;STE',             op:7,   prod:0,   sold:10,  cl:-3 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FXZ', sku:'898294852M',          part:'CROSSMEMBER;RR S MOD',         op:12,  prod:0,   sold:0,   cl:12 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FXZ', sku:'898294-4750',         part:'CROSSMEMBER 1st - 6 mm',       op:0,   prod:0,   sold:28,  cl:-28 },
  { oem_name:'Ghandhara Industries Ltd.', model:'FXZ', sku:'898294-4820',         part:'CROSSMEMBER END 3 mm',         op:15,  prod:0,   sold:15,  cl:0 },
];

async function main() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  EmpclERP – OEM Finished Goods Ingestion | August 2025');
  console.log('  3 OEMs | 10 Models | 70 SKUs');
  console.log('══════════════════════════════════════════════════════════════\n');

  const oemCache = {}, modelCache = {};
  let count = 0;

  for (const row of DATA) {
    // OEM
    if (!oemCache[row.oem_name]) {
      oemCache[row.oem_name] = await upsertOEM(row.oem_name);
    }
    const oem_id = oemCache[row.oem_name];

    // Model
    const mk = `${row.oem_name}::${row.model}`;
    if (!modelCache[mk]) {
      modelCache[mk] = await upsertModel(oem_id, row.model);
    }
    const model_id = modelCache[mk];

    // Product
    const product_id = await upsertProduct(row.sku, row.part, model_id, oem_id);

    // Inventory (closing stock)
    const inv_id = await upsertInventory(product_id, row.cl);

    // Transactions
    await insertTxns(inv_id, product_id, row);

    count++;
    console.log(`  ✔ [${count.toString().padStart(2)}] ${row.model.padEnd(8)} | ${row.sku.padEnd(25)} | Op:${String(row.op).padStart(4)} Prod:${String(row.prod).padStart(4)} Sold:${String(row.sold).padStart(4)} Cl:${String(row.cl).padStart(5)}`);
  }

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  ✔ ${count} products ingested across ${Object.keys(oemCache).length} OEMs, ${Object.keys(modelCache).length} models`);
  console.log(`══════════════════════════════════════════════════════════════\n`);

  await db.end?.();
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
