class IsValidZipFile
  include Webspicy::Specification::Post

  MATCH = /The response is a valid zip file/i

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    IsValidZipFile.new
  end

  def check!
    res = invocation.response
    expected_content = test_case.metadata[:zip] || { "includes": [], "excludes": [] }

    zippath = Tempfile.new('foo')

    File.open(zippath.path, 'w') do |f|
      f.write res.body
    end

    Zip::File.open(zippath) do |zip|
      (expected_content["includes"] || []).each do |name|
        obj = zip.find_entry(name)
        fail! "Could not find object inside zip: #{name}" unless obj
      end

      (expected_content["excludes"] || []).each do |name|
        obj = zip.find_entry(name)
        fail! "Object should not be inside zip: #{name}" if obj
      end
    end
  ensure
    File.delete(zippath) if File.exist?(zippath)
  end

end
