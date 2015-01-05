/*
 * Copyright (c) 2011-2014 Chris McCormick, Sébastien Piquemal <sebpiq@gmail.com>
 *
 *  This file is part of WebPd. See https://github.com/sebpiq/WebPd for documentation
 *
 *  WebPd is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  WebPd is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with WebPd.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
var _ = require('underscore')
  , expect = require('chai').expect
  , utils = require('../core/utils')
  , PdObject = require('../core/PdObject')
  , Patch = require('../core/Patch')
  , pdGlob = require('../global')
  , portlets = require('./portlets')

exports.declareObjects = function(library) {

  library['receive'] = PdObject.extend(utils.NamedMixin, {

    type: 'receive',

    outletDefs: [portlets.Outlet],
    abbreviations: ['r'],

    init: function(args) {
      var name = args[0]
        , onMsgReceived = this._messageHandler()
      this.on('change:name', function(oldName, newName) {
        if (oldName) pdGlob.emitter.removeListener('msg:' + oldName, onMsgReceived)
        pdGlob.emitter.on('msg:' + newName, onMsgReceived)
      })
      this.setName(name)
    },

    _messageHandler: function(args) {
      var self = this
      return function(args) {
        self.outlets[0].message(args)
      }
    }

  })

  library['send'] = PdObject.extend(utils.NamedMixin, {

    type: 'send',

    inletDefs: [

      portlets.Inlet.extend({
        message: function(args) {
          pdGlob.emitter.emit('msg:' + this.obj.name, args)
        }
      })

    ],

    abbreviations: ['s'],

    init: function(args) { this.setName(args[0]) }

  })

  library['msg'] = PdObject.extend({

    type: 'msg',

    doResolveArgs: false,

    inletDefs: [

      portlets.Inlet.extend({
        message: function(args) {
          // For some reason in Pd $0 in a message is always 0.
          args = args.slice(0)
          args.unshift(0)
          this.obj.outlets[0].message(this.obj.resolver(args))
        }
      })

    ],

    outletDefs: [portlets.Outlet],

    init: function(args) {
      this.resolver = utils.getDollarResolver(args)
    }

  })

  library['print'] = PdObject.extend({

    type: 'print',

    inletDefs: [

      portlets.Inlet.extend({
        message: function(args) {
          console.log(this.obj.prefix ? [this.obj.prefix].concat(args) : args)
        }
      })

    ],

    init: function(args) {
      this.prefix = (args[0] || 'print');
    }

  })

  library['pd'] = Patch

}
