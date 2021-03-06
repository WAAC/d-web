module.exports = AccountController;

var userRepos         = getRepos('users')();
var notificationRepos = getRepos('notifications')();
var amazon            = getRepos('amazon')();

/**
 *  AccountController
 *
 * @returns {AccountController}
 * @constructor
 */
function AccountController () {
    'use strict';

    if (!(this instanceof AccountController)) {
        return new AccountController();
    }
}

/**
 * @param req
 * @param res
 */
AccountController.prototype.signIn = function (req, res) {
    'use strict';

    res.render('account/pages/sign-in');
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.signOut = function (req, res) {
    'use strict';

    req.logout();
    res.render('account/pages/sign-out');
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activation = function (req, res) {
    'use strict';

    res.render('account/pages/activation/main');
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsAccount = function (req, res) {
    'use strict';

    userRepos.getUserInfo(req.user.email).then(function (userInfo) {
        if (userInfo.avatar && userInfo.username) {
            res.redirect(301, '/account/activation/profile');
        } else {
            res.render('account/pages/activation/account', {
                user: userInfo
            });
        }
    }, function (err) {
        console.error(err);

        errorPageRender(res, 400, 'Sorry, something went wrong. please try again');
    });
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsAccountAvatarUpload = function (req, res) {
    'use strict';

    var path = require('path'),
        os   = require('os'),
        uuid = require('node-uuid'),
        fs   = require('fs');

    var busboyPackage = require('busboy');
    var busboy        = new busboyPackage({headers: req.headers});
    var fileToken     = '';
    var savedFile     = '';

    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        fileToken = uuid.v4() + path.extname(filename);
        savedFile = path.join(process.cwd() + '/upload', fileToken);
        file.pipe(fs.createWriteStream(savedFile));
    });

    busboy.on('finish', function () {
        amazon.s3Upload(savedFile, fileToken, req.query.file_type).then(function (err) {
            fs.unlink(savedFile);
            if (!err) {
                var s3file = 'https://' + getEnvConfig('tokens').aws.s3.bucket + '.s3.amazonaws.com/' + fileToken;
                // update the user's avatar into database
                userRepos.updateAvatar(req.user._id, s3file).then(function () {
                    res.json({
                        status: true,
                        data: {
                            file: s3file
                        }
                    });
                }, function (err) {
                    console.error(err);

                    res.status(400).json({
                        status: false
                    });
                });
            } else {
                console.error(err);

                res.status(400).json({
                    status: false,
                    reason: err
                });
            }
        }, null);
    });

    req.pipe(busboy);
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsAccountSubmit = function (req, res) {
    'use strict';
    var username = req.body.username;
    if (username) {
        // validate the username
        userRepos.isUsernameExists(username).then(function (status) {
            if (!status) {
                userRepos.updateUsername(req.user._id, username).then(function () {
                    res.json({
                        status: true,
                    });
                }, function (err) {
                    console.error(err);

                    res.status(400).json({
                        status: false
                    });
                });
            } else {
                res.json({
                    status: false,
                    reason: 'username-already-exists'
                });
            }
        }, function (err) {
            console.error(err);

            res.status(400).json({
                status: false
            });
        });
    } else {
        res.json({
            status: false
        });
    }
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsProfile = function (req, res) {
    'use strict';

    userRepos.getUserInfo(req.user.email).then(function (userInfo) {
        if (!(userInfo.avatar && userInfo.username)) {
            res.redirect('/account/activation/account');
        } else {
            // check if user already inserted the profile
            if (userInfo.profile) {
                res.redirect('/account/activation/sharing');
            } else {
                res.render('account/pages/activation/profile', {
                    user: userInfo,
                    countries: getConfig('countries')
                });
            }
        }
    }, function (err) {
        console.error(err);

        errorPageRender(res, 400, 'Sorry, something went wrong. please try again');
    });
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsProfileSubmit = function (req, res) {
    'use strict';

    var profile = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        phone: req.body.phone,
        country: req.body.country,
        gender: req.body.gender,
        geoLocation: req.body.geoLocation
    };

    if (
        profile.firstname &&
        profile.lastname &&
        profile.phone &&
        profile.country &&
        profile.gender
    ) {
        userRepos.updateProfile(req.user._id, profile).then(function () {
            res.json({
                status: true
            });
        }, function (err) {
            console.error(err);

            res.status(400).json({
                status: false
            });
        });
    } else {
        res.json({
            status: false
        });
    }
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsSharing = function (req, res) {
    'use strict';

    userRepos.getUserInfo(req.user.email).then(function (userInfo) {
        if (!(userInfo.avatar && userInfo.username)) {
            res.redirect('/account/activation/account');
        } else {
            // check if user already inserted the profile
            if (!(userInfo.profile)) {
                res.redirect('/account/activation/profile');
            } else {
                res.render('account/pages/activation/sharing', {
                    user: userInfo
                });
            }
        }
    }, function (err) {
        console.error(err);

        errorPageRender(res, 400, 'Sorry, something went wrong. please try again');
    });
};

/**
 * @param req
 * @param res
 */
AccountController.prototype.activationStepsAgree = function (req, res) {
    'use strict';

    userRepos.getUserInfo(req.user.email).then(function (userInfo) {
        if (!(userInfo.avatar && userInfo.username)) {
            res.json({
                status: false
            });
        } else {
            // check if user already inserted the profile
            if (!(userInfo.profile)) {
                res.json({
                    status: false
                });
            } else {
                userRepos.updateActivation(req.user._id, true).then(function () {
                    res.json({
                        status: true
                    });
                }, function (err) {
                    console.error(err);

                    res.status(400).json({
                        status: false
                    });
                });
            }
        }
    }, function (err) {
        console.error(err);

        res.status(400).json({
            status: false
        });
    });
};
