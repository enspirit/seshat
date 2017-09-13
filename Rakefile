task :default => :test

require 'webspicy'

desc "Runs all API integration tests on components"
task :test do
  Webspicy::Tester.new(Path.dir/'webspicy').call
end
