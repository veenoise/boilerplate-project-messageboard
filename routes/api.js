'use strict';

const controllers = require('../controllers/Handlers');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(controllers.threadsPost)
    .get(controllers.threadsGet)
    .delete(controllers.threadsDelete)
    .put(controllers.threadPut);
    
  app.route('/api/replies/:board')
    .post(controllers.replyPost)
    .get(controllers.replyGet)
    .delete(controllers.replyDelete)
    .put(controllers.replyPut);
};
