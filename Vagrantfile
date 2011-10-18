Vagrant::Config.run do |config|

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "base"


  # Boot with a GUI so you can see the screen. (Default is headless)
  config.vm.boot_mode = :gui
  config.ssh.max_tries = 5000
  config.ssh.timeout   = 30
  config.vm.forward_port("web", 80, 4567)
end