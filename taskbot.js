

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
        if(message.match.input.indexOf(",") > -1) {
            tasks = message.match.input.substring(4).split(',');
            for(var i in tasks){
              user.tasks.push(tasks[i]);
            }
            controller.storage.users.save(user,function(err, id) {
                bot.reply(message, "Saved task.");
                // console.log("user: ", user);
            });
        }
        else {
          user.tasks.push(message.match.input.substring(4));
          controller.storage.users.save(user,function(err, id) {
              bot.reply(message, "Saved task.");
              // console.log("user: ", user);
          });
        }
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
        var msg = "";
        for(var i = 0; i < user.tasks.length; i++){
            msg += "\n" + (i + 1) + ". " + user.tasks[i];
        }
        bot.reply(message, "Your current tasks:" + msg);
    } else{
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

        if(!isNaN(parseInt(message.match.input.substring(7)))){
          var taskNumber = parseInt(message.match.input.substring(7))

          if(user.tasks.length >= taskNumber && taskNumber > 0) {
              user.tasks.splice(taskNumber - 1, 1);
              controller.storage.users.save(user,function(err, id) {
                  bot.reply(message, "Task has been removed.");
              });
          }
          else {
              bot.reply(message, "Task does not exist in task list.");
          }
        }
        else {
            bot.reply(message, "Use 'delete <task number>' to delete a task. To see the list of task numbers, type 'view'.");
        }
    });
});

controller.hears(['help', 'halp'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message,
        "Use 'add <task>' to add a task, or 'add <task,task,...>' to add multiple tasks.\n" +
        "Use 'delete <task number>' to remove a task.\n" +
        "Use 'view' to see the tasks and task numbers.\n" +
        "Use 'clear' to empty the task list.");
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
