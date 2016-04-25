nohup node server/server.js --config=test/config &
gulp all
gulp dist
bash test/test-server.sh
gulp test
kill $!
