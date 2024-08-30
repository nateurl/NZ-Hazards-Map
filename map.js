let map, view;
let infoPopup, popupTitle, popupContent, closePopupButton;

document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM fully loaded and parsed");
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Extent"
  ], function(Map, MapView, GeoJSONLayer, SimpleRenderer, PictureMarkerSymbol, SimpleFillSymbol, Extent) {
    console.log("Modules loaded");

    infoPopup = document.getElementById("infoPopup");
    popupTitle = document.getElementById("popupTitle");
    popupContent = document.getElementById("popupContent");
    closePopupButton = document.getElementById("closePopup");

    closePopupButton.addEventListener("click", closePopup);
    
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
        if (name === "Rail" || name === "State highways") {
          return {
            type: "simple",
            symbol: {
              type: "simple-line",
              color: colors[index],
              width: 1
            }
          };
        } else if (name === "HSZ Impact points" || name === "AF8 Impact points") {
          const color = name === "HSZ Impact points" ? [255, 87, 51] : [51, 135, 255];
          const fillOpacity = 0.3;
          const outlineOpacity = name === "HSZ Impact points" ? 1 : 0.3;
          
          return {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [...color, fillOpacity],
              outline: {
                color: [...color, outlineOpacity],
                width: 1
              }
            }
          };
        } else {
          let iconUrl;
          switch(name) {
            case "Seaports":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png";
              break;
            case "Fuel terminals":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Reserves.png";
              break;
            case "Woolworths DCs":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/DCICON.png";
              break;
            case "CT sites":
              iconUrl = "https://raw.githubusercontent.com/nateurl/natesproject/master/icons/RailIcon.png";
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

      Promise.all(layerInfo.map((info, index) => {
        console.log(`Creating layer for ${info.name}`);
        const layer = new GeoJSONLayer({
          url: info.url,
          title: info.name,
          renderer: createRenderer(info.name, index)
        });

        if (info.name === "HSZ Impact points" || info.name === "AF8 Impact points") {
          layer.when(() => {
            if (layer.geometryType === "point") {
              const color = info.name === "HSZ Impact points" ? [255, 87, 51] : [51, 135, 255];
              const fillOpacity = 0.3;
              const outlineOpacity = info.name === "HSZ Impact points" ? 1 : 0.3;
              
              layer.renderer = {
                type: "simple",
                symbol: {
                  type: "simple-marker",
                  color: [...color, fillOpacity],
                  outline: {
                    color: [...color, outlineOpacity],
                    width: 1
                  },
                  size: 8
                }
              };
            }
          });
        }
        
        return layer.load().then(() => {
          console.log(`Layer ${info.name} loaded successfully`);
          layersByName[info.name] = layer;

          if (info.name === "HSZ Impact points" || info.name === "AF8 Impact points") {
            const button = document.createElement("button");
            button.innerHTML = info.name === "HSZ Impact points"
              ? `Trigger HSZ event`
              : 'Trigger AF8 event';
            button.className = "layerButton";
            button.onclick = function() {
              layer.visible = !layer.visible;
              this.classList.toggle("active");
              console.log(`Toggled visibility for ${info.name}: ${layer.visible}`);
              
              if (layer.visible) {
                showPopup(info.name);
              } else {
                closePopup();
              }
            };
            document.getElementById("layerButtons").appendChild(button);
          }

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
//added pngs
function showPopup(layerName) {
  if (layerName === "HSZ Impact points") {
    popupTitle.textContent = "HSZ Impact";
    popupContent.innerHTML = `
      <p>Critical transport infrastructure damaged:</p>
      <ul>
        <li>Eastland Port</li>
        <li>Napier Port</li>
        <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png" alt="HSZ Impact" style="max-width: 100%; height: auto;">
        <li>Napier fuel terminal</li>
        
        <li>Napier container transfer site</li>
        <li>CentrePort, Wellington</li>
        <li>Wellington's fuel terminals</li>
        <li>Port Marlborough</li>
        <li>Marlborough container transfer site</li>
        <li>Sections of state highways and rail lines</li>
      </ul>
      <p>20 foot containers impacted each day: TBC</p>
      <img src="path/to/hsz_impact_image.png" alt="HSZ Impact" style="max-width: 100%; height: auto;">
    `;
  } else if (layerName === "AF8 Impact points") {
    popupTitle.textContent = "Alpine Fault 8 Impact";
    popupContent.innerHTML = `
      <p>Information about Alpine Fault 8 impact...</p>
      <img src="path/to/af8_impact_image.png" alt="AF8 Impact" style="max-width: 100%; height: auto;">
    `;
  }
  infoPopup.style.display = "block";
}


    // added pngs

    function closePopup() {
      infoPopup.style.display = "none";
    }

    function addLayersInOrder() {
      const orderOfLayers = ["Rail", "State highways", "Fuel terminals", "Seaports", "Woolworths DCs", "CT sites", "HSZ Impact points", "AF8 Impact points"];
      
      orderOfLayers.forEach(layerName => {
        if (layersByName[layerName]) {
          map.add(layersByName[layerName]);
          if (layerName === "HSZ Impact points" || layerName === "AF8 Impact points") {
            layersByName[layerName].visible = false;
          } else {
            layersByName[layerName].visible = true;
          }
          console.log(`Added ${layerName} to map. Visible: ${layersByName[layerName].visible}`);
        } else {
          console.warn(`Layer ${layerName} not found`);
        }
      });

      console.log("All layers added to map in specified order");
    }
  });
});
