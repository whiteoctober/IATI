/* 
	This flushes all the keys in redistogo instance

	local:
	REDISTOGO_URL=the_redis_url node flushcache.js 

	heroku:
	heroku run node flushcache.js --app aidview
*/

var redis = require('redis-url').createClient(process.env.REDISTOGO_URL);

console.log("running flushdb on redis to go");

redis.flushdb(function(){
	console.log("complete");
	process.exit(0);
});