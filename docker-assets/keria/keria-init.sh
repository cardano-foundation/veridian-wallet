#!/bin/sh
set -xe
export KERIA_RENDERED_CURLS=$(for keria_curl in ${KERIA_CURLS}; do echo $keria_curl; done | jq -cRn '[inputs]')
export KERIA_RENDERED_IURLS=$(for keria_iurl in ${KERIA_IURLS}; do echo $keria_iurl; done | jq -cRn '[inputs]')
envsubst < /configmap/backer-oobis.json.tpl > /config/backer-oobis.json
