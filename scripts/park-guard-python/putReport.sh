#!/bin/bash

json_string=${1}

curl -v \
   'https://ltwnegghx2.execute-api.eu-west-1.amazonaws.com/prod/report'\
  -H 'content-type: application/json' \
  -d ${json_string}
