// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 01: Define Study Area
// =====================================================


// 1. Load administrative boundaries
var counties = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
);


// 2. Select Harris County, Texas
var harrisCounty = counties
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Texas'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Harris'));


// 3. Print the selected county
print('Harris County:', harrisCounty);


// 4. Display Harris County on the map
Map.centerObject(harrisCounty, 10);

Map.addLayer(
  harrisCounty,
  {
    color: 'red',
    fillColor: '00000000'
  },
  'Harris County'
);