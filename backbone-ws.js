(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define(['backbone'], function (Backbone) {
            return factory(root, Backbone);
        });
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        return factory(root, require('backbone'));
    }
    else {
        // Browser globals
        factory(root, root.Backbone);
    }
}(this, function (root, Backbone) {

    var ajaxSync = Backbone.sync;

    function WS (resource, url, options) {
        if ( ! resource ) throw new Error('Resource not provided.');
        if ( ! url ) throw new Error('URL not provided.');
        if ( ! (this instanceof WS) ) return new WS(resource, url, options);

        this.options = options = options || {};
        this.url = url;

        this.typeAttribute = options.typeAttribute || 'type';
        this.dataAttribute = options.dataAttribute || 'data';
        this.reopen = 'reopen' in options ? options.reopen : true;
        this.resource = resource;

        if ( resource instanceof Backbone.Model ) {
            resource.on('destroy', this.destroy, this);
        }

        resource[options.sendAttribute || 'send'] = this.send.bind(this);

        if ( options.sync ) {
            resource.sync = this.sync.bind(this);
        }

        this.open();
    }

    WS.prototype.open = function () {
        this.socket = this.options.protocol ?
                      new root.WebSocket(this.url, this.options.protocol) :
                      new root.WebSocket(this.url);
        this.socket.onopen = this.onopen.bind(this);
        this.socket.onmessage = this.onmessage.bind(this);
        this.socket.onerror = this.onerror.bind(this);
        this.socket.onclose = this.onclose.bind(this);
    };

    WS.prototype.onopen = function () {
        this.resource.trigger('open');
    };

    WS.prototype.onmessage = function (event) {
        var data = JSON.parse(event.data),
            type = this.typeAttribute && data[this.typeAttribute];

        if ( type ) {
            data = this.dataAttribute ? data[this.dataAttribute] : data;

            this.resource.trigger('message:' + type, data);
        }

        this.resource.trigger('message', data, type);
    };

    WS.prototype.onerror = function () {
        this.resource.trigger('wserror');
    };

    WS.prototype.onclose = function (code, reason, wasClean) {
        this.resource.trigger('close', code, reason, wasClean);

        if ( !this.reopen ) {
            this.open();
        }
    };

    WS.prototype.destroy = function () {
        this.socket.close();
        this.socket = null;
        this.resource = null;
    };

    WS.prototype.send = function (data) {
        if ( this.socket ) {
            this.socket.send(JSON.stringify(data));
        }
        else {
            throw new Error('WebSocket not opened yet!');
        }
    };

    WS.prototype.sync = function (method, model, options) {
        if ( options.xhr ) {
            return ajaxSync.call(Backbone, method, model, options);
        }

        var data;

        data = options.data || options.attrs || model.toJSON(options);

        if ( ! data.method ) {
            data.method = method;
        }

        if ( typeof options.beforeSend == 'function' ) {
            options.beforeSend.apply(model, arguments);
        }

        this.send(data);

        model.trigger('request', model, this.socket, options);
        // returns nothing!
    };

    Backbone.WS = WS;

    return WS;
}));
