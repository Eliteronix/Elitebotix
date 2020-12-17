//Get the prefix
const { prefix } = require('../config.json');

module.exports = {
    name: 'help',
    description: 'List all commands or get info about a specific command.',
    aliases: ['commands'],
    usage: '[command name]',
    cooldown: 5,
    execute(msg, args, prefixCommand) {
        if (prefixCommand) {
            //define variables
            const data = [];
            const { commands } = msg.client;

            //Check if all the commands should be returned
            if (!args.length) {
                data.push('Here\'s a list of all my commands:');
                //filter commands collection for noCooldownMessage and push the result
                data.push(commands.filter(commands => commands.noCooldownMessage != true).map(command => command.name).join(', '));
                data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);

                //Send all the commands (Split the message into multiple pieces if necessary)
                return msg.author.send(data, { split: true })
                    .then(() => {
                        if (msg.channel.type === 'dm') return;
                        msg.reply('I\'ve sent you a DM with all my commands!');
                    })
                    .catch(error => {
                        console.error(`Could not send help DM to ${msg.author.tag}.\n`, error);
                        msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
                    });
            }

            //Get given command name written or when aliases used
            const name = args[0].toLowerCase();
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

            //Send message if no valid command
            if (!command) {
                return msg.reply('that\'s not a valid command!');
            }

            //Push information about the command + extra information if necessary
            data.push(`**Name:** ${command.name}`);
            if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
            if (command.description) data.push(`**Description:** ${command.description}`);
            if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
            data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

            //Send the information
            msg.channel.send(data, { split: true });
        }
    },
};