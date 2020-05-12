require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');

const bot = new Telegraf(process.env.TOKEN);

const getData = async () => {
	const { data } = await axios.get('https://www.worldometers.info/coronavirus/');
	const $ = cheerio.load(data);
	const columns = $($('td:contains("Brazil")')[0].parent).find('td');
	const totalCases = $(columns[1]).text().trim() || 0;
	const newCases = $(columns[2]).text().trim() || 0;
	const totalDeaths = $(columns[3]).text().trim() || 0;
	const newDeaths = $(columns[4]).text().trim() || 0;
	const totalRecovered = $(columns[5]).text().trim() || 0;
	const activeCases = $(columns[6]).text().trim() || 0
	const serious = $(columns[7]).text().trim() || 0;

	let message = '';
	message += `*Data:* ${moment().tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm')}\n`;
	message += `*Total de casos:* ${totalCases}\n`;
	message += `*Novos casos:* ${newCases}\n`;
	message += `*Total de mortes:* ${totalDeaths}\n`;
	message += `*Novas mortes:* ${newDeaths}\n`;
	message += `*Casos recuperados:* ${totalRecovered}\n`;
	message += `*Casos ativos:* ${activeCases}\n`;
	message += `*Casos graves:* ${serious}\n`;

	return {
		message,
		totalCases,
		totalDeaths
	};
};

bot.start((ctx) => {
	ctx.reply('Utilize o comando /covid para obter os números do COVID-19 no Brasil.');
});

bot.help((ctx) => {
	ctx.reply('Utilize o comando /covid para obter os números do COVID-19 no Brasil.');
});

bot.command('covid', async (ctx) => {
	try {
		const data = await getData();
		ctx.reply(data.message, { parse_mode: 'Markdown' });
	}
	catch (err) {
		ctx.reply(err.message);
	}
});

bot.launch().then(async () => {
  const dataFile = path.join(__dirname, 'data.json');
  await fs.ensureFile(dataFile);
  console.log('Bot rodando');
	setInterval(async () => {
		try {
			const data = await getData();
      const result = JSON.parse((await fs.readFile(dataFile), 'utf-8') || '{}');
			if (data.totalCases != result.totalCases || data.totalDeaths != result.totalDeaths) {
        console.log(data);
				bot.telegram.sendMessage('@covid_brasil', data.message, { parse_mode: 'Markdown' });
				await fs.writeFile(dataFile, JSON.stringify(data));
			}
		}
		catch (err) {
			bot.telegram.sendMessage('@covid_brasil', err.message);
		}
	}, 300000);
});