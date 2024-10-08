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
              width: 0.5
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
                width: 0.5
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
    popupTitle.textContent = "Impact from a Hikurangi Subduction Zone Earthquake and Tsunami";
    popupContent.innerHTML = `
    <p>Critical transport infrastructure damaged:</p>
<ul style="list-style-type: none; padding-left: 0;">
  <li style="display: flex; align-items: center;">
    Eastland Port
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png" alt="Vessel" style="width: 20px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Napier Port
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png" alt="Vessel" style="width: 20px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Napier fuel terminal
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Reserves.png" alt="Reserves" style="width: 15px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Napier container transfer site
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/RailIcon.png" alt="Rail" style="width: 20px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    CentrePort, Wellington
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png" alt="Vessel" style="width: 20px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Wellington's fuel terminals
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Reserves.png" alt="Reserves" style="width: 15px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Port Marlborough
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/Vessel.png" alt="Vessel" style="width: 20px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Marlborough container transfer site
    <img src="https://raw.githubusercontent.com/nateurl/natesproject/master/icons/RailIcon.png" alt="Rail" style="width: 20px; height: auto; margin-left: 5px;">
  </li>
  <li style="display: flex; align-items: center;">
    Sections of state highways &#x1F6E3; and rail lines &#x1F689;
  </li>
</ul>
<p>Daily impact: 870 twenty-foot equivalent containers &#127959; &
 8,684 tonnes of export logs &#x1FAB5; 
</p>
    `;
  } else if (layerName === "AF8 Impact points") {
    popupTitle.textContent = "Impact from a Alpine Fault Maginutude 8 Earthquake";
    popupContent.innerHTML = `
      <p> Critical infrastrucure damaged: </p>
  <ul style="list-style-type: none; padding-left: 0;">
  <li style="display: flex; align-items: center;">
 State highways (SH) SH6, SH73 and SH7 to the West Coast &#x1F6E3;</li>
   <li style="display: flex; align-items: center;">
   SH65 near Springs Junction &#x1F6E3;
   </li>
     <li style="display: flex; align-items: center;">
    SH94 to Milford Sound &#x1F6E3;
    </li> 
       <li style="display: flex; align-items: center;"> 
  SH80 to Mount Cook &#x1F6E3;
  </li>
   <li style="display: flex; align-items: center;">
Midland Rail Line to Greymouth &#x1F689;
 </li>
    `;
  }
  infoPopup.style.display = "block";
}
// added pngs //
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
