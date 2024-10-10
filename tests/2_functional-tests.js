const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

// Creating a new thread: POST request to /api/threads/{board}
// Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
// Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
// Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
// Reporting a thread: PUT request to /api/threads/{board}
// Creating a new reply: POST request to /api/replies/{board}
// Viewing a single thread with all replies: GET request to /api/replies/{board}
// Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
// Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
// Reporting a reply: PUT request to /api/replies/{board}

suite('Functional Tests', function() {
  let threadContent;
  let threadContent2;

  // Creating a new thread: POST request to /api/threads/{board}
  test("Creating a new thread: POST request to /api/threads/{board}", function(done) {
    chai.request(server)
      .post('/api/threads/general')
      .send({
        text: "dummy",
        delete_password: "123"
      })
      .end(function(err, res) {
        threadContent = res.body;
        assert.equal(res.status, 200);
        assert.isObject(res.body, 'Response should be an object');
        assert.property(res.body, '_id', 'Response should contain _id');
        assert.property(res.body, 'text', 'Response should contain text');
        assert.property(res.body, 'created_on', 'Response should contain created_on');
        assert.property(res.body, 'bumped_on', 'Response should contain bumped_on');
        assert.property(res.body, 'reported', 'Response should contain reported');
        assert.property(res.body, 'delete_password', 'Response should contain delete_password');
        assert.property(res.body, 'replies', 'Response should contain replies');
        
        // Make another thread
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: "dummy",
            delete_password: "123"
          })
          .end(function(err, res) {
            threadContent2 = res.body;
          })
          done();
      })
  })

  // Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
  test("Creating a new thread: POST request to /api/threads/{board}", function(done) {
    chai.request(server)
      .get('/api/threads/general')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'Response should be an array');
        assert.isAtMost(res.body.length, 10, 'Reponse should be array of threads less than equal to 10');
        res.body.forEach((item) => {
          assert.isObject(item, 'Item should be an object');
          assert.property(item, '_id', 'Response should contain _id');
          assert.property(item, 'text', 'Response should contain text');
          assert.property(item, 'created_on', 'Response should contain created_on');
          assert.isAtMost(item.replies.length, 3, 'Replies should be at most 3')
        });
        done();
      })
  })

  // Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
  test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", function(done) {
    chai.request(server)
      .delete('/api/threads/general')
      .send({
        thread_id: threadContent._id,
        delete_password: "1234"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password', 'Response should be incorrect password');
        done();
      })
  })

  // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
  test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", function(done) {
    chai.request(server)
      .delete('/api/threads/general')
      .send({
        thread_id: threadContent._id,
        delete_password: "123"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success', 'Response should be success');
        done();
      })
  })

  // Reporting a thread: PUT request to /api/threads/{board}
  test("Reporting a thread: PUT request to /api/threads/{board}", function(done) {
    chai.request(server)
      .put('/api/threads/general')
      .send({
        thread_id: threadContent2._id,
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported', 'Response should be reported');
        done();
      })
  })

  // Creating a new reply: POST request to /api/replies/{board}
  test("Creating a new reply: POST request to /api/replies/{board}", function(done) {
    chai.request(server)
      .post(`/api/replies/dummy`)
      .send({
        text: "dummy",
        delete_password: "123",
        thread_id: threadContent2._id
      })
      .end(function(err, res) {
        threadContent2 = res.body;
        assert.equal(res.status, 200);
        assert.isObject(res.body, 'Response should be an object');
        assert.isArray(res.body.replies, 'Response should be an array');
        assert.isObject(res.body.replies[0], 'Response should be an object');
        assert.property(res.body.replies[0], '_id', 'Response should contain _id');
        assert.property(res.body.replies[0], 'text', 'Response should contain text');
        assert.property(res.body.replies[0], 'created_on', 'Response should contain created_on');
        assert.property(res.body.replies[0], 'delete_password', 'Response should contain delete_password');
        assert.property(res.body.replies[0], 'reported', 'Response should contain reported');
        done();
      })
  })

  // Viewing a single thread with all replies: GET request to /api/replies/{board}
  test("Viewing a single thread with all replies: GET request to /api/replies/{board}", function(done) {
    chai.request(server)
      .get(`/api/replies/dummy`)
      .query({
        thread_id: threadContent2._id
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body, 'Response should be an object');
        assert.isArray(res.body.replies, 'Response should be an array');
        assert.isObject(res.body.replies[0], 'Response should be an object');
        done();
      })
  })

  // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
  test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function(done) {
    chai.request(server)
      .delete(`/api/replies/dummy`)
      .send({
        thread_id: threadContent2._id,
        reply_id: threadContent2.replies[0]._id,
        delete_password: '1234'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password', 'Response should be incorrect password');
        done();
      })
  })
  
  // Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
  test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with an invalid delete_password", function(done) {
    chai.request(server)
      .delete(`/api/replies/dummy`)
      .send({
        thread_id: threadContent2._id,
        reply_id: threadContent2.replies[0]._id,
        delete_password: '123'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success', 'Response should be success');
        done();
      })
  })
  
  // Reporting a reply: PUT request to /api/replies/{board}
  test("Reporting a reply: PUT request to /api/replies/{board}", function(done) {
    chai.request(server)
      .put(`/api/replies/dummy`)
      .send({
        thread_id: threadContent2._id,
        reply_id: threadContent2.replies[0]._id,
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported', 'Response should be reported');
        done();
      })
  })
});
