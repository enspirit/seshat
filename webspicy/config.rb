require 'webspicy'

Webspicy::Configuration.new(Path.dir) do |c|

  c.postcondition ValidLocationHeader
  c.postcondition FileSecurelyRenamed
  c.postcondition FileShouldBeNamed
  c.postcondition DirectoyExists
  c.precondition DirectoyNotExist

  c.host = ENV['API_BASE'] || "http://127.0.0.1:3000"

end
