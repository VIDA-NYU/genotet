#!/bin/bash
i=0
now=$(date +%Y-%m-%d)
prefix="log/server_"
logname=$prefix$now"_"
suffix=".log"
while [ -f "$logname$i$suffix" ]
do
  i=$(($i+1))
done

nohup node --max-old-space-size=8192 server/server.js > $logname$i$suffix &
