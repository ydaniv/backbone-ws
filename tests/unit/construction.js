(function (root, factory) {
    define([
        'intern!object',
        'intern/chai!assert',
        'backbone',
        'backbone-ws',
        'mocks'
    ], function (registerSuite, assert, Backbone, WS, server) {
        return factory(root, registerSuite, assert, Backbone, WS, server);
    });
}(this, function (root, registerSuite, assert, Backbone, WS, server) {

    registerSuite(function () {
        var SERVER_WS_URL = 'ws://localhost:8090',
            model;

        var WebSocketConstructor = this.WebSocket;

        return {
            name                                     : 'Construction',
            beforeEach                               : function () {
                model = new Backbone.Model();
            },
            afterEach                                : function () {
                model.destroy();
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
                                    'ws:open'   : dfd.resolve
                                }
                            }
                        ]
                    });
                assert.include(instance.resources, model);
                instance.send({ topic: 'world' });
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
                        'ws:message'      : dfd.resolve
                    });

                instance.send({ topic: 'late' });
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
                        'ws:message'           : dfd.resolve
                    });

                instance.send({ topic: 'something' });
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
                        'ws:message': dfd.resolve
                    });

                instance.send({ topic: 'world' });
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
                        'ws:message': dfd.resolve
                    });

                model.flip({ topic: 'world' });
                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                    assert.isTrue(instance.isOpen);
                });
            },
            'test reopen'                            : function () {
                var instance = WS(SERVER_WS_URL, {
                        reopenTimeout: 1
                    }),
                    dfd = this.async(100, 3);

                instance.bind(
                    model,
                    {
                        'ws:open' : function () {
                            assert.isTrue(instance.isOpen);
                            dfd.resolve();
                        },
                        'ws:close': function () {
                            assert.isFalse(instance.isOpen);
                            dfd.resolve();
                        }
                    });

                dfd.promise.then(function () {
                    assert.isTrue(instance.isOpen);
                });
                server.close();
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
                        'ws:message': dfd.resolve
                    });

                model.send({ topic: 'late' });
            },
            'construct with sync'                    : function () {
                var dfd = this.async(100, 2),
                    instance = WS(SERVER_WS_URL, {
                        sync     : true,
                        resources: [
                            {
                                resource: model,
                                events  : {
                                    'ws:message': dfd.resolve
                                }
                            }
                        ]
                    });
                model.on('request', function (m, socket, options) {
                    assert.strictEqual(m, model);
                    assert.strictEqual(socket, instance.socket);
                    dfd.resolve();
                });
                model.save({ topic: 'world' });
                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                });
            },
            'construct with sync and xhr option true': function () {
                var instance = WS(SERVER_WS_URL, {
                    sync     : true,
                    resources: [
                        {
                            resource: model,
                            events  : {
                                'ws:message': function () {
                                    assert(false);
                                }
                            }
                        }
                    ]
                });
                assert.throws(function () {
                    model.save({ topic: 'world' }, { xhr: true });
                }, Error);
            },
            'construct with retries'                 : function () {
                var dfd = this.async(100, 7),
                    instance = WS(SERVER_WS_URL, {
                        retries      : 2,
                        reopenTimeout: 1,
                        resources    : [
                            {
                                resource: model,
                                events  : {
                                    'ws:close': function () {
                                        dfd.resolve();
                                    },
                                    'ws:open' : function () {
                                        dfd.resolve();
                                        server.close();
                                    },
                                    'ws:noretries': function () {
                                        dfd.resolve();
                                    }
                                }
                            }
                        ]
                    });
            }
            //'test route *'                : function () {
            //    var dfd = this.async(1000, 2),
            //        instance = WS(SERVER_WS_URL, {
            //            typeAttribute: 'topic',
            //            routes       : {
            //                '*': function (topic, data) {
            //                    assert.equal(topic, 'ws:message:polly');
            //                    assert.propertyVal(data, 'message', 'parrot');
            //                    dfd.resolve();
            //                }
            //            }
            //        });
            //
            //    instance.bind(
            //        model,
            //        {
            //            'ws:message': dfd.resolve
            //        });
            //
            //    model.send({ topic: 'late' });
            //}
        };
    });
}));
