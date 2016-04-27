#!/bin/bash

nohup node server/server.js --config=test/config &
gulp all
res=$?
if [[ $res -ne 0 ]]
then
  exit $res
fi
gulp dist
res=$?
if [[ $res -ne 0 ]]
then
  exit $res
fi
bash test/test-server.sh
res=$?
if [[ $res -ne 0 ]]
then
  exit $res
fi
gulp test
res=$?
if [[ $res -ne 0 ]]
then
  exit $res
fi
kill $!
