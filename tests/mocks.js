define([
    'mock-socket'
], function () {
    var SERVER_WS_URL = 'ws://localhost:8090',
        server;

    // mock WebSocket
    this.WebSocket = this.MockSocket;

    function restart () {
        server.close();
        server = mockServerFactory();
        return server;
    }

    // mock web server factory
    function mockServerFactory () {
        server = new MockServer(SERVER_WS_URL);

        server.on('connection', function (server) {

            server.on('message', function (data) {
                var message = JSON.parse(data);
                if ( message.topic == 'world' ) {
                    server.send('{"message":"hello"}');
                }
                else if ( message.topic == 'late' ) {
                    server.send('{"topic":"polly","data":{"message":"parrot"}}');
                }
                else if ( message.topic == 'something' ) {
                    server.send('{"type":"completely","info":{"message":"different"}}');
                }
                else if ( message.topic == 'question' ) {
                    server.send('{"type":"answer","data":{"everything":42}}');
                }
            });
        });

        server.restart = restart;

        return server;
    }

    function getServer () {
        return server || mockServerFactory();
    }

    return {
        getServer: getServer,
        url      : SERVER_WS_URL
    };
});
