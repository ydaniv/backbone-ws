(function (root, factory) {
    define([
        'intern!object',
        'intern/chai!assert',
        'backbone',
        'backbone-ws',
        'mocks'
    ], function (registerSuite, assert, Backbone, WS, mocks) {
        return factory(root, registerSuite, assert, Backbone, WS, mocks);
    });
}(this, function (root, registerSuite, assert, Backbone, WS, mocks) {

    registerSuite(function () {
        var server = mocks.getServer(),
            SERVER_WS_URL = mocks.url,
            model;

        var WebSocketConstructor = this.WebSocket;

        return {
            name                                     : 'Construction',
            beforeEach                               : function () {
                model = new Backbone.Model();
            },
            afterEach                                : function () {
                model.destroy();
                server = server.restart();
            },
            'construct without url'                  : function () {
                function noUrl () {
                    return new WS();
                }

                assert.throws(noUrl, /URL not provided/);
            },
            'construct without new'                  : function () {
                var ws = WS(SERVER_WS_URL);
                assert.instanceOf(ws, WS);
                ws.destroy();
            },
            'open on construction'                   : function () {
                var instance = WS(SERVER_WS_URL),
                    dfd = this.async(100);

                instance.bind(
                    model,
                    {
                        'ws:open': dfd.resolve
                    });

                dfd.promise.then(function () {
                    assert.isTrue(instance.isOpen);
                });
            },
            'construct with resource'                : function () {
                var dfd = this.async(100, 2),
                    instance = WS(SERVER_WS_URL, {
                        resources: [
                            {
                                resource: model,
                                events  : {
                                    'ws:message': dfd.resolve,
                                    'ws:open'   : function () {
                                        dfd.resolve();
                                        instance.send({ topic: 'world' });
                                    }
                                }
                            }
                        ]
                    });
                assert.include(instance.resources, model);
                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                    assert.isTrue(instance.isOpen);
                });
            },
            'construct with typeAttribute'           : function () {
                var instance = WS(SERVER_WS_URL, {
                        typeAttribute: 'topic'
                    }),
                    dfd = this.async(100, 2);

                instance.bind(
                    model,
                    {
                        'ws:message:polly': dfd.resolve,
                        'ws:message'      : dfd.resolve,
                        'ws:open'         : function () {
                            instance.send({ topic: 'late' });
                        }
                    });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'parrot');
                    assert.isTrue(instance.isOpen);
                });
            },
            'construct with dataAttribute'           : function () {
                var instance = WS(SERVER_WS_URL, {
                        dataAttribute: 'info'
                    }),
                    dfd = this.async(100, 2);

                instance.bind(
                    model,
                    {
                        'ws:message:completely': dfd.resolve,
                        'ws:message'           : dfd.resolve,
                        'ws:open'              : function () {
                            instance.send({ topic: 'something' });
                        }
                    });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'different');
                    assert.isTrue(instance.isOpen);
                });
            },
            'construct with keepOpen'                : function () {
                var instance = WS(SERVER_WS_URL, {
                        keepOpen: true
                    }),
                    dfd = this.async(100),
                    old_destroy = instance.destroy;
                instance.destroy = function () {
                    throw new Error('.destroy() called!');
                };

                instance.bind(
                    model,
                    {
                        'ws:message': dfd.resolve,
                        'ws:open'   : function () {
                            instance.send({ topic: 'world' });
                        }
                    });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                    assert.isTrue(instance.isOpen);
                    instance.destroy = old_destroy;
                });
            },
            'construct with sendAttribute'           : function () {
                var instance = WS(SERVER_WS_URL, {
                        sendAttribute: 'flip'
                    }),
                    dfd = this.async(100);

                instance.bind(
                    model,
                    {
                        'ws:message': dfd.resolve,
                        'ws:open'   : function () {
                            model.flip({ topic: 'world' });
                        }
                    });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                    assert.isTrue(instance.isOpen);
                });
            },
            'test reopen'                            : function () {
                var instance = WS(SERVER_WS_URL, {
                        reopenTimeout: 1
                    }),
                    first = true,
                    dfd = this.async(100, 3);

                instance.bind(
                    model,
                    {
                        'ws:open' : function () {
                            assert.isTrue(instance.isOpen);
                            dfd.resolve();
                            if ( first ) {
                                first = false;
                                server = server.restart();
                            }
                        },
                        'ws:close': function () {
                            assert.isFalse(instance.isOpen);
                            dfd.resolve();
                        }
                    });

                dfd.promise.then(function () {
                    assert.isTrue(instance.isOpen);
                });
            },
            'test specific route'                    : function () {
                var dfd = this.async(100, 2),
                    instance = WS(SERVER_WS_URL, {
                        typeAttribute: 'topic',
                        routes       : {
                            'ws:message:polly': function (topic, data) {
                                assert.equal(topic, 'ws:message:polly');
                                assert.propertyVal(data, 'message', 'parrot');
                                dfd.resolve();
                            }
                        }
                    });

                instance.bind(
                    model,
                    {
                        'ws:message': dfd.resolve,
                        'ws:open'   : function () {
                            model.send({ topic: 'late' });
                        }
                    });
            },
            'construct with sync'                    : function () {
                var dfd = this.async(100, 2),
                    instance = WS(SERVER_WS_URL, {
                        sync     : true,
                        resources: [
                            {
                                resource: model,
                                events  : {
                                    'ws:message': dfd.resolve,
                                    'ws:open'   : function () {
                                        model.save({ topic: 'world' });
                                    }
                                }
                            }
                        ]
                    });

                model.on('request', function (m, socket, options) {
                    assert.strictEqual(m, model);
                    assert.strictEqual(socket, instance.socket);
                    dfd.resolve();
                });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                });
            },
            'construct with sync and xhr option true': function () {
                var dfd = this.async(100),
                    instance = WS(SERVER_WS_URL, {
                        sync     : true,
                        resources: [
                            {
                                resource: model,
                                events  : {
                                    'ws:message': function () {
                                        assert(false);
                                    },
                                    'ws:open'   : function () {
                                        assert.throws(function () {
                                            model.save({ topic: 'world' }, { xhr: true });
                                        }, Error);
                                        dfd.resolve();
                                    }
                                }
                            }
                        ]
                    });
            },
            'construct with retries'                 : function () {
                var dfd = this.async(100, 5),
                    first = true,
                    instance = WS(SERVER_WS_URL, {
                        retries      : 1,
                        reopenTimeout: 10,
                        resources    : [
                            {
                                resource: model,
                                events  : {
                                    'ws:close'    : function () {
                                        dfd.resolve();
                                    },
                                    'ws:open'     : function () {
                                        if ( first ) {
                                            first = false;
                                        }
                                        else {
                                            instance.retries = 0;
                                        }
                                        dfd.resolve();
                                        server = server.restart();
                                    },
                                    'ws:noretries': function () {
                                        dfd.resolve();
                                    }
                                }
                            }
                        ]
                    });
            },
            'construct with expect function success' : function () {
                var dfd = this.async(100, 3),
                    instance = WS(SERVER_WS_URL, {
                        expectSeconds: .05,
                        typeAttribute: false,
                        dataAttribute: false,
                        expect       : function (data) {
                            dfd.resolve();
                            return data.message == 'hello';
                        },
                        resources    : [
                            {
                                resource: model,
                                events  : {
                                    'ws:open'     : function () {
                                        instance.send({ topic: 'world' }, true);
                                    },
                                    'ws:timeout'  : function () {
                                        assert(false, 'Timeout reached');
                                    },
                                    'ws:message'  : dfd.resolve,
                                    'ws:fulfilled': dfd.resolve
                                }
                            }
                        ]
                    });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                });
            },
            'construct with expect function fail'    : function () {
                var dfd = this.async(100),
                    instance = WS(SERVER_WS_URL, {
                        expectSeconds: .01,
                        expect       : function (data) {
                            return data.message == 'polly';
                        },
                        resources    : [
                            {
                                resource: model,
                                events  : {
                                    'ws:timeout': dfd.resolve,
                                    'ws:open'   : function () {
                                        instance.send({ topic: 'world' }, true);
                                    }
                                }
                            }
                        ]
                    });
            },
            'construct with expect string success'   : function () {
                var dfd = this.async(100, 2),
                    instance = WS(SERVER_WS_URL, {
                        typeAttribute: 'topic',
                        expect       : 'polly',
                        expectSeconds: .05,
                        resources    : [
                            {
                                resource: model,
                                events  : {
                                    'ws:open'     : function () {
                                        instance.send({ topic: 'late' }, true);
                                    },
                                    'ws:timeout'  : function () {
                                        assert(false, 'Timeout reached');
                                    },
                                    'ws:message'  : dfd.resolve,
                                    'ws:fulfilled': dfd.resolve
                                }
                            }
                        ]
                    });

                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'parrot');
                });
            },
            'construct with expect string fail'      : function () {
                var dfd = this.async(100),
                    instance = WS(SERVER_WS_URL, {
                        typeAttribute: 'topic',
                        expectSeconds: .05,
                        expect       : 'polly',
                        resources    : [
                            {
                                resource: model,
                                events  : {
                                    'ws:timeout': dfd.resolve,
                                    'ws:open'   : function () {
                                        instance.send({ topic: 'world' }, true);
                                    }
                                }
                            }
                        ]
                    });
            },
            'test route *'                           : function () {
                var dfd = this.async(1000, 2),
                    instance = WS(SERVER_WS_URL, {
                        typeAttribute: 'topic',
                        routes       : {
                            '*': function (topic, data) {
                                assert.equal(topic, 'ws:message:polly');
                                assert.propertyVal(data, 'message', 'parrot');
                                dfd.resolve();
                            }
                        }
                    });

                instance.bind(
                    model,
                    {
                        'ws:message': dfd.resolve,
                        'ws:open'   : function () {
                            model.send({ topic: 'late' });
                        }
                    });
            }
        };
    });
}));
