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
            model = new Backbone.Model(),
            ws;

        return {
            name                                             : 'Methods',
            beforeEach                                       : function () {
                ws = WS(SERVER_WS_URL);
            },
            afterEach                                        : function () {
                ws.socket && ws.unbind(model);
                ws = null;
            },
            'test bind'                                      : function () {
                var dfd = this.async(1000);
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
            'test unbind'                                    : function () {
                var dfd = this.async(1000),
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
            'test destroy'                                   : function () {
                var dfd = this.async(1000);
                ws.bind(
                    model,
                    {
                        'ws:close': dfd.resolve
                    });
                ws.destroy();
                assert.isNull(ws.socket);
                assert.notInclude(ws.resources, model);
            },
            'test destroy called after last resource unbound': function () {
                var dfd = this.async(1000);
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
            'test sync': function () {
                var dfd = this.async(1000),
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
            'test route': function () {
                var dfd = this.async(1000),
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
            }
        };
    });
}));
