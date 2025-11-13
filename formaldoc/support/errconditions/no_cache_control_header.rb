class NoCacheControlHeader
  include Webspicy::Specification::Err

  MATCH = /It does not set the Cache-Control header/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    NoCacheControlHeader.new
  end

  def check!
    res = invocation.response
    if res.headers['Cache-Control']
      fail! 'Cache-Control header is present, but should not be'
    end
    true
  end

end
