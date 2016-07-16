module.exports = Locations;

var Promise                = require('promise');
var socketRepo             = getRepos('sockets')();
var socketAction           = getSocketActions(io);
var socketLocationsActions = socketAction.init('locations');

/**
 * handle the socket.io's Locations
 *
 * @param io
 * @param socket
 *
 * @returns {Locations}
 * @constructor
 */
function Locations (io, socket) {
    'use strict';

    if (!(this instanceof Locations)) {
        return new Locations(io, socket);
    }

    socket.on('refresh-location', function (data) {
        socketRepo.refreshGeoLocation(socket.id, data.position).then(function (s) {
            // do some action when location refreshed
        }, function (e) {
            console.error(e);
        });
    });

    /**
     * broadcast current socket's info to ther sockets
     * @param sockets
     * @param socketId
     * 
     * @returns {*}
     */
    var broadcastCurrentSocketInfoToOthers = function (sockets, socketIds) {
        return new Promise(function (resolve, reject) {
            // fetch the current socket's info
            socketRepo.fetchSocketsBySocketId(socketId).then(function (socketInfo) {
                // broadcast current socket's info to the audiences
                socketLocationsActions.parent.broadcast(sockets, 'refresh-users-in-map-view', {
                    sockets: socketInfo,
                    diff: [socketId]
                }).then(function () {
                    resolve(true);
                }, reject);
            }, reject);
        });
    };

    /**
     * broadcast diff socket's info to ther sockets
     *
     * @param sockets
     * @param socketId
     *
     * @returns {*}
     */
    var broadcastDiffToOthers = function (sockets, socketIds) {
        return new Promise(function (resolve, reject) {
            socketRepo.transformSocketIdtId([socketIds]).then(function (transSockets) {
                var socketId = transSockets[0].socketId;
                // fetch the current socket's info
                socketRepo.fetchSocketsBySocketId(socketObj.socketId).then(function (socketInfo) {
                    // broadcast current socket's info to the audiences
                    socketLocationsActions.parent.broadcast(sockets, 'refresh-users-in-map-view', {
                        diff: [socketObj.socketId]
                    }).then(function () {
                        resolve(true);
                    }, reject);
                }, reject);
            }.reject);

        });
    };

    var refreshSocketsClientsView = function (socketId, sockets, socketsDiff) {
        return new Promise(function (resolve, reject) {
            // uncomment next line in order to debug the results

            // first step - send to current socket the list of online sockets in this region
            socket.emit('refresh-users-in-map-view', {
                sockets: sockets,
                diff: socketsDiff
            });

            // second step - broadcast too all the users who are in this region
            broadcastCurrentSocketInfoToOthers(sockets, socketId).then(function () {
                // third step - broadcast too all the removed Sockets
                broadcastDiffToOthers(socketsDiff, socket.id).then(function () {
                    resolve(sockets);
                }, reject);
            }, reject);
        });
    };

    var fetchSocketsInsight = function (socketId, center, corners) {
        return new Promise(function (resolve, reject) {
            socketRepo.fetchSocketsInSight(corners, socketId).then(function (sockets) {
                resolve(sockets);
            }, reject);
        });
    };

    /**
     * store insightSockets into socket's audience List
     *
     * @param inSightSockets
     *
     * @returns {*}
     */
    var storeInsightSockets = function (inSightSockets) {
        return new Promise(function (resolve, reject) {
            // store insight sockets into my socket's audience list
            socketRepo.pushSocketsIntoAudienceList(socket.id, inSightSockets).then(function (finalInSightSockets) {
                // store/push my socketId into insight socket's audienceList
                finalInSightSockets.forEach(function (targetAudienceSocketId) {
                    socketRepo.pushSocketsIntoAudienceList(targetAudienceSocketId, [socket.id]);
                });
                
                resolve(finalInSightSockets);
            }, reject);
        });
    };

    /**
     * remove outSightSockets from socket's audience list
     * @param outSightSockets
     * @returns {*}
     */
    var removeOutSightSockets = function (outSightSockets) {
        return new Promise(function (resolve, reject) {
            // remove insight sockets from my socket's audience list
            socketRepo.removeSocketsIntoAudienceList(socket.id, outSightSockets)
                      .then(function (result) {
                          var finalInSightSockets = result.audienceList;
                          var socketsDiffObj      = result.socketsDiffObj;

                          // store/push my socketId into insight socket's audienceList
                          finalInSightSockets.forEach(function (targetAudienceSocketId) {
                              socketRepo.removeSocketsIntoAudienceList(targetAudienceSocketId, [socket.id]);
                          });

                          resolve({
                              finalInSightSockets: finalInSightSockets,
                              socketsDiffObj: socketsDiffObj
                          });
                      }, reject);
        });
    };

    socket.on('refresh-map-view', function (data) {
        socketRepo.refreshMapViewGeo(socket.id, data.center, data.corners).then(function () {
            fetchSocketsInsight(socket.id, data.center, data.corners).then(function (inSightSockets) {
                // store insight sockets into my socket's audience list
                storeInsightSockets(inSightSockets).then(function (finalInSightSockets) {
                    removeOutSightSockets(inSightSockets).then(function (result) {
                        var finalInSightSockets = result.finalInSightSockets;
                        var socketsDiffObj      = result.socketsDiffObj;
                        // everything is fine now can refresh sockets on clients view
                        refreshSocketsClientsView(socket.id, inSightSockets, socketsDiffObj);
                    }, function (e) {
                        console.error(e);
                    });
                }, function (e) {
                    console.error(e);
                });
            }, function (e) {
                console.error(e);
            });
        }, function (e) {
            console.error(e);
        });
    });
}
