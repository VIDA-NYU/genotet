#!/bin/bash

# Initializes mongo database
mongo < mongo-init.js

# Download bigWigToWig for testing
curl -o test/bigWigToWig http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigWigToWig
chmod 755 test/bigWigToWig
