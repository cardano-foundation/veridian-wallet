#!/bin/bash
set -x
for wit in $(seq 0 $(( WITNESS_COUNT - 1 )));
do
  WITNESS_COUNTER=$wit
  if [ ! -e ${KERI_VAR_DIR}/db/wit${WITNESS_COUNTER}/data.mdb ]; then
    mkdir -p ${KERI_VAR_DIR}/data
    mkdir -p ${KERI_SCRIPT_DIR}/keri/cf
    set -e
    
    # Set KERIA_CURLS based on deployment mode
    if [ "${DEPLOYMENT_MODE}" = "local" ]; then
      export KERIA_CURLS="${KERIA_CURLS_PROTO}://witness-${WITNESS_COUNTER}:$(( BASE_HTTP_PORT + WITNESS_COUNTER ))"
      echo "Local deployment mode - Setting KERIA_CURLS to: ${KERIA_CURLS}"
    else
      export KERIA_CURLS="${KERIA_CURLS_PROTO}://witness-${WITNESS_COUNTER}.${KERIA_CURLS_EXTERNAL_HOST_TLD}"
      echo "Cloud deployment mode - Setting KERIA_CURLS to: ${KERIA_CURLS}"
    fi
    
    echo "Rendering KERIA_CURLS..."
    export KERIA_RENDERED_CURLS=$(for keria_curl in ${KERIA_CURLS}; do echo $keria_curl; done | jq -cRn '[inputs]')
    echo "KERIA_RENDERED_CURLS: ${KERIA_RENDERED_CURLS}"
    
    export WITNESS_NAME="wit${WITNESS_COUNTER}"
    export DT=$(date -u +"%Y-%m-%dT%H:%M:%S.000000+00:00")
    envsubst < /configmap/witness.json.tpl > ${KERI_SCRIPT_DIR}/keri/cf/${WITNESS_NAME}.json
    
    echo "Generated config file contents:"
    cat ${KERI_SCRIPT_DIR}/keri/cf/${WITNESS_NAME}.json
    kli init --name ${WITNESS_NAME} --nopasscode --config-dir ${KERI_SCRIPT_DIR} --config-file ${WITNESS_NAME}.json
    kli incept --name ${WITNESS_NAME} --alias ${WITNESS_NAME} --config ${KERI_SCRIPT_DIR} --file /configmap/wil-witness-sample.json
    
    echo "Witness ${WITNESS_NAME} initialization completed."
  else
    echo "Config file already exists for witness ${WITNESS_COUNTER}, skipping initialization."
  fi
done
