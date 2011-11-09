# This is a ruby guard file,  it can be used to restart the app
# each time the js changes - very handy for development
#
#
# Install (guard-process requires ruby 1.9.2)
#
# gem install guard guard-process
# gem install rb-fsevent # os x
# gem install rb-inotify gem # linux
#
# Run
#
# guard start
group :app do

  guard 'process', :name => 'Iati', :command => 'node web.js' do
    watch('web.js')
    watch(/lib\/.*\.js/)
  end
  
end

group :livereload do
  
  guard 'livereload' do
    watch(%r{view/.+\.jade})
    watch(%r{public/stylesheets/.+\.(css|less)})
    watch(%r{public/javascripts/.+\.js})
    watch(%r{public/images/.+})
  end
  
end

group :test do
  
  guard 'process', :name => 'Jasmine Tests', :command => './node_modules/jasmine-node/bin/jasmine-node test' do
    watch(/.*\.js/)
  end
  
end

