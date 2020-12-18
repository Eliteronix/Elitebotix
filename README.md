# Elitebotix
 Repository for Discord bot Elitebotix
The bot is in development and following the tutorials by The Coding Train
More features will get added


How to deploy:
    curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash -
    sudo apt install -y nodejs
    add the .env file for using the bot tokens
    sudo npm install --global pm2
    pm2 start bot.js --name "Elitebotix" --watch
    pm2 startup
    copy the given command and execute it
    pm2 save