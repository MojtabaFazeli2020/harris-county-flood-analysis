// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 07: Flood Detection Using Sentinel-1 VV
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
// 4. Select Homogeneous SAR Geometry
// =====================================================
// Same:
// - Orbit direction: ASCENDING
// - Relative orbit: 34
//
// This makes the Before and After images
// more comparable.
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
// 5 August 2017
// Expected: 2 Sentinel-1 slices
// =====================================================

var beforeCollection = orbit34
  .filterDate(
    '2017-08-05',
    '2017-08-06'
  );

print(
  'BEFORE collection - 5 August 2017:',
  beforeCollection
);

print(
  'Number of BEFORE images:',
  beforeCollection.size()
);


// =====================================================
// 6. Select AFTER Images
// =====================================================
// 29 August 2017
// Expected: 2 Sentinel-1 slices
// =====================================================

var afterCollection = orbit34
  .filterDate(
    '2017-08-29',
    '2017-08-30'
  );

print(
  'AFTER collection - 29 August 2017:',
  afterCollection
);

print(
  'Number of AFTER images:',
  afterCollection.size()
);


// =====================================================
// 7. Create BEFORE VV Mosaic
// =====================================================

var beforeVV = beforeCollection
  .select('VV')
  .mosaic()
  .clip(harrisCounty);


// =====================================================
// 8. Create AFTER VV Mosaic
// =====================================================

var afterVV = afterCollection
  .select('VV')
  .mosaic()
  .clip(harrisCounty);


// =====================================================
// 9. Display BEFORE VV
// =====================================================

Map.centerObject(
  harrisCounty,
  10
);

Map.addLayer(
  beforeVV,
  {
    min: -25,
    max: 5
  },
  'BEFORE VV - 5 August 2017'
);


// =====================================================
// 10. Display AFTER VV
// =====================================================

Map.addLayer(
  afterVV,
  {
    min: -25,
    max: 5
  },
  'AFTER VV - 29 August 2017'
);


// =====================================================
// 11. Calculate VV Difference
// =====================================================
// Difference = AFTER - BEFORE
//
// Example:
//
// BEFORE = -8 dB
// AFTER  = -20 dB
//
// Difference = -20 - (-8)
//            = -12 dB
//
// Negative values indicate a decrease
// in radar backscatter.
// =====================================================

var vvDifference = afterVV
  .subtract(beforeVV)
  .clip(harrisCounty);


// =====================================================
// 12. Display VV Difference
// =====================================================

Map.addLayer(
  vvDifference,
  {
    min: -15,
    max: 15
  },
  'VV Difference - After minus Before'
);


// =====================================================
// 13. Define Flood Candidate Areas
// =====================================================
// We consider pixels with a decrease of
// 5 dB or more as potential flood candidates.
//
// Threshold:
//
// VV Difference <= -5 dB
//
// IMPORTANT:
// These are FLOOD CANDIDATES,
// not confirmed flooded areas.
// =====================================================

var floodCandidate = vvDifference
  .lte(-5)
  .selfMask()
  .clip(harrisCounty);


// =====================================================
// 14. Display Flood Candidate Areas
// =====================================================

Map.addLayer(
  floodCandidate,
  {
    palette: ['0000FF']
  },
  'Flood Candidates - VV decrease >= 5 dB'
);


// =====================================================
// 15. Display Harris County Boundary
// =====================================================

Map.addLayer(
  harrisCounty,
  {
    color: 'red',
    fillColor: '00000000'
  },
  'Harris County Boundary'
);


// =====================================================
// 16. Calculate Candidate Flood Area
// =====================================================
// Pixel area is calculated in square meters.
// We convert the final result to square kilometers.
// =====================================================

var floodAreaImage = floodCandidate
  .multiply(
    ee.Image.pixelArea()
  );

var floodArea = floodAreaImage
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: harrisCounty.geometry(),
    scale: 10,
    maxPixels: 1e13
  });


// =====================================================
// 17. Convert Square Meters to Square Kilometers
// =====================================================

var floodBandName = floodAreaImage.bandNames().get(0);

var floodAreaKm2 = ee.Number(
  floodArea.get(floodBandName)
).divide(1e6);

print(
  'Potential flooded area (km²):',
  floodAreaKm2
);


// =====================================================
// 18. Calculate Total Harris County Area
// =====================================================

var countyArea = ee.Image
  .pixelArea()
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: harrisCounty.geometry(),
    scale: 10,
    maxPixels: 1e13
  });

var countyBandName = ee.Image
  .pixelArea()
  .bandNames()
  .get(0);

var countyAreaKm2 = ee.Number(
  countyArea.get(countyBandName)
).divide(1e6);

print(
  'Harris County area (km²):',
  countyAreaKm2
);


// =====================================================
// 19. Calculate Percentage of Flood Candidates
// =====================================================

var floodPercentage = floodAreaKm2
  .divide(countyAreaKm2)
  .multiply(100);

print(
  'Potential flooded area (% of Harris County):',
  floodPercentage
);


// =====================================================
// 20. Create a Simple Legend
// =====================================================

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

var legendTitle = ui.Label({
  value: 'Hurricane Harvey - Flood Detection',
  style: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 0 8px 0'
  }
});

legend.add(legendTitle);


// ---- Legend item: Flood candidates ----

var floodColor = ui.Label({
  style: {
    backgroundColor: '0000FF',
    padding: '8px',
    margin: '0 5px 0 0'
  }
});

var floodText = ui.Label({
  value: 'Potential flooded area (VV decrease ≥ 5 dB)',
  style: {
    margin: '0'
  }
});

var floodLegendRow = ui.Panel({
  widgets: [
    floodColor,
    floodText
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});

legend.add(floodLegendRow);


// ---- Legend item: County boundary ----

var boundaryColor = ui.Label({
  style: {
    backgroundColor: 'FF0000',
    padding: '2px 8px',
    margin: '0 5px 0 0'
  }
});

var boundaryText = ui.Label({
  value: 'Harris County boundary',
  style: {
    margin: '0'
  }
});

var boundaryLegendRow = ui.Panel({
  widgets: [
    boundaryColor,
    boundaryText
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});

legend.add(boundaryLegendRow);


Map.add(legend);