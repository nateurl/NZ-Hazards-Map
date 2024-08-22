function initMap() {
  require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/GeoJSONLayer",
        "esri/renderers/UniqueValueRenderer",
        "esri/symbols/PictureMarkerSymbol",
        "esri/geometry/Extent"
      ], function(Map, MapView, GeoJSONLayer, UniqueValueRenderer, PictureMarkerSymbol, Extent) {
  });
  }
    document.addEventListener("DOMContentLoaded", initMap);
