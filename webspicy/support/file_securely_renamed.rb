require 'uri'
require 'cgi'

class FileSecurelyRenamed

  MATCH = /The file should have been securely renamed/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    FileSecurelyRenamed.new
  end

  def check(invocation)
    location = invocation.response.headers['Location']
    uri = URI.parse(location)

    filename = uri.path.split('/').last
    params = CGI::parse(uri.query)
    raise "File should have been renamed" if filename == params['n']
  end

end
