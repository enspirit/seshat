require 'uri'
require 'cgi'
require 'path'

class FilePreviouslyUploaded

  include Webspicy::Specification::Pre

  MATCH = /The file (.*) should have been previously uploaded/

  def initialize(file)
    @file = file
  end
  attr_reader :file

  def self.match(service, descr)
    return nil unless descr =~ MATCH
    FilePreviouslyUploaded.new($1)
  end

  def counterexamples(service)
    []
  end

  def instrument()
    # not implemented yet, see makefile
  end

end
