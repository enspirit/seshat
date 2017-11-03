require 'webspicy'

Webspicy::Configuration.new(Path.dir) do |c|

  c.postcondition ValidLocationHeader
  c.postcondition FileSecurelyRenamed

  c.folder 'api' do |api|
    api.host = 'http://localhost:3000'
  end

end
