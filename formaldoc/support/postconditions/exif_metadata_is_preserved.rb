class ExifMetadataIsPreserved
  include Webspicy::Specification::Post

  MATCH = /Exif metadata are preserved/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    ExifMetadataIsPreserved.new
  end

  def check!
    res = invocation.response
    objects = invocation.output

    upload_url, _ = test_case.specification.instantiate_url(test_case.params)

    objects.each do |object|
      object_url = invocation.client.config.host + upload_url + object[:name]
      image = MiniMagick::Image.open(object_url)
      fail!("Metadata do not seem preserved") if image.exif.empty?
    end
  end

end
