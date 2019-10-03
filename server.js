const TelegramBot = require("node-telegram-bot-api");
const request = require("request");
// replace the value below with the Telegram token you receive from @BotFather
const token = "";

// Create a bot that uses "polling" to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "/convert [whatever]"
bot.onText(/\/convert (.+)/, (msg, match) => {
  // "msg" is the received Message from Telegram
  // "match" is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const latex = match[1]; // the captured "whatever"
  renderImage(chatId, latex);
});

bot.onText(/\/status/, (msg, _) => {
  // "msg" is the received Message from Telegram
  // "match" is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  console.log("status");
  bot.sendMessage(chatId, "Hi, the bot is alive and working! Sending a test LaTeX equation:");
  renderImage(chatId, "i\\hbar\\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r},t) = \\left [ \\frac{-\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r},t)\\right ] \\Psi(\\mathbf{r},t)"); //Time-dependent Schrodinger equation (general)
});

async function renderImage(TelegramChatID, latex) {
  request.post("https://quicklatex.com/latex3.f",
    {
      form: {
        formula: `\\begin{align*}${latex}\\end{align*}`,
        fsize: "99px",
        fcolor: "000000",
        mode: "0",
        out: "1",
        remhost: "quicklatex.com",
        preamble: "\\usepackage{amsmath} \\usepackage{amsfonts} \\usepackage{amssymb} \\usepackage{graphicx} \\usepackage{mhchem}",
        errors: "1"
      }
    }, (error, _, body) => {
      if (error) {
        bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");
      }
      else {
        const split = body.split("\n");
        const image = split[1].split(" ")[0];

        if (!error && image != "https://quicklatex.com/cache3/error.png") {
          bot.sendPhoto(TelegramChatID, image);
        }
        else {
          let compileError = "";
          for (let i = 2; i < split.length; i++) compileError += split[i] + "\n";
          bot.sendMessage(TelegramChatID, `Your LaTeX expression failed to compile:\n${compileError}`);
        }
      }
    });
}