#!/bin/bash

mongo < test/mongo-init.js

function abort {
  rm dist/session
  exit $1
}

jasmine-node test/jasmine-node/user/bad-signup-spec.js
res=$?
if [[ $res -ne 0 ]]
then
  abort $res
fi

jasmine-node test/jasmine-node/user/user-spec.js
res=$?
if [[ $res -ne 0 ]]
then
  abort $res
fi

jasmine-node test/jasmine-node/upload
res=$?
if [[ $res -ne 0 ]]
then
  exit $res
  #abort $res
fi

abort 0
