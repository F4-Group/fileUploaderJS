FileUploaderJS
==============

Requires : 
* works using commonJS (tested only on browserify)

Features :

* html5 File upload with progression
* handle file upload from disk
* handle file upload from another tab
* handle file upload from another browser
* handle multiple files (optional)
* handle destination server able to generate thumbnail
* handle jpeg orientation tag
* generate thumbnail client side using canvas
* allow phones to take photos (iOS doesn't allow it natively for multiple input field), we'll try to mimic the android behaviour (one image at a time)
* allow to remove images
* graceful error handling
* automatic tests (if possible)
* file extension filters option
* CORS
* thumbnail even for URI dropped images (either canvas or server generated thumbnail)
* css theme customization
* Retina enabled
* display previously uploaded images (already stored on a server)

Should work on 

* latest chrome
* latest firefox
* android phones & tablets
* iOS phones & tablets (working from iOS 7 and up (maybe 6), silent fail on iOS 5)
* IE 9+