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
  .filter(ee.Filter.eq('ADM0_NAME', 'United States of America'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Texas'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Harris'));


// 3. Load Sentinel-1 GRD images
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(harrisCounty)
  .filterDate('2017-08-01', '2017-09-15');


// 4. Print number of available images
print(
  'Number of Sentinel-1 images:',
  sentinel1.size()
);


// 5. Print image dates in readable format
var imageDates = sentinel1
  .aggregate_array('system:time_start')
  .map(function(date) {
    return ee.Date(date).format('YYYY-MM-dd HH:mm');
  });

print(
  'Image dates:',
  imageDates
);


// 6. Display Harris County
Map.centerObject(harrisCounty, 10);

Map.addLayer(
  harrisCounty,
  {
    color: 'red',
    fillColor: '00000000'
  },
  'Harris County'
);


// 7. Display the first Sentinel-1 image
var firstImage = ee.Image(
  sentinel1.first()
);

Map.addLayer(
  firstImage,
  {
    min: -25,
    max: 5,
    bands: ['VV']
  },
  'Sentinel-1 VV - First Image'
);