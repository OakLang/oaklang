#!/usr/bin/env bash

# Run with:
# cd $HOME && curl -fsSL -o clone_repo.sh https://s3-us-west-2.amazonaws.com/wakatime-infra/clone_repo_wonderful.dev.sh && chmod a+x clone_repo.sh && ./clone_repo.sh && rm ~/clone_repo.sh

set -e

REPO="git@github.com:wakatime/wonderful.dev.git"
SSHKEY="https://s3-us-west-2.amazonaws.com/wakatime-infra/sshid_wonderful.dev.tar.gz.gpg"
OPTROOT="/opt/wonderful.dev"
DIRNAME="current"

if [ -d "$OPTROOT/$DIRNAME" ]; then
  echo "$OPTROOT/$DIRNAME already exists, exiting."
  exit 0
fi

ssh-keyscan github.com >> ~/.ssh/known_hosts

wget --ca-directory=/etc/ssl/certs/ $SSHKEY
gpg -d sshid_wonderful.dev.tar.gz.gpg > sshid.tar.gz
tar -xzf sshid.tar.gz
mkdir -p ~/.ssh
mv sshid/id_rsa ~/.ssh/id_rsa
chmod go-r ~/.ssh/id_rsa
mv sshid/id_rsa.pub ~/.ssh/id_rsa.pub
rmdir sshid
rm sshid.tar.gz
rm sshid_wonderful.dev.tar.gz.gpg

mkdir -p $OPTROOT
cd $OPTROOT

git clone $REPO current

echo "*******************************************************************"
echo "* Finished clone wonderful.dev repo at /opt/wonderful.dev/current *"
echo "*******************************************************************"
