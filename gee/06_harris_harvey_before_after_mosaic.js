// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 06: Before / After Sentinel-1 Mosaic
// =====================================================


// =====================================================
// 1. Load Administrative Boundaries
// =====================================================

var counties = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
);


// =====================================================
// 2. Select Harris County, Texas
// =====================================================

var harrisCounty = counties
  .filter(
    ee.Filter.eq(
      'ADM0_NAME',
      'United States of America'
    )
  )
  .filter(
    ee.Filter.eq(
      'ADM1_NAME',
      'Texas'
    )
  )
  .filter(
    ee.Filter.eq(
      'ADM2_NAME',
      'Harris'
    )
  );

print(
  'Harris County:',
  harrisCounty
);


// =====================================================
// 3. Load Sentinel-1 GRD
// =====================================================

var sentinel1 = ee.ImageCollection(
  'COPERNICUS/S1_GRD'
)
  .filterBounds(harrisCounty)
  .filterDate(
    '2017-08-01',
    '2017-09-15'
  );

print(
  'Total Sentinel-1 images:',
  sentinel1.size()
);


// =====================================================
// 4. Filter to the Same SAR Geometry
// =====================================================
// We use:
// ASCENDING
// Relative Orbit 34
// This keeps the Before and After images
// as geometrically comparable as possible.
// =====================================================

var orbit34 = sentinel1
  .filter(
    ee.Filter.eq(
      'orbitProperties_pass',
      'ASCENDING'
    )
  )
  .filter(
    ee.Filter.eq(
      'relativeOrbitNumber_start',
      34
    )
  );

print(
  'ASCENDING - Relative Orbit 34:',
  orbit34
);


// =====================================================
// 5. Select BEFORE Images
// =====================================================
// Date: 5 August 2017
// Two relevant slices: 13 and 14
// =====================================================

var before = orbit34
  .filterDate(
    '2017-08-05',
    '2017-08-06'
  );

print(
  'BEFORE - 5 August 2017:',
  before
);

print(
  'Number of BEFORE images:',
  before.size()
);


// =====================================================
// 6. Select AFTER Images
// =====================================================
// Date: 29 August 2017
// Two relevant slices: 13 and 14
// =====================================================

var after = orbit34
  .filterDate(
    '2017-08-29',
    '2017-08-30'
  );

print(
  'AFTER - 29 August 2017:',
  after
);

print(
  'Number of AFTER images:',
  after.size()
);


// =====================================================
// 7. Create BEFORE Mosaic
// =====================================================

var beforeMosaic = before
  .mosaic()
  .clip(harrisCounty);


// =====================================================
// 8. Create AFTER Mosaic
// =====================================================

var afterMosaic = after
  .mosaic()
  .clip(harrisCounty);


// =====================================================
// 9. Display Harris County
// =====================================================

Map.centerObject(
  harrisCounty,
  10
);

Map.addLayer(
  harrisCounty,
  {
    color: 'red',
    fillColor: '00000000'
  },
  'Harris County'
);


// =====================================================
// 10. Display BEFORE Mosaic
// =====================================================

Map.addLayer(
  beforeMosaic,
  {
    bands: ['VV'],
    min: -25,
    max: 5
  },
  'BEFORE - 5 August 2017 - VV'
);


// =====================================================
// 11. Display AFTER Mosaic
// =====================================================

Map.addLayer(
  afterMosaic,
  {
    bands: ['VV'],
    min: -25,
    max: 5
  },
  'AFTER - 29 August 2017 - VV'
);


// =====================================================
// 12. Print Mosaic Information
// =====================================================

print(
  'BEFORE Mosaic:',
  beforeMosaic
);

print(
  'AFTER Mosaic:',
  afterMosaic
);