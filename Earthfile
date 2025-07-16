VERSION 0.8

IMPORT --allow-privileged github.com/cardano-foundation/cf-gha-workflows/./earthfiles/functions:main AS functions

ARG --global DOCKER_IMAGES_TARGETS="idw-keria idw-witness cred-issuance cred-issuance-ui cip45-sample-dapp"

ARG --global DOCKER_IMAGES_PREFIX="cf"
ARG --global DOCKER_IMAGES_EXTRA_TAGS=""
ARG --global DOCKER_IMAGES_LABELS=""
ARG --global DOCKER_REGISTRIES=""
ARG --global RELEASE_TAG=""
ARG --global TARGET_PLATFORM=""
ARG --global PUSH=false

ARG --global KERIA_DOCKER_IMAGE_REPO=weboftrust/keria
ARG --global KERIA_DOCKER_IMAGE_TAG=0.2.0-rc1
ARG --global KERIA_GIT_REPO_URL="https://github.com/cardano-foundation/keria.git"
ARG --global KERIA_GIT_REF=424ef9f5900d589a57cf9e32fc23be72256363e4

ARG --global KERI_DOCKER_IMAGE_REPO=weboftrust/keri
ARG --global KERI_DOCKER_IMAGE_TAG=1.1.26

all:
  LOCALLY
  FOR image_target IN $DOCKER_IMAGES_TARGETS
    BUILD +$image_target --PUSH=$PUSH
  END

docker-publish:
  BUILD +all --PUSH=$PUSH

docker-manifests-merge:
  ARG PLATFORMS
  LOCALLY
  FOR image_target IN $DOCKER_IMAGES_TARGETS
    IF [ "${image_target}" = "cip45-sample-dapp" ]
      LET PLATFORMS="linux/amd64"
      LET DOCKER_REGISTRIES="$(echo ${DOCKER_REGISTRIES} | sed 's|hub.docker.com||g')"
    END
    DO functions+DOCKER_MANIFESTS_MERGE \
       --PLATFORMS="${PLATFORMS}" \
       --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
       --DOCKER_IMAGE_NAME="${DOCKER_IMAGES_PREFIX}-${image_target}" \
       --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS}" \
       --PUSH=$PUSH
  END

keria-src:
  FROM alpine/git
  RUN git clone $KERIA_GIT_REPO_URL /keria && \
      cd /keria && \
      git checkout $KERIA_GIT_REF
  SAVE ARTIFACT /keria

