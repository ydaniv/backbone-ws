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
        var server = mocks.server,
            SERVER_WS_URL = mocks.url,
            model = new Backbone.Model(),
            ws;

        return {
            name                                                    : 'Methods',
            beforeEach                                              : function () {
                ws = WS(SERVER_WS_URL);
            },
            afterEach                                               : function () {
                ws.socket && ws.unbind(model);
                ws = null;
            },
            'test bind'                                             : function () {
                var dfd = this.async(100);
                ws.bind(
                    model,
                    {
                        'ws:message': dfd.resolve
                    });

                assert.include(ws.resources, model);
                ws.send({ topic: 'world' });
                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                });
            },
            'test bind with default events'                         : function () {
                var dfd = this.async(100);
                ws.bind(model);
                model.on('ws:message', model.set);
                assert.include(ws.resources, model);

                ws.send({ topic: 'world' });

                dfd.promise.then(function () {
                    assert.equal(model.get('message'), 'hello');
                });
                dfd.resolve();
            },
            'test bind with default events and type/data attributes': function () {
                var dfd = this.async(100);
                ws.bind(model);
                model.on('ws:message:answer', model.set);
                assert.include(ws.resources, model);

                ws.send({ topic: 'question' });

                dfd.promise.then(function () {
                    assert.equal(model.get('everything'), 42);
                });
                dfd.resolve();
            },
            'test unbind'                                           : function () {
                var dfd = this.async(100),
                    another_model = new Backbone.Model();
                ws.bind(
                    model,
                    {
                        'ws:message': dfd.reject
                    });
                ws.bind(
                    another_model,
                    {
                        'ws:message': dfd.resolve
                    });
                ws.unbind(model);
                assert.include(ws.resources, another_model);
                assert.notInclude(ws.resources, model);
                ws.send({ topic: 'world' });
                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'message', 'hello');
                    ws.unbind(another_model);
                });
            },
            'test destroy'                                          : function () {
                var dfd = this.async(100);
                ws.bind(
                    model,
                    {
                        'ws:close': dfd.resolve
                    });
                ws.destroy();
                assert.isNull(ws.socket);
                assert.notInclude(ws.resources, model);
            },
            'test destroy called after last resource unbound'       : function () {
                var dfd = this.async(100);
                ws.bind(
                    model,
                    {
                        'ws:close': dfd.resolve
                    });
                ws.unbind(model);
                assert.isNull(ws.socket);
                assert.notInclude(ws.resources, model);
                dfd.resolve();
            },
            'test sync'                                             : function () {
                var dfd = this.async(100),
                    request_triggered = false;
                ws.useSync = true;
                ws.bind(
                    model,
                    {
                        'ws:message': dfd.resolve
                    });

                assert.include(ws.resources, model);
                model.on('request', function () {
                    request_triggered = true;
                });
                model.save({ topic: 'world' });
                dfd.promise.then(function (message) {
                    assert.isTrue(request_triggered);
                    assert.propertyVal(message, 'message', 'hello');
                });
            },
            'test route'                                            : function () {
                var dfd = this.async(100),
                    events = {};

                ws.routes = {
                    'ws:message:jump': function (topic, data) {
                        return 'ws:message:' + data.id;
                    }
                };

                events['ws:message:' + model.cid] = dfd.resolve;

                ws.bind(
                    model,
                    events);

                server.send('{"type":"jump","data":{"id":"' + model.cid + '","get":"down"}}');
                dfd.promise.then(function (message) {
                    assert.propertyVal(message, 'get', 'down');
                });
            },
            'test assert'                                           : function () {
                assert(ws.assert(), 'Asserting there`s no expectation failed.');

                ws.expectation = function (data) {
                    return data === true;
                };
                assert(ws.assert(true), 'Asserting function expectation failed.');

                ws.expectation = 'yo!';
                assert(ws.assert({ type: 'yo!' }), 'Asserting type expectation failed.');

                ws.expectation = 'yo!';
                assert(ws.assert('yo!'), 'Asserting string data expectation failed.');

                ws.expectation = { yo: 'ho!' };
                assert(ws.assert({ yo: 'ho!' }), 'Asserting data Object expectation failed.');
                //},
                //'test expect'                                           : function () {
                //TBD
            }
        };
    });
}));
