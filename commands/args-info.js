module.exports = {
	name: 'args-info',
	description: 'Shows your arguments',
	execute(msg, args) {
		//Check if there are arguments for the command
        if (!args.length) {
            msg.channel.send(`You didn't provide any arguments.`);
        } else {
            msg.channel.send(`Command name: args-info\nArguments: ${args}`);
        }
	},
};