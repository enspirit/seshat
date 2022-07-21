require 'webspicy'

Webspicy::Configuration.new(Path.dir) do |c|

  c.precondition AnObjectWithThatNameExistsOnBucket
  c.postcondition ObjectsCanBeDownloaded

  c.host = ENV['SESHAT_BASE'] || "http://127.0.0.1:3000"

end
