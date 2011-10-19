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

guard 'process', :name => 'Iati', :command => 'node app.js' do
  watch('app.js')
end