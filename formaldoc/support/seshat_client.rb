class SeshatClient
  include Webspicy::Support::World::Item

  def client
    config.client
  end

  def post_file(test_case, path, filename, folder=nil, extra_headers = {})
    # upload the file
    file = HTTP::FormData::File.new(path, {
      content_type: fmt_mime_type(filename),
      filename: filename
    })
    http_opts = {
      form: {
        filename => file
      }
    }
    url = folder ? config.host + folder + '/' : config.host + '/'
    headers = {
      'Authorization' => test_case.headers['Authorization']
    }.merge(extra_headers).compact

    response = HTTP[headers].post(url, http_opts)
    raise "Unable to upload file for precondition" unless response.status == 200

    response
  end

  def fmt_mime_type(filename)
    file_extension = File.extname(filename).delete ?.
    case file_extension
      when 'json' then 'application/json'
      when 'csv' then 'text/csv'
      else "application/octet-stream"
    end
  end

end # class SeshatClient
