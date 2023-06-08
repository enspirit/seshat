class ETagCachingProtocol
  include Webspicy::Specification::Post

  MATCH = /It supports the ETag\/If-None-Match caching protocol/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    ETagCachingProtocol.new
  end

  def check!
    res = invocation.response
    etag = res.headers['ETag']
    fail!("No ETag response header found") unless etag

    url, _ = test_case.specification.instantiate_url(test_case.params)
    url = invocation.client.config.host + url

    response = client.api.get(url, {}, {
      'If-None-Match' => etag
    })
    fail!("304 expected") unless response.status == 304

    response = client.api.get(url, {}, {
      'If-None-Match' => "W/somethingelse"
    })
    fail!("2xx expected") if response.status == 304
  end

end
