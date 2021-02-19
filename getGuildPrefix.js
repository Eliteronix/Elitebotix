const { DBGuilds } = require('./dbObjects');
const { prefix } = require('./config.json');

module.exports = async function (msg){
  //Define prefix command
  let guildPrefix;

  //Check if the channel type is not a dm
  if (msg.channel.type === 'dm') {
	  //Set prefix to standard prefix
	  guildPrefix = prefix;
  } else {
	  //Get guild from the db
	  const guild = await DBGuilds.findOne({
		  where: { guildId: msg.guild.id },
	  });

    //Check if a guild record was found
	  if (guild) {
	  	if (guild.customPrefixUsed) {
	  		guildPrefix = guild.customPrefix;
	  	} else {
	  		//Set prefix to standard prefix
	  		guildPrefix = prefix;
  		}
  	} else {
  		//Set prefix to standard prefix
  		guildPrefix = prefix;
  	}
  }
  return guildPrefix
};
