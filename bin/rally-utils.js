#!/usr/bin/env node

/**
 * Module dependencies.
 */
var RallyService = require('../services/rallyService.js')
var rallyService = new RallyService()

//do stuff
var results = rallyService.doWork(process.argv.slice(2))
