var express = require('express')
var router = express.Router()
var postReq = null
var RallyService = require('../services/rallyService.js')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('unit tests GET method')
})

router.post('/', function(req, res, next) {
  var rallyService = new RallyService()
  // set the request object to the postReq object, so it is at the module scope and we can reference it in a callback function.
  postReq = req
  /* get Rally connection setup */
  var rallyAPI = getAPI()

  // make sure we've got the correct params
  var args = process.argv.slice(2)
  var isValidParams = rallyService.checkParamsForCopy(args, rallyAPI)
  if (!isValidParams) {
    console.log('usage: rallyUtil copyTestFolders sourceFolder targetFolder')
  }

  // test -  get the list of top level folders in our test plan
  // getTestFolders(rallyAPI);

  // write the unit tests  results out to the appropriate test runs in Rally
  writeTestResults(rallyAPI)

  res.send('unit tests POST method succeeded!')
})

function getAPI() {
  var rally = require('rally'),
    restApi = rally({
      //user: 'george.florentine@fdiinc.com', //required if no api key, defaults to process.env.RALLY_USERNAME
      //pass: 'triguy91', //required if no api key, defaults to process.env.RALLY_PASSWORD
      apiKey: '_p9e20JT5QamxQVJhUAsR0zWEZsKTRkB9ihDS4BBsIc',
      //apiKey: '_12fj83fjk...', //preferred, required if no user/pass, defaults to process.env.RALLY_API_KEY
      apiVersion: 'v2.0', //this is the default and may be omitted
      server: 'https://rally1.rallydev.com', //this is the default and may be omitted
      requestOptions: {
        headers: {
          'X-RallyIntegrationName': 'Rally/React test integration', //while optional, it is good practice to
          'X-RallyIntegrationVendor': 'FDI', //provide this header information
          'X-RallyIntegrationVersion': '0.1'
        }
        //any additional request options (proxy options, timeouts, etc.)
      }
    })
  return restApi
}
function getTestFolders(rallyAPI) {
  var objectToRead = '/testfolder/262051648568'

  // NOTE: this is a hard coded object id, probably should query for folder name
  var results = 0
  results = rallyAPI.get(
    {
      ref: objectToRead, //may be a ref ('/defect/1234') or an object with a _ref property
      fetch: ['_ref', '_refObjectName'], //fields to fetch
      scope: {
        workspace: '/workspace/566885'
      },
      requestOptions: {} //optional additional options to pass through to request
    },
    function(error, result) {
      if (error) {
        console.log(error)
      } else {
        console.log(result.Object)
      }
    }
  )
}

function writeTestResults(restApi) {
  // get the date in ISO 8601 format
  var date = new Date()
  var isoDate = date.toISOString()
  var note = new Object()
  var unitTestResults = 'Fail'

  // DEBUG: dump the json we got in the POST request
  //dumpJSON(postReq.body);

  // NOTE: need to extract the test case name from the JSON data we received and then find the ID of the TC.
  // right now we're putting all  test results under one test case, which is  too course  grained. We
  // like  to  associate a  group of unit test results  to  specific unit tesss so  we can see  what areas
  // of the system have passing/failing unit  tests
  var results = generateTestResults(postReq.body, note)
  if (results) {
    unitTestResults = 'Pass'
  }

  restApi.create(
    {
      type: 'testcaseresult', //the type to create
      data: {
        Name: 'UnitTestIntegrationTestResult', //the data with which to populate the new object
        TestCase: 'https://rally1.rallydev.com/slm/webservice/v2.0/testcase/260569786444',
        Verdict: unitTestResults,
        Date: isoDate,
        Build: 'integration testing',
        Notes: note.results
      },
      fetch: ['FormattedID'], //the fields to be returned on the created object
      scope: {
        workspace: '/workspace/12345' //optional, only required if creating in non-default workspace
      },
      requestOptions: {} //optional additional options to pass through to request
    },
    function(error, result) {
      if (error) {
        console.log(error)
      } else {
        console.log(result.Object)
      }
    }
  )
}
function dumpJSON(unitTestResultsJSON, noteResult) {
  for (var exKey in unitTestResultsJSON) {
    console.log('key:' + exKey + ', value:' + unitTestResultsJSON[exKey])
  }
}
function generateTestResults(unitTestResultsJSON, noteResult) {
  var results = ''
  var pass = false

  // HACK: this is  brittle, need  a better  way of determing what  info  we  use from  the test result
  var i = 0
  for (exKey in unitTestResultsJSON) {
    results += exKey + ': ' + unitTestResultsJSON[exKey] + ', '
    if (exKey == 'success') {
      if (unitTestResultsJSON[exKey]) {
        pass = true
      }
    }
    // only need the first 11 items
    if (i == 11) {
      break
    }
    i++
  }
  noteResult.results = results
  return pass
}

module.exports = router
