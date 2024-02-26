URL=$1

USERID=$(echo ${URL} | awk -F'/' '{print $5}')
USERNAME=$(echo ${URL} | awk -F'/' '{print $6}')

FOLDER="$USERNAME-gaiagps-$USERID"
TRACKS="https://www.gaiagps.com/api/objects/items/public/$USERID/?sort_key=time_created&sort_field=create_date&sort_direction=desc&show_waypoints=false&show_areas=false&show_archived=true&include_track_photos=false&show_private=false"

echo "--- processing $URL"

mkdir -p "$FOLDER"
cd "$FOLDER"
curl $TRACKS --no-progress-meter \
  | jq -r '.[] | .id' \
  | xargs -n 1 sh -c 'if [ ! -f "$0.gpx" ]; then curl --no-progress-meter -o "$0.gpx" "https://www.gaiagps.com/api/objects/track/$0.gpx/"; echo "downloaded $0.gpx"; fi'

cd ..
