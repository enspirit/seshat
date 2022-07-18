#!/usr/bin/env bash

echo "Initializing minio..."
mc config host add minio http://127.0.0.1:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# create the private bucket (default options are ok/secure)
echo "Creating private bucket $PRIVATE_BUCKET..."
mc mb --quiet minio/$PRIVATE_BUCKET

# create the public bucket
echo "Creating public bucket $PRIVATE_BUCKET..."
mc mb --quiet minio/$PUBLIC_BUCKET
# ... with public access for all files
echo "Setting public bucket acl..."
mc policy set public minio/$PUBLIC_BUCKET

echo "Done"
