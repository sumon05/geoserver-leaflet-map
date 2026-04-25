#!/bin/bash
echo "Warte auf GeoServer..."
sleep 45

GS="http://localhost:8081/geoserver/rest"
AUTH="admin:geoserver"

echo "Erstelle Workspace..."
curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"workspace":{"name":"karlsruhe"}}' \
  "$GS/workspaces"

echo "Erstelle Stores..."
curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"dataStore":{"name":"strassen","type":"Shapefile","connectionParameters":{"entry":[{"@key":"url","$":"file:/opt/shapefiles/roads_utf8.shp"},{"@key":"charset","$":"UTF-8"}]}}}' \
  "$GS/workspaces/karlsruhe/datastores"

curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"dataStore":{"name":"gewaesser","type":"Shapefile","connectionParameters":{"entry":[{"@key":"url","$":"file:/opt/shapefiles/gis_osm_water_a_free_1.shp"},{"@key":"charset","$":"UTF-8"}]}}}' \
  "$GS/workspaces/karlsruhe/datastores"

curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"dataStore":{"name":"gebaeude","type":"Shapefile","connectionParameters":{"entry":[{"@key":"url","$":"file:/opt/shapefiles/buildings_utf8.shp"},{"@key":"charset","$":"UTF-8"}]}}}' \
  "$GS/workspaces/karlsruhe/datastores"

curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"dataStore":{"name":"orte","type":"Shapefile","connectionParameters":{"entry":[{"@key":"url","$":"file:/opt/shapefiles/gis_osm_places_free_1.shp"},{"@key":"charset","$":"UTF-8"}]}}}' \
  "$GS/workspaces/karlsruhe/datastores"

echo "Erstelle Layer..."
curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"featureType":{"name":"roads_utf8","nativeName":"roads_utf8","srs":"EPSG:4326","nativeSRS":"EPSG:4326","projectionPolicy":"FORCE_DECLARED"}}' \
  "$GS/workspaces/karlsruhe/datastores/strassen/featuretypes"

curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"featureType":{"name":"gis_osm_water_a_free_1","nativeName":"gis_osm_water_a_free_1","srs":"EPSG:4326","nativeSRS":"EPSG:4326","projectionPolicy":"FORCE_DECLARED"}}' \
  "$GS/workspaces/karlsruhe/datastores/gewaesser/featuretypes"

curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"featureType":{"name":"buildings_utf8","nativeName":"buildings_utf8","srs":"EPSG:4326","nativeSRS":"EPSG:4326","projectionPolicy":"FORCE_DECLARED"}}' \
  "$GS/workspaces/karlsruhe/datastores/gebaeude/featuretypes"

curl -s -u $AUTH -X POST \
  -H "Content-Type: application/json" \
  -d '{"featureType":{"name":"gis_osm_places_free_1","nativeName":"gis_osm_places_free_1","srs":"EPSG:4326","nativeSRS":"EPSG:4326","projectionPolicy":"FORCE_DECLARED"}}' \
  "$GS/workspaces/karlsruhe/datastores/orte/featuretypes"

echo "Setup abgeschlossen!"
echo "Karte: http://localhost:3000"
echo "GeoServer: http://localhost:8081/geoserver"
