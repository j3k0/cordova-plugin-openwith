/* global describe it beforeEach */
var openwith = require('./openwith')
var expect = require('expect.js')

describe('openwith', () => {
  var cordovaExecArgs

  var cordovaExecCallTo = function (method) {
    return cordovaExecArgs[method]
  }

  // cordova fail-over (to run tests)
  var fakeCordova = () => {
    return {
      exec: function (successCallback, errorCallback, targetObject, method, args) {
        cordovaExecArgs[method] = {
          successCallback: successCallback,
          errorCallback: errorCallback,
          targetObject: targetObject,
          method: method,
          args: args
        }
      }
    }
  }

  beforeEach(() => {
    // start each test from a clean state
    openwith.reset()

    // setup a fake cordova engine
    openwith.setCordova(fakeCordova())

    // disable all logging
    openwith.setLogger(() => {})
    // openwith.setVerbosity(0)

    cordovaExecArgs = {}
  })

  describe('.about()', () => {
    it('is a function', () => expect(openwith.about).to.be.a('function'))
    it('returns a string', () => expect(openwith.about()).to.be.a('string'))
  })

  describe('.init()', () => {
    it('is a function', () => expect(openwith.init).to.be.a('function'))
    it('can only be called once', () => {
      expect(openwith.init).withArgs(null, null).to.not.throwError()
      expect(openwith.init).withArgs(null, null).to.throwError()
    })
    it('accepts a success and error callback', () => {
      var success = () => {}
      var error = () => {}
      expect(openwith.init).withArgs(success, error).to.not.throwError()
    })
    it('rejects bad argument types', () => {
      var cb = () => {}
      expect(openwith.init).withArgs(cb, 1).to.throwError()
      expect(openwith.init).withArgs(1, cb).to.throwError()
    })
  })

  describe('.getVerbosity()', () => {
    it('is a function', () => expect(openwith.getVerbosity).to.be.a('function'))
    it('returns the verbosity level', () => expect(openwith.getVerbosity()).to.be.a('number'))
  })

  describe('.setVerbosity()', () => {
    it('is a function', () => expect(openwith.setVerbosity).to.be.a('function'))
    it('accepts only valid verbosity levels', () => {
      expect(openwith.setVerbosity).withArgs(openwith.DEBUG).to.not.throwError()
      expect(openwith.setVerbosity).withArgs(openwith.INFO).to.not.throwError()
      expect(openwith.setVerbosity).withArgs(openwith.WARN).to.not.throwError()
      expect(openwith.setVerbosity).withArgs(openwith.ERROR).to.not.throwError()
      expect(openwith.setVerbosity).withArgs(999).to.throwError()
    })
    it('changes the verbosity level', () => {
      openwith.setVerbosity(openwith.DEBUG)
      expect(openwith.getVerbosity()).to.equal(openwith.DEBUG)
      openwith.setVerbosity(openwith.INFO)
      expect(openwith.getVerbosity()).to.equal(openwith.INFO)
      openwith.setVerbosity(openwith.WARN)
      expect(openwith.getVerbosity()).to.equal(openwith.WARN)
      openwith.setVerbosity(openwith.ERROR)
      expect(openwith.getVerbosity()).to.equal(openwith.ERROR)
    })
    it('changes the native verbosity level', () => {
      openwith.setVerbosity(openwith.INFO)
      expect(cordovaExecCallTo('setVerbosity')).to.be.ok()
      expect(cordovaExecCallTo('setVerbosity').args).to.eql([ openwith.INFO ])
    })
  })

  describe('.numHandlers', () => {
    it('is a function', () => expect(openwith.numHandlers).to.be.a('function'))
    it('returns the number of handlers', () => {
      expect(openwith.numHandlers()).to.be.a('number')
      expect(openwith.numHandlers()).to.equal(0)
    })
  })

  describe('.addHandler', () => {
    it('is a function', () => expect(openwith.addHandler).to.be.a('function'))
    it('accepts only a function as argument', () => {
      expect(openwith.addHandler).withArgs(() => {}).to.not.throwError()
      expect(openwith.addHandler).withArgs('nope').to.throwError()
    })
    it('increases the number of handlers', () => {
      expect(openwith.numHandlers()).to.equal(0)
      openwith.addHandler(() => {})
      expect(openwith.numHandlers()).to.equal(1)
    })
    it('refuses to add the same handler more than once', () => {
      const handler = () => {}
      expect(openwith.numHandlers()).to.equal(0)
      openwith.addHandler(handler)
      expect(openwith.numHandlers()).to.equal(1)
      expect(openwith.addHandler).withArgs(handler).to.throwError()
      expect(openwith.numHandlers()).to.equal(1)
    })
  })

  describe('new file received', () => {
    var onNewFile
    var myHandlersArgs
    var myHandlers

    // test what happens for received files,
    // this requires to hack into some internal, to trigger a new file event
    beforeEach(() => {
      // There is the hack, we know that the onNewFile callback is expected by the
      // native side as argument 0 of the init function
      openwith.init()
      onNewFile = cordovaExecCallTo('setHandler').successCallback
      // setup 2 handlers
      myHandlersArgs = [undefined, undefined]
      myHandlers = [
        function () { myHandlersArgs[0] = arguments },
        function () { myHandlersArgs[1] = arguments }
      ]
    })

    it('triggers all registered handlers', () => {
      // register handlers, check that they haven't been called yet
      myHandlers.forEach(openwith.addHandler)
      myHandlersArgs.forEach((args) => {
        expect(args).to.not.be.ok()
      })

      // trigger a new file event and check that the handlers have been called
      var newFile = { test: 1 }
      onNewFile(newFile)
      myHandlersArgs.forEach((args) => {
        expect(args).to.be.ok()
        expect(args[0]).to.equal(newFile)
      })

      // do it again with another pseudo "file"
      var newFile2 = { test: 2 }
      onNewFile(newFile2)
      myHandlersArgs.forEach((args) => {
        expect(args[0]).to.equal(newFile2)
      })
    })

    it('triggers for handlers added after the new file is received', () => {
      var newFile = { test: 3 }
      onNewFile(newFile)
      myHandlers.forEach(openwith.addHandler)
      myHandlersArgs.forEach((args) => {
        expect(args).to.be.ok()
        expect(args[0]).to.equal(newFile)
      })
    })
  })
})
