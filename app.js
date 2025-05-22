const map = L.map('map').setView([52, 19], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const layerGroups = {};
    const featuresByClass = {};
    const epsgDefs = {
      'EPSG:2176': '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.999923 +x_0=5500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
      'EPSG:2177': '+proj=tmerc +lat_0=0 +lon_0=18 +k=0.999923 +x_0=6500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
      'EPSG:2178': '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
      'EPSG:2179': '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.999923 +x_0=8500000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
    };

    Object.entries(epsgDefs).forEach(([code, def]) => proj4.defs(code, def));

    document.getElementById('fileInput').addEventListener('change', handleFile);

    function switchTab(id, title) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.getElementById(`tab-${id}`).classList.add('active');
      document.getElementById(`tab-active`).textContent = title;
    }

    function handleFile(evt) {
      const file = evt.target.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const xml = new DOMParser().parseFromString(e.target.result, 'application/xml');
        parseGML(xml);
      };
      reader.readAsText(file);
    }

    function transformCoords(x, y, srsName) {
      const code = `EPSG:${srsName.split('EPSG::')[1]}`;
      return proj4.defs(code) ? proj4(code, 'EPSG:4326', [y, x]) : [x, y];
    }

    function styleFeature(feature) {

        //console.log('klasaObiektu:', feature.properties.klasaObiektu);

        switch (feature.properties.klasaObiektu) {
            case 'EGB_JednostkaEwidencyjna':
                return {
                  color: '#000000',  // czarny obrys
                  weight: 1,
                  opacity: 1,
                  fillColor: '#FFFFFF',
                  fillOpacity: 0.01,
                  dashArray: '6, 2',
                  dashOffset: '0'
                };
            case 'EGB_ObrebEwidencyjny':
                    return {
                      color: '#000000', 
                      weight: 1,
                      opacity: 1,
                      fillColor: '#FFFFFF',
                      fillOpacity: 0.01,
                      dashArray: '6, 4',
                      dashOffset: '0'
                    };
          case 'EGB_DzialkaEwidencyjna':
            return {
              color: '#000000',  
              weight: 1,
              opacity: 1,
              fillColor: '#FFFFFF',
              fillOpacity: 0.01,
            };
          case 'EGB_KonturUzytkuGruntowego':
            return {
              color: '#000000',  
              weight: 1,
              fillColor: '#FFFFFF',  
              fillOpacity: 0.01,
              dashArray: '2, 2',
              dashOffset: '0'
            };
        case 'EGB_KonturKlasyfikacyjny':
                return {
                  color: '#000000',  
                  weight: 1,
                  fillColor: '#FFFFFF',  
                  fillOpacity: 0.01,
                  dashArray: '6, 2',
                dashOffset: '0'
                };
        case 'EGB_ArkuszEwidencyjny':
                return {
                  color: '#000000',  
                  weight: 1,
                  fillColor: '#FFFFFF',  
                  fillOpacity: 0.01,
                  dashArray: '6, 2',
                dashOffset: '0'
                };
          case 'EGB_Budynek':
            return {
              color: '#000000',  
              weight: 2,
              fillColor: '#FFFFFF', 
              fillOpacity: 0.01
            };
          case 'EGB_PunktGraniczny':
            return {
              color: '#000000',
              radius: 4,
              fillColor: '#000000',
              fillOpacity: 1,
              weight: 1
            };
          case 'EGB_OsnowaEwidencyjna':
            return {
              color: '#0000FF',  // niebieski
              radius: 5,
              fillColor: '#87CEFA',
              fillOpacity: 0.8,
              weight: 1
            };
          default:
            return {
              color: '#7704c5',
              weight: 1,
              fillOpacity: 0.3
            };
        }
      }
      
      function getPolygonCentroid(coords) {
        let x = 0, y = 0, area = 0;
      
        for (let i = 0, len = coords.length, j = len - 1; i < len; j = i++) {
          const xi = coords[i][0], yi = coords[i][1];
          const xj = coords[j][0], yj = coords[j][1];
          const a = xi * yj - xj * yi;
          area += a;
          x += (xi + xj) * a;
          y += (yi + yj) * a;
        }
      
        area *= 0.5;
        const factor = 1 / (6 * area);
        return [x * factor, y * factor];
      }

      function getPropertiesRecursive(element) {
        const properties = {};
        Array.from(element.children).forEach(child => {
          if (child.children.length === 0) {
            properties[child.localName] = child.textContent.trim();
          } else {
            // Rekursywnie pobieraj zagnieżdżone atrybuty
            const nested = getPropertiesRecursive(child);
            
            Object.assign(properties, nested);
          }
        });
        return properties;
      }
      
      
      
      

    function parseGML(xml) {
      const members = xml.getElementsByTagNameNS('*', 'featureMember');
      Array.from(members).forEach(member => {
        const feature = member.firstElementChild;
        const cls = feature.localName;
        const geom = feature.querySelector('Point, LineString, Polygon');
        if (!geom) return;

        const srsName = geom.getAttribute('srsName') || '';
        let geometry = null;

        if (geom.localName === 'Point') {
          const coords = geom.querySelector('pos').textContent.split(' ').map(Number);
          const [x, y] = transformCoords(coords[0], coords[1], srsName);
          geometry = { type: 'Point', coordinates: [x, y] };
        } else if (geom.localName === 'LineString') {
          const coords = geom.querySelector('posList').textContent.trim().split(/\s+/).map(Number);
          const coordinates = [];
          for (let i = 0; i < coords.length; i += 2) {
            coordinates.push(transformCoords(coords[i], coords[i + 1], srsName));
          }
          geometry = { type: 'LineString', coordinates };
        } else if (geom.localName === 'Polygon') {
          const posList = geom.querySelector('posList').textContent.trim().split(/\s+/).map(Number);
          const coordinates = [];
          for (let i = 0; i < posList.length; i += 2) {
            coordinates.push(transformCoords(posList[i], posList[i + 1], srsName));
          }
          geometry = { type: 'Polygon', coordinates: [coordinates] };
        }

        //const properties = { klasaObiektu: cls }; // <-- dodaj to!
        const properties = Object.assign({ klasaObiektu: cls }, getPropertiesRecursive(feature)); 
        Array.from(feature.children).forEach(el => {
            const propName = el.localName;
            const href = el.getAttribute('xlink:href');
            const value = href ? { 'xlink:href': href } : (!el.children.length ? el.textContent : null);
          
            if (value !== null) {
                if (properties[propName]) {
                  if (!Array.isArray(properties[propName])) {
                    properties[propName] = [properties[propName]];
                  }
                  // Dodaj tylko, jeśli nie istnieje już taka sama wartość
                  const isDuplicate = properties[propName].some(existing =>
                    typeof existing === 'object' && typeof value === 'object'
                      ? existing['xlink:href'] === value['xlink:href']
                      : existing === value
                  );
                  if (!isDuplicate) {
                    properties[propName].push(value);
                  }
                } else {
                  properties[propName] = value;
                }
              }
              
          });
          
          

        if (!featuresByClass[cls]) featuresByClass[cls] = [];
        featuresByClass[cls].push({ type: 'Feature', geometry, properties });
      });

      Object.entries(featuresByClass).forEach(([cls, features]) => {
        const layer = L.geoJSON({ type: 'FeatureCollection', features }, {
            style: styleFeature,
            pointToLayer: (feature, latlng) => {
                  return L.circleMarker(latlng, {
                    radius: 0.1,
                    color: '#000000',
                    fillColor: '#000000',
                    fillOpacity: 1,
                    weight: 0.1
                  })
                },
            onEachFeature: (feature, layer) => {
              layer.on('click', () => showFeatureInfo(feature.properties));
            }
          }).addTo(map);

          /*if (cls === 'EGB_DzialkaEwidencyjna') {
            features.forEach(feature => {
                console.log(feature.properties, feature.geometry.coordinates[0])
              if (feature.geometry.type === 'Polygon') {
                const centroid = getPolygonCentroid(feature.geometry.coordinates[0]);
                const numer = feature.properties.idDzialki || feature.properties.numer || feature.properties.id || 'brak';
                const label = L.marker(centroid, {
                  icon: L.divIcon({
                    className: 'dzialka-label',
                    html: `<div>${numer.split('.').at(-1)}</div>`,
                    iconSize: [50, 20],
                    iconAnchor: [25, 10],
                    onEachFeature: (feature, label) => {
                        label.on('click', () => showFeatureInfo(feature.properties));}
                  })
                  
                }
                

                ).addTo(map);
              }
            });
          }*/
          
          

        layerGroups[cls] = layer;
        addLayerControl(cls, layer);
      });

      switchTab('table');
      buildDataTable();
    }

    function showFeatureInfo(properties) {
        const info = document.getElementById('tab-info');
        let html = '<strong>Dane obiektu:</strong><br>';
      
        for (const [key, value] of Object.entries(properties)) {
            if (Array.isArray(value)) {
              html += `<strong>${key}</strong>:<ul>`;
              value.forEach(item => {
                if (typeof item === 'object' && item['xlink:href']) {
                  html += `<li><a href="${item['xlink:href']}" target="_blank" style="text-decoration: underline; color: blue;">${item['xlink:href']}</a></li>`;
                } else {
                  html += `<li>${item}</li>`;
                }
              });
              html += '</ul>';
            } else if (typeof value === 'object' && value !== null && value['xlink:href']) {
              html += `<strong>${key}</strong>: <a href="${value['xlink:href']}" target="_blank" style="text-decoration: underline; color: blue;">${value['xlink:href']}</a><br>`;
            } else {
              html += `<strong>${key}</strong>: ${value}<br>`;
            }
          }
          
      
        info.innerHTML = html;
      }

      function formatPropertyValue(value) {
        if (value && typeof value === 'object' && value['xlink:href']) {
          return `<a href="${value['xlink:href']}" target="_blank" style="text-decoration:underline">${value['xlink:href']}</a>`;
        }
        return value ?? '';
      }
      
      function openTablePopup(cls, features) {
        const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        if (!popup) {
          alert("Popup został zablokowany przez przeglądarkę.");
          return;
        }
      
        const keys = Object.keys(features[0].properties);
        let html = `
          <html>
            <head>
              <title>${cls}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 10px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                th { background-color: #f4f4f4; }
              </style>
            </head>
            <body>
              <h2>${cls}</h2>
              <table>
                <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
                <tbody>
        `;
      
        features.forEach(f => {
            html += '<tr>' + keys.map(k => {
                let value = f.properties[k];
                if (Array.isArray(value)) {
                  value = [...new Set(value.map(v => formatPropertyValue(v)))].join(', ');
                } else {
                  value = formatPropertyValue(value);
                }
                return `<td>${value}</td>`;
              }).join('') + '</tr>';
              
        });
      
        html += `
                </tbody>
              </table>
            </body>
          </html>
        `;
      
        popup.document.write(html);
        popup.document.close();
      }
      

      function buildDataTable() {
        const tableDiv = document.getElementById('tab-table');
        tableDiv.innerHTML = '<h3>Warstwy z atrybutami:</h3>';
      
        Object.entries(featuresByClass).forEach(([cls, features]) => {
          if (features.length === 0) return;
      
          const button = document.createElement('button');
          button.textContent = cls;
          button.style.marginBottom = '5px';
          button.padding = '5px';
          button.addEventListener('click', () => openTablePopup(cls, features));
          tableDiv.appendChild(button);
          tableDiv.appendChild(document.createElement('br'));
        });
      }
      



    function zoomToData() {
        const bounds = L.latLngBounds();
        let hasData = false;
      
        Object.entries(layerGroups).forEach(([name, group]) => {
          if (group && group.getLayers) {
            const layers = group.getLayers();
            layers.forEach(l => {
              if (l.getBounds && l.getBounds().isValid()) {
                bounds.extend(l.getBounds());
                hasData = true;
              } else if (l.getLatLng) {
                bounds.extend(l.getLatLng());
                hasData = true;
              }
            });
          }
        });
      
        if (hasData && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        } else {
          console.warn("Brak danych – bounds:", bounds);
          alert("Brak danych do wyświetlenia.");
        }
      }
      
      
      

    function addLayerControl(name, layer) {
      const container = document.getElementById('tab-layers');
      const id = `layer-${name}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.checked = true;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          map.addLayer(layer);
        } else {
          map.removeLayer(layer);
        }
      });
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = name;
      container.appendChild(checkbox);
      container.appendChild(label);
      container.appendChild(document.createElement('br'));
    }