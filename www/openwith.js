function initOpenwithPlugin (root) {
  'use strict'

  // imports
  // var cordova = require('cordova')

  var PLUGIN_NAME = 'OpenWithPlugin'

  // the returned object
  var openwith = {}

  //
  // exported constants
  //

  // logging levels
  var DEBUG = openwith.DEBUG = 0
  var INFO = openwith.INFO = 10
  var WARN = openwith.WARN = 20
  var ERROR = openwith.ERROR = 30

  // actions
  openwith.SEND = 'SEND'
  openwith.VIEW = 'VIEW'

  //
  // state variables
  //

  // default verbosity level is to show errors only
  var verbosity

  // list of registered handlers
  var handlers

  // list of intents sent to this app
  //
  // it's never cleaned up, so that newly registered handlers (especially those registered a bit too late)
  // will still receive the list of intents.
  var intents

  // the logger function (defaults to console.log)
  var logger

  // the cordova object (defaults to global one)
  var cordova

  // has init() been called or not already
  var initCalled

  // make sure a number is displayed with 2 digits
  var twoDigits = function (n) {
    return n < 10
      ? '0' + n
      : '' + n
  }

  // format a date for display
  var formatDate = function (now) {
    var date = now ? new Date(now) : new Date()
    var d = [date.getMonth() + 1, date.getDate()].map(twoDigits)
    var t = [date.getHours(), date.getMinutes(), date.getSeconds()].map(twoDigits)
    return d.join('-') + ' ' + t.join(':')
  }

  // format verbosity level for display
  var formatVerbosity = function (level) {
    if (level <= DEBUG) return 'D'
    if (level <= INFO) return 'I'
    if (level <= WARN) return 'W'
    return 'E'
  }

  // display a log in the console only if the level is higher than current verbosity
  var log = function (level, message) {
    if (level >= verbosity) {
      logger(formatDate() + ' ' + formatVerbosity(level) + ' openwith: ' + message)
    }
  }

  // reset the state to default
  openwith.reset = function () {
    log(DEBUG, 'reset')
    verbosity = openwith.INFO
    handlers = []
    intents = []
    logger = console.log
    cordova = root.cordova
    initCalled = false
  }

  // perform the initial reset
  openwith.reset()

  // change the logger function
  openwith.setLogger = function (value) {
    logger = value
  }

  // change the cordova object (mostly for testing)
  openwith.setCordova = function (value) {
    cordova = value
  }

  // change the verbosity level
  openwith.setVerbosity = function (value) {
    log(DEBUG, 'setVerbosity()')
    if (value !== DEBUG && value !== INFO && value !== WARN && value !== ERROR) {
      throw new Error('invalid verbosity level')
    }
    verbosity = value
    cordova.exec(null, null, PLUGIN_NAME, 'setVerbosity', [value])
  }

  // retrieve the verbosity level
  openwith.getVerbosity = function () {
    log(DEBUG, 'getVerbosity()')
    return verbosity
  }

  // a simple function to test that the plugin is correctly installed
  openwith.about = function () {
    log(DEBUG, 'about()')
    return 'cordova-plugin-openwith, (c) 2017 fovea.cc'
  }

  var findHandler = function (callback) {
    for (var i = 0; i < handlers.length; ++i) {
      if (handlers[i] === callback) {
        return i
      }
    }
    return -1
  }

  // registers a intent handler
  openwith.addHandler = function (callback) {
    log(DEBUG, 'addHandler()')
    if (typeof callback !== 'function') {
      throw new Error('invalid handler function')
    }
    if (findHandler(callback) >= 0) {
      throw new Error('handler already defined')
    }
    handlers.push(callback)
    intents.forEach(function handleIntent (intent) {
      callback(intent)
    })
  }

  openwith.numHandlers = function () {
    log(DEBUG, 'numHandler()')
    return handlers.length
  }

  openwith.load = function (dataDescriptor, successCallback, errorCallback) {
    var loadSuccess = function (base64) {
      dataDescriptor.base64 = base64
      if (successCallback) {
        successCallback(base64, dataDescriptor)
      }
    }
    var loadError = function (err) {
      if (errorCallback) {
        errorCallback(err, dataDescriptor)
      }
    }
    if (dataDescriptor.base64) {
      loadSuccess(dataDescriptor.base64)
    } else {
      cordova.exec(loadSuccess, loadError, PLUGIN_NAME, 'load', [dataDescriptor])
    }
  }

  openwith.exit = function () {
    log(DEBUG, 'exit()')
    cordova.exec(null, null, PLUGIN_NAME, 'exit', [])
  }

  var onNewIntent = function (intent) {
    log(DEBUG, 'onNewIntent(' + intent.action + ')')
    // process the new intent
    handlers.forEach(function (handler) {
      handler(intent)
    })
    intents.push(intent)
  }

  // Initialize the native side at startup
  openwith.init = function (successCallback, errorCallback) {
    log(DEBUG, 'init()')
    if (initCalled) {
      throw new Error('init should only be called once')
    }
    initCalled = true

    // callbacks have to be functions
    if (successCallback && typeof successCallback !== 'function') {
      throw new Error('invalid success callback')
    }
    if (errorCallback && typeof errorCallback !== 'function') {
      throw new Error('invalid error callback')
    }

    var initSuccess = function () {
      log(DEBUG, 'initSuccess()')
      if (successCallback) successCallback()
    }
    var initError = function () {
      log(DEBUG, 'initError()')
      if (errorCallback) errorCallback()
    }
    var nativeLogger = function (data) {
      var split = data.split(':')
      log(+split[0], '[native] ' + split.slice(1).join(':'))
    }

    cordova.exec(nativeLogger, null, PLUGIN_NAME, 'setLogger', [])
    cordova.exec(onNewIntent, null, PLUGIN_NAME, 'setHandler', [])
    cordova.exec(initSuccess, initError, PLUGIN_NAME, 'init', [])
  }

  return openwith
}

// Export the plugin object
var openwith = initOpenwithPlugin(this)
module.exports = openwith
this.plugins = this.plugins || {}
this.plugins.openwith = openwith
