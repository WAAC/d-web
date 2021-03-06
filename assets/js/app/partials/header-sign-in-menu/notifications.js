(function(angular) {
    'use strict';

    var controller = 'HeaderSignInMenuNotificationsController';

    var app = angular.module("eloyt");
    app.controller(controller, [
        '$scope', '$http', '$socketConnection',
        function ($scope, $http, $socketConnection) {
            if (typeof window.controllers[controller] === 'object') {
                return;
            }
            window.controllers[controller] = this;

            $socketConnection.socket.on('notify', function (data) {
                $.notify(data.text, 'success');
            });

            $scope.moduleLoaded = true;
            $scope.lastNotifyDownloaded = false;
            $scope.initialized = false;
            $scope.notificationsWaiting = false;
            $scope.unreadCount = 0;
            $scope.list = [];
            $scope.start = 0;

            $scope.getNotifications = function() {
                if (!$scope.isDropdownOpen() && !$scope.lastNotifyDownloaded) {
                    $scope.notificationsWaiting = true;
                    if (!$scope.initialized || $scope.list.length === 0) {
                        $scope.getNotifyNotInitialized();
                    } else {
                        if ($scope.list.length < 10) {
                            $scope.getNotifyInitialized();
                        } else {
                            $scope.notificationsWaiting = false;
                        }
                    }
                }
            };

            $scope.getNotificationsScrollDown = function() {
                if (!$scope.lastNotifyDownloaded) {
                    $scope.notificationsWaiting = true;
                    if ($scope.initialized) {
                        $scope.getNotifyInitialized();
                    }
                }
            };

            $scope.getNotifyInitialized = function() {
                $scope.request(function (result) {
                    if (result.statusText === 'OK') {
                        $scope.renderNotifications(result.data.items);
                        $scope.start += result.data.items.length;
                    }
                    $scope.notificationsWaiting = false;
                }, function () {
                    $scope.notificationsWaiting = false;
                });
            };

            $scope.getNotifyNotInitialized = function() {
                $scope.request(function (result) {
                    if (result.statusText === 'OK') {
                        $scope.renderNotifications(result.data.items);
                        $scope.start = result.data.items.length;
                        $scope.initialized = true;
                    }
                    $scope.notificationsWaiting = false;
                }, function () {
                    $scope.notificationsWaiting = false;
                });
            };

            $scope.renderNotifications = function (items) {
                angular.forEach(items, function (notify) {
                    $scope.list.push(notify);
                });
            };

            $scope.isDropdownOpen = function () {
                return $('.dropdown-notification').hasClass('open');
            };

            $scope.request = function (ok, fail) {
                $http({
                    method: 'GET',
                    url: '/notifications/get-json',
                    params: {
                        start: $scope.start || undefined
                    }
                })
                .then(function(result){
                    // don't allow to request being send anymore incase the last request being empty
                    if(
                        result.data.items.length === 0 && $scope.start !== 0
                    ) {
                        $scope.lastNotifyDownloaded = true;
                    }
                    ok(result);
                }, function(){
                    fail();
                });
            };
        }
    ]);
    app.directive("scroll", function () {
        return {
            restrict: 'EA',
            link: function($scope, $element) {
                $element.bind('scroll', function() {
                    $scope.$apply(function() {
                        if (
                            $element[0].offsetHeight + $element[0].scrollTop >=
                            $element[0].scrollHeight - 10
                        ) {
                            // load the rest of notifications when scrollbar reached the end
                            if(!$scope.notificationsWaiting) {
                                $scope.getNotificationsScrollDown();
                            }
                        }
                    });
                });
            }
        };
    });
})(window.angular);