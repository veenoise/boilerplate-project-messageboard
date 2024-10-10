const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  threadsPost: async (req, res) => {
    try {
      const data = {
        "_id": uuidv4(),
        "text": req.body.text,
        "created_on": new Date().toISOString(),
        "bumped_on": new Date().toISOString(),
        "reported": false,
        "delete_password": req.body.delete_password,
        "replies": [],
      };
      const record = await pb.collection('threadsBoard').create(data);
      res.json(data);
    } catch {
      res.status(400).send('error: thread post');
    }
  },
  threadsGet: async (req, res) => {
    try {
      const resultList = await pb.collection('threadsBoard').getList(1, 10, {
        sort: '-bumped_on',
        fields: '_id, text, created_on, bumped_on, replies',
      });
      resultList.items.forEach((item) => {
        item.created_on = item.created_on.replace(" ", "T");
        item.bumped_on = item.bumped_on.replace(" ", "T");
        item.replies.sort((a, b) => {
          return new Date(b.created_on) - new Date(a.created_on);
        })  
        item.replies = item.replies.slice(0, 3);
        item.replies.forEach((reply) => {
          delete reply.delete_password;
          delete reply.reported;
        })
      })
      res.send(resultList.items);
    } catch {
      res.status(400).send('error: thread get');
    }
  },
  threadsDelete: async (req, res) => {
    try {
      const threadID = req.body.thread_id;
      const deletePass = req.body.delete_password;
      const threadBoard = await pb.collection('threadsBoard').getFirstListItem(`_id = '${threadID}'`);
      if (threadBoard.delete_password === deletePass) {
        await pb.collection('threadsBoard').delete(threadBoard.id);
        res.send('success');
      } else {
        res.send('incorrect password');
      }
    } catch {
      res.status(400).send('error: thread delete');
    }
  },
  threadPut: async (req, res) => {
    try {
      const threadID = req.body.report_id || req.body.thread_id;
      const threadBoard = await pb.collection('threadsBoard').getFirstListItem(`_id = '${threadID}'`);
      await pb.collection('threadsBoard').update(threadBoard.id, {"reported": true});
      res.send('reported');
    } catch {
      res.status(400).send('error: thread put');
    }
   
  },
  replyPost: async (req, res) => {
    try {
      const threadID = req.body.thread_id;
      const replyText = req.body.text;
      const deletePass = req.body.delete_password;
      const originRecord = await pb.collection('threadsBoard').getFirstListItem(`_id = '${threadID}'`);
      const replyData = {
        "text": replyText,
        "_id": uuidv4(),
        "reported": false,
        "delete_password": deletePass,
        "created_on": new Date().toISOString(),
      }
      const data = {
        "bumped_on": new Date().toISOString(),
        "replies": [...originRecord.replies, replyData]
      };
      // await pb.collection('threadsBoard').update(originRecord.id, data);
      // res.redirect(`/b/${req.params.board}/${threadID}`);
      const update = await pb.collection('threadsBoard').update(originRecord.id, data);
      update.created_on = update.created_on.replace(" ", "T");
      update.bumped_on = update.bumped_on.replace(" ", "T");
      res.json(update);
    } catch {
      res.status(400).send('error: reply post');
    }
    
  },
  replyGet: async (req, res) => {
    try {
      const threadID = req.query.thread_id;
      const threadBoard = await pb.collection('threadsBoard').getFirstListItem(`_id = '${threadID}'`, {
        fields: '_id, text, created_on, bumped_on, replies',
      });
      threadBoard.replies.forEach((item) => {
        delete item.reported;
        delete item.delete_password;
      })
      threadBoard.bumped_on = threadBoard.bumped_on.replace(" ", "T");
      threadBoard.created_on = threadBoard.created_on.replace(" ", "T");
      res.send(threadBoard);
    } catch {
    res.status(400).send('error: reply get');
    }
  },
  replyDelete: async (req, res) => {
    try {
      const threadID = req.body.thread_id;
      const replyID = req.body.reply_id;
      const deletePass = req.body.delete_password;
      const threadBoard = await pb.collection('threadsBoard').getFirstListItem(`_id = '${threadID}'`);
      let newReplies = []
      let success = false
      threadBoard.replies.forEach((item) => {
        if (item._id === replyID && item.delete_password === deletePass) {
          success = true;
          item.text = '[deleted]';
        }
        newReplies.push(item);
      });
      if (success) {
        await pb.collection('threadsBoard').update(threadBoard.id, {"replies": newReplies});
        res.send('success');
      } else {
        res.send('incorrect password');
      }
    } catch {
      res.status(400).send('error: reply delete');
    }    
  },
  replyPut: async (req, res) => {
    try {
      const threadID = req.body.report_id || req.body.thread_id;
      const replyID = req.body.reply_id;
      const threadBoard = await pb.collection('threadsBoard').getFirstListItem(`_id = '${threadID}'`);
      let newReplies = [];
      threadBoard.replies.forEach((item) => {
        if (item._id === replyID) {
          item.reported = true;
        }
        newReplies.push(item);
      });
      await pb.collection('threadsBoard').update(threadBoard.id, {"replies": newReplies});
      res.send('reported');
    } catch {
      res.status(400).send('error: reply put');
    }
  }
}