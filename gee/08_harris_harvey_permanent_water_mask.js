// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 08: Remove Permanent Water
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


// =====================================================
// 4. Select Same SAR Geometry
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


// =====================================================
// 5. Select BEFORE Images
// =====================================================

var beforeCollection = orbit34
  .filterDate(
    '2017-08-05',
    '2017-08-06'
  );


// =====================================================
// 6. Select AFTER Images
// =====================================================

var afterCollection = orbit34
  .filterDate(
    '2017-08-29',
    '2017-08-30'
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
// 9. Calculate VV Difference
// =====================================================
// Difference = AFTER - BEFORE
//
// Large negative values indicate a strong
// decrease in radar backscatter.
// =====================================================

var vvDifference = afterVV
  .subtract(beforeVV)
  .clip(harrisCounty);


// =====================================================
// 10. Create Initial Flood Candidate Mask
// =====================================================
// Threshold:
// VV decrease >= 5 dB
//
// In mathematical form:
//
// AFTER - BEFORE <= -5 dB
// =====================================================

var initialFloodCandidate = vvDifference
  .lte(-5)
  .selfMask()
  .clip(harrisCounty);


// =====================================================
// 11. Load JRC Global Surface Water
// =====================================================
// This dataset contains historical information
// about surface water occurrence.
//
// Occurrence represents the percentage of
// observations in which water was detected.
// =====================================================

var waterDataset = ee.Image(
  'JRC/GSW1_4/GlobalSurfaceWater'
);


// =====================================================
// 12. Extract Water Occurrence
// =====================================================

var waterOccurrence = waterDataset
  .select('occurrence')
  .clip(harrisCounty);


// =====================================================
// 13. Define Permanent Water
// =====================================================
// We use occurrence > 90%.
//
// This means water was detected in more than
// 90% of available observations.
//
// These areas are treated as permanent water
// for this analysis.
// =====================================================

var permanentWater = waterOccurrence
  .gt(90)
  .selfMask()
  .clip(harrisCounty);


// =====================================================
// 14. Remove Permanent Water
// =====================================================
// Keep only flood candidates that are NOT
// classified as permanent water.
// =====================================================
var nonPermanentWater = waterOccurrence
  .lte(90);

var floodCandidateFiltered =
  initialFloodCandidate
    .updateMask(nonPermanentWater)
    .clip(harrisCounty);

// =====================================================
// 15. Display Harris County
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
  'Harris County Boundary'
);


// =====================================================
// 16. Display Initial Flood Candidates
// =====================================================

Map.addLayer(
  initialFloodCandidate,
  {
    palette: ['0000FF']
  },
  'Initial Flood Candidates'
);


// =====================================================
// 17. Display Permanent Water
// =====================================================

Map.addLayer(
  permanentWater,
  {
    palette: ['00FFFF']
  },
  'Permanent Water (>90% occurrence)'
);


// =====================================================
// 18. Display Filtered Flood Candidates
// =====================================================

Map.addLayer(
  floodCandidateFiltered,
  {
    palette: ['FF8C00']
  },
  'Flood Candidates After Water Mask'
);


// =====================================================
// 19. Calculate Initial Flood Candidate Area
// =====================================================

var initialFloodAreaImage =
  initialFloodCandidate
    .multiply(
      ee.Image.pixelArea()
    )
    .rename('flood_area');

var initialFloodArea = initialFloodAreaImage
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: harrisCounty.geometry(),
    scale: 10,
    maxPixels: 1e13
  });

var initialFloodAreaKm2 = ee.Number(
  initialFloodArea.get('flood_area')
).divide(1e6);


// =====================================================
// 20. Calculate Filtered Flood Candidate Area
// =====================================================

var filteredFloodAreaImage =
  floodCandidateFiltered
    .multiply(
      ee.Image.pixelArea()
    )
    .rename('flood_area');

var filteredFloodArea = filteredFloodAreaImage
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: harrisCounty.geometry(),
    scale: 10,
    maxPixels: 1e13
  });

var filteredFloodAreaKm2 = ee.Number(
  filteredFloodArea.get('flood_area')
).divide(1e6);


// =====================================================
// 21. Calculate Permanent Water Area
// =====================================================

var permanentWaterAreaImage =
  permanentWater
    .multiply(
      ee.Image.pixelArea()
    )
    .rename('water_area');

var permanentWaterArea = permanentWaterAreaImage
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: harrisCounty.geometry(),
    scale: 10,
    maxPixels: 1e13
  });

var permanentWaterAreaKm2 = ee.Number(
  permanentWaterArea.get('water_area')
).divide(1e6);


// =====================================================
// 22. Print Results
// =====================================================

print(
  'Initial flood candidate area (km²):',
  initialFloodAreaKm2
);

print(
  'Permanent water area (km²):',
  permanentWaterAreaKm2
);

print(
  'Flood candidate area after permanent water mask (km²):',
  filteredFloodAreaKm2
);


// =====================================================
// 23. Create Legend
// =====================================================

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});


// -----------------------------------------------------
// Legend Title
// -----------------------------------------------------

var legendTitle = ui.Label({
  value: 'Hurricane Harvey - Water Mask',
  style: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 0 8px 0'
  }
});

legend.add(legendTitle);


// -----------------------------------------------------
// Initial Flood Candidates
// -----------------------------------------------------

var blueBox = ui.Label({
  style: {
    backgroundColor: '0000FF',
    padding: '8px',
    margin: '0 5px 0 0'
  }
});

var blueText = ui.Label({
  value: 'Initial flood candidates',
  style: {
    margin: '0'
  }
});

var blueRow = ui.Panel({
  widgets: [
    blueBox,
    blueText
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});

legend.add(blueRow);


// -----------------------------------------------------
// Permanent Water
// -----------------------------------------------------

var cyanBox = ui.Label({
  style: {
    backgroundColor: '00FFFF',
    padding: '8px',
    margin: '0 5px 0 0'
  }
});

var cyanText = ui.Label({
  value: 'Permanent water (>90% occurrence)',
  style: {
    margin: '0'
  }
});

var cyanRow = ui.Panel({
  widgets: [
    cyanBox,
    cyanText
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});

legend.add(cyanRow);


// -----------------------------------------------------
// Filtered Flood Candidates
// -----------------------------------------------------

var orangeBox = ui.Label({
  style: {
    backgroundColor: 'FF8C00',
    padding: '8px',
    margin: '0 5px 0 0'
  }
});

var orangeText = ui.Label({
  value: 'Flood candidates after water mask',
  style: {
    margin: '0'
  }
});

var orangeRow = ui.Panel({
  widgets: [
    orangeBox,
    orangeText
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});

legend.add(orangeRow);


Map.add(legend);