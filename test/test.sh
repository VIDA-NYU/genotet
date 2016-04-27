#!/bin/bash

nohup node server/server.js --config=test/config &
pid=$!
res=0

function abort {
  kill $1
  exit $2
}

gulp all
res=$?
if [[ $res -ne 0 ]]
then
  abort $pid $res
fi

gulp dist
res=$?
if [[ $res -ne 0 ]]
then
  abort $pid $res
fi

bash test/test-server.sh
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

abort $pid 0
