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

    objects.each do |object|
      object_url = invocation.client.config.host + object[:name]
      response = client.api.get(object_url)
      raise "Could not download object #{object[:name]}" unless response.status == 200
    end
  end

end
