parent_path=$(cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P)

cd "$parent_path"

python3 car_tracker.py --conf config/config.json --lines config/lines_offset_config.json
