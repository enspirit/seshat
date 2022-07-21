class ObjectsCanBeDownloaded
  include Webspicy::Specification::Post

  MATCH = /Objects can be downloaded using their names/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    ObjectsCanBeDownloaded.new
  end

  def check!
    res = invocation.response
    objects = invocation.output

    upload_url, _ = test_case.specification.instantiate_url(test_case.params)

    objects.each do |object|
      object_url = invocation.client.config.host + upload_url + object[:name]
      response = client.api.get(object_url)
      raise "Could not download object #{object[:name]}" unless response.status == 200
    end
  end

end
