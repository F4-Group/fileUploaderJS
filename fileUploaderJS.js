//Bugfix for iOS 6 and 7
//Source: http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
//    based on the work of https://github.com/stomita/ios-imagefile-megapixel

var $ = require('jquery');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var template = require("./fileUploaderJSTemplate.jade");
module.exports = FileUploaderJS;

util.inherits(FileUploaderJS, EventEmitter);

function FileUploaderJS(target, options) {
    _.defaults(options, {});
    this.$container = $(target);
    this.$container.append(template());
    var that = this;
    var onElement = false;
    this.$container.find(".dropZone")
        .on({
            dragenter: handleEnter,
            dragleave: handleLeave,
            dragover: handleOver,
            drop: handleDrop,
        });

    this.on("filesDropped", _.bind(this.filesDropped, this));
    this.on("urisDropped", _.bind(this.urisDropped, this));
    this.on("imageDropped", _.bind(this.imageDropped, this));

    function handleDrop(event) {
        event.preventDefault();
        if (onElement) {
            handleLeave(event);
            var dataTransfer = event.originalEvent.dataTransfer;
            if (dataTransfer.files && dataTransfer.files.length) {
                //dataTransfer.files not available in ie9
                that.emit("filesDropped", dataTransfer.files);
            } else {
                var htmlContent = getDataTransferData(dataTransfer, ['text/html']);
                var uriContent;
                if (htmlContent) {
                    var img = $(htmlContent);
                    if (!img.is("img"))
                        img = img.find("img");//Todo prendre la plus grande image pour eviter les spacers
                    uriContent = img.attr("src");
                }
                if (!uriContent)
                    uriContent = getDataTransferData(dataTransfer, ['text/uri-list', 'URL']);
                if (uriContent) {

                    var uris = [];
                    _.each(uriContent.split("\n"), function (singleLine) {
                        if (!singleLine.match(/^#/))
                            uris.push(singleLine);
                    });
                    that.emit("urisDropped", uris);
                }
            }
        }
        //Todo do not stop event if not handled
        event.stopPropagation();
    }

    function getDataTransferData(dataTransfer, types) {
        if (!dataTransfer.types)
            return null;//ie9

        var type = _.find(types, function (type) {
            return _.contains(dataTransfer.types, type);
        });
        if (type)
            return dataTransfer.getData(type);
        else
            return null;
    }

    function handleEnter() {
        if (!onElement) {
            onElement = true;
        }
    }

    function handleLeave() {
        if (onElement) {
            onElement = false;
        }
    }

    function handleOver(event) {
        handleEnter();
        // prevent default to allow drop
        // see https://developer.mozilla.org/en-US/docs/Mozilla_event_reference/dragover
        if (event)
            event.preventDefault();
    }

}
FileUploaderJS.prototype.error = function (errorMessage) {
    console.error(errorMessage);
    this.emit("error", errorMessage);
};

FileUploaderJS.prototype.filesDropped = function (files) {
    var that = this;
    _.each(files, function (file) {
        if (/^image\//.test(file.type)) {
            that.emit("imageDropped", file);
        } else {
            that.error("nonImageFile");
        }
    });
};

FileUploaderJS.prototype.urisDropped = function (uris) {
    _.each(uris, function (uri) {
        $.ajax({
            method: "POST",
            url: "http://upload.cka.f4-group.com/upload",
            data: {
                uri: uri
            }
        });
    });
};

FileUploaderJS.prototype.imageDropped = function (image) {
    this.xhrUpload({
        url: "http://upload.cka.f4-group.com/upload",
        data: {
            file: image
        }
    });
};

FileUploaderJS.prototype.upload = function (options) {
    if (typeof(FormData) != "undefined" && typeof(XMLHttpRequest) != "undefined")
        this.xhrUpload(options);
    else
        this.iframeUpload(options);
};
/**
 *
 * @param options
 * @param options.data
 * @param options.data.file
 * @param options.url
 * @param options.progressBar
 * @param options.error
 * @param options.done
 */
FileUploaderJS.prototype.xhrUpload = function (options) {
    var formData = new FormData();

    if (options.inputNode)
        formData.append('file', options.inputNode[0].files[0]);
    else if (!options.data.file)
        console.error("no file to send!");

    _.each(options.data, function (value, key) {
        formData.append(key, value);
    });

    var xhr = new XMLHttpRequest();
    xhr.open('POST', options.url, true);
    xhr.onloadstart = function () {
        if (options.onData)
            options.onData(xhr.responseText);
    };
    xhr.onprogress = function () {
        if (options.onData)
            options.onData(xhr.responseText);
    };
    xhr.onload = function () {
        var err;
        var data;
        if (xhr.status === 200) {
            try {
                data = JSON.parse(xhr.responseText);
            }
            catch (error) {
                console.error("FileUploader: invalid JSON", xhr.responseText, error);
                err = 'Invalid JSON';
            }
        } else {
            console.error("FileUploader: wrong status", xhr.status, xhr.responseText);
            err = 'invalid status';
        }
        done(err, data);
    };
    xhr.onabort = function () {
        done('aborted');
        console.dir(arguments);
        console.error("fileUpload aborted", arguments);
    };
    xhr.onerror = function () {
        done('server error');
        console.error("fileUpload error", arguments);
    };
    xhr.upload.onprogress = function (e) {
        if (e.lengthComputable && options.progressBar) {
            //noinspection MagicNumberJS
            options.progressBar[0].value = (e.loaded / e.total) * 100;
            options.progressBar[0].textContent = options.progressBar[0].value; // Fallback for unsupported browsers.
        }
    };
    xhr.send(formData);

    function done(err, data) {
        if (err) {
            if (options.error)
                options.error(err);
        } else {
            if (options.done)
                options.done(data);
        }
    }
};

FileUploaderJS.prototype.iframeUpload = function (options) {
    var $input = $(options.inputNode);
    var $form = $input.closest('form');
    if ($form.length && $form.attr('action') && $form.attr('target')) {
        //see http://viralpatel.net/blogs/ajax-style-file-uploading-using-hidden-iframe/
        var iframeId = $form.attr('target');
        var $iframe = $('#' + iframeId);
        if ($iframe.length) {
            var onIframeLoad = function () {
                $iframe.off('load', onIframeLoad);
                var iframe = $iframe.get(0);
                var data = null;
                try {
                    var content = '';
                    if (iframe.contentDocument)
                        content = iframe.contentDocument.body.innerText;
                    else if (iframe.contentWindow)
                        content = iframe.contentWindow.document.body.innerText;
                    else if (iframe.document)
                        content = iframe.document.body.innerText;
                    if (content)
                        data = JSON.parse(content);
                }
                catch (error) {
                    console.warn("FileUploader: Invalid JSON:", error);
                }
                options.done(data);
            };
            $iframe.on('load', onIframeLoad);
        }
        $form.submit();
    } else {
        if (options.error)
            options.error('upload error');
        console.log("FormData: " + typeof(FormData));
        console.log("XMLHttpRequest: " + typeof(XMLHttpRequest));
        //creer une iframe qui contiens un formulaire qui s'envoie vraiment.
        //http://www.alfajango.com/blog/ajax-file-uploads-with-the-iframe-method/ //lien mort ?
    }
};
