// server.js

const express = require('express');
const uuid = require('uuid');
const SocketServer = require('ws').Server;
const randomColor = require('random-color')

let users = []
let currentUser;

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', (client) => {
  console.log('Client connected')

  jsonMessage = {
      id: uuid.v1(),
      type: 'incomingSystemNotification',
      userCount: wss.clients.size
    }
  wss.broadcast(JSON.stringify(jsonMessage));

  client.on('message', handleMessage);

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  client.on('close', () => {
    console.log('Client disconnected');
    jsonMessage = {
      id: uuid.v1(),
      type: 'incomingSystemNotification',
      userCount: wss.clients.size
    }
    wss.broadcast(JSON.stringify(jsonMessage));

})
});

wss.broadcast = function(data) {
  wss.clients.forEach(function(client) {
    client.send(data);
  });
};

function getColouredMessage(jsonMessage) {
  let isNewUser = true;
  let currentUuid = '';
  for (i in users) {
    if (users[i].uuid == jsonMessage.uuid) {
      isNewUser = false;
      currentUser = users[i]
      break;
    }
  }

  if (isNewUser) {
    let newUser = {uuid: jsonMessage.uuid, color: randomColor().hexString()}
    users.push(newUser)
    currentUser = newUser;
  }
  return currentUser.color
}

// Handles incoming messages.
// Stores the current state of the textbox and broadcasts it
function handleMessage(message) {
  let outgoing = '';
  let jsonMessage = JSON.parse(message)

  switch(jsonMessage.type) {
    case "postMessage":
      outgoing = 'incomingMessage'
      jsonMessage.color = getColouredMessage(jsonMessage);
      break;
    case "postNotification":
      outgoing = 'incomingNotification'
      jsonMessage['content'] = jsonMessage.oldUserName + ' has changed their name to ' + jsonMessage.newUserName
      break;
    default:
      throw new Error("Unknown event type " + jsonMessage.type);
    }
  jsonMessage.type = outgoing;
  jsonMessage.id = uuid.v1()
  wss.broadcast(JSON.stringify(jsonMessage));
}


// Simply broadcasts the message back to all clients
function broadcastBack(message) {
  console.log(`Received: ${message}`)
  wss.broadcast(message);
}