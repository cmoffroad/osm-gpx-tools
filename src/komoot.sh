URL=$1

USERID=$(echo ${URL} | awk -F'/' '{print $5}')
DISPLAYNAME=$(curl --no-progress-meter "https://www.komoot.com/api/v007/users/$USERID/" | jq -r ".display_name" | sed 's/ /+/' | xargs -n 1 sh -c 'echo $0' )

FOLDER="$DISPLAYNAME-komoot-$USERID"
TRACKS="https://www.komoot.com/api/v007/users/$USERID/tours/?sport_types=&type=&sort_field=date&sort_direction=desc&name=&status=public&hl=en&page=0&limit=100"

echo "--- processing $URL ($FOLDER)"

mkdir -p "$FOLDER"
cd "$FOLDER"
curl $TRACKS --no-progress-meter \
  | jq -r '._embedded.tours | .[] | select(.type == "tour_recorded") | .id' \
  | xargs -n 1 sh -c 'if [ ! -f "$0.gpx" ]; then curl --no-progress-meter -o "$0.gpx" "https://www.komoot.com/api/v007/tours/$0.gpx?hl=en"; echo "downloaded $0.gpx"; fi'
cd ..