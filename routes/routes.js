var express = require('express');
var router = express.Router();
var fs = require('fs');
var archiver = require('archiver');
const { check, validationResult } = require('express-validator');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Web To Android-as-JSON Converter' });
    console.log("User at homepage");
});

/* GET Zip file. */
router.get('/download', function(req, res, next) {
    res.download('WebToAndroid_Project.zip');
    console.log("User getting Zip file");
});

//Set up POST handler for URL input by user
router.post('/convert', [
    // input must be URL
    check('url_input').isURL().withMessage('Input MUST be a valid URL'),
    // input must not be empty
    check('url_input').isLength({ min: 1 }).withMessage('URL should not be empty')
], function(req, res) {

    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    var url_input = req.body.url_input;
    var jason_url_property = "{{ #if $jason.url.indexOf('" + url_input + "') == -1 }}";
    var data = {};

    data = {
        "$jason": {
            "head": {
                "title": "External - Links",
                "description": "Opens tab if external link",
                "actions": {
                    "handleLink": [{
                            [`{{#if $jason.url.indexOf('${url_input}') == -1 }}`]: {
                                "type": "$href",
                                "options": {
                                    "url": "{{$jason.url}}",
                                    "view": "web"
                                }
                            }
                        },
                        {
                            "{{#else}}": {
                                "type": "$default"
                            }
                        }
                    ]
                }
            },
            "body": {
                "background": {
                    "type": "html",
                    "url": "" + url_input + "",
                    "action": {
                        "trigger": "handleLink"
                    }
                }
            }
        }
    };

    var json = JSON.stringify(data);

    //Write JSON file
    fs.writeFileSync('WebToAndroid_Project/app/src/main/assets/file/hello.json', json, function(err) {
        if (err) throw err;
        console.log('Saved!');
    });

    //Create Zip

    // create a file to stream archive data to.
    var output = fs.createWriteStream('WebToAndroid_Project.zip');
    var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');

        res.render('convert', {
            url_to_convert: url_input,
            title: 'Web To Android-as-JSON Conversion Complete',
            button_visibility: true
        });


    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
        console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
        throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);
    archive.directory('WebToAndroid_Project', false);
    archive.finalize();

    console.log(`URL is %{url_input}`);
    console.log(data);
    console.log(json);




});

module.exports = router;
