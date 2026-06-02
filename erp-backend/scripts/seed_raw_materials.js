import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawData = [
  { sNo: 1, code: 'EMCM001', category: 'Galvanized Sheet (GI)', description: 'GI 1220x2440x1.2', uom: 'Pcs' },
  { sNo: 2, code: 'EMCM002', category: 'Galvanized Sheet (GI)', description: 'GI 1225x2440x1.2', uom: 'Pcs' },
  { sNo: 3, code: 'EMCM003', category: 'Galvanized Sheet (GI)', description: 'GI 1230x2440x1.2', uom: 'Pcs' },
  { sNo: 4, code: 'EMCM004', category: 'Galvanized Sheet (GI)', description: 'GI 1220x2440x1.5', uom: 'Pcs' },
  { sNo: 5, code: 'EMCM005', category: 'Galvanized Sheet (GI)', description: 'GI 1225x2440x1.5', uom: 'Pcs' },
  { sNo: 6, code: 'EMCM006', category: 'Galvanized Sheet (GI)', description: 'GI 1230x2440x1.5', uom: 'Pcs' },
  { sNo: 7, code: 'EMCM007', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1220x2440x0.8', uom: 'Pcs' },
  { sNo: 8, code: 'EMCM008', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1225x2440x0.8', uom: 'Pcs' },
  { sNo: 9, code: 'EMCM009', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1230x2440x0.8', uom: 'Pcs' },
  { sNo: 10, code: 'EMCM010', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1220x2440x1.0', uom: 'Pcs' },
  { sNo: 11, code: 'EMCM011', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1225x2440x1.0', uom: 'Pcs' },
  { sNo: 12, code: 'EMCM012', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1230x2440x1.0', uom: 'Pcs' },
  { sNo: 13, code: 'EMCM013', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1220x2440x1.2', uom: 'Pcs' },
  { sNo: 14, code: 'EMCM014', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1225x2440x1.2', uom: 'Pcs' },
  { sNo: 15, code: 'EMCM015', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1230x2440x1.2', uom: 'Pcs' },
  { sNo: 16, code: 'EMCM016', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1220x2440x1.5', uom: 'Pcs' },
  { sNo: 17, code: 'EMCM017', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1225x2440x1.5', uom: 'Pcs' },
  { sNo: 18, code: 'EMCM018', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1230x2440x1.5', uom: 'Pcs' },
  { sNo: 19, code: 'EMCM019', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1220x2440x2.0', uom: 'Pcs' },
  { sNo: 20, code: 'EMCM020', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1225x2440x2.0', uom: 'Pcs' },
  { sNo: 21, code: 'EMCM021', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1230x2440x2.0', uom: 'Pcs' },
  { sNo: 22, code: 'EMCM022', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1220x2440x2.5', uom: 'Pcs' },
  { sNo: 23, code: 'EMCM023', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1225x2440x2.5', uom: 'Pcs' },
  { sNo: 24, code: 'EMCM024', category: 'Cold Rolled Sheet (CRC)', description: 'CRC 1230x2440x2.5', uom: 'Pcs' },
  { sNo: 25, code: 'EMCM025', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x2.0', uom: 'Pcs' },
  { sNo: 26, code: 'EMCM026', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x2.0', uom: 'Pcs' },
  { sNo: 27, code: 'EMCM027', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x2.0', uom: 'Pcs' },
  { sNo: 28, code: 'EMCM028', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x2.5', uom: 'Pcs' },
  { sNo: 29, code: 'EMCM029', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x2.5', uom: 'Pcs' },
  { sNo: 30, code: 'EMCM030', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x2.5', uom: 'Pcs' },
  { sNo: 31, code: 'EMCM031', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x3.0', uom: 'Pcs' },
  { sNo: 32, code: 'EMCM032', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x3.0', uom: 'Pcs' },
  { sNo: 33, code: 'EMCM033', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x3.0', uom: 'Pcs' },
  { sNo: 34, code: 'EMCM034', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x4.0', uom: 'Pcs' },
  { sNo: 35, code: 'EMCM035', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x4.0', uom: 'Pcs' },
  { sNo: 36, code: 'EMCM036', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x4.0', uom: 'Pcs' },
  { sNo: 37, code: 'EMCM037', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x4.5', uom: 'Pcs' },
  { sNo: 38, code: 'EMCM038', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x4.5', uom: 'Pcs' },
  { sNo: 39, code: 'EMCM039', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x4.5', uom: 'Pcs' },
  { sNo: 40, code: 'EMCM040', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x6.0', uom: 'Pcs' },
  { sNo: 41, code: 'EMCM041', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x6.0', uom: 'Pcs' },
  { sNo: 42, code: 'EMCM042', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x6.0', uom: 'Pcs' },
  { sNo: 43, code: 'EMCM043', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x7.0', uom: 'Pcs' },
  { sNo: 44, code: 'EMCM044', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x7.0', uom: 'Pcs' },
  { sNo: 45, code: 'EMCM045', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x7.0', uom: 'Pcs' },
  { sNo: 46, code: 'EMCM046', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1220x2440x8.0', uom: 'Pcs' },
  { sNo: 47, code: 'EMCM047', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1225x2440x8.0', uom: 'Pcs' },
  { sNo: 48, code: 'EMCM048', category: 'Hot Rolled Sheet (HRC)', description: 'HRC 1230x2440x8.0', uom: 'Pcs' },
  { sNo: 49, code: 'EMCM049', category: 'Fuels & Lubricants', description: 'High Speed Diesel (HSD)', uom: 'Liters' },
  { sNo: 50, code: 'EMCM050', category: 'Fuels & Lubricants', description: 'Engine Oil 15W-40', uom: 'Liters' },
  { sNo: 51, code: 'EMCM051', category: 'Fuels & Lubricants', description: 'Hydraulic Oil ISO VG 46', uom: 'Liters' },
  { sNo: 52, code: 'EMCM052', category: 'Fuels & Lubricants', description: 'All-Purpose Lithium Grease', uom: 'Kg' },
  { sNo: 53, code: 'EMCM053', category: 'Paints & Chemicals', description: 'Primer - Red Oxide', uom: 'Liters' },
  { sNo: 54, code: 'EMCM054', category: 'Paints & Chemicals', description: 'Primer - Grey', uom: 'Liters' },
  { sNo: 55, code: 'EMCM055', category: 'Paints & Chemicals', description: 'Enamel Paint - Industrial Blue', uom: 'Liters' },
  { sNo: 56, code: 'EMCM056', category: 'Paints & Chemicals', description: 'Enamel Paint - Gloss White', uom: 'Liters' },
  { sNo: 57, code: 'EMCM057', category: 'Paints & Chemicals', description: 'Paint Thinner / Solvent', uom: 'Liters' },
  { sNo: 58, code: 'EMCM058', category: 'Fasteners', description: 'Hex Bolt M8x25mm Grade 8.8', uom: 'Pcs' },
  { sNo: 59, code: 'EMCM059', category: 'Fasteners', description: 'Hex Bolt M10x30mm Grade 8.8', uom: 'Pcs' },
  { sNo: 60, code: 'EMCM060', category: 'Fasteners', description: 'Hex Bolt M12x40mm Grade 8.8', uom: 'Pcs' },
  { sNo: 61, code: 'EMCM061', category: 'Fasteners', description: 'Hex Nut M8 Grade 8', uom: 'Pcs' },
  { sNo: 62, code: 'EMCM062', category: 'Fasteners', description: 'Hex Nut M10 Grade 8', uom: 'Pcs' },
  { sNo: 63, code: 'EMCM063', category: 'Fasteners', description: 'Flat Washer M8', uom: 'Pcs' },
  { sNo: 64, code: 'EMCM064', category: 'Fasteners', description: 'Flat Washer M10', uom: 'Pcs' },
  { sNo: 65, code: 'EMCM065', category: 'Fasteners', description: 'Spring Washer M10', uom: 'Pcs' },
  { sNo: 66, code: 'EMCM066', category: 'Welding Consumables', description: 'MIG / CO2 Wire ER70S-6 1.2mm', uom: 'Kg' },
  { sNo: 67, code: 'EMCM067', category: 'Welding Consumables', description: 'Welding Electrode E6013 3.2mm', uom: 'Kg' },
  { sNo: 68, code: 'EMCM068', category: 'Welding Consumables', description: 'CO2 Gas Cylinder (27Kg)', uom: 'Cylinder' },
  { sNo: 69, code: 'EMCM069', category: 'Welding Consumables', description: 'Oxygen Gas Cylinder (6.8m3)', uom: 'Cylinder' },
  { sNo: 70, code: 'EMCM070', category: 'Abrasives & Tools', description: 'Thin Cutting Disc 4" x 1mm', uom: 'Pcs' },
  { sNo: 71, code: 'EMCM071', category: 'Abrasives & Tools', description: 'Grinding Disc 4" x 6mm', uom: 'Pcs' },
  { sNo: 72, code: 'EMCM072', category: 'Abrasives & Tools', description: 'Flap Disc 4" x 5/8', uom: 'Pcs' },
  { sNo: 73, code: 'EMCM073', category: 'Packaging & Misc', description: 'Steel Strapping Roll', uom: 'Roll' },
  { sNo: 74, code: 'EMCM074', category: 'Packaging & Misc', description: 'Stretch Wrap Film', uom: 'Roll' },
  { sNo: 75, code: 'EMCM075', category: 'Packaging & Misc', description: 'Cotton Waste / Rags', uom: 'Kg' } // Assuming kg for rags
];

async function seedData() {
  console.log(`Starting to seed ${rawData.length} Raw Materials...`);

  let count = 0;
  for (const item of rawData) {
    // 1. Ensure UOM exists
    let uomCode = item.uom.toUpperCase();
    let uomRecord = await prisma.uOM.findUnique({ where: { code: uomCode } });
    
    if (!uomRecord) {
      uomRecord = await prisma.uOM.create({
        data: {
          code: uomCode,
          name: item.uom
        }
      });
      console.log(`Created UOM: ${uomCode}`);
    }

    // 2. Insert into Material table
    const fullDescription = `${item.category} - ${item.description}`;
    
    const materialRecord = await prisma.material.upsert({
      where: { material_code: item.code },
      update: {
        name: item.description,
        description: fullDescription,
        uom_id: uomRecord.uom_id
      },
      create: {
        material_code: item.code,
        name: item.description,
        description: fullDescription,
        uom_id: uomRecord.uom_id,
        category: 'RAW_MATERIAL'
      }
    });

    // 3. Insert into RawMaterial table
    await prisma.rawMaterial.upsert({
      where: { material_code: item.code },
      update: {
        name: item.description,
        description: fullDescription,
        uom_id: uomRecord.uom_id
      },
      create: {
        material_code: item.code,
        name: item.description,
        description: fullDescription,
        uom_id: uomRecord.uom_id
      }
    });
    
    count++;
  }

  console.log(`Successfully ingested ${count} raw materials and consumables.`);
}

seedData()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