idw-keria:
  ARG EARTHLY_TARGET_NAME
  ARG DOCKER_IMAGES_EXTRA_TAGS
  ARG FORCE_BUILD=false
  LET DOCKER_IMAGE_NAME=${DOCKER_IMAGES_PREFIX}-${EARTHLY_TARGET_NAME}
  LET KERIA_UPSTREAM_TAG=""

  LOCALLY

  IF [ "${KERIA_GIT_REF}" != "" ]
      SET KERIA_UPSTREAM_TAG=${KERIA_GIT_REF}
  ELSE
      SET KERIA_UPSTREAM_TAG=${KERIA_DOCKER_IMAGE_TAG}
  END

  IF [ "${FORCE_BUILD}" = "false" ]
    ARG REGISTRY_IMAGE_EXISTS=$( ( docker manifest inspect ${HUB_DOCKER_COM_USER}/${DOCKER_IMAGE_NAME}:keria-${KERIA_UPSTREAM_TAG} 2>/dev/null | grep -q layers ) || echo false)
  ELSE
    ARG REGISTRY_IMAGE_EXISTS=false
  END

  IF [ "${REGISTRY_IMAGE_EXISTS}" = "false" ]
    WAIT

      IF [ "${KERIA_GIT_REF}" != "" ]
          FROM DOCKERFILE -f +keria-src/keria/images/keria.dockerfile +keria-src/keria/*
      ELSE
          FROM ${KERIA_DOCKER_IMAGE_REPO}:${KERIA_DOCKER_IMAGE_TAG}
      END

      RUN apk add --no-cache jq envsubst
      ENTRYPOINT keria start --config-file backer-oobis --config-dir ./scripts

    END

    WAIT
      DO functions+DOCKER_LABELS --LABELS="${DOCKER_IMAGES_LABELS}"
      SAVE IMAGE ${DOCKER_IMAGE_NAME}:${KERIA_UPSTREAM_TAG}
      SAVE IMAGE ${DOCKER_IMAGE_NAME}:latest
    END

    DO functions+DOCKER_TAG_N_PUSH \
       --PUSH=$PUSH \
       --TARGET_PLATFORM=${TARGET_PLATFORM} \
       --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
       --DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} \
       --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS} keria-${KERIA_UPSTREAM_TAG}"
  END

idw-witness:
  ARG EARTHLY_TARGET_NAME
  ARG DOCKER_IMAGES_EXTRA_TAGS
  ARG FORCE_BUILD=false
  LET DOCKER_IMAGE_NAME=${DOCKER_IMAGES_PREFIX}-${EARTHLY_TARGET_NAME}

  LOCALLY
  RUN echo $TARGETPLATFORM
  IF [ "${FORCE_BUILD}" = "false" ]
    ARG REGISTRY_IMAGE_EXISTS=$( (docker manifest inspect ${HUB_DOCKER_COM_USER}/${DOCKER_IMAGE_NAME}:keri-${KERI_DOCKER_IMAGE_TAG} 2> /dev/null | grep -q layers) || echo false)
  ELSE
    ARG REGISTRY_IMAGE_EXISTS=false
  END

  IF [ "${REGISTRY_IMAGE_EXISTS}" = "false" ]
    WAIT
      FROM ${KERI_DOCKER_IMAGE_REPO}:${KERI_DOCKER_IMAGE_TAG}
      ENV PYTHONUNBUFFERED=1
      ENV PYTHONIOENCODING=UTF-8
      RUN apk add --no-cache jq envsubst
      ENTRYPOINT kli witness demo
    END
    WAIT
      DO functions+DOCKER_LABELS --LABELS="${DOCKER_IMAGES_LABELS}"
      SAVE IMAGE ${DOCKER_IMAGE_NAME}:keri-${KERI_DOCKER_IMAGE_TAG}
      SAVE IMAGE ${DOCKER_IMAGE_NAME}:latest
    END
    DO functions+DOCKER_TAG_N_PUSH \
       --PUSH=$PUSH \
       --TARGET_PLATFORM=${TARGET_PLATFORM} \
       --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
       --DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} \
       --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS} keri-${KERI_DOCKER_IMAGE_TAG}"
  END

cred-issuance:
  ARG EARTHLY_TARGET_NAME
  LET DOCKER_IMAGE_NAME=${DOCKER_IMAGES_PREFIX}-${EARTHLY_TARGET_NAME}

  WAIT
    FROM DOCKERFILE ./services/credential-server
  END
  WAIT
    DO functions+DOCKER_LABELS --LABELS="${DOCKER_IMAGES_LABELS}"
    SAVE IMAGE ${DOCKER_IMAGE_NAME}
  END
  DO functions+DOCKER_TAG_N_PUSH \
     --PUSH=$PUSH \
     --TARGET_PLATFORM=${TARGET_PLATFORM} \
     --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
     --DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} \
     --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS}"

cred-issuance-ui:
  ARG EARTHLY_TARGET_NAME
  LET DOCKER_IMAGE_NAME=${DOCKER_IMAGES_PREFIX}-${EARTHLY_TARGET_NAME}

  WAIT
    FROM DOCKERFILE ./services/credential-server-ui
  END
  WAIT
    DO functions+DOCKER_LABELS --LABELS="${DOCKER_IMAGES_LABELS}"
    SAVE IMAGE ${DOCKER_IMAGE_NAME}
  END
  DO functions+DOCKER_TAG_N_PUSH \
     --PUSH=$PUSH \
     --TARGET_PLATFORM=${TARGET_PLATFORM} \
     --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
     --DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} \
     --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS}"

cip45-sample-dapp:
  ARG EARTHLY_TARGET_NAME
  LET DOCKER_IMAGE_NAME=${DOCKER_IMAGES_PREFIX}-${EARTHLY_TARGET_NAME}
  LOCALLY

  # skip this for arm as it takes forever
  IF [ "${TARGET_PLATFORM}" != "linux/arm64" ]
    WAIT
      FROM DOCKERFILE ./services/cip45-sample-dapp
    END
    WAIT
      DO functions+DOCKER_LABELS --LABELS="${DOCKER_IMAGES_LABELS}"
      SAVE IMAGE ${DOCKER_IMAGE_NAME}
    END
    DO functions+DOCKER_TAG_N_PUSH \
       --PUSH=$PUSH \
       --TARGET_PLATFORM=${TARGET_PLATFORM} \
       --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
       --DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} \
       --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS}"
  END

keria-passcode-gen:
 ARG EARTHLY_TARGET_NAME
 LET DOCKER_IMAGE_NAME=${DOCKER_IMAGES_PREFIX}-${EARTHLY_TARGET_NAME}

  WAIT
    FROM DOCKERFILE -f ./services/Dockerfile.keria-passcode-gen ./services
  END
  WAIT
    DO functions+DOCKER_LABELS --LABELS="${DOCKER_IMAGES_LABELS}"
    SAVE IMAGE ${DOCKER_IMAGE_NAME}
  END
  DO functions+DOCKER_TAG_N_PUSH \
     --PUSH=$PUSH \
     --TARGET_PLATFORM=${TARGET_PLATFORM} \
     --DOCKER_REGISTRIES="${DOCKER_REGISTRIES}" \
     --DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME} \
     --DOCKER_IMAGES_EXTRA_TAGS="${DOCKER_IMAGES_EXTRA_TAGS}"
