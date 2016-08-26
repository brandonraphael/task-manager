/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    json_file_store: 'path_to_json_database',
    debug: false
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var tasks = [];

controller.hears(['add'], 'direct_message,direct_mention,mention', function(bot, message) {
    // console.log("message", message);
    // console.log("match array:", message.match);
    // console.log("input:", message.match.input);
    // tasks.push(message.match.input.substring(4));

    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
                tasks: []
            };
        }
        user.tasks.push(message.match.input.substring(4));
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message, "Saved task.");
            console.log("user: ", user);
        });
    });
});

controller.hears(['view'], 'direct_message,direct_mention,mention', function(bot, message) {
  controller.storage.users.get(message.user,function(err, user) {
    if (!user) {
        user = {
            id: message.user,
            tasks: []
        };
    }
    if(user.tasks.length > 0){
      bot.reply(message, "Your current tasks:");
      for(var i = 0; i < user.tasks.length; i++){
        bot.reply(message, (i + 1) + ". " + user.tasks[i]);
      }
    }else{
        bot.reply(message, "You have no current tasks.");
    }
  });
});

controller.hears(['clear'], 'direct_message,direct_mention,mention', function(bot, message) {
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
                tasks: []
            };
        }
        user.tasks = [];
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message, "Your task list has been cleared.");
        });
    });
});

controller.hears(['delete'], 'direct_message,direct_mention,mention', function(bot, message) {
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
                tasks: []
            };
        }

        if(user.tasks.indexOf(message.match.input.substring(7)) !== -1) {

          user.tasks.splice(user.tasks.indexOf(message.match.input.substring(7)), 1);
          controller.storage.users.save(user,function(err, id) {
              bot.reply(message, "Task has been removed.");
          });
        }
        else {
          bot.reply(message, "Task does not exist in task list.");
        }
    });
});

controller.hears(['help', 'halp'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, "Use 'add [task]' to add a task.");
    bot.reply(message, "Use 'delete [task]' to remove a task.");
    bot.reply(message, "Use 'clear' to empty the task list.");
    bot.reply(message, "Use 'view' to see the task list.");
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
