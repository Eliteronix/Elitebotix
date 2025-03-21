module.exports = {
	name: "Elitebotix Bun", // Name of your application
	script: "index.js", // Entry point of your application
	interpreter: "bun", // Bun interpreter
	env: {
		PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`, // Add "~/.bun/bin/bun" to PATH
	}
};