class AnObjectWithThatNameExistsOnBucket
  include Webspicy::Specification::Pre

  MATCH = /An object with that name exists on the bucket/

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    AnObjectWithThatNameExistsOnBucket.new
  end

  def instrument
    # fail!("Unable to find token in email")
    # puts test_case.specification.inspect()
    url, _ = test_case.specification.instantiate_url(test_case.params)

    filename = File.basename(url)
    folder = File.dirname(url)

    # check we have a fixture file matching what the test should upload
    fixture_path = File.join(File.dirname(__FILE__), '..', '..', 'fixtures', filename)
    raise "No fixtures matching #{filename}, check formaldoc/fixtures/" unless File.file?(fixture_path)

    # upload the file
    file = HTTP::FormData::File.new(fixture_path, {
      content_type: fmt_mime_type(filename),
      filename: filename
    })
    http_opts = {
      form: {
        filename => file
      }
    }
    puts "should upload #{filename} into #{folder}"
    puts "about to upload"
    url = client.config.host + folder + '/'
    response = HTTP[{}].post(url, http_opts)
    puts response
  end

  def fmt_mime_type(filename)
    file_extension = File.extname(filename).delete ?.
    case file_extension
      when 'json' then 'application/json'
      when 'csv' then 'text/csv'
      else "application/octet-stream"
    end
  end

  def counterexamples(service)
    []
  end
end