let map, view;

// Layer information with scale and offset properties
var layerInfo = [
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/rail.geojson", name: "Rail", offset: 0, minScale: 0, maxScale: 0 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/WoolworthsDCs.geojson", name: "Woolworths DCs", minScale: 5000000, maxScale: 0 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/seaports.geojson", name: "Seaports", minScale: 7000000, maxScale: 1000000 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/airports.geojson", name: "Airports", minScale: 8000000, maxScale: 2000000 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/inlandports.geojson", name: "Inland ports", minScale: 6000000, maxScale: 500000 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/ctsites.geojson", name: "CT sites", minScale: 5500000, maxScale: 750000 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/fuelterminals.geojson", name: "Fuel terminals", minScale: 7500000, maxScale: 1500000 },
  { url: "https://raw.githubusercontent.com/nateurl/natesproject/master/impactpoints.geojson", name: "Impact points", minScale: 9000000, maxScale: 3000000 },
];

var colors = ["#1F78B4", "#95ec6f", "#9bc8f5", "#9efefe", "#c2987c", "#ff770c", "#ffc500", "#ff0000"];

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

    function createRenderer(name, index, offset) {
      console.log(`Creating renderer for ${name}`);
      if (name === "Rail") {
        return {
          type: "simple",
          symbol: {
            type: "simple-line",
            color: colors[index],
            width: 1,
            offset: offset || index * 2
          }
        };
      } else {
        let iconUrl;
        switch(name) {
          case "Seaports":
            iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/Vessel.png";
            break;
          case "Fuel terminals":
            iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/Reserves.png";
            break;
          case "Woolworths DCs":
            iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/DCICON.png";
            break;
          case "CT sites":
            iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/RailIcon.png";
            break;
          default:
            iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/default-icon.png";
        }

        return {
          type: "simple",
          symbol: {
            type: "picture-marker",
            url: iconUrl,
            width: "20px",
            height: "20px"
          },
          visualVariables: [
            {
              type: "size",
              field: "ObjectID",
              stops: [
                { value: 1, size: 15 },
                { value: 1000, size: 25 }
              ]
            }
          ]
        };
      }
    }

    function initializeLayers() {
      let layers = [];

      Promise.all(layerInfo.map((info, index) => {
        console.log(`Creating layer for ${info.name}`);
        const layer = new GeoJSONLayer({
          url: info.url,
          title: info.name,
          renderer: createRenderer(info.name, index, info.offset),
          featureReduction: info.name !== "Rail" ? {
            type: "cluster",
            clusterRadius: "100px",
            clusterMaxZoom: 14,
            popupTemplate: {
              title: "Cluster of {cluster_count} points",
              content: "Zoom in to see individual points."
            }
          } : null,
          minScale: info.minScale || (info.name !== "Rail" ? 10000000 : undefined),
          maxScale: info.maxScale || 0
        });

        return layer.load().then(() => {
          console.log(`Layer ${info.name} loaded successfully`);
          layers.push(layer);

          const button = document.createElement("button");
          button.innerHTML = info.name;
          button.className = "layerButton active";
          button.onclick = function() {
            layer.visible = !layer.visible;
            this.classList.toggle("active");
            console.log(`Toggled visibility for ${info.name}: ${layer.visible}`);
          };
          document.getElementById("layerButtons").appendChild(button);

          return layer;
        }).catch(error => {
          console.error(`Error loading layer ${info.name}:`, error);
          console.error(`Layer URL: ${info.url}`);
          if (error.details) console.error(`Error details:`, error.details);
        });
      })).then(() => {
        map.addMany(layers);
        console.log("All layers added to map");
      }).catch(error => {
        console.error("Error in Promise.all:", error);
        if (error.details) console.error("Error details:", error.details);
      });

      setTimeout(() => {
        console.log("Layers in map:", map.layers.items.map(l => l.title));
        console.log("Current map scale:", view.scale);
      }, 5000);
    }
  });
});
