// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 04: Sentinel-1 Image Inventory
// Display Image Footprints
// =====================================================


// 1. Load Harris County
var counties = ee.FeatureCollection(
  'FAO/GAUL/2015/level2'
);

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


// 2. Load Sentinel-1 images
var sentinel1 = ee.ImageCollection(
  'COPERNICUS/S1_GRD'
)
  .filterBounds(harrisCounty)
  .filterDate(
    '2017-08-01',
    '2017-09-15'
  );


// 3. Select Ascending Orbit 34
var orbit34 = sentinel1
  .filter(ee.Filter.eq(
    'orbitProperties_pass',
    'ASCENDING'
  ))
  .filter(ee.Filter.eq(
    'relativeOrbitNumber_start',
    34
  ));


// 4. Select images from 5 August
var before = orbit34
  .filterDate(
    '2017-08-05',
    '2017-08-06'
  );


// 5. Select images from 29 August
var after = orbit34
  .filterDate(
    '2017-08-29',
    '2017-08-30'
  );


// 6. Print selected images
print(
  'Before - 5 August:',
  before
);

print(
  'After - 29 August:',
  after
);


// 7. Create footprints for 5 August
var beforeFootprints = ee.FeatureCollection(
  before.map(function(image) {

    return ee.Feature(
      image.geometry(),
      {
        'slice': image.get('sliceNumber'),
        'orbit': image.get(
          'relativeOrbitNumber_start'
        )
      }
    );

  })
);


// 8. Create footprints for 29 August
var afterFootprints = ee.FeatureCollection(
  after.map(function(image) {

    return ee.Feature(
      image.geometry(),
      {
        'slice': image.get('sliceNumber'),
        'orbit': image.get(
          'relativeOrbitNumber_start'
        )
      }
    );

  })
);


// 9. Display Harris County
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


// 10. Display 5 August footprints
Map.addLayer(
  beforeFootprints,
  {
    color: 'blue',
    fillColor: '00000000'
  },
  '5 August - Footprints'
);


// 11. Display 29 August footprints
Map.addLayer(
  afterFootprints,
  {
    color: 'yellow',
    fillColor: '00000000'
  },
  '29 August - Footprints'
);