#IATI Development insight


## Running development insight

Requires node + npm.

    # install npm dependencies
    npm install 
    
    # run the app
    node app.js

The default endpoint is http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq? - if you want to change this, set the ENDPOINT environment variable:

    # run the app with a custom endpoint
    ENDPOINT=http://my-custom/endpoint? node app.js


## Vagrant

This project can be run on a virtual machine using [Vagrant](http://vagrantup.com/)

    gem install vagrant
    vagrant box add base http://files.vagrantup.com/lucid32.box
    vagrant up

    # (in the gui launched by virtual box)
    /etc/init.d/networking restart

    # when ssh-ed into virtual machine
    cd /vagrant && node app.js

Note. this will tunnel port 3000 on the virtual box -> 3003 on localhost

## Heroku

This app can be deployed to [heroku](http://heroku.com)

    heroku create --stack cedar
    git push heroku develop:master
    
    # make the app run in production mode
    heroku config:add NODE_ENV=production
    
    # to set a custom api endpoint (remember the trailing question mark)
    heroku config:add ENDPOINT=http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq?
    
    # to rename for a nicer url
    heroku apps:rename my-iati-app


## Memcached

Responses from the api can be cached using memcached by setting the env variable MEMCACHE_SERVERS:

    MEMCACHE_SERVERS=127.0.0.1:11211 node web.js

This won't work on heroku as yet (because the memcached is user/pass protected) - though can help with local development.