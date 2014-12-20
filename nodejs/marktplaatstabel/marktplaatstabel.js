'use strict';

var fs = require('fs');
var http = require('http');
var httpProxy = require('http-proxy');
var transformerProxy = require('transformer-proxy');
var url = require('url');
var path = require('path');
var lodash = require('lodash');
var express = require('express');
var excelXLSX = require('xlsx');
var excelXLS = require('xlsjs');
var app = express();
var PhotoUploader = require('photo-uploader');

var settings = {
    title        : "Marktplaatstabel",
    version      : "1.4.0",
    proxyURL     : "http://www..marktplaatstabel.services",
    sslProxyURL  : "http://ssl.marktplaatstabel.services",
    proxyTarget  : "www.marktplaats.nl",
    listenPort   : 80,
    publicFolder : 'C:/Users/Public/Documents/Marktplaatstabel',
    appRootPath  : '/marktplaatstabel'
};

(function printVersionInfo() {
    var printVersionInfo = settings.title + " " + settings.version;
    var separatorLine = "";
    for (var i=0; i < printVersionInfo.length;i++) separatorLine+="-";
    console.log("\n"+printVersionInfo);
    console.log(separatorLine);
})();

var marktplaatsProxy = httpProxy.createProxyServer({
    changeOrigin: true,
    rejectUnauthorized: false,
    xfwd: false
});

marktplaatsProxy.on('proxyReq', function(proxyReq, req, res, options) { filterRequestHeader(proxyReq); });
marktplaatsProxy.on('proxyRes', function(proxyRes, req, res, options) { filterResponseHeader(proxyRes); });

function filterResponseHeader(proxyRes) {

    // Redirects to localhost
    if (typeof proxyRes.headers.location !== 'undefined') {
        proxyRes.headers.location = proxyRes.headers.location.replace(/https:\/\/www\.marktplaats\.nl/gi, "http:\/\/ssl.marktplaatstabel.services");
        proxyRes.headers.location = proxyRes.headers.location.replace(/http:\/\/www\.marktplaats\.nl/gi, "http:\/\/www.marktplaatstabel.services");
    }
    
    // Allow loading page in frame
    delete proxyRes.headers['x-frame-options'];

    // Set domain of cookies to localhost
    if (typeof proxyRes.headers['set-cookie'] === 'object') {
        var newCookies = [];
        var loggedIn = false;
        proxyRes.headers['set-cookie'].forEach(function(cookie, index) {

            if (cookie.indexOf("FLASH=")!==-1) return;
            if (cookie.indexOf("MpSecurity")!==-1) loggedIn=true;

            // Set cookie domain to proxy
            cookie = cookie.replace(new RegExp("([dD]omain=)[\\w\\-\\.]+;?","gi"), "$1.marktplaatstabel.services;");

            // Remove secure flag. The browser only sees http://.
            cookie = cookie.replace(new RegExp("Secure;?","gi"), "");

            newCookies.push(cookie);
        });

        var loggedInCookie = "LoggedIn="+loggedIn.toString()+"; Path=/; Domain=.marktplaatstabel.services;"
        newCookies.push(loggedInCookie);

        // Add cookie to accept cookies on marktplaats.nl (Art. 11.7a Tw)
        var cookieOptIn = "CookieOptIn=true; Path=/; Domain=.marktplaatstabel.services;";
        newCookies.push(cookieOptIn);

        proxyRes.headers['set-cookie'] = newCookies;
    }
}

function filterRequestHeader(proxyReq) {
    // No gzip encoding
    proxyReq.setHeader("Accept-Encoding","");
    // Set Referer to original host
    proxyReq.setHeader("Referer", "http://www.marktplaats.nl");
    // Set generic User-Agent
    proxyReq.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36");
}

// Refreshing the page many times in fast succession kills the proxy server with a 'socket hang up' error
// (_http_client.js::createHangUpError()) if no error handler is defined.
marktplaatsProxy.on('error', function (err, req, res) { errorHandler(res, err); });

var fileServer = http.createServer(function(req, res, next) {

    var fullPath = settings.publicFolder + decodeURIComponent(req.url);
    var extension = path.extname(fullPath).toUpperCase();
    var workbook = null;

    // XLS (BIFF5/BIFF8, Excel 95-2004 spreadsheet)
    if (extension === '.XLS') {
        workbook = excelXLS.readFile(fullPath);
    }
    // XLSX / XLSM / XLSB (Excel 2007+ Spreadsheet) / ODS
    if (['.XLSX','.XLSB','.XLSM','.ODS'].indexOf(extension)!==-1) {
        workbook = excelXLSX.readFile(fullPath);
    }

    if (workbook===null) {
        if (extension==='.XML') {

            fs.readFile(fullPath, function(err, dataBuffer) {
                if (err) {
                    errorHandler(res, err);
                }
                else {
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    res.write(dataBuffer);
                    res.end();
                }
            });
        }
        else {
            res.status(415); // Unsupported Media Type
        }
    }
    else {
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        var json = excelXLSX.utils.sheet_to_json(firstSheet);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.write(JSON.stringify(json));
        res.end();
    }
});

