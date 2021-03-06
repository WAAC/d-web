module.exports = PostsController;

var userRepos       = getRepos('users')();
var usersPostsRepos = getRepos('usersPosts')();

/**
 *  PostsController
 *
 * @returns {PostsController}
 * @constructor
 */
function PostsController () {
    'use strict';

    if (!(this instanceof PostsController)) {
        return new PostsController();
    }
}

/**
 * @param req
 * @param res
 */
PostsController.prototype.compose = function (req, res) {
    'use strict';

    var content  = req.body.content;
    var position = req.body.geoLocation;
    var mapView = req.body.mapView || null;
    var mapCenterView = req.body.mapCenterView || null;
    var region = req.body.region || null;

    if (content.length > 250) {
        res.json({
            status: false
        });

        return;
    }

    usersPostsRepos.addNewPost(req.user._id, content, position, mapView, mapCenterView, region).then(function (postRes) {
        res.json({
            status: true,
            post: postRes
        });
    }, function (err) {
        console.error(err);

        res.status(400).json({
            status: false
        });
    });
};

/**
 * @param req
 * @param res
 * @param username
 */
PostsController.prototype.getProfilePostsJson = function (req, res, username) {
    'use strict';

    var start  = req.query.start || 0;
    var length = req.query.length || 10;

    userRepos.getUserInfoByUsername(username).then(function (userInfo) {
        if (userInfo) {
            usersPostsRepos.getProfilePosts(
                userInfo._id,
                start,
                length
            ).then(function (posts) {
                if (posts) {
                    res.status(200).json({
                        posts: posts,
                        start: start,
                        length: length
                    });
                } else {
                    res.status(200).json({
                        posts: [],
                        start: start,
                        length: length
                    });
                }
            }, function (err) {
                console.error(err);

                res.status(400).json({
                    status: false
                });
            });
        } else {
            res.status(404).json({
                status: false
            });
        }
    }, function (err) {
        console.error(err);

        res.status(400).json({
            status: false
        });
    });
};
