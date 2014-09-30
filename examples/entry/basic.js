var $ = require("jquery");
var fileUploaderJS = require("../../fileUploaderJS");

var uploader = new fileUploaderJS("#uploaderZone");
uploader.on("message", function (message) {
    console.log(message);
    $("#result").text(message);
});