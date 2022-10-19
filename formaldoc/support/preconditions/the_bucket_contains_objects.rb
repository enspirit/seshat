class TheBucketContainsObjects
  include Webspicy::Specification::Pre

  MATCH = /The bucket contains objects/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    TheBucketContainsObjects.new
  end

  def instrument
    return if test_case.counterexample

    url, _ = test_case.specification.instantiate_url(test_case.params)

    folder = url[1...-1]

    # check we have a fixture file matching what the test should upload
    fixture_path = File.join(File.dirname(__FILE__), '..', '..', 'fixtures', 'seshat.jpg')
    raise "Unable to find seshat.jpg in fixtures" unless File.file?(fixture_path)

    config.world.seshat.post_file(test_case, fixture_path, 'seshat.jpg', "/#{folder}")
    config.world.seshat.post_file(test_case, fixture_path, 'seshat.jpg', "/#{folder}/subfolder")
  end

  def counterexamples(service)
    []
  end
end
