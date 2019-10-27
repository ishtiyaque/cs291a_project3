docker build -t us.gcr.io/cs291-f19/project3_${CS291_ACCOUNT} .
docker run -it --rm \
  -p 4000:3000 \
  -v ~/.config/gcloud/application_default_credentials.json:/root/.config/gcloud/application_default_credentials.json \
  us.gcr.io/cs291-f19/project3_${CS291_ACCOUNT}

