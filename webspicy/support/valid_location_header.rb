class ValidLocationHeader

  MATCH = /Following the Location header .*? allows downloading the file/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    ValidLocationHeader.new
  end

  def check(invocation)
    location = invocation.response.headers['Location']
    raise "Location should have been set" unless location

    api = invocation.client.api
    response = api.get(location)
    raise "Failed to successfully reach the location" unless response.status == 200

    ct = response.headers['Content-Type']
    raise "Content type should have been `text/csv`" unless ct == "text/csv"
  end

end
