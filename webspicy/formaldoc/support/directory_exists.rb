require 'uri'
require 'cgi'

class DirectoyExists

  MATCH = /The directory (.*) should exist/

  def initialize(directory)
    @directory = directory
  end
  attr_reader :directory

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    DirectoyExists.new($1)
  end

  def counterexamples(service)
    []
  end

  def check(invocation)
    dir = File.join('tmp', directory)
    raise "Directoy does not exist" unless File.directory?(dir)
  end

end
