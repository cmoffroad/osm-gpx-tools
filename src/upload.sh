node ~/Workspaces/OSM/osm-gpx-tools/src/direction.js .
mapillary_tools process . --skip_process_errors && mapillary_tools upload . --user_name "julcnx"
node ~/Workspaces/OSM/osm-gpx-tools/src/prune.js .