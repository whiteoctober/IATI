Vagrant::Config.run do |config|

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "base"


  # Boot with a GUI so you can see the screen. (Default is headless)
  # NOTE : this allows us to restart network if it is hanging with
  #         /etc/init.d/networking restart
  config.vm.boot_mode = :gui
  config.ssh.max_tries = 5000
  config.ssh.timeout   = 30

  # forward to port 3003 to distinguish between vagrant and local
  config.vm.forward_port("node", 3000, 3003)

  config.vm.provision :chef_solo do |chef|
    chef.add_recipe "nodejs"
    chef.add_recipe "nodejs::npm"
    chef.json = {
        "nodejs" => {
          "version" => "0.4.12",
          "npm" => "1.0.99"
        } 
      }
  end
  
  config.vm.provision :shell, :inline => "cd /vagrant && npm install"
  
  config.vm.provision :shell, :inline => "npm install supervisor -g"
  # guard is better than supervisor,  though leaving it off for now.
  # config.vm.provision :shell, :inline => "gem install guard rb-inotify"

end