#IATI Development insight


## Running development insight

Requires node + npm.

    # install npm dependencies
    npm install 
    
    # run the app
    node app.js


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
