#!/bin/sh
set -eu

: "${MINIO_ENDPOINT:=http://minio:9000}"
: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"
: "${S3_BUCKET:?S3_BUCKET is required}"
: "${S3_ACCESS_KEY:?S3_ACCESS_KEY is required}"
: "${S3_SECRET_KEY:?S3_SECRET_KEY is required}"

POLICY_NAME="${S3_BUCKET}-rw"

echo "[minio-init] waiting for MinIO at ${MINIO_ENDPOINT}..."
until mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null 2>&1; do
    sleep 1
done
echo "[minio-init] connected"

echo "[minio-init] ensuring bucket '${S3_BUCKET}'"
mc mb --ignore-existing "local/${S3_BUCKET}"
mc anonymous set download "local/${S3_BUCKET}"

echo "[minio-init] writing policy '${POLICY_NAME}'"
cat > /tmp/policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": ["arn:aws:s3:::${S3_BUCKET}/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::${S3_BUCKET}"]
    }
  ]
}
EOF
mc admin policy create local "${POLICY_NAME}" /tmp/policy.json >/dev/null 2>&1 || \
    mc admin policy update local "${POLICY_NAME}" /tmp/policy.json

echo "[minio-init] ensuring user '${S3_ACCESS_KEY}'"
if mc admin user info local "${S3_ACCESS_KEY}" >/dev/null 2>&1; then
    echo "[minio-init] user exists, skipping creation"
else
    mc admin user add local "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}"
fi

echo "[minio-init] attaching policy '${POLICY_NAME}' to user"
mc admin policy attach local "${POLICY_NAME}" --user "${S3_ACCESS_KEY}" >/dev/null 2>&1 || \
    echo "[minio-init] policy already attached"

echo "[minio-init] done"
