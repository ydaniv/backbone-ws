(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['backbone'], function (root, Backbone) {
            factory(root, Backbone);
        });
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(root, require('backbone'));
    } else {
        // Browser globals
        factory(root, root.Backbone);
    }
}(this, function (root, Backbone) {

    var ajaxSync = Backbone.sync;

    Backbone.sync = function (method, model, options) {
        if ( options.xhr ) {
            return ajaxSync.call(Backbone, method, model, options);
        }

        var data;

        data = options.data || options.attrs || model.toJSON(options);

        if (!data.method) {
            data.method = method;
        }

        if (typeof options.beforeSend == 'function') {
            options.beforeSend.apply(this, arguments);
        }

        if ( Backbone.ws.socket ) {
            Backbone.ws.socket.send(JSON.stringify(data));
        }
        else {
            throw new Error('WebSocket not opened yet!');
        }

        model.trigger('request', model, ws, options);
        // returns nothing!
    };

    Backbone.ws = Backbone.Event.extend({
        typeAttribute: 'type',
        dataAttribute: 'data',
        reopen: true,
        socket: null,
        url: '',
        protocol: '',
        open: function (url, protocol) {
            var ws = Backbone.ws.socket = new root.WebSocket(url, protocol),
                type_attr = Backbone.ws.typeAttribute,
                data_attr = Backbone.ws.dataAttribute;

            if ( url ) {
                Backbone.ws.url = url;
            }
            if ( protocol ) {
                Backbone.ws.protocol = protocol;
            }

            ws.onopen = function () {
                Backbone.ws.trigger('open');
            };

            ws.onmessage = function (event) {
                var data = JSON.parse(event.data);

                Backbone.ws.trigger('message', data);

                if (type_attr && data[type_attr]) {
                    data = data_attr && type_attr in data ? data[data_attr] : data;

                    Backbone.ws.trigger('message:' + data[type_attr], data);
                }
            };

            ws.onerror = function () {
                Backbone.ws.trigger('error');
            };

            ws.onclose = function (code, reason, wasClean) {
                Backbone.ws.trigger('close', code, reason, wasClean);

                if (Backbone.ws.reopen) {
                    Backbone.ws.open(Backbone.ws.url, Backbone.ws.protocol);
                }
            };
        }
    });
}));
