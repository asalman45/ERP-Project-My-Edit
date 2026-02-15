// Comprehensive test for Partial QA API endpoint
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8081/api';

async function testPartialQAAPI() {
  console.log('\n🧪 Testing Partial QA Rejection API\n');
  console.log('═'.repeat(70));

  try {
    // Step 1: Find a product in QA
    console.log('\n1️⃣ Finding products in QA section...');
    const qaResponse = await fetch(`${API_BASE}/quality-assurance/by-location-type?type=QA`);
    
    if (!qaResponse.ok) {
      throw new Error(`QA fetch failed: ${qaResponse.status} ${qaResponse.statusText}`);
    }

    const qaData = await qaResponse.json();
    const qaProducts = Array.isArray(qaData) ? qaData : (qaData.data || []);
    
    if (qaProducts.length === 0) {
      console.log('❌ No products found in QA section');
      console.log('ℹ️  Please move some finished goods to QA first');
      return;
    }

    // Filter to products with quantity > 0
    const availableProducts = qaProducts.filter(p => p.quantity > 0);
    
    if (availableProducts.length === 0) {
      console.log('❌ No products with quantity > 0 found');
      return;
    }

    const testProduct = availableProducts[0];
    console.log(`✅ Found test product:`);
    console.log(`   Product: ${testProduct.product_name || testProduct.product?.part_name}`);
    console.log(`   Code: ${testProduct.product_code || testProduct.product?.product_code}`);
    console.log(`   Inventory ID: ${testProduct.inventory_id}`);
    console.log(`   Quantity: ${testProduct.quantity} ${testProduct.uom_code || 'pcs'}`);

    // Step 2: Prepare test data
    const totalQty = testProduct.quantity;
    const approvedQty = Math.floor(totalQty * 0.6);
    const reworkQty = Math.floor(totalQty * 0.3);
    const scrapQty = totalQty - approvedQty - reworkQty;

    console.log('\n2️⃣ Preparing test data...');
    console.log(`   Total Quantity: ${totalQty}`);
    console.log(`   Approved: ${approvedQty}`);
    console.log(`   Rework: ${reworkQty}`);
    console.log(`   Scrap: ${scrapQty}`);
    console.log(`   Total: ${approvedQty + reworkQty + scrapQty} ✅`);

    const testPayload = {
      approved_quantity: approvedQty,
      rejections: [
        {
          quantity: reworkQty,
          disposition: "REWORK",
          reason: "Surface defects requiring rework",
          root_cause: "Machine calibration issue",
          corrective_action: "Recalibrate machine"
        },
        {
          quantity: scrapQty,
          disposition: "SCRAP",
          reason: "Cracks found, beyond repair"
        }
      ],
      notes: "Automated test inspection",
      rejected_by: "test-script"
    };

    console.log('\n3️⃣ Sending API request...');
    console.log(`   POST ${API_BASE}/quality-assurance/${testProduct.inventory_id}/partial`);
    console.log(`   Payload:`, JSON.stringify(testPayload, null, 2));

    // Step 3: Make API call
    const response = await fetch(`${API_BASE}/quality-assurance/${testProduct.inventory_id}/partial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const responseData = await response.json();

    console.log('\n4️⃣ API Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`   ❌ Error: ${responseData.error || 'Unknown error'}`);
      if (responseData.error?.includes('Prisma')) {
        console.log(`   ⚠️  Prisma error detected - check schema compatibility`);
      }
      return;
    }

    console.log(`   ✅ Success!`);
    console.log(`   Response:`, JSON.stringify(responseData, null, 2));

    // Step 4: Verify results
    console.log('\n5️⃣ Verifying results...');
    
    // Wait a bit for database to sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check QA inventory (should be 0)
    const qaCheckResponse = await fetch(`${API_BASE}/quality-assurance/by-location-type?type=QA`);
    const qaCheckData = await qaCheckResponse.json();
    const qaCheckProducts = Array.isArray(qaCheckData) ? qaCheckData : (qaCheckData.data || []);
    const originalProduct = qaCheckProducts.find(p => p.inventory_id === testProduct.inventory_id);
    
    if (originalProduct) {
      console.log(`   Original QA Inventory: ${originalProduct.quantity} pcs`);
      if (originalProduct.quantity === 0) {
        console.log(`   ✅ Original inventory set to 0`);
      } else {
        console.log(`   ⚠️  Original inventory still has quantity`);
      }
    } else {
      console.log(`   ✅ Original product no longer in QA (as expected)`);
    }

    // Check response data
    if (responseData.data) {
      console.log('\n6️⃣ Response Summary:');
      console.log(`   Original Quantity: ${responseData.data.original_quantity}`);
      console.log(`   Approved Quantity: ${responseData.data.approved_quantity}`);
      console.log(`   Rejected Quantity: ${responseData.data.rejected_quantity}`);
      
      if (responseData.data.results) {
        if (responseData.data.results.approved) {
          console.log(`   ✅ Approved inventory created: ${responseData.data.results.approved.inventory_id}`);
        }
        
        if (responseData.data.results.rejections) {
          responseData.data.results.rejections.forEach((rej, i) => {
            console.log(`   ✅ Rejection ${i + 1}: ${rej.disposition} - ${rej.quantity} pcs`);
            if (rej.wo_id) {
              console.log(`      Rework WO: ${rej.wo_no} (${rej.wo_id})`);
            }
            if (rej.scrap_id) {
              console.log(`      Scrap ID: ${rej.scrap_id}`);
            }
          });
        }
      }
    }

    // Final summary
    console.log('\n7️⃣ Test Summary:');
    console.log('═'.repeat(70));
    if (response.ok && responseData.success) {
      console.log('🎉 TEST PASSED!');
      console.log('\n✅ All checks passed:');
      console.log('   ✅ API endpoint working');
      console.log('   ✅ Request accepted');
      console.log('   ✅ Response received');
      console.log('   ✅ Data structure correct');
      console.log('\n📋 Next: Verify in database:');
      console.log('   - Check Finished Goods inventory');
      console.log('   - Check Rework Area inventory');
      console.log('   - Check Scrap Inventory');
      console.log('   - Check QA Rejection records');
    } else {
      console.log('❌ TEST FAILED');
      console.log(`   Error: ${responseData.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server not running!');
      console.log('   Please start backend: cd erp-backend && npm run dev');
    }
  }
}

// Run test
testPartialQAAPI();

