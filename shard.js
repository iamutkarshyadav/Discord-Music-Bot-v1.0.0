
const fs = require('fs');
const Discord = require('discord.js');
const colors = require('colors');


const messages = require('./messages.json');


const client = new Discord.Client();
client.commands = new Discord.Collection();
const disbut = require('discord-buttons')(client);


module.exports.client = client;


const modules = fs.readdirSync('./modules').filter(file => file.endsWith('.js'));

for (const file of modules) {
		const module = require(`./modules/${file}`);
    console.log('[INIT]'.gray + ` ${module.name} - module loaded`);
}


const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
    console.log('[INIT]'.gray + ` ${command.name} - command loaded`);
	}
}


client.helpPages = [];
const commandFoldersForHelp = fs.readdirSync('./commands');
const path = require('path');

for (const folder of commandFoldersForHelp) {
	const data = [];
 	let embed = new Discord.MessageEmbed()
		.setTitle('Help')
		.setColor(require('./messages.json').embed_color)
	const commandFiles = fs.readdirSync(`./commands/${folder}`);
	data.push(`**${path.basename(folder)}**`);
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		data.push(`**${command.emoji || ":package:"}** ${command.name}`);
	}
	embed.setDescription(data);
	client.helpPages.push(embed);
}

const cooldowns = new Discord.Collection();

client.once('ready', () => {
	console.log('[STATUS]'.green + ' ' + messages.bot_ready);
	client.user.setActivity('MUSIC 🎧', { type: 'LISTENING' });
});

client.on('message', async (message) => {
	if (!message.content.startsWith(messages.bot_prefix) || message.author.bot) return;

	const args = message.content.slice(messages.bot_prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.guildOnly && message.channel.type === 'dm') {
		return message.channel.send(messages.bot_nodms);
	}

	if (command.permissions) {
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			return message.channel.send(messages.bot_noperms);
		}
	}

	if (command.args && !args.length) {
		let reply = messages.bot_usage1;

		if (command.usage) {
			reply += messages.bot_usage2.replace('(PREFIX)', messages.prefix).replace('(COMMAND)', command.name).replace('(USAGE)', command.usage);
		}

		return message.channel.send(reply);
	}

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.channel.send(messages.bot_cooldown.replace('(TIME)', timeLeft.toFixed(1)));
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(client, message, args);
	} catch (error) {
		console.error(error);
		message.channel.send(messages.bot_error.replace('(ERROR)', error));
	}
});


client.login(process.env.BOT_TOKEN);
