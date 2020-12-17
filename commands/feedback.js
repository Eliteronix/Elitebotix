module.exports = {
    name: 'feedback',
    description: 'Sends feedback to the devs',
    execute(msg, args, prefixCommand) {
        if (prefixCommand) {
            //check for the first argument
            if (!args[0]) { //Send message if empty
                msg.channel.send(`Please specify what kind of feedback you want to give: e!feedback <Bug/Feature/General>`);
            } else if (args[0].toLowerCase() === 'bug') { //go to bug tree
                if (!args[1]) { //check for second argument
                    msg.channel.send(`Please add an explaination to your bug after the command.`);
                } else { //send message in the correct channel
                    //declare bug channel
                    const bugChannel = msg.client.channels.cache.find(channel => channel.id === '787961689362530364');
                    //check if channel was found
                    if (bugChannel) {
                        //get rid of the first argument
                        args.shift();
                        //join the bug in a variable
                        const bug = args.join(' ');
                        //send the bug into the correct Channel
                        bugChannel.send(`[BUG] ${bug} - ${msg.author.username}#${msg.author.discriminator}`);
                        //send a message to the user
                        msg.channel.send(`Your bug report was sent to the developers.`);
                    } else {
                        //if no channel found
                        msg.channel.send(`Your bug report couldn't reach the developers. Please contact Eliteronix#4208.`);
                    }
                }
            } else if (args[0].toLowerCase() === 'feature') { //go to feature tree
                if (!args[1]) { //check for second argument
                    msg.channel.send(`Please add an explaination to your feature-request after the command.`);
                } else { //send message in the correct channel
                    //declare feature channel
                    const featureChannel = msg.client.channels.cache.find(channel => channel.id === '787961754658537493');
                    //check if channel was found
                    if (featureChannel) {
                        //get rid of the first argument
                        args.shift();
                        //join the feature in a variable
                        const feature = args.join(' ');
                        //send the feature into the correct Channel
                        featureChannel.send(`[FEATURE] ${feature} - ${msg.author.username}#${msg.author.discriminator}`);
                        //send a message to the user
                        msg.channel.send(`Your feature-request was sent to the developers.`);
                    } else {
                        //if no channel found
                        msg.channel.send(`Your feature-request couldn't reach the developers. Please contact Eliteronix#4208.`);
                    }
                }
            } else if (args[0].toLowerCase() === 'general') { //go to general tree
                if (!args[1]) { //check for second argument
                    msg.channel.send(`Please add some text to your feedback after the command.`);
                } else { //send message in the correct channel
                    //declare feedback channel
                    const feedbackChannel = msg.client.channels.cache.find(channel => channel.id === '787963756495896576');
                    //check if channel was found
                    if (feedbackChannel) {
                        //get rid of the first argument
                        args.shift();
                        //join the feedback in a variable
                        const feedback = args.join(' ');
                        //send the feedback into the correct Channel
                        feedbackChannel.send(`[FEEDBACK] ${feedback} - ${msg.author.username}#${msg.author.discriminator}`);
                        //send a message to the user
                        msg.channel.send(`Your feedback was sent to the developers.`);
                    } else {
                        //if no channel found
                        msg.channel.send(`Your feedback couldn't reach the developers. Please contact Eliteronix#4208.`);
                    }
                }
            }
        }
    },
};