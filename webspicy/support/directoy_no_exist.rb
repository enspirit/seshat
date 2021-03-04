require 'fileutils'

class DirectoyNotExist

  MATCH = /The directory (.*) must not exist/

  def initialize(directory)
    @directory = directory
  end
  attr_reader :directory

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    DirectoyNotExist.new($1)
  end

  def counterexamples(service)
    []
  end

  def instrument(test_case, client)
    return if (test_case.tags & ['rename', 'rename_file']).any?
    dir = File.join('tmp', directory)
    Dir.delete(dir) if File.directory?(dir)
  end

  def check(invocation)
    dir = File.join('tmp', directory)
    raise "Directoy does exist" if File.directory?(dir)
  end

end
