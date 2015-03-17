var irc = require("irc");
var _ = require("underscore");
var str = require("underscore.string");
require("node-import");
var utils = require("./utils");

imports("./string_extensions");
imports("./config");

if (!Array.prototype.addIfNotPresent) {
  Array.prototype.addIfNotPresent = function(elem) {
    if (_.contains(this, elem)) {
      this.push(elem);
    }
  }
}

var commands = {
  JOIN: "lunchbot join",
  LEAVE: "lunchbot leave",
  TRAIN: "lunchbot train",
  ADD: "lunchbot add",
  HELP: "lunchbot help"
};

var members = config.defaultMembers || [];

var messages = {
  ASCII_TRAIN: [
    " _||__|  |  ______   ______   ______ ",
    "(        | |      | |      | |      |",
    "/-()---() ~ ()--() ~ ()--() ~ ()--() "
  ],
  HELP_MESSAGE: [
    "Possible commands: ",
    commands.JOIN + ": add yourself to the lunch train",
    commands.LEAVE + ": remove yourself from the lunch train",
    commands.TRAIN + ": declare a lunch train",
    commands.ADD + ": invoke as 'lunchbot add <nick>', will add the nick to the train if it's in the channel",
    commands.HELP + ": generate this help text"
  ]
};


// Define the program variables.
var lastTrainTime = Date.now();

var client = new irc.Client(config.server, config.botName, {
  channels: config.channels
});
var names = [];

// When we first receive the list of channel members, make sure to 
// keep hold of that.
client.addListener("names" + channels.GENERAL, function(nicks) {
  names = Object.keys(nicks);
  console.log("Current members of " + channels.GENERAL + ": " + names.join(","))
});

// Whenever someone joins, update the global list of names.
client.addListener("join" + channels.GENERAL, function(nick, message) {
  names.addIfNotPresent(nick);
  console.log(nick + " has joined " + channels.GENERAL);
});

// When someone leaves, whether intentional or not, remove their name
// from the list.
var removeUser = function(nick, reason, message) {
  names = _.without(names, nick);
  members = _.without(members, nick);
  console.log(nick + " has left " + channels.GENERAL);
};

client.addListener("part" + channels.GENERAL, removeUser);
client.addListener("kick" + channels.GENERAL, removeUser);
client.addListener("quit", removeUser);
client.addListener("kill", removeUser);

// When someone changes their nick we should keep up. Update their nick in the 
// train list and the global list.
client.addListener("nick", function(oldnick, newnick, channels, message) {
  names = _.without(names, oldnick);
  names.push(newnick);
  // Only update the member list if they're actually on the lunch train.
  if (_.contains(members, oldnick)) {
    members = _.without(members, oldnick);
    members.push(newnick);
  }
  console.log(oldnick + " has changed nicks to " + newnick);
});

// Now make sure we parse out messages correctly.
client.addListener("message" + channels.GENERAL, function(from, to, message) {
  if (str(message).startsWith(commands.JOIN)) {
    members.addIfNotPresent(from);
    var joinMessage = from + " has joined the lunch train.";
    client.say(channels.GENERAL, joinMessage);
    console.log(joinMessage);
  } else if (str(message).startsWith(commands.LEAVE)) {
    members = _.without(members, from);
    client.say(channels.GENERAL, from + " has left the lunch train :(")
  } else if (str(message).startsWith(commands.TRAIN)) {
    var TRAIN_MESSAGE = "choo choo";
    if (from !== config.botName && utils.validLunchTrainTime(lastTrainTime)) {
      lastTrainTime = Date.now();
      client.say(channels.GENERAL, Array.from(members).join(",") + ": " + TRAIN_MESSAGE);
      client.say(channels.GENERAL, messages.ASCII_TRAIN.join("\n"));
    }
  } else if (str(message).startsWith(commands.ADD)) {
    var remainder = str(message).substring(commands.ADD.length).trim().value();
    members.addIfNotPresent(remainder);
  } else if (str(message).startsWith(commands.HELP)) {
    client.say(channels.GENERAL, messages.HELP_MESSAGE.join("\n"));
  }
});

client.addListener("error", function(message) {
  console.log("Error: " + message);
});
