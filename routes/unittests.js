var express = require('express');
var router = express.Router();
var postReq = null;

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('unit tests GET method');
  });

  router.post('/', function(req, res, next) {

    // set the request object to the postReq object, so it is at the module scope and we can reference it in a callback function.
    postReq = req;
    /* get Rally connection setup */
    var rallyAPI = getAPI();

    // test -  get the list of top level folders in our test plan
    getTestFolders(rallyAPI);

    // write the unit tests  results out to the appropriate test runs in Rally
    writeTestResults(rallyAPI);

    res.send('unit tests POST method');
  });

  function getAPI() {
    var rally = require('rally'),
    restApi = rally({
        //user: 'george.florentine@fdiinc.com', //required if no api key, defaults to process.env.RALLY_USERNAME
        //pass: 'triguy91', //required if no api key, defaults to process.env.RALLY_PASSWORD
        apiKey: '_p9e20JT5QamxQVJhUAsR0zWEZsKTRkB9ihDS4BBsIc',
        //apiKey: '_12fj83fjk...', //preferred, required if no user/pass, defaults to process.env.RALLY_API_KEY
        apiVersion: 'v2.0', //this is the default and may be omitted
        server: 'https://rally1.rallydev.com',  //this is the default and may be omitted
        requestOptions: {
            headers: {
                'X-RallyIntegrationName': 'Rally/React test integration',  //while optional, it is good practice to
                'X-RallyIntegrationVendor': 'FDI',             //provide this header information
                'X-RallyIntegrationVersion': '0.1'                    
            }
            //any additional request options (proxy options, timeouts, etc.)     
        }
    });
    return restApi;
  }
  function getTestFolders(rallyAPI) {
    var objectToRead= ('/testfolder/262051648568');

    // make sure we  can find the root unit test folder. 
    // HACK: this is a hard coded object id, probably should query for folder name
    var results = 0;
    results = rallyAPI.get({
        ref: objectToRead, //may be a ref ('/defect/1234') or an object with a _ref property
        fetch: ['_ref', '_refObjectName'], //fields to fetch
        scope: {
            workspace: '/workspace/566885' 
        },
        requestOptions: {} //optional additional options to pass through to request
    
    }, function(error, result) {
        if(error) {
            console.log(error);
        } else {
            console.log(result.Object);

            // ok, we've got the root UnitTest folder. Look at the request object to determine what  folder we should put the test results into
            var payload =  JSON.stringify(postReq.body);
            console.log(" calling application submitted POST with body: " + payload);
        }
    });
  }
  
  function writeTestResults(restApi) {
    restApi.create({
        type: 'testcaseresult', //the type to create
        data: {
            Name: 'UnitTestIntegrationTestResult', //the data with which to populate the new object
            TestCase: 'https://rally1.rallydev.com/slm/webservice/v2.0/testcase/260569786444',
            Verdict: 'Pass',
            Date: '2018-10-24',
            Build: 'integration testing',
            Notes: 'utint2'
        },
        fetch: ['FormattedID'],  //the fields to be returned on the created object
        scope: {
            workspace: '/workspace/12345' //optional, only required if creating in non-default workspace
        },
        requestOptions: {} //optional additional options to pass through to request
    }, function(error, result) {
        if(error) {
            console.log(error);
        } else {
            console.log(result.Object);
        }
    });
  }
  module.exports = router;