require 'webspicy'
require 'webspicy/web/specification/post/last_modified_caching_protocol'
require 'webspicy/web/specification/post/etag_caching_protocol'
require 'mini_magick'
require 'zip'
require 'tempfile'

Webspicy::Configuration.new(Path.dir) do |c|

  c.precondition AnObjectWithThatNameExistsOnBucket
  c.precondition TheBucketContainsObjects
  c.postcondition ObjectsCanBeDownloaded
  c.postcondition ImageIsResized
  c.postcondition IsValidZipFile
  c.postcondition Webspicy::Web::Specification::Post::LastModifiedCachingProtocol
  c.postcondition Webspicy::Web::Specification::Post::ETagCachingProtocol

  c.host = ENV['SESHAT_BASE'] || "http://127.0.0.1:3000"

end