fileServer.on('error', function (err, req, res) { errorHandler(res, err); });

var remoteFileServer = http.createServer(function(req, resXml, next) {

    var requestURL = decodeURIComponent(req.url.substring(1));

    try {
        if (requestURL.indexOf("http")===-1) {
           requestURL="http://"+requestURL;
        }

        var parsedURL = url.parse(requestURL);

        if (parsedURL.search!==null)
            parsedURL.path += parsedURL.search;

        var options = {
              host    : parsedURL.host,
              path    : parsedURL.path
        };

        http.request(options, function(res) {
              var dataBuffer = new Buffer(0);
              res.on('data', function (chunk) {
                  dataBuffer = Buffer.concat([dataBuffer, chunk]);
              });
              res.on('end', function () {
                  resXml.setHeader("Access-Control-Allow-Origin", "*");
                  resXml.write(dataBuffer);
                  resXml.end();
              });
        }).end();
    }
    catch (error) {
        console.log(2);
        errorHandler(resXml, error);
    }

});

remoteFileServer.on('error', function (err, req, res) { errorHandler(res, err); });

function errorHandler(res, err) {
    res.writeHead(404, {
        'Content-Type': 'text/plain'
    });
    res.write(err.message);
    res.end();
}

var transformerFunction = function(httpMessageBody, req) {

    httpMessageBody = httpMessageBody.toString();

    // Regex map with pattern as key, and replacement string as value
    var regexMap = {

        // Replace marktplaats.nl links with localhost DNS names (except values of hidden input elements)
        'value="http(s)?:\/\/www.marktplaats.nl'      : 'value="http$1://preserveInputElementValues', //save
        'http:\/\/www.marktplaats.nl'                 : 'http://www.marktplaatstabel.services',
        'https:\/\/www.marktplaats.nl'                : 'http://ssl.marktplaatstabel.services',
        'value="http(s)?://preserveInputElementValues': 'value="http$1:\/\/www.marktplaats.nl', //restore

        // Proxy auth.marktplaats.nl through localhost to filter cookies
        'https:\/\/(auth.marktplaats.nl)' : 'http://www.marktplaatstabel.services/$1',

        // Proxy https://s.marktplaats.com through localhost to add HTML button to TinyMCE editor
        '\/\/(s.marktplaats.com)' : '//www.marktplaatstabel.services/$1',

        // Disable analytics. Marktplaatstabel is not a real user.
        '\\(window.*\'GTM-TFG7LW\'\\)' : '',
        '<script.*tealeaf.js" ><\/script>' : '',
        '<script.*speedstats.js" ><\/script>' : '',
        '<script.*cdn.optimizely.com.*<\/script>' : '',
        '\/\/www.googletagmanager.com\/ns.html\?id=GTM-TFG7LW' : '',
        '(function sitespeedHandler\\(\\) {)' : '$1 return;',

        // Add HTML button to TinyMCE editor
        "theme:'advanced',theme_advanced_buttons1:'bold,italic,underline,bullist'" : 
            "theme: 'advanced',theme_advanced_buttons1: 'bold,italic,underline,bullist,code'",

	// Insert new css file
        '<\/head>' : '<link href="http:\/\/localhost\/marktplaatstabel\/css\/marktplaats800px.css" rel="stylesheet" type="text\/css" media="screen"><\/link><\/head>',
	// Insert expandSelect javascript addon
	'<\/body>' : '<script type="text\/javascript" src="http:\/\/localhost\/marktplaatstabel\/js\/expandSelect.js"><\/script><\/head>',
	// Open 'place add' form target in new window to prevent HTTP iframe in HTTPS document.
	'(action="https://localhost/syi/placeAdvertisement.html/m/save.html")' : '$1 target="_blank"'
    };

    // Filter HTML body
    Object.keys(regexMap).forEach(function(pattern) {
        httpMessageBody = httpMessageBody.replace(new RegExp(pattern,"gi"), regexMap[pattern]);
    });

    return httpMessageBody;
}

