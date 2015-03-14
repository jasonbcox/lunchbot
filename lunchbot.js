var irc = require("irc");
require('node-import');

imports("string_extensions.js");

// Define constants up here.
var channels = {
    GENERAL: "#general"
}

var config = {
    channels: [channels.GENERAL],
    server: "irc.corp.linkedin.com",
    botName: "lunchbot"
};

var commands = {
    JOIN: "lunchbot join",
    LEAVE: "lunchbot leave",
    TRAIN: "lunchbot train",
    ADD: "lunchbot add",
    HELP: "lunchbot help"
}

var messages = {
    var ASCII_TRAIN = \
    "
       _||__|  |  ______   ______   ______ 
      (        | |      | |      | |      |
      /-()---() ~ ()--() ~ ()--() ~ ()--()
    ";
}


// Now define the program variables.
var lastTrainTime = null;

var members = ["kchandra", "kroy", "Yukikaze", "Jason"]

var client = new irc.Client(config.server, config.botName, {channels: config.channels});
var names = null;

// When we first receive the list of channel members, make sure to 
// keep hold of that.
client.addListener("names" + channels.GENERAL, function(nicks) {
    names = new Set(nicks.keys());
});

// Whenever someone joins, update the global list of names.
client.addListener("join" + channels.GENERAL, function(nick, message) {
    names = names || new Set();
    names.add(nick);
    console.log(nick + " has joined " + channels.GENERAL);
});

// When someone leaves, whether intentional or not, remove their name
// from the list.
var removeUser = function(nick, reason, message) {
    names.delete(nick);
    console.log(nick + " has left " + channels.GENERAL);
}

client.addListener("part" + channels.GENERAL, removeUser);
client.addListener("kick" + channels.GENERAL, removeUser);
client.addListener("quit", removeUser);
client.addListener("kill", removeUser);

// When someone changes their nick we should keep up. Update their nick in the 
// train list and the global list.
client.addListener("nick", function(oldnick, newnick, channels, message) {
    names.delete(oldnick);
    names.add(newnick);
    if (members.has(oldnick)) {
        members.delete(oldnick);
        members.add(newnick);
    }
    console.log(oldnick + " has changed nicks to " + newnick);
});

// Now make sure we parse out messages correctly.
client.addListener("message" + channels.GENERAL, function(from, to, message) {
    if (message.startsWith(commands.JOIN)) {
        members = members.add(from);
        client.say(from + " has joined the lunch train.")
    }
    else if (message.startsWith(commands.LEAVE)) {
        members.delete(from);
        client.say(channels.GENERAL, from + " has left the lunch train :(")
    }
    else if (message.startsWith(commands.TRAIN)) {
        var TRAIN_MESSAGE = "choo choo";
        if (from !== config.botName && validLunchTrainTime()) {
            client.say(channels.GENERAL, Array.from(members).join(",") + ": " + TRAIN_MESSAGE);
            client.say(channels.GENERAL, ASCII_TRAIN);
        }
    }
    else if (message.startsWith(commands.ADD)) {
        var remainder = message.substring(commands.ADD.length).trim();
        if (names.has(remainder)) {
            members = members.add(remainder);
        }
    }
    else if (message.startsWith(commands.HELP)) {
        client.say(channels.GENERAL, helpMessage());
    }
});

client.addListener("error", function(message) {
    console.log("Error: " + message);
});