// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 09: DEM and Slope Analysis
// =====================================================


// =====================================================
// 1. Load Harris County Boundary
// =====================================================

var counties = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
);

var harrisCounty = counties
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Texas'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Harris'));

Map.centerObject(harrisCounty, 9);

Map.addLayer(
  harrisCounty,
  {color: 'yellow'},
  'Harris County Boundary'
);


// =====================================================
// 2. Load Sentinel-1 Data
// =====================================================

var sentinel1 = ee.ImageCollection(
  'COPERNICUS/S1_GRD'
)
.filterBounds(harrisCounty)
.filterDate('2017-08-01', '2017-09-15')
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
.filter(ee.Filter.eq('relativeOrbitNumber_start', 34));


// =====================================================
// 3. Before and After Image Collections
// =====================================================

var beforeCollection = sentinel1
  .filterDate('2017-08-05', '2017-08-06');

var afterCollection = sentinel1
  .filterDate('2017-08-29', '2017-08-30');


// =====================================================
// 4. Create Before and After VV Mosaics
// =====================================================

var beforeVV = beforeCollection
  .select('VV')
  .mosaic()
  .clip(harrisCounty);

var afterVV = afterCollection
  .select('VV')
  .mosaic()
  .clip(harrisCounty);


// =====================================================
// 5. Detect Initial Flood Candidates
// =====================================================

var vvDifference = afterVV.subtract(beforeVV);

var initialFloodCandidate = vvDifference
  .lte(-5)
  .selfMask()
  .clip(harrisCounty);


// =====================================================
// 6. Load JRC Historical Water Data
// =====================================================

var globalSurfaceWater = ee.Image(
  'JRC/GSW1_4/GlobalSurfaceWater'
);

var waterOccurrence = globalSurfaceWater
  .select('occurrence');


// =====================================================
// 7. Remove Historical Permanent Water
// =====================================================

var nonPermanentWater = waterOccurrence.lte(90);

var floodCandidateFiltered = initialFloodCandidate
  .updateMask(nonPermanentWater)
  .clip(harrisCounty);


// =====================================================
// 8. Load DEM
// =====================================================

var dem = ee.Image('USGS/SRTMGL1_003')
  .select('elevation')
  .clip(harrisCounty);


// =====================================================
// 9. Calculate Slope
// =====================================================

var slope = ee.Terrain.slope(dem);


// =====================================================
// 10. Visualization Parameters
// =====================================================

var demVisualization = {
  min: 0,
  max: 100,
  palette: [
    '0d0887',
    '6a00a8',
    'b12a90',
    'e16462',
    'fca636',
    'f0f921'
  ]
};

var slopeVisualization = {
  min: 0,
  max: 10,
  palette: [
    '006400',
    '7fff00',
    'ffff00',
    'ffa500',
    'ff0000'
  ]
};

var floodVisualization = {
  palette: ['00ffff']
};


// =====================================================
// 11. Add Layers to the Map
// =====================================================

Map.addLayer(
  beforeVV,
  {
    min: -25,
    max: 5,
    palette: ['black', 'white']
  },
  'Before Harvey - VV'
);

Map.addLayer(
  afterVV,
  {
    min: -25,
    max: 5,
    palette: ['black', 'white']
  },
  'After Harvey - VV'
);

Map.addLayer(
  dem,
  demVisualization,
  'DEM - Elevation'
);

Map.addLayer(
  slope,
  slopeVisualization,
  'Slope'
);

Map.addLayer(
  floodCandidateFiltered,
  floodVisualization,
  'Final Flood Candidates'
);


// =====================================================
// 12. Calculate Area of Final Flood Candidates
// =====================================================

var finalFloodArea = floodCandidateFiltered
  .multiply(ee.Image.pixelArea())
  .rename('flood_area')
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: harrisCounty.geometry(),
    scale: 30,
    maxPixels: 1e13
  });

print(
  'Final flood candidate area (m²):',
  finalFloodArea
);

print(
  'Final flood candidate area (km²):',
  ee.Number(finalFloodArea.get('flood_area'))
    .divide(1e6)
);


// =====================================================
// 13. Elevation Statistics for Flood Candidates
// =====================================================

var elevationStatistics = dem
  .updateMask(floodCandidateFiltered)
  .reduceRegion({
    reducer: ee.Reducer.mean()
      .combine({
        reducer2: ee.Reducer.minMax(),
        sharedInputs: true
      }),
    geometry: harrisCounty.geometry(),
    scale: 30,
    maxPixels: 1e13
  });

print(
  'Elevation statistics for final flood candidates (meters):',
  elevationStatistics
);


// =====================================================
// 14. Slope Statistics for Flood Candidates
// =====================================================

var slopeStatistics = slope
  .updateMask(floodCandidateFiltered)
  .reduceRegion({
    reducer: ee.Reducer.mean()
      .combine({
        reducer2: ee.Reducer.minMax(),
        sharedInputs: true
      }),
    geometry: harrisCounty.geometry(),
    scale: 30,
    maxPixels: 1e13
  });

print(
  'Slope statistics for final flood candidates (degrees):',
  slopeStatistics
);


// =====================================================
// 15. General DEM and Slope Statistics for Harris County
// =====================================================

var countyElevationStatistics = dem.reduceRegion({
  reducer: ee.Reducer.mean()
    .combine({
      reducer2: ee.Reducer.minMax(),
      sharedInputs: true
    }),
  geometry: harrisCounty.geometry(),
  scale: 30,
  maxPixels: 1e13
});

print(
  'General elevation statistics for Harris County (meters):',
  countyElevationStatistics
);


var countySlopeStatistics = slope.reduceRegion({
  reducer: ee.Reducer.mean()
    .combine({
      reducer2: ee.Reducer.minMax(),
      sharedInputs: true
    }),
  geometry: harrisCounty.geometry(),
  scale: 30,
  maxPixels: 1e13
});

print(
  'General slope statistics for Harris County (degrees):',
  countySlopeStatistics
);


// =====================================================
// 16. Export Final Flood Candidates
// =====================================================

Export.image.toDrive({
  image: floodCandidateFiltered,
  description: 'Harris_Harvey_Final_Flood_Candidates',
  folder: 'GEE_Harris_Harvey',
  fileNamePrefix: 'harris_harvey_final_flood_candidates',
  region: harrisCounty.geometry(),
  scale: 30,
  maxPixels: 1e13
});


// =====================================================
// 17. Export DEM
// =====================================================

Export.image.toDrive({
  image: dem,
  description: 'Harris_County_DEM',
  folder: 'GEE_Harris_Harvey',
  fileNamePrefix: 'harris_county_dem',
  region: harrisCounty.geometry(),
  scale: 30,
  maxPixels: 1e13
});


// =====================================================
// 18. Export Slope
// =====================================================

Export.image.toDrive({
  image: slope,
  description: 'Harris_County_Slope',
  folder: 'GEE_Harris_Harvey',
  fileNamePrefix: 'harris_county_slope',
  region: harrisCounty.geometry(),
  scale: 30,
  maxPixels: 1e13
});