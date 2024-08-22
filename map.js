let map, view;

document.addEventListener("DOMContentLoaded", function() {
      console.log("DOM fully loaded and parsed");
      require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GeoJSONLayer",
        "esri/renderers/SimpleRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/geometry/Extent"
      ], function(Map, MapView, GeoJSONLayer, SimpleRenderer, PictureMarkerSymbol, Extent) {
        console.log("Modules loaded");

      map = new Map({
          basemap: "streets-vector"
        });
        console.log("Map created");

      view = new MapView({
          container: "viewDiv",
          map: map,
          extent: new Extent({
            xmin: 165.0,
            ymin: -48.0,
            xmax: 179.5,
            ymax: -33.5,
            spatialReference: { wkid: 4326 }
          }),
          constraints: {
            minZoom: 4,
            maxZoom: 18,
            rotationEnabled: false,
            geometry: new Extent({
              xmin: 165.0,
              ymin: -48.0,
              xmax: 179.5,
              ymax: -33.5,
              spatialReference: { wkid: 4326 }
            })
          }
        });
        console.log("View created");

        view.when(() => {
          console.log("Map view is ready");
          view.ui.add("layerControls", "bottom-right");
            initializeLayers();
        }, (error) => {
          console.error("Error loading map view:", error);
        });
            view.watch("scale", function(newValue) {
      console.log("New scale:", newValue);
    });
  });
});
