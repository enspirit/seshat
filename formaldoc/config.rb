require 'webspicy'
require 'mini_magick'

Webspicy::Configuration.new(Path.dir) do |c|

  c.precondition AnObjectWithThatNameExistsOnBucket
  c.precondition TheBucketContainsObjects
  c.postcondition ObjectsCanBeDownloaded
  c.postcondition ImageIsResized

  c.host = ENV['SESHAT_BASE'] || "http://127.0.0.1:3000"

end
