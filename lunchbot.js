var irc = require("irc");
var _ = require("underscore");
var str = require("underscore.string");
require("node-import");

imports("./config");

if (!Array.prototype.addIfNotPresent) {
  Array.prototype.addIfNotPresent = function(elem) {
    if (_.contains(this, elem)) {
      this.push(elem);
    }
  };
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
client.addListener("names", function(channel, nicks) {
  names = Object.keys(nicks);
  console.log("Current members of " + channel + ": " + names.join(","));
});

// Whenever someone joins, update the global list of names.
client.addListener("join", function(channel, nick, message) {
  names.addIfNotPresent(nick);
  console.log(nick + " has joined " + channel);
});

// When someone leaves, whether intentional or not, remove their name
// from the list.
var removeUser = function(nick, reason, channels, message) {
  names = _.without(names, nick);
  members = _.without(members, nick);
  console.log(nick + " has disconnected");
};

client.addListener("part", function(channel, nick, reason, message) {
  names = _.without(names, nick);
  members = _.without(members, nick);
  console.log(nick + " has disconnected from " + channel);
});

client.addListener("kick", function(channel, nick, by, reason, message) {
  names = _.without(names, nick);
  members = _.without(members, nick);
  console.log(nick + " has been kicked from " + channel + " by " + by);
});

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

var validLunchTrainTime = function(lastTrainTime) {
  // Milliseconds in an hour.
  var millisPerHour = 1000 * 60 * 60;
  return ((_.now() - lastTrainTime) >= millisPerHour);
};

// Now make sure we parse out messages correctly.
client.addListener("message", function(from, to, text, message) {
  // We're not gonna handle private messages
  if (to === config.botName) {
    return;
  }
  if (str(text).startsWith(commands.JOIN)) {
    members.addIfNotPresent(from);
    var joinMessage = from + " has joined the lunch train.";
    client.say(to, joinMessage);
    console.log(joinMessage);
  } else if (str(text).startsWith(commands.LEAVE)) {
    members = _.without(members, from);
    client.say(to, from + " has left the lunch train :(");
  } else if (str(text).startsWith(commands.TRAIN)) {
    var TRAIN_MESSAGE = "choo choo";
    if (from !== config.botName && validLunchTrainTime(lastTrainTime)) {
      lastTrainTime = _.now();
      client.say(to, members.join(",") + ": " + TRAIN_MESSAGE);
      client.say(to, messages.ASCII_TRAIN.join("\n"));
    }
  } else if (str(text).startsWith(commands.ADD)) {
    var remainder = str(text).substring(commands.ADD.length).trim().value();
    members.addIfNotPresent(remainder);
  } else if (str(text).startsWith(commands.HELP)) {
    client.say(to, messages.HELP_MESSAGE.join("\n"));
  }
});

client.addListener("error", function(message) {
  console.log("Error: " + message.command);
});
