require 'uri'
require 'cgi'

class FileNotRenamed

  MATCH = /The file should not have been renamed/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    FileNotRenamed.new
  end

  def check(invocation)
    location = invocation.response.headers['Location']
    uri = URI.parse(location)

    filename = uri.path.split('/').last
    params = CGI::parse(uri.query)
    raise "File should not have been renamed" if filename != params['n']
  end

end