app.get('/getdirlist', function(req, res, next) {

     var currentDir = settings.publicFolder;
     var query = req.query.path || '';
     if (query) currentDir = path.join(settings.publicFolder, query);

     fs.readdir(currentDir, function (err, files) {
         if (err) {
            throw err;
          }
          var data = [];
          files.filter(function (file) {
              return true;
          }).forEach(function (file) {

                var fullPath = path.join(currentDir, file);
                var relativePath = path.join(query, file);
                try {
                    var isDirectory = fs.statSync(fullPath).isDirectory();
                    if (isDirectory) {
                          data.push({ Name : file, IsDirectory: true, Path : relativePath });
                    } else {
                          var ext = path.extname(file);
                          var prefix = settings.sslProxyURL + settings.appRootPath;
                          data.push({ Name : file, Ext : ext, IsDirectory: false, Path : prefix + "/?file=" + relativePath });
                    }

                } catch(e) {
                    switch (e.code) {
                        case 'EPERM':
                            console.log("Permission denied requesting file status on: "+fullPath);
                            break;
                    }
                }        

          });
          data = lodash.sortBy(data, function(f) { return f.Name });
          res.json(data);
      });
});

app.get('/filebrowser', function(req, res) { res.redirect('/filebrowser/index.html'); });

app.post('/postPicture', function(req, res) {
    req.on('photoUploaderResult', function(result) {
       res.end(result);
    });
    var photoUploader = new PhotoUploader(req);
    photoUploader.upload();
});

var placeAdvertisementProxy = httpProxy.createProxyServer({
    changeOrigin: true,
    rejectUnauthorized: false,
});

placeAdvertisementProxy.on('proxyReq', function(proxyReq, req, res, options) {
    var cookie = proxyReq._headers['cookie'].replace(/FLASH=.*?;/,"");
    proxyReq.setHeader("Cookie",cookie);
});

placeAdvertisementProxy.on('proxyRes', function(proxyRes, req, res, options) {
    // Prevent 302 redirect after XMLHttpRequest
    if (proxyRes.statusCode === 302) {
        proxyRes.statusCode = 200;
        delete proxyRes.headers.location;
    }
});

placeAdvertisementProxy.on('error', function (err, req, res) { errorHandler(res, err); });

app.post('/ajaxPlaatsAdvertentie.html', function(req, res) {
    var target = "https://www.marktplaats.nl";
    req.url = "https://www.marktplaats.nl/syi/plaatsAdvertentie.html/m/save.html";
    placeAdvertisementProxy.web(req, res, { target: target});
});

app.use(express.static(__dirname)); // App public directory

// Transformer-proxy; filter js, json and html (test if request url ends in .js, .html, .json or /, not followed by a \w)
app.use(transformerProxy(transformerFunction, {match: /(\.js([^\w]|$))|(\.html([^\w]|$))|(\.json([^\w]|$))|(\/([^\w]|$))/})); 

app.use(function(req, res, next) {

    var host = req.headers.host;
    var path = url.parse(req.url).pathname || '/';
    var firstFolderEndPos = path.substring(1).indexOf('/')+1;
    var firstFolder = path.substring(0, firstFolderEndPos+1);

    switch (firstFolder) {

        case '/exit/':
            process.exit();
            break;

        case '/file/':
            // Strip firstFolder from path
            req.url = req.url.substring(firstFolder.length-1);
            fileServer.emit("request", req, res, next);
            break;

        case '/remotefile/':
            // Strip firstFolder from path
            req.url = req.url.substring(firstFolder.length-1);
            remoteFileServer.emit("request", req, res, next);
            break;

        default :
            // Default target
            var target = "http://" + settings.proxyTarget;

            if (host.indexOf("ssl.marktplaatstabel.services")!==-1) {
                target="https://" + settings.proxyTarget;
            }
            else {

                // Translate URL's with the hostname stored in the path
                // back to the original.
                // See also: transformerFunction() above.

                var localhostPathToBaseURL = {
                    '/auth.marktplaats.nl/' : 'https://auth.marktplaats.nl',
                    '/s.marktplaats.com/'   : 'https://s.marktplaats.com',
                };

                if (typeof localhostPathToBaseURL[firstFolder] !== 'undefined') {
                    target = localhostPathToBaseURL[firstFolder];
                    req.url = req.url.substring(firstFolder.length-1);
                }
            }

            marktplaatsProxy.web(req, res, { target: target});
            break;
    }

});

var httpServer = http.createServer(app);

httpServer.on('error', function (err, req, res) {
    switch(err.code) {
        case 'EADDRINUSE':
             console.log("Error: Can't start server. Port " + settings.listenPort + " is already in use.");
            break;
        default:
            console.log("Unhandled exception occurred, stack trace:\n");
            console.log(err.stack);
            break;
    }
});

httpServer.listen(settings.listenPort, function() {
    console.log("Server listening on port "+settings.listenPort);
});

