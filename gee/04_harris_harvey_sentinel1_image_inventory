// =====================================================
// Harris County Flood Analysis
// Hurricane Harvey - 2017
// Step 03: Sentinel-1 Metadata
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


// 5. Create metadata table
var metadata = sentinel1.map(function(image) {

  return ee.Feature(null, {

    'date': ee.Date(
      image.get('system:time_start')
    ).format('YYYY-MM-dd HH:mm'),

    'platform': image.get(
      'platform_number'
    ),

    'mode': image.get(
      'instrumentMode'
    ),

    'polarization': image.get(
      'transmitterReceiverPolarisation'
    ),

    'pass': image.get(
      'orbitProperties_pass'
    ),

    'relative_orbit': image.get(
      'relativeOrbitNumber_start'
    ),

    'orbit_number': image.get(
      'orbitNumber_start'
    ),

    'slice_number': image.get(
      'sliceNumber'
    ),

    'total_slices': image.get(
      'totalSlices'
    )

  });

});


// 6. Sort by date
metadata = metadata.sort('date');


// 7. Display the metadata table
print(
  'Sentinel-1 Metadata Table:',
  metadata
);
print('Metadata table:', metadata);

// 8. Display Harris County
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