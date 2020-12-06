const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT){
ENDPOINT_URL = "http://127.0.0.1:5000"
} else{
ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}


async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token
  console.log("token " + token);
  return token;
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome() {
    addMessage(agent.query, true);
    addMessage('Hello, welcome to WiscShop! How can I help you today?', false);
    //console.log(ENDPOINT_URL);
  }

  function isLoggedIn() {
    if (typeof(token) === typeof undefined || token === '') {
      return false;
    } else {
      return true;
    }
  }

  async function login() {
    if (isLoggedIn()) {
      console.log("username " + username);
      console.log("token " + token);
      addMessage('You are already logged in as ' + username + '.', false);
    } else {
      // You need to set this from `username` entity that you declare in DialogFlow
      username = agent.parameters.username;
      // You need to set this from password entity that you declare in DialogFlow
      password = agent.parameters.password;
      await getToken()

      //agent.add(token)

      if (typeof(token) === typeof undefined) {
        addMessage("Invalid credentials. Please try again", false);
      } else {
        await deleteMessages();
        addMessage("Welcome back " + username + "!", false);
        addMessage("What are you looking for today?", false);
      }
    }
  }

  async function addMessage(text, isUser) {
    if (!isUser) {
      agent.add(text); // say message if not computer message
    }
    
    if (isLoggedIn()) {
      const body = JSON.stringify({
        date: new Date(),
        isUser: isUser,
        text: text,
      })
    
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: body,
        redirect: 'follow'
      }
  
      const serverReturn = await fetch(ENDPOINT_URL + '/application/messages', request);
      const serverResponse = await serverReturn.json();

      return serverResponse;
    }
  }

  async function deleteMessages() {
    const request = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/application/messages', request);
    const serverResponse = await serverReturn.json();
    return serverResponse;
  }


  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome);


  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set('login', login);

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080)
