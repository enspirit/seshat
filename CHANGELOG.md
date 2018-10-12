## 1.1.0

* BREAKING: The default docker image is now based on node:8.5, no longer
  on passenger. This changes the default container port to 3000 and may
  require specifying a 80 port in configuration to get backward compatible
  with the 1.0 image.

* FIX: POST and GET bugs when file names contain special characters. They
  are now properly encoded for use in URLs.

## 1.0.0

* Birthday
