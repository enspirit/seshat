class AnObjectWithThatNameExistsOnBucket
  include Webspicy::Specification::Pre

  MATCH = /An object with that name exists on the bucket/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    AnObjectWithThatNameExistsOnBucket.new
  end

  def instrument
    return if test_case.counterexample

    url, _ = test_case.specification.instantiate_url(test_case.params)

    filename = File.basename(url)
    folder = File.dirname(url)

    # check we have a fixture file matching what the test should upload
    fixture_path = File.join(File.dirname(__FILE__), '..', '..', 'fixtures', filename)
    raise "No fixtures matching #{filename}, check formaldoc/fixtures/" unless File.file?(fixture_path)

    config.world.seshat.post_file(test_case, fixture_path, filename, folder)
  end

  def counterexamples(service)
    []
  end
end
