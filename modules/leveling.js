module.exports.name = "Discord Leveling System";

const enabled = true;

const messagewhen = false;

const theactualmessage = '**(TAG)**, you have advanced to level **(LEVEL)**!';

const minxp = 15;
const maxxp = 25;

const mee6leveling = true;

const mee6cooldown = 60000;

const colors = require('colors');
module.exports.enabled = enabled;
if (!enabled) return console.log('[INFO]'.blue + ' Leveling module is ' + 'DISABLED'.red);
if (enabled) console.log('[INFO]'.blue + ' Leveling module is ' + 'ENABLED'.green);
const Levels = require("discord-xp");
Levels.setURL(process.env.LEVEL_DBURL);
module.exports.Levels = Levels;
const client = require('../shard.js').client;

client.on("message", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.content.startsWith(require('../messages.json').bot_prefix)) return;

  if (mee6leveling && !message.member.cooldown) {
    message.member.cooldown = true;
    const randomAmountOfXp = Math.floor(Math.random() * (maxxp - minxp) + minxp);
    const hasLeveledUp = await Levels.appendXp(message.author.id, message.guild.id, randomAmountOfXp);
    if (hasLeveledUp) {
      return;
    }
    setTimeout(function() {
      message.member.cooldown = false;
    }, mee6cooldown)
  } else if (!mee6leveling) {
    const randomAmountOfXp = Math.floor(Math.random() * (maxxp - minxp) + minxp);
    const hasLeveledUp = await Levels.appendXp(message.author.id, message.guild.id, randomAmountOfXp);
    if (hasLeveledUp) {
      const user = await Levels.fetch(message.author.id, message.guild.id);
      if (messagewhen) {
        if (!sendtochannel) return message.channel.send(theactualmessage.replace('(TAG)', message.author.tag).replace('(LEVEL)', user.level));
        const channel = client.channels.cache.get(channelid);
        channel.send(theactualmessage.replace('(TAG)', message.author.tag).replace('(LEVEL)', user.level));
      }
    }
  } else if (mee6leveling && message.member.cooldown) {
    return;
  }
});
