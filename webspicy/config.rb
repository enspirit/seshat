require 'webspicy'

Webspicy::Configuration.new(Path.dir) do |c|

  c.around_each  do |tc, &bl|
    simplestNew = File.join('tmp', 'simplest/new')
    Dir.delete(simplestNew) if File.directory?(simplestNew)
    simplestNew = File.join('tmp', 'simplest/new.txt')
    File.delete(simplestNew) if File.file?(simplestNew)
    bl.call
  end

  c.postcondition ValidLocationHeader
  c.postcondition FileSecurelyRenamed
  c.postcondition FileShouldBeNamed
  c.postcondition DirectoyExists
  c.postcondition DirectoyNotExist
  c.postcondition FileExists
  c.postcondition FileNotExist

  c.precondition DirectoyNotExist

  c.host = ENV['API_BASE'] || "http://127.0.0.1:3000"

end
