/* global cordova */
exports.defineAutoTests = function () {
  describe('openwith', () => {

    beforeEach(() => {
      // start each test from a clean state
      cordova.openwith.reset()

      // disable all logging
      cordova.openwith.setLogger(() => { })
      // cordova.openwith.setVerbosity(0)

      cordovaExecArgs = {}
    })

    describe('.about()', () => {
      it('is defined', () => expect(cordova.openwith.about).toBeDefined())
    })

    describe('.init()', () => {
      it('is a function', () => expect(cordova.openwith.init).toBeDefined())

      beforeEach(function () {
        spyOn(cordova.openwith, 'init')

        cordova.openwith.init()
        cordova.openwith.init()
      })

      it('can only be called once', () => {
        expect(cordova.openwith.init).toHaveBeenCalledTimes(1)
      })
    })

    describe('.init()', () => {
      beforeEach(function () {
        spyOn(cordova.openwith, 'init')

        var success = () => { }
        var error = () => { }
        cordova.openwith.init(success, error)
      })

    })
    it('accepts a success and error callback', () => {
      expect(cordova.openwith.init).toHaveBeenCalled()
    })
  })

  describe('.init()', () => {
    beforeEach(function () {
      spyOn(cordova.openwith, 'init')

      var cb = () => { }
      cordova.openwith.init(cb, 1)
      cordova.openwith.init(1, cb)
    })

    it('rejects bad argument types', () => {
      expect(cordova.openwith.init).toHaveBeenCalledTimes(0)
    })
  })

  describe('.getVerbosity()', () => {
    it('is a function', () => expect(cordova.openwith.getVerbosity).toBeDefined())
    it('returns the verbosity level', () => expect(cordova.openwith.getVerbosity()).toBeGreaterThanOrEqual(0))
  })
}