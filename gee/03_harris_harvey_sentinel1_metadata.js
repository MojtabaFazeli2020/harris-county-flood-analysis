// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 02: Explore Sentinel-1 Data
// =====================================================


// 1. Load administrative boundaries
var counties = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
);


// 2. Select Harris County, Texas
var harrisCounty = counties
  .filter(ee.Filter.eq(
    'ADM0_NAME',
    'United States of America'
  ))
  .filter(ee.Filter.eq(
    'ADM1_NAME',
    'Texas'
  ))
  .filter(ee.Filter.eq(
    'ADM2_NAME',
    'Harris'
  ));


// 3. Load Sentinel-1 images
var sentinel1 = ee.ImageCollection(
  'COPERNICUS/S1_GRD'
)
  .filterBounds(harrisCounty)
  .filterDate(
    '2017-08-01',
    '2017-09-15'
  );


// 4. Number of images
print(
  'Number of Sentinel-1 images:',
  sentinel1.size()
);


// 5. Show the properties of the first image
var firstImage = ee.Image(
  sentinel1.first()
);

print(
  'First Sentinel-1 image:',
  firstImage
);


// 6. Display Harris County
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


// 7. Display the first Sentinel-1 image
Map.addLayer(
  firstImage,
  {
    bands: ['VV'],
    min: -25,
    max: 5
  },
  'Sentinel-1 VV - First Image'
);