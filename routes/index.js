var express = require('express');
var router = express.Router();
var https = require("https");
var Q = require("q");
var async = require("async");

// var ig = require('instagram-node').instagram();

// Every call to `ig.use()` overrides the `client_id/client_secret`
// or `access_token` previously entered if they exist.
var clientId = '1334b24c87064ddc941dbd02a756dbc7';

function getTimeline(userId){

  var deferred = Q.defer();

  var options = {
    host: 'api.instagram.com',
    path: '/v1/users/'+ userId +'/media/recent?client_id=' + clientId,
  };

  var req = https.get(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('done gettingTimeline');
      //console.log('BODY: ' + body);
      deferred.resolve(JSON.parse(body));
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
    deferred.reject(new Error(e.message));
  });

  return deferred.promise;

}

function getPosts(jsonObj){

  var posts = [];

  for(i in jsonObj.data){
    console.log(jsonObj.data);
    var post = jsonObj.data[i];
    posts.push(post.id);
  }

  return posts;
}

function getCommentsOfOnePost(postId){
  return function(callback){
    https.get({
        host: 'api.instagram.com',
        path: '/v1/media/'+ postId +'/comments?client_id=' + clientId,
      }, function(res){

      var bodyChunks = [];

      res.on('data', function(chunk) {

        bodyChunks.push(chunk);

      }).on('end', function() {

        var body = Buffer.concat(bodyChunks);
        var data = JSON.parse(body).data;
        // comments.push(data);
        console.log('success:' + postId + " length: " + data.length);
        callback(null, data);

      });

    });
  }
}

function getCommentsOfAllPosts(postIds){

  var deferred = Q.defer();
  var calls = [];
  var comments = [];
  console.log(postIds);
  console.log("Total Post ID: " + postIds.length);

  getPostsFunction = postIds.map(function(postId) { return getCommentsOfOnePost(postId); });

  async.parallel(getPostsFunction, function(err, results){
    // concatComments = [].concat.apply([], comments);
    results = [].concat.apply([], results);
    console.log(results);
    deferred.resolve(results);
  });

  return deferred.promise;
}

/* GET home page. */
router.get('/', function(req, res, next) {

  getTimeline('4275583')
  .then(function(jsonObj){
    return getPosts(jsonObj); //return arrays of ids
  })
  .then(function(postIds){
    return getCommentsOfAllPosts(postIds);
  })
  .then(function(content){
    res.render('index', {
      title: 'Express',
      // posts: content,
      comments: content
    });
  })
  .catch(function (error) {
      // Handle any error from all above steps
  })
  .done();

  // res.render('index', { title: 'Express', content: '1' });

  // Promise.try(function(){
  //     return getTimeline('4275583');
  // }).then(function(value){
  //     return value;
  // }).then(function(content){
  //     res.render('index', { title: 'Express', content: '1' });
  // }).catch(function(err){
  //     next(err);
  // });

});

module.exports = router;
