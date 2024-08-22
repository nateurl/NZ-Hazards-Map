let map, view;
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM fully loaded and parsed");
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/geometry/Extent"
  ], function(Map, MapView, GeoJSONLayer, SimpleRenderer, PictureMarkerSymbol, SimpleMarkerSymbol, Extent) {
    console.log("Modules loaded");

    map = new Map({
      basemap: "dark-gray-vector"
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

    const layersByName = {};

    function initializeLayers() {
      function createRenderer(name, index) {
        console.log(`Creating renderer for ${name}`);
        if (name === "Rail") {
          return {
            type: "simple",
            symbol: {
              type: "simple-line",
              color: colors[index],
              width: 1
            }
          };
        } else {
          let iconUrl;
          let iconWidth = "20px";
          let iconHeight = "20px";
          let symbol;

          switch(name) {
            case "Seaports":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png";
              symbol = {
                type: "picture-marker",
                url: iconUrl,
                width: iconWidth,
                height: iconHeight
              };
              break;
            case "Fuel terminals":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Reserves.png";
              symbol = {
                type: "picture-marker",
                url: iconUrl,
                width: "30px",
                height: "30px"
              };
              break;
            case "Woolworths DCs":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/DCICON.png";
              symbol = {
                type: "picture-marker",
                url: iconUrl,
                width: iconWidth,
                height: iconHeight
              };
              break;
            case "CT sites":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/RailIcon.png";
              symbol = {
                type: "picture-marker",
                url: iconUrl,
                width: iconWidth,
                height: iconHeight
              };
              break;
            case "HSZ Impact Points":
              // Use a SimpleMarkerSymbol for HSZ Impact Points
              symbol = {
                type: "simple-marker",
                color: "#FF5733", // Example color
                size: "15px", // Size of the marker
                outline: {
                  color: "white", // Outline color
                  width: 1
                }
              };
              break;
            default:
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/default-icon.png";
              symbol = {
                type: "picture-marker",
                url: iconUrl,
                width: iconWidth,
                height: iconHeight
              };
          }

          return {
            type: "simple",
            symbol: symbol,
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

      Promise.all(layerInfo.map((info, index) => {
        console.log(`Creating layer for ${info.name}`);
        const layer = new GeoJSONLayer({
          url: info.url,
          title: info.name,
          renderer: createRenderer(info.name, index),
          featureReduction: info.name !== "Rail" && info.name !== "HSZ Impact Points" ? {
            type: "cluster",
            clusterRadius: "100px",
            popupTemplate: {
              title: "Cluster of {cluster_count} points",
              content: "Zoom in to see individual points."
            }
          } : null,
          popupTemplate: info.name === "HSZ Impact Points" ? {
            title: "HSZ Impact Point",
            content: "Additional information: {your_field_name}" // Replace with actual field name
          } : null
        });
        return layer.load().then(() => {
          console.log(`Layer ${info.name} loaded successfully`);
          layersByName[info.name] = layer;

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
        addLayersInOrder();
      }).catch(error => {
        console.error("Error in Promise.all:", error);
        if (error.details) console.error("Error details:", error.details);
      });

      setTimeout(() => {
        console.log("Layers in map:", map.layers.items.map(l => l.title));
        console.log("Current map scale:", view.scale);
      }, 5000);
    }

    function addLayersInOrder() {
      const orderOfLayers = ["Rail", "Fuel terminals", "Seaports", "Woolworths DCs", "CT sites", "HSZ Impact Points"];
      
      orderOfLayers.forEach(layerName => {
        if (layersByName[layerName]) {
          map.add(layersByName[layerName]);
          console.log(`Added ${layerName} to map`);
        } else {
          console.warn(`Layer ${layerName} not found`);
        }
      });

      console.log("All layers added to map in specified order");
    }
  });
});
