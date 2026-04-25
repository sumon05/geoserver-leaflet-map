#!/bin/bash
echo "Warte auf GeoServer..."
sleep 30

GS="http://localhost:8081/geoserver/rest"
AUTH="admin:geoserver"

# Workspace
curl -s -u $AUTH -X POST -H "Content-Type: application/json" \
  -d '{"workspace":{"name":"karlsruhe"}}' \
  "$GS/workspaces"

# Stores
for store in "strassen:roads_utf8.shp" "gewaesser:gis_osm_water_a_free_1.shp" "gebaeude:buildings_utf8.shp" "orte:gis_osm_places_free_1.shp"; do
  NAME=$(echo $store | cut -d: -f1)
  FILE=$(echo $store | cut -d: -f2)
  curl -s -u $AUTH -X POST -H "Content-Type: application/json" \
    -d "{\"dataStore\":{\"name\":\"$NAME\",\"type\":\"Shapefile\",\"connectionParameters\":{\"entry\":[{\"@key\":\"url\",\"\$\":\"file:/opt/shapefiles/$FILE\"},{\"@key\":\"charset\",\"\$\":\"UTF-8\"}]}}}" \
    "$GS/workspaces/karlsruhe/datastores"
done

echo "Setup fertig!"
