#!/bin/sh

export REGION=us-east-1
export ACCOUNT_ID=[your aws account id]
export IMAGE_NAME=awsevents
#aws --region ${REGION} ecr create-repository --repository-name awsevents

aws --region ${REGION} ecr get-login-password | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/awsevents
docker build ./backend/ -t ${IMAGE_NAME} -t ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/awsevents:${IMAGE_NAME}
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/awsevents:${IMAGE_NAME}
#--progress=plain