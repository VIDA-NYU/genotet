#!/bin/bash

#nohup node server/server.js --config=test/config &
#pid=$!
pid=-1
res=0

function abort {
  kill $1
  exit $2
}

#gulp all
res=$?
if [[ $res -ne 0 ]]
then
  abort $pid $res
fi
#gulp dist
res=$?
if [[ $res -ne 0 ]]
then
  abort $pid $res
fi
bash test/test-server.sh
exit 0
res=$?
if [[ $res -ne 0 ]]
then
  abort $pid $res
fi
gulp test
res=$?
if [[ $res -ne 0 ]]
then
  abort $pid $res
fi
kill $pid
