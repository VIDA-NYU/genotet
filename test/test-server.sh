nohup node server/server.js --config=test/config &
mongo < test/mongo-init.js
jasmine-node test/jasmine-node

