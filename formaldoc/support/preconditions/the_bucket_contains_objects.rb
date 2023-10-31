class TheBucketContainsObjects
  include Webspicy::Specification::Pre

  MATCH = /The bucket contains objects( with.*metadata)?/

  def initialize(with_metadata=false)
    @with_metadata = with_metadata
  end
  attr_reader :with_metadata

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    TheBucketContainsObjects.new($1)
  end

  def instrument
    return if test_case.counterexample

    extra_headers = if with_metadata
      test_case.metadata[:object]["metadata"].reduce({}) do |meta,(key, value)|
        meta["seshat-metadata-#{key}"] = value
        meta
      end
    else
      {}
    end

    url, _ = test_case.specification.instantiate_url(test_case.params)

    puts "uploading #{url} #{extra_headers.inspect}"
    folder = url[1...-1]

    # check we have a fixture file matching what the test should upload
    fixture_path = File.join(File.dirname(__FILE__), '..', '..', 'fixtures', 'seshat.jpg')
    raise "Unable to find seshat.jpg in fixtures" unless File.file?(fixture_path)

    config.world.seshat.post_file(test_case, fixture_path, 'seshat.jpg', "/#{folder}", extra_headers)
    config.world.seshat.post_file(test_case, fixture_path, 'seshat.jpg', "/#{folder}/subfolder", extra_headers)
  end

  def counterexamples(service)
    []
  end
end
