# secure-rename

Upon file upload I want to rename the original filename to a new object name

* upon POST request, change metadata filename to generated name
* upon response, change Location to include generated name, and ?name={original name}
* upon GET request, add support for ?name= and generate appropriate header

# zipping

Upon file upload I want to zip its content

* upon POST request, consume stream and return a stream of zipped content
* upon response, do nothing
* upon GET request, support for dezipping on the fly

# image transformation

Upon image upload I'd like to shrink/crop

* upon POST request, consume stream, use sharp(), generate new image
* upon response, do nothing
* upon GET request do nothing

# image thumbnail generation

Upon image upload I'd like to generate an **additional** shrinked/cropped version of the file

...

# job processing (much like the previous point)

Upon file upload I'd like to trigger an async job processing

...
