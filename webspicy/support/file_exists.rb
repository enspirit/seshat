require 'uri'
require 'cgi'

class FileExists

  MATCH = /The file (.*) should exist/

  def initialize(file)
    @file = file
  end
  attr_reader :file

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    FileExists.new($1)
  end

  def counterexamples(service)
    []
  end

  def check(invocation)
    return unless invocation.test_case.tags.include?('rename_file')
    fil = File.join('tmp', file)
    raise "File #{fil} does not exist" unless File.file?(fil)
  end

end
