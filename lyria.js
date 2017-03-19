"use strict";

var Discord = require("discord.js"); //required dependencies
var wikiSearch = require("nodemw");
var googleAPI = require("googleapis");
var bot = new Discord.Client();
/* authorize various apis */

try {
  var auth = require("./auth.json");
} catch(e){
  console.log("An auth.json is needed");
}
if(auth.bot_token) {
  console.log("logging in with bot token");
  bot.login(auth.bot_token);
}

bot.on("message", msg => { //event handler for a message
  let prefix = "!"; //prefix for the bot
  var responses = { //possible responses for the bot to respond
    "!ping": "pong!",
    "!foo": "bar!",
    "!Dong-A-Long-A-Long": "It's Lyria!",
  }

  if(msg.author.bot) return; //exit if bot sends a message

  const channel = msg.channel;
  if(responses[msg.content]) { //sends the appropriate message for the cmd
    msg.channel.sendMessage(responses[msg.content]);
  }

  //begin main functionality
  "use strict";
  if(msg.content.charAt(0) == prefix) {
    if(msg.content.startsWith(prefix + "gbfwiki")) {
      searchWiki(msg);
    }
    else if(msg.content.startsWith(prefix + "gwhonors")) {
      inputHonors(msg);
    }
    else if(msg.channel.type === 'dm' && msg.content.startsWith(prefix + "honors")) {
      parseHonors(msg);
    }
    else if(msg.channel.id == auth.officer_channel && msg.content.startsWith(prefix + "gwprelims")) {
      console.log(msg.channel.name);
      prelimsNotif(msg);
    }
    else if (msg.content.startsWith(prefix + "gwprelims")) {
      msg.channel.sendMessage("Please make the command in the officers channel");
    }
    else if (msg.channel.id == auth.officer_channel && msg.content.startsWith(prefix + "gwfinals")) {
      gwfinalsMessage(msg);
    }
    else if (msg.content.startsWith(prefix + "gwfinals")) {
      msg.channel.sendMessage("Please make the command in the officers channel");
    }
    else if(msg.channel.id == auth.officer_channel && msg.content.startsWith(prefix + "gwvictory")) {
      bot.guilds.get(auth.server_id).defaultChannel.sendMessage("@everyone\nWe won!\n");
    }
    else if (msg.content.startsWith(prefix + "help") || msg.content.startsWith(prefix + "h")) {
      let helpMessage = "I'll do my best to help!\nAvailable Commands:\n!gbfwiki <name>  => I'll try to find a wiki page for your character\n" +
      "!honors => I'll PM you instructions on how to submit honors\n!gwprelims <number> => I'll tell everyone the minimum contribution!\n" +
      "!gwfinals <number> <yes/no> <number> => First: number 1-5 for Finals Day #   Second: yes or no to fighting   Third: Minimum honors\n" +
      "!gwvictory => I'll tell everyone we won!\n";
      msg.channel.sendMessage(helpMessage);
    }

  }
});
function searchWiki(msg) {
  let args = msg.content.split(" ").slice(1); //remove the !gbfwiki
  let searchterm = args.join(" "); //join search terms with more than one word

  var client = new wikiSearch({ //create a new nodemw bot for gbf.wiki
    protocol: 'https',
    server: 'gbf.wiki',
    path: '/',
    debug: false
  }),
  paramsQuery = { //parameters for a direct api call
    action: 'query', //action to take: query
    prop: 'info',//property to get: info
    inprop: 'url',//add extra info about url
    generator: 'search',//enable searching
    gsrsearch: searchterm,//what to search
    gsrlimit: 1,//take only first result
    format: 'json', //output as .json
    indexpageids: 1// get page ids
  },
  paramsSearch = {
    action: 'opensearch',//action: opensearch for typos
    search: searchterm,// what to search
    limit: 1,// only 1 result
    format: 'json'//output as .json
  }
  client.api.call(paramsQuery, function(err, info, next, data) { //call api
    try { //error returned when no such page matches exactly
      console.log("querying: " + searchterm);
      let pageId = info["pageids"][0];
      console.log(info["pages"][pageId].fullurl);
      let url = info["pages"][pageId].fullurl;
      msg.channel.sendMessage("<" + url + ">");//output message to channel
    }
    catch(TypeError) { //catch that error and use opensearch protocol
      client.api.call(paramsSearch, function(err2, info2, next2, data2) {
        console.log("Typo?");
        if(!data2[3].length){//404 error url is always at 4th index
          msg.channel.sendMessage("Could not find page for " + searchterm);
        }
        else {
          msg.channel.sendMessage("<" + data2[3] + ">");//output message
        }
      });
    }
  });
}
function inputHonors(message) {
  let user = message.author;
  user.sendMessage("Please send a screenshot of your honors and in the" +
  "comment box add: !honors <honors>");
}
function parseHonors(message) {
  let user = message.author;
  let args = message.content.split(" ").slice(1);

  if (isNaN(args[0])) {    // User input check for integer
    user.sendMessage("Please enter a valid number.  For example, to enter 10" +
    " million honors, type 10");
    return;
  }
  if (!(message.attachments.first() == undefined)) {
    console.log(message.attachments.first().url);
  }
  console.log("Username is: " + message.author["username"]);
  console.log("Honors is: " + args[0]);

}

// Preliminaries notification message; Simple @everyone in default channel
function prelimsNotif(message) {
  let args = message.content.split(" ").slice(1);
  if (isNaN(args[0]) || args[0] < 0) {
    message.channel.sendMessage("Please enter a valid non negative number.");
    return;
  }
  let prelimsMessage = "@everyone\nGuild War Preliminaries have started!\nMinimum Contribution: " + args[0] + "m";
  bot.guilds.get(auth.server_id).defaultChannel.sendMessage(prelimsMessage);
  //console.log(message.author);
  //console.log((bot.guilds.get(serverID).defaultChannel.sendMessage("This is a nuke @everyone")));
  //console.log(bot.guilds.firstKey());

}

function gwfinalsMessage(message) {
  let args = message.content.split(" ").slice(1);
  if (args.length != 3) {
    message.channel.sendMessage("Make sure to fill all fields in the command.  Use '!help' for to learn more\n");
    return;
  }
  if (isNaN(args[0]) || isNaN(args[2])) {
    message.channel.sendMessage("The first and third fields need to be numbers. Use !help to learn more\n");
    return;
  }
  if (args[1].toLowerCase() != "yes" && args[1].toLowerCase() != "no") {
    message.channel.sendMessage("Please indicate 'yes' or 'no' in the second field\n");
    return;
  }
  if (args[0] < 1 || args[0] > 5) {
    message.channel.sendMessage("First field number needs to be a 1, 2, 3, 4, or 5 to indicate Finals day\n");
    return;
  }
  let finalsMessage = "@everyone\nFinals Day " + args[0] + " has started!\nFighting: " + args[1] + "\nMinimum Contribution: " + args[2] + "m\nGood Luck!\n";
  bot.guilds.get(auth.server_id).defaultChannel.sendMessage(finalsMessage);
}

bot.on('ready', () => {
  console.log('Dong-A-Long-A-Long! It\'s Lyria!');
});
