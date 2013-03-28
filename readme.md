#Aid View


## Running development insight

Requires node + npm.

    # install npm dependencies
    npm install 
    
    # run the app
    node web.js

The default endpoint is http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq? - if you want to change this, set the ENDPOINT environment variable:

    # run the app with a custom endpoint
    ENDPOINT=http://my-custom/endpoint? node web.js
    
    # run the app with a custom corpus
    CORPUS=fullA node web.js


## Vagrant

This project can be run on a virtual machine using [Vagrant](http://vagrantup.com/)

    gem install vagrant
    vagrant box add base http://files.vagrantup.com/lucid32.box
    vagrant up

    # (in the gui launched by virtual box)
    /etc/init.d/networking restart

    # when ssh-ed into virtual machine
    cd /vagrant && node web.js

Note. this will tunnel port 3000 on the virtual box -> 3003 on localhost

## Heroku

This app can be deployed to [heroku](http://heroku.com)

    heroku create --stack cedar
    git push heroku develop:master
    
    # make the app run in production mode
    heroku config:add NODE_ENV=production
    
    # to set a custom api endpoint (remember the trailing question mark)
    heroku config:add ENDPOINT=http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq?
    
    # to set the corpus used
    heroku config:add CORPUS=fullA
    
    # to rename for a nicer url
    heroku apps:rename my-iati-app

**NOTE** currently the compiled js are given a url based on the app startup time, this is the only inhibitor to the app being assigned to multiple dynos (also, for browser caching effectiveness across restarts)


## API Request Caching

Requests to the api can be cached, which is **very** recommended (even in development)

### Memcached

Responses from the api can be cached using memcached by setting the env variable MEMCACHE_SERVERS:

    MEMCACHE_SERVERS=127.0.0.1:11211 node web.js

This won't work on heroku as yet (because the memcached is user/pass protected) - though can help with local development.

(note, to clear memcached: `echo "flush_all" | nc localhost 11211` )

### Redis

Redis can also be used to cache requests, to enable the redis add-on on heroku (and caching on the app):

    heroku addons:add redistogo

And to use redis locally

    REDISTOGO_URL=redis://user:pass@url:port/ node web.js

(interestingly, you can use the redistogo url from your heroku app, run `heroku config` to find it)

…Just now - there isn't a good option for cache expiry,  but removing and adding the add-on should do the trick.

There is a script that will expire the redis cache, this can be run on heroku using:

    heroku run node clearcache.js --app aidview


### Analytics

Google analytics can be enabled by setting the GA_ACCOUNT variable

    GA_ACCOUNT=UA-12345678-1