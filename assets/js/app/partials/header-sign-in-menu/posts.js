(function (angular) {
    'use strict';

    angular.module("deeployer")
        .controller("HeaderSignInMenuPostsController", [
            '$scope', '$http',
            function ($scope, $http) {
                $scope.waiting = false;
                $scope.content = '';
                $scope.maxContentLength = 250;
                $scope.newPostModal = $('#header-fix-signed-in-new-post-modal');

                $scope.newPostPopup = function () {
                    $scope.newPostModal.modal({
                        backdrop: 'static'
                    });
                };

                $scope.sendPost = function () {
                    if (
                        ($scope.maxContentLength - $scope.content.length) >= 0 &&
                        ($scope.maxContentLength - $scope.content.length) < $scope.maxContentLength
                    ) {
                        $scope.waiting = true;
                        $scope.request({
                            content: $scope.content
                        }, function () {
                            $scope.newPostModal.modal('hide');
                            $scope.waiting = false;
                        }, function () {
                            $scope.waiting = false;
                        });
                    }
                };

                $scope.request = function (data, ok, fail) {
                    $http({
                        method: 'POST',
                        url: '/profile/post',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data: $.param(data)
                    })
                    .then(function(result){
                        if (result.status) {
                            ok(result);
                        } else {
                            fail();
                        }
                    }, function(result){
                        fail();
                    });
                };
            }
        ]);
})(window.angular);
