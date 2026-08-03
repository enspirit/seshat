require 'net/http'
require 'uri'

##
# Uploads real bytes to the signed URL and then fetches the object back through
# Seshat.
#
# This is the only check that proves the signature is actually correct. A unit
# test can assert that a URL was produced and that its query string looks right
# while the backend would still reject the upload - the AWS SDK, left at its
# defaults, binds a checksum of the empty signing-time body into the URL, and
# nothing but a real PUT reveals it.
#
class PresignedUploadRoundTrips
  include Webspicy::Specification::Post

  MATCH = /The signed url accepts the bytes and the object is retrievable/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    PresignedUploadRoundTrips.new
  end

  def check!
    presigned = invocation.output
    body = 'seshat presigned upload payload'

    uri = URI(presigned[:url])
    http = Net::HTTP.new(uri.host, uri.port)
    if uri.scheme == 'https'
      http.use_ssl = true
      # minio runs with a self-signed cert in the compose stack
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end

    put = Net::HTTP::Put.new(uri)
    presigned[:headers].each { |name, value| put[name.to_s] = value }
    put.body = body

    response = http.request(put)
    unless response.code.to_i == 200
      raise "Signed PUT rejected with #{response.code}: #{response.body}"
    end

    # ...and the object is now readable through Seshat under the returned name.
    base, _ = test_case.specification.instantiate_url(test_case.params)
    object_url = invocation.client.config.host + base + presigned[:name]
    fetched = client.api.get(object_url)

    raise "Could not download #{presigned[:name]}: #{fetched.status}" unless fetched.status == 200

    got = fetched.body.to_s
    unless got == body
      raise "Object content does not match what was uploaded: " \
            "expected #{body.inspect} (#{body.bytesize}B), got #{got[0, 80].inspect} (#{got.bytesize}B)"
    end
  end

end
