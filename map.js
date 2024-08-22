let map, view;

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/LayerList"
], function(Map, MapView, GeoJSONLayer, LayerList) {
  
  map = new Map({
    basemap: "topo-vector"
  });

  view = new MapView({
    container: "viewDiv",
    map: map,
    center: [174.7633, -41.2889], // Coordinates for New Zealand
    zoom: 6
  });

  function createLayer(info, index) {
    const layer = new GeoJSONLayer({
      url: info.url,
      title: info.name,
      outFields: ["*"],
      renderer: {
        type: "simple",
        symbol: info.name === "Rail" ? {
          type: "simple-line",
          color: colors[index],
          width: 2
        } : {
          type: "simple-marker",
          color: colors[index],
          size: 8
        }
      },
      popupTemplate: {
        title: "{name}",
        content: "{*}"
      }
    });

    return layer;
  }

  layerInfo.forEach((info, index) => {
    const layer = createLayer(info, index);
    map.add(layer);
  });

  view.when(() => {
    const layerList = new LayerList({
      view: view,
      container: "layerList"
    });

    // Add custom layer toggle buttons
    const layerButtons = document.getElementById("layerButtons");
    map.layers.forEach(layer => {
      const button = document.createElement("button");
      button.innerHTML = layer.title;
      button.className = "layerButton active";
      button.onclick = function() {
        layer.visible = !layer.visible;
        this.classList.toggle("active");
      };
      layerButtons.appendChild(button);
    });
  });
});
