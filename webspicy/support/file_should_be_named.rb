require 'uri'
require 'cgi'

class FileShouldBeNamed

  MATCH = /The file should be named (.*)/

  def initialize(filename)
    @filename = filename
  end
  attr_reader :filename

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    FileShouldBeNamed.new($1)
  end

  def check(invocation)
    location = invocation.response.headers['Location']
    uri = URI.parse(location)

    actual = uri.path.split('/').last
    raise "File should have been named #{filename}. Got #{actual}" if actual != filename
  end

end
