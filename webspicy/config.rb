require 'webspicy'

Webspicy::Configuration.new(Path.dir) do |c|

  c.postcondition ValidLocationHeader
  c.postcondition FileSecurelyRenamed
  c.postcondition FileShouldBeNamed
  c.postcondition DirectoyExists
  c.postcondition DirectoyNotExist
  c.postcondition FileExists
  c.postcondition FileNotExist
  c.precondition DirectoyNotExist

  c.host = 'http://localhost:3000'

end
