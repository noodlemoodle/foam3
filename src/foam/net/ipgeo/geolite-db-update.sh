#! /usr/bin/env zsh

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <accountId> <licenseKey> <path>"
    exit 1
fi

ACCOUNT_ID=$1
LICENSE_KEY=$2
SAVE_TO=$3

FILE_LOCATION="maxmind-update"

mkdir $SAVE_TO

cd $SAVE_TO && {
    curl -L -o $FILE_LOCATION "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=$LICENSE_KEY&suffix=tar.gz&account_id=$ACCOUNT_ID" ;
    if [ $? -eq 0 ]; then
        echo "update downloaded: $FILE_LOCATION"
    else
        echo "updated failed"
        exit 1
    fi
    tar -xzf $FILE_LOCATION
    rm $FILE_LOCATION
    # rename extracted folder to a known name
    # move contents of maxmind/geolite maxmind/ and delete geolite
    mv ./* ./geolite 
    mv ./*/* .
    rm -rf geolite
    cd -;
}

echo "done"
