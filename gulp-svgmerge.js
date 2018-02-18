/**
 * Forked from gulp-svgstore.
 *
 * It use <g> instead of <symbol> for each combined svg icon. Result is used for
 * Plasma theme icons.
 */

var cheerio = require("cheerio");
var path = require("path");
var Stream = require("stream");
var fancyLog = require("fancy-log");
var PluginError = require("plugin-error");
var Vinyl = require("vinyl");

module.exports = function(config) {
  config = config || {
    removeStyleAttributes: true,
    removeFontAttributes: true,
    removeOverflowAttributes: true,
    removeColorAttributes: true
  };

  var namespaces = {};
  var isEmpty = true;
  var fileName;
  var inlineSvg = config.inlineSvg || false;
  var ids = {};

  var resultSvg =
    '<svg xmlns="http://www.w3.org/2000/svg"><defs><style type="text/css" id="current-color-scheme">.ColorScheme-Text{color:#555555;}</style></defs></svg>';
  if (!inlineSvg) {
    resultSvg =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
      '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
      resultSvg;
  }

  var $ = cheerio.load(resultSvg, { xmlMode: true });
  var $combinedSvg = $("svg");
  var stream = new Stream.Transform({ objectMode: true });
  var x = 0;

  stream._transform = function transform(file, encoding, cb) {
    if (file.isStream()) {
      return cb(new PluginError("gulp-svgmerge", "Streams are not supported!"));
    }

    if (file.isNull()) return cb();

    var $svg = cheerio.load(file.contents.toString(), { xmlMode: true })("svg");

    if ($svg.length === 0) return cb();

    var idAttr = path.basename(file.relative, path.extname(file.relative));
    var width = $svg.attr("width");
    var height = $svg.attr("height");
    var $g = $("<g/>");

    if (idAttr in ids) {
      return cb(
        new PluginError(
          "gulp-svgmerge",
          "File name should be unique: " + idAttr
        )
      );
    }

    ids[idAttr] = true;

    if (!fileName) {
      fileName = path.basename(file.base);
      if (fileName === "." || !fileName) {
        fileName = "svgmerge.svg";
      } else {
        fileName = fileName.split(path.sep).shift() + ".svg";
      }
    }

    if (file && isEmpty) {
      isEmpty = false;
    }

    $g.attr("id", idAttr);
    $g.attr("transform", "translate(" + x + ", 0)");
    var $square = $(
      '<rect x="0" y="0" width="' +
        width +
        '" height="' +
        height +
        '" opacity="0" />'
    );

    var attrs = $svg[0].attribs;
    for (var attrName in attrs) {
      if (attrName.match(/xmlns:.+/)) {
        var storedNs = namespaces[attrName];
        var attrNs = attrs[attrName];

        if (storedNs !== undefined) {
          if (storedNs !== attrNs) {
            fancyLog.info(
              attrName +
                " namespace appeared multiple times with different value." +
                ' Keeping the first one : "' +
                storedNs +
                '".\nEach namespace must be unique across files.'
            );
          }
        } else {
          for (var nsName in namespaces) {
            if (namespaces[nsName] === attrNs) {
              fancyLog.info(
                "Same namespace value under different names : " +
                  nsName +
                  " and " +
                  attrName +
                  ".\nKeeping both."
              );
            }
          }
          namespaces[attrName] = attrNs;
        }
      }
    }

    $svg.find("defs, metadata, sodipodi\\:namedview").remove();
    const $paths = $svg.find("path");
    if (config.removeStyleAttributes) {
      $paths.attr("style", null);
    }
    if (config.removeFontAttributes) {
      $paths
        .attr("font-weight", null)
        .attr("font-family", null)
        .attr("white-space", null);
    }
    if (config.removeOverflowAttributes) {
      $paths.attr("overflow", null);
    }
    if (config.removeColorAttributes) {
      $paths.attr("color", null);
    }

    // Default fill color use text color
    // This is the way that Plasma change icon color in light/dark background
    $paths.each(function() {
      const $this = $(this);
      if ($this.attr("fill") === "#555") {
        $this.addClass("ColorScheme-Text");
        $this.attr("fill", null);
        $this.attr("style", "fill:currentColor");
      }
    });

    $g.append($square);
    $g.append($svg.contents());
    $combinedSvg.append($g);
    x += Number(width);
    cb();
  };

  stream._flush = function flush(cb) {
    if (isEmpty) return cb();

    for (var nsName in namespaces) {
      $combinedSvg.attr(nsName, namespaces[nsName]);
    }
    var file = new Vinyl({ path: fileName, contents: new Buffer($.xml()) });
    this.push(file);
    cb();
  };

  return stream;
};
