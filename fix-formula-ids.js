/**
 * Quick Fix: Update Formula to Use Current Sample IDs
 * 
 * Run this in browser console (F12) to fix the formula immediately
 */

(function fixFormulaIds() {
  console.log('🔧 Starting Formula ID Fix...\n');
  
  // Load data
  const formulas = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
  const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
  
  if (formulas.length === 0) {
    console.log('❌ No formulas found');
    return;
  }
  
  if (samples.length === 0) {
    console.log('❌ No samples found');
    return;
  }
  
  let updatedCount = 0;
  
  // For each formula
  formulas.forEach(formula => {
    const formulaName = formula.name || formula.formulaName || 'Unknown';
    console.log(`\n📋 Checking formula: ${formulaName}`);
    
    if (!formula.ingredients || formula.ingredients.length === 0) {
      console.log('  ⚠️  No ingredients');
      return;
    }
    
    // For each ingredient
    formula.ingredients.forEach((ing, idx) => {
      const oldId = ing.rawMaterialId;
      
      if (!oldId) {
        console.log(`  Ingredient ${idx + 1}: No rawMaterialId`);
        return;
      }
      
      // Check if this ID exists in samples
      const exists = samples.find(s => s.id === oldId);
      
      if (exists) {
        console.log(`  Ingredient ${idx + 1}: ✅ ID exists (${oldId})`);
        return;
      }
      
      // ID doesn't exist - try to find by code
      console.log(`  Ingredient ${idx + 1}: ⚠️  ID not found (${oldId})`);
      
      // Try to match by code
      const code = ing.code;
      if (code) {
        const matchByCode = samples.find(s => 
          s.code === code || 
          s.customIdNo === code
        );
        
        if (matchByCode) {
          console.log(`  → Found by code "${code}": ${matchByCode.id}`);
          console.log(`  → Updating rawMaterialId...`);
          ing.rawMaterialId = matchByCode.id;
          updatedCount++;
          console.log(`  ✅ Updated!`);
          return;
        }
      }
      
      // Try to match by old ID pattern (in case it's stored with 'sample-' prefix)
      const cleanOldId = oldId.replace(/^sample-/, '');
      const matchById = samples.find(s => {
        const sampleId = (s.id || '').replace(/^sample-/, '');
        return sampleId.includes(cleanOldId) || cleanOldId.includes(sampleId);
      });
      
      if (matchById) {
        console.log(`  → Found similar ID: ${matchById.id}`);
        console.log(`  → Updating rawMaterialId...`);
        ing.rawMaterialId = matchById.id;
        updatedCount++;
        console.log(`  ✅ Updated!`);
        return;
      }
      
      console.log(`  ❌ Could not find replacement for ID: ${oldId}`);
    });
  });
  
  if (updatedCount > 0) {
    // Save updated formulas
    localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
    console.log(`\n✅ Fixed ${updatedCount} ingredient(s)`);
    console.log('🔄 Please refresh the page and try again!');
  } else {
    console.log('\n✅ No fixes needed - all ingredient IDs are valid');
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Formulas checked: ${formulas.length}`);
  console.log(`  Ingredients updated: ${updatedCount}`);
})();

