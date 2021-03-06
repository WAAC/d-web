module.exports = UserPosts;

var Promise    = require('promise');
var model      = getModel('usersPosts')();
var socketRepo = getRepos('sockets')();

/**
 * UserPosts Repository
 *
 * @returns {UserPosts}
 * @constructor
 */
function UserPosts () {
    'use strict';

    if (!(this instanceof UserPosts)) {
        return new UserPosts();
    }
}

/**
 * add new post
 *
 * @param ownerUserId
 * @param content
 * @param position
 * @param mapView
 * @param mapCenterView
 * @param region
 *
 * @returns {Promise}
 */
UserPosts.prototype.addNewPost = function (ownerUserId, content, position, mapView, mapCenterView, region) {
    'use strict';

    return new Promise(function (resolve, reject) {
        resolve = resolve || function () {};
        reject  = reject || function () {};

        model.addNewPost(ownerUserId, content, position, mapView, mapCenterView, region).then(resolve, reject);
    });
};

/**
 * get the profile's posts from model
 *
 * @param userId
 * @param start
 * @param length
 *
 * @returns {Promise}
 */
UserPosts.prototype.getProfilePosts = function (userId, start, length) {
    'use strict';

    return new Promise(function (resolve, reject) {
        resolve = resolve || function () {};
        reject  = reject || function () {};

        model.getPostsByOwnerId(userId, start, length).then(resolve, reject);
    });
};

/**
 * get the console's posts from model
 *
 * @param userId
 * @param corners
 * @param start
 * @param length
 *
 * @returns {Promise}
 */
UserPosts.prototype.getConsolePosts = function (userId, corners, start, length) {
    'use strict';

    return new Promise(function (resolve, reject) {
        resolve = resolve || function () {};
        reject  = reject || function () {};

        // get the list of the users who are in the map view of console
        socketRepo.fetchUserIdFromSocketsInSight(corners, '').then(function (users) {
            model.getPostsByOwnerIdAndMapView(users, corners, start, length).then(resolve, reject);
        }, reject);

    });
};
