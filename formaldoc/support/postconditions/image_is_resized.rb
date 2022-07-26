class ImageIsResized
  include Webspicy::Specification::Post

  MATCH = /The image is resized properly/
  EXPECTED_WIDTH = 400

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    ImageIsResized.new
  end

  def check!
    res = invocation.response
    objects = invocation.output

    upload_url, _ = test_case.specification.instantiate_url(test_case.params)

    objects.each do |object|
      object_url = invocation.client.config.host + upload_url + object[:name]
      image = MiniMagick::Image.open(object_url)
      raise "Image was not resized (width = #{image[:width]} instead of #{EXPECTED_WIDTH})" unless image[:width] == EXPECTED_WIDTH
    end
  end

end
