var rally = require('rally')
class RallyService {
  constructor() {
    this.config = require('../config/config.js')
  }

  checkParamsForCopy(args) {
    var paramsOK = false
    if (args.length != 3) {
      console.log('usage: rallyUtil copyTestFolders sourceFolder targetFolder')
    }
    var functionName = args[0]
    switch (functionName) {
      case 'copyTestFolders':
        if (args.length != 3) {
          console.log('usage: rallyUtil copyTestFolders sourceFolder targetFolder')
        }
        paramsOK = true
        break
      default:
        console.log(functionName + ' is not yet implemented')
        break
    }
    return paramsOK
  }
  async doWork(args) {
    if (!this.checkParamsForCopy(args)) {
      return
    }
    switch (args[0]) {
      case 'copyTestFolders':
        await this.getTestFolders(args.slice(1))
        break
    }
  }
  copyTestFolders(args) {
    var rallyAPI = this.getAPI()
    var objectToRead = '/testfolder/2F262051648568'
    var workSpaceID = this.config['workspaceID']

    // NOTE: this is a hard coded object id, probably should query for folder name
    var results = 0
    results = rallyAPI.get(
      {
        ref: objectToRead, //may be a ref ('/defect/1234') or an object with a _ref property
        fetch: ['_ref', '_refObjectName'], //fields to fetch
        scope: {
          workspace: '/workspace/' + workSpaceID
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
  getAPI() {
    var apiConfigKey = this.config['apiKey']
    var rallyServer = this.config['server']
    var version = this.config['version']
    var integrationName = this.config['integrationName']
    var vendor = this.config['vendor']
    var restApi = rally({
      apiKey: apiConfigKey,
      apiVersion: 'v2.0',
      server: rallyServer,
      requestOptions: {
        headers: {
          'X-RallyIntegrationName': integrationName,
          'X-RallyIntegrationVendor': vendor,
          'X-RallyIntegrationVersion': version
        }
        //any additional request options (proxy options, timeouts, etc.)
      }
    })
    return restApi
  }
  async getTestFolders() {
    try {
      var workSpaceID = this.config['workspaceID']
      var sourceFolderID = this.config['sourceFolderID']
      var rallyAPI = this.getAPI()
      var objectToRead = '/testfolder/' + sourceFolderID

      // NOTE: this is a hard coded object id, probably should query for folder name
      var results = 0
      results = await rallyAPI.get({
        ref: objectToRead, //may be a ref ('/defect/1234') or an object with a _ref property
        fetch: ['_ref', '_refObjectName', 'Children'], //fields to fetch
        scope: {
          workspace: '/workspace/' + workSpaceID
        },
        requestOptions: {} //optional additional options to pass through to request
      })
      console.log(results)
      //queryUtils = rally.util.query

      // get the folder object itself
      var testFolders = await rallyAPI.get({
        ref: '/TestFolder/287869866692/Children', //may be a ref ('/defect/1234') or an object with a _ref property
        fetch: ['_ref', '_refObjectName', 'Children'], //fields to fetch
        scope: {
          workspace: '/workspace/' + workSpaceID
        },
        requestOptions: {} //optional additional options to pass through to request})
      })
      console.log(results)
      var folderName
      var folder
      for (var testFolderIdx in testFolders.Object.Results) {
        folder = testFolders.Object.Results[testFolderIdx]
        folderName = folder._refObjectName
        console.log(folderName)
        // look at folder's children
        await this.traverseFolderChildren(rallyAPI, folder)
      }
    } catch (err) {
      console.log(err)
    }
  }
  async traverseFolderChildren(rallyAPI, folder) {
    var workSpaceID = this.config['workspaceID']
    var folder
    var folderName
    // look at children and recurse
    var type = folder._type
    if (type === 'TestFolder') {
      var folderId = folder._ref.substring(folder._ref.indexOf('testfolder/') + 'testfolder/'.length)
      var testFolders = await rallyAPI.get({
        ref: '/TestFolder/' + folderId + '/Children', //may be a ref ('/defect/1234') or an object with a _ref property
        fetch: ['_ref', '_refObjectName', 'Children', 'TestCases'], //fields to fetch
        scope: {
          workspace: '/workspace/' + workSpaceID
        },
        requestOptions: {} //optional additional options to pass through to request})
      })
      console.log(testFolders)
      for (var testFolderIdx in testFolders.Object.Results) {
        folder = testFolders.Object.Results[testFolderIdx]
        folderName = folder._refObjectName
        console.log(folderName)
        // look at folder's children
        if (folder._type === 'TestFolder' && folder.Children.Count > 0) {
          this.traverseFolderChildren(rallyAPI, folder)
        } else {
          // look for test cases
          var testCasePath = folder.TestCases._ref.substring(folder._ref.indexOf('v2.0') + 'v2.0'.length)
          var testCases = await rallyAPI.get({
            ref: testCasePath, //may be a ref ('/defect/1234') or an object with a _ref property
            fetch: ['_ref', '_refObjectName'], //fields to fetch
            scope: {
              workspace: '/workspace/' + workSpaceID
            },
            requestOptions: {} //optional additional options to pass through to request})
          })
          console.log(testCases)
          var testCase
          if (testCases.Object.Results.length > 0) {
            for (var idx in testCases.Object.Results) {
              testCase = testCases.Object.Results[idx]
              console.log(testCase._refObjectName)
            }
          }
        }
      }
    }
  }
}
module.exports = RallyService
