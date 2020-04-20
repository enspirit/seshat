require 'webspicy'

Webspicy::Configuration.new(Path.dir) do |c|

  c.postcondition ValidLocationHeader
  c.postcondition FileSecurelyRenamed
  c.postcondition FileNotRenamed
  c.postcondition DirectoyExists
  c.precondition DirectoyNotExist

  c.host = 'http://localhost:3000'

end
