#!/bin/bash

if [ ! -d log ]; then
  mkdir log
fi

i=0
now=$(date +%Y-%m-%d)
prefix="log/server_"
logname=$prefix$now"_"
suffix=".log"
while [ -f "$logname$i$suffix" ]
do
  i=$(($i+1))
done

nohup mongod >> mongod.log 2>&1 &
nohup node --max-old-space-size=8192 server/server.js >> $logname$i$suffix 2>&1 &

