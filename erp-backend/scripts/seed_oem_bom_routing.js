import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const oemData = [
  // 1.
  {
    partNo: '897384060M', // using main part
    description: 'Bkt Fuel Tank',
    model: 'NMR',
    bom: [
      { subAssembly: 'Main Sheet', thickness: 2.5, w: 170, l: 760, qty: 1, blankWt: 2.54, yield: 91, pcsSheet: 21 },
      { subAssembly: 'Rubber (U Shaped)', discrete: true, desc: '8 inch x 3mm', qty: 1 }
    ],
    routings: ['Cutting/Shearing', 'Forming', 'Piercing 1', 'Piercing 2', 'Cleaning', 'Rubber Cutting', 'Rubber Pasting', 'Labeling', 'Dispatch']
  },
  // 2.
  {
    partNo: '89806273NM',
    description: 'Base Plate',
    model: 'NMR',
    bom: [
      { subAssembly: 'Main Sheet', thickness: 2.0, w: 240, l: 1010, qty: 1, blankWt: 3.81, yield: 90, pcsSheet: 11 },
      { subAssembly: 'Sides', thickness: 3.0, w: 90, l: 90, qty: 2, blankWt: 0.19, yield: 96, pcsSheet: 351 },
      { subAssembly: 'Rubber', discrete: true, desc: '5" x 15" x 3.0mm', qty: 2 },
      { subAssembly: 'Symentex Adhesive Glue', discrete: true, desc: 'Consumable', qty: 1 } // AR mapped to 1
    ],
    routings: ['Cutting/Shearing', 'Piercing of Big Hole', 'Bending', 'Piercing/Laser Cutting of Slots', 'Brackets Bending', 'Brackets Welding', 'Chipping/Cleaning', 'Paint', 'Rubber Cutting', 'Rubber Pasting', 'Dispatch']
  },
  // 3.
  {
    partNo: '897169-2311',
    description: 'Band Fuel Tank',
    model: 'NMR',
    bom: [
      { subAssembly: 'Strip', thickness: 1.2, w: 29, l: 650, qty: 1, blankWt: 0.18, yield: 90, pcsSheet: 142 },
      { subAssembly: 'Rubber', discrete: true, desc: '32 x 600mm', qty: 1 },
      { subAssembly: 'Stud', discrete: true, desc: 'M8x1.25 Stud', qty: 1, materialCode: 'EMCM058' } // mapped to hex bolt
    ],
    routings: ['Cutting/Shearing of Strip', 'Blanking of Hook', 'Cutting/Parting of Threaded Shaft', 'Welding of Hook and threaded shaft on main Strip', 'Chipping/Cleaning', 'Paint', 'Rubber Cutting', 'Rubber Fixing', 'Dispatch']
  },
  // 4.
  {
    partNo: '898126-2341',
    description: 'Brkt Gear Control',
    model: 'NPR 71',
    bom: [
      { subAssembly: 'Main', thickness: 6.0, qty: 1 },
      { subAssembly: 'Clamp1', thickness: 4.5, qty: 1 },
      { subAssembly: 'Clamp2', thickness: 4.5, qty: 1 },
      { subAssembly: 'Strip', thickness: 3.0, qty: 1 },
      { subAssembly: 'Nut', discrete: true, desc: 'M8x1.25 Nut', qty: 3, materialCode: 'EMCM061' }
    ],
    routings: ['Laser Cutting of Main Part and Brackets', 'Forming of Main Part', 'Piercing of Main Part', 'Piercing of Strip', 'Bending of Strip', 'Bending of Brackets', 'Complete Welding of all 4 Parts', 'Chipping/Cleaning', 'Paint', 'Labeling and Dispatch']
  },
  // 5.
  {
    partNo: '897035517M',
    description: 'Bkt Fuel Tank for AL Tank',
    model: 'NPR 71',
    bom: [
      { subAssembly: 'Main Sheet', thickness: 2.5, w: 160, l: 690, qty: 1, blankWt: 2.17, yield: 89, pcsSheet: 24 },
      { subAssembly: 'Rubber', discrete: true, desc: '7.75 inch x 3.0mm', qty: 2 }
    ],
    routings: ['Cutting/Shearing', 'Forming', 'Piercing 1', 'Piercing 2', 'Cleaning', 'Rubber Cutting', 'Rubber Pasting', 'Labeling', 'Dispatch']
  },
  // 6.
  {
    partNo: '89716923AL',
    description: 'Band Fuel Tank for AL Tank',
    model: 'NPR 71',
    bom: [
      { subAssembly: 'Strip', thickness: 1.2, w: 29, l: 605, qty: 1, blankWt: 0.17, yield: 99, pcsSheet: 168 },
      { subAssembly: 'Rubber', discrete: true, desc: '32 x 570mm', qty: 1 },
      { subAssembly: 'Stud', discrete: true, desc: 'M8x1.25 Stud 65mm', qty: 1, materialCode: 'EMCM058' }
    ],
    routings: ['Cutting/Shearing of Strip', 'Blanking of Hook', 'Cutting/Parting of Threaded Shaft', 'Welding of Hook and threaded shaft on main Strip', 'Chipping/Cleaning', 'Paint', 'Rubber Cutting', 'Rubber Fixing', 'Dispatch']
  },
  // Cross Members (7-18, 20, 22-27)
  {
    partNo: '897924-3430', description: 'CM 4th', model: 'NMR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 400, l: 660, qty: 1, blankWt: 6.22, pcsSheet: 10 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '897924-3480', description: 'CM 6th', model: 'NMR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 275, l: 580, qty: 1, blankWt: 3.76, pcsSheet: 16 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898035-8253', description: 'CM Spr', model: 'NMR',
    bom: [
      { subAssembly: 'Main Bkt', thickness: 3.0, w: 104, l: 645, qty: 1, blankWt: 1.58, pcsSheet: 38 },
      { subAssembly: 'U channel', thickness: 3.0, w: 68, l: 420, qty: 1, blankWt: 0.67, pcsSheet: 95 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '897924-3530', description: 'CM End', model: 'NMR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 163, l: 645, qty: 1, blankWt: 2.48, pcsSheet: 24 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '89836-2420', description: 'Brkt ASM Air', model: 'NMR',
    bom: [
      { subAssembly: 'Main', thickness: 4.5, w: 270, l: 160, qty: 1, blankWt: 1.53, pcsSheet: 63 },
      { subAssembly: 'Bolt', discrete: true, desc: 'M10x1.25 Bolt', qty: 2, materialCode: 'EMCM059' }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898486-3830', description: 'CM 1st', model: 'NLR', // Assuming NLR for NLR/NMR combo
    bom: [
      { subAssembly: 'Main', thickness: 4.0, w: 305, l: 660, qty: 1, blankWt: 6.32, pcsSheet: 13 },
      { subAssembly: 'Horn Bkt', thickness: 3.0, w: 30, l: 90, qty: 2, blankWt: 0.06, pcsSheet: 1080 },
      { subAssembly: 'Shafts', discrete: true, desc: 'Shafts', qty: 4 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '897924-3450', description: 'Gusset', model: 'NMR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 325, l: 137, qty: 1, blankWt: 1.05, pcsSheet: 59 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '897924-3520', description: 'Gusset Upr', model: 'NLR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 284, l: 157, qty: 1, blankWt: 1.05, pcsSheet: 60 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898107-5632', description: 'Stopper S/T', model: 'NLR',
    bom: [
      { subAssembly: 'Round', thickness: 3.0, w: 240, l: 240, qty: 1, blankWt: 1.36, pcsSheet: 50 },
      { subAssembly: 'Side Plates', thickness: 3.0, w: 150, l: 86, qty: 1, blankWt: 0.30, pcsSheet: 224 },
      { subAssembly: 'Base Plate', thickness: 4.0, w: 214, l: 225, qty: 1, blankWt: 1.51, pcsSheet: 55 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898323-4500', description: 'Bkt Fuel Filter', model: 'NMR',
    bom: [
      { subAssembly: 'Main Bkt', thickness: 4.5, w: 430, l: 157, qty: 1, blankWt: 2.38, pcsSheet: 40 },
      { subAssembly: 'Base Plate', thickness: 4.5, w: 145, l: 70, qty: 1, blankWt: 0.36, pcsSheet: 280 },
      { subAssembly: 'Side Plate', thickness: 2.0, w: 90, l: 105, qty: 1, blankWt: 0.15, pcsSheet: 299 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898344-6020', description: 'CM 2nd', model: 'NLR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 262, l: 672, qty: 1, blankWt: 4.15, pcsSheet: 15 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '897924-3440', description: 'CM 5th', model: 'NLR',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 305, l: 564, qty: 1, blankWt: 4.05, pcsSheet: 16 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898072-147M', description: 'Brkt Exh', model: 'NLR',
    bom: [
      { subAssembly: 'L', thickness: 4.5, w: 70, l: 154, qty: 2, blankWt: 0.38, pcsSheet: 268 },
      { subAssembly: 'U', thickness: 4.5, w: 70, l: 227, qty: 1, blankWt: 0.56, pcsSheet: 180 },
      { subAssembly: 'Bolt M8x25', discrete: true, desc: 'Bolt', qty: 2, materialCode: 'EMCM058' },
      { subAssembly: 'Bolt M10x30', discrete: true, desc: 'Bolt', qty: 2, materialCode: 'EMCM059' }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898072-148M', description: 'Brkt Exh', model: 'NMR',
    bom: [
      { subAssembly: 'L', thickness: 4.5, w: 70, l: 154, qty: 2, blankWt: 0.38, pcsSheet: 268 },
      { subAssembly: 'U', thickness: 4.5, w: 70, l: 227, qty: 1, blankWt: 0.56, pcsSheet: 180 },
      { subAssembly: 'Bolt M8x25', discrete: true, desc: 'Bolt', qty: 2, materialCode: 'EMCM058' },
      { subAssembly: 'Bolt M10x30', discrete: true, desc: 'Bolt', qty: 3, materialCode: 'EMCM059' }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898091-8020', description: 'Bkt W/Paint LH', model: 'NLR',
    bom: [
      { subAssembly: 'Center Plate', thickness: 6.0, w: 117, l: 147, qty: 1, blankWt: 0.81, pcsSheet: 160 },
      { subAssembly: 'U bracket', thickness: 6.0, w: 107, l: 274.5, qty: 1, blankWt: 1.38, pcsSheet: 96 },
      { subAssembly: 'Rib Bull Shaped', thickness: 6.0, w: 121, l: 137, qty: 1, blankWt: 0.78, pcsSheet: 177 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898091-8030', description: 'Bkt W/Paint RH', model: 'NLR',
    bom: [
      { subAssembly: 'Center Plate', thickness: 6.0, w: 117, l: 147, qty: 1, blankWt: 0.81, pcsSheet: 160 },
      { subAssembly: 'U bracket', thickness: 6.0, w: 107, l: 274.5, qty: 1, blankWt: 1.38, pcsSheet: 96 },
      { subAssembly: 'Rib Bull Shaped', thickness: 6.0, w: 121, l: 137, qty: 1, blankWt: 0.78, pcsSheet: 177 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898294-4820', description: 'CM End', model: 'FXZ',
    bom: [{ subAssembly: 'Main', thickness: 3.0, w: 382, l: 820, qty: 1, blankWt: 7.38, pcsSheet: 8 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898294-8521', description: 'CM RR S', model: 'FXZ',
    bom: [{ subAssembly: 'Main', thickness: 4.5, w: 460, l: 752, qty: 1, blankWt: 12.22, pcsSheet: 8 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  {
    partNo: '898294-4750', description: 'CM 6.0', model: 'FXZ',
    bom: [{ subAssembly: 'Main', thickness: 6.0, w: 635, l: 812, qty: 1, blankWt: 24.29, pcsSheet: 3 }],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  },
  // Tanks (28-30)
  {
    partNo: '898487-6220', description: 'Purge Tank', model: 'FXZ',
    bom: [
      { subAssembly: 'Shell', thickness: 3.0, w: 138, l: 600, qty: 1, blankWt: 1.95, pcsSheet: 34 },
      { subAssembly: 'Dish', thickness: 3.0, w: 240, l: 240, qty: 1, blankWt: 1.36, pcsSheet: 50 },
      { subAssembly: 'Shaft Dia 28', discrete: true, desc: 'Shaft AR', qty: 1 },
      { subAssembly: 'Shaft Dia 36', discrete: true, desc: 'Shaft AR', qty: 1 }
    ],
    routings: ['Shell Rolling', 'Dish Pressing/Forming', 'Shaft Cutting', 'Sub-Assembly Tacking', 'Seam Welding', 'Pressure Testing', 'Painting', 'Dispatch']
  },
  {
    partNo: '88486-0580', description: 'Large Tank', model: 'FXZ',
    bom: [
      { subAssembly: 'Shell', thickness: 3.0, w: 700, l: 903, qty: 1, blankWt: 14.89, pcsSheet: 3 },
      { subAssembly: 'Dish', thickness: 3.0, w: 380, l: 380, qty: 3, blankWt: 3.40, pcsSheet: 18 },
      { subAssembly: 'Shafts', discrete: true, desc: 'Shaft Dia 28 & 36 AR', qty: 1 }
    ],
    routings: ['Shell Rolling', 'Dish Pressing/Forming', 'Shaft Cutting', 'Sub-Assembly Tacking', 'Seam Welding', 'Pressure Testing', 'Painting', 'Dispatch']
  },
  {
    partNo: '897491-2710', description: 'Large Tank 2', model: 'FXZ',
    bom: [
      { subAssembly: 'Shell', thickness: 3.0, w: 700, l: 903, qty: 1, blankWt: 14.89, pcsSheet: 3 },
      { subAssembly: 'Dish', thickness: 3.0, w: 380, l: 380, qty: 4, blankWt: 3.40, pcsSheet: 18 },
      { subAssembly: 'Shafts', discrete: true, desc: 'Shaft Dia 28 & 36 AR', qty: 1 }
    ],
    routings: ['Shell Rolling', 'Dish Pressing/Forming', 'Shaft Cutting', 'Sub-Assembly Tacking', 'Seam Welding', 'Pressure Testing', 'Painting', 'Dispatch']
  },
  // Bkt ECM
  {
    partNo: '897485-3750', description: 'Bkt ECM', model: 'FXZ',
    bom: [
      { subAssembly: 'Main Plate', thickness: 4.5, w: 285, l: 280, qty: 1, blankWt: 2.82, pcsSheet: 32 },
      { subAssembly: 'Side Plate', thickness: 2.0, w: 205, l: 218, qty: 1, blankWt: 0.70, pcsSheet: 55 },
      { subAssembly: 'Side Bkt I', thickness: 4.5, w: 50, l: 133, qty: 1, blankWt: 0.23, pcsSheet: 432 },
      { subAssembly: 'Side Bkt II', thickness: 4.5, w: 50, l: 133, qty: 1, blankWt: 0.23, pcsSheet: 432 },
      { subAssembly: 'Side Bkt III', thickness: 4.5, w: 50, l: 75, qty: 1, blankWt: 0.13, pcsSheet: 768 }
    ],
    routings: ['Shearing', 'Blanking/Piercing', 'Bending/Forming', 'Welding', 'Chipping/Cleaning', 'Painting', 'Inspection', 'Dispatch']
  }
];

async function seedData() {
  console.log(`Starting OEM Mfg Data Ingestion for ${oemData.length} FG parts...`);

  // Ensure OEM exists
  let oem = await prisma.oEM.findUnique({ where: { oem_name: 'Ghandhara Automobiles Ltd.' } });
  if (!oem) {
    oem = await prisma.oEM.create({ data: { oem_name: 'Ghandhara Automobiles Ltd.' } });
  }

  // Pre-fetch raw materials to map thickness to materials
  const allMaterials = await prisma.material.findMany({ where: { category: 'RAW_MATERIAL' } });
  const uoms = await prisma.uOM.findMany();
  const pcsUom = uoms.find(u => u.code === 'PCS') || uoms[0];

  let mappedCount = 0;

  for (const item of oemData) {
    // Upsert Model
    let dbModel = await prisma.model.findFirst({ where: { oem_id: oem.oem_id, model_name: item.model } });
    if (!dbModel) {
      dbModel = await prisma.model.create({ data: { oem_id: oem.oem_id, model_name: item.model } });
    }

    // Upsert Product (Finished Good)
    const product = await prisma.product.upsert({
      where: { product_code: item.partNo },
      update: {
        part_name: item.description,
        model_id: dbModel.model_id,
        oem_id: oem.oem_id,
        category: 'FINISHED_GOOD',
        uom_id: pcsUom.uom_id
      },
      create: {
        product_code: item.partNo,
        part_name: item.description,
        model_id: dbModel.model_id,
        oem_id: oem.oem_id,
        category: 'FINISHED_GOOD',
        uom_id: pcsUom.uom_id
      }
    });

    console.log(`Processed FG: ${product.product_code}`);

    // Create BOM and Blank Specs
    await prisma.bOM.deleteMany({ where: { product_id: product.product_id } });
    await prisma.blankSpec.deleteMany({ where: { product_id: product.product_id } });

    let stepSeq = 1;

    for (const comp of item.bom) {
      let materialId = null;

      if (comp.discrete) {
        // Handle discrete/consumable items
        if (comp.materialCode) {
          const mat = allMaterials.find(m => m.material_code === comp.materialCode);
          if (mat) materialId = mat.material_id;
        }

        if (!materialId) {
          // Create dummy material for discrete unmapped items
          const autoCode = `MISC-${comp.subAssembly.replace(/\s+/g, '-').toUpperCase().substring(0, 10)}`;
          const mat = await prisma.material.upsert({
            where: { material_code: autoCode },
            update: { name: comp.subAssembly, description: comp.desc },
            create: { material_code: autoCode, name: comp.subAssembly, description: comp.desc, uom_id: pcsUom.uom_id }
          });
          materialId = mat.material_id;
        }

        await prisma.bOM.create({
          data: {
            product_id: product.product_id,
            material_id: materialId,
            quantity: comp.qty,
            sub_assembly_name: comp.subAssembly,
            step_sequence: stepSeq++,
            uom_id: pcsUom.uom_id
          }
        });

      } else {
        // Map thickness to HRC or CRC sheet
        let sheetMat = null;
        if (comp.thickness >= 2.0) {
          sheetMat = allMaterials.find(m => m.description && m.description.includes('HRC') && m.description.includes(comp.thickness.toFixed(1)));
        } 
        if (!sheetMat) {
          sheetMat = allMaterials.find(m => m.description && m.description.includes('CRC') && m.description.includes(comp.thickness.toFixed(1)));
        }
        if (!sheetMat) {
          sheetMat = allMaterials.find(m => m.description && m.description.includes(comp.thickness.toFixed(1)));
        }

        if (sheetMat) {
          materialId = sheetMat.material_id;
        } else {
          // Fallback if not found
          const fallbackMat = await prisma.material.findFirst();
          materialId = fallbackMat.material_id;
          console.warn(`Could not perfectly match thickness ${comp.thickness} to RM database. Used fallback.`);
        }

        await prisma.bOM.create({
          data: {
            product_id: product.product_id,
            material_id: materialId,
            quantity: comp.qty,
            sub_assembly_name: comp.subAssembly,
            step_sequence: stepSeq++,
            uom_id: sheetMat ? sheetMat.uom_id : pcsUom.uom_id
          }
        });

        // Add Blank Specs for material consumption
        if (comp.w && comp.l) {
          await prisma.blankSpec.create({
            data: {
              product_id: product.product_id,
              sub_assembly_name: comp.subAssembly,
              width_mm: comp.w,
              length_mm: comp.l,
              thickness_mm: comp.thickness,
              quantity: comp.qty,
              blank_weight_kg: comp.blankWt || 0,
              pcs_per_sheet: comp.pcsSheet || 0,
              consumption_pct: comp.yield || 0,
              sheet_type: '1220x2440' // Typical standard
            }
          });
        }
      }
    }

    // Routings
    await prisma.routing.deleteMany({ where: { product_id: product.product_id } });
    let routStepNo = 1;
    for (const op of item.routings) {
      await prisma.routing.create({
        data: {
          product_id: product.product_id,
          step_no: routStepNo++,
          operation: op,
          work_center: 'General Workshop'
        }
      });
    }

    mappedCount++;
  }

  console.log(`Successfully ingested comprehensive BOM and Routing data for ${mappedCount} products.`);
}

seedData()
  .catch((e) => {
    console.error('Error seeding BOM data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
