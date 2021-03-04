require 'fileutils'

class FileNotExist

  MATCH = /The file (.*) must not exist/

  def initialize(filename)
    @filename = filename
  end
  attr_reader :filename

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    FileNotExist.new($1)
  end

  def counterexamples(service)
    []
  end

  def check(invocation)
    return if invocation.test_case.tags.include?('rename')
    file = File.join('tmp', filename)
    raise "File does exist" if File.file?(file)
  end

end
