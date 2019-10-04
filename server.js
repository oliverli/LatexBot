const TelegramBot = require("node-telegram-bot-api");
const request = require("request");

// replace the value below with the Telegram token you receive from @BotFather
// load token from file
var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'token.txt');

    const token = fs.readFileSync(filePath, {encoding: 'utf-8'}, function(err, data){
        if (err) {
            console.log("Err:", err);
            exit();
        }
    }).trim();

// Create a bot that uses "polling" to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const defaultPreamble = "\\usepackage{amsmath} \\usepackage{amsfonts} \\usepackage{amssymb} \\usepackage{graphicx} \\usepackage{mhchem}"

// Matches "/convert [whatever]"
bot.onText(/\/convert (.+)/, (msg, match) => {
  // "msg" is the received Message from Telegram
  // "match" is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const latex = match[1].trim(); // the captured "whatever"
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

bot.onText(/\/convertraw(?:\@\S*)?([\s\S]*)/, (msg, match) => {
  // "msg" is the received Message from Telegram
  // "match" is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const latex = match[1].trim(); // the captured "whatever"

  if (latex) renderImageRaw(chatId, latex, defaultPreamble);
});

bot.onText(/\/convertwithpreambleraw(?:\@\S*)?([\s\S]*)/, (msg, match) => {
  // "msg" is the received Message from Telegram
  // "match" is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  latex = match[1].trim(); // the captured "whatever"

  preamble = [defaultPreamble];
  body = [];

  x = latex.split("\n");
  l = x.length;

  x.forEach(function (elem) {
      if (elem.length >= 4 && elem.substring(0, 4) === "\\use") {
          preamble.push(elem);
      }
      else {
          body.push(elem);
      }
  });

  preamble = preamble.join("\n");
  body = body.join("\n");

  if (body) renderImageRaw(chatId, body, preamble);
});

async function renderImageRaw(TelegramChatID, latex, preamble){
    request.post("https://quicklatex.com/latex3.f",
      {
        form: {
          formula: `\\begin{align*}\\end{align*}${latex}`,
          fsize: "99px",
          fcolor: "000000",
          mode: "0",
          out: "1",
          remhost: "quicklatex.com",
          preamble: preamble,
          errors: "1"
        }
      }, (error, _, body) => {
        if (error) {
          bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");
        }
        else {
          const split = body.split("\n");
          const image = split[1].split(" ")[0].trim();

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

async function renderImage(TelegramChatID, latex) {
  return renderImageRaw(TelegramChatID, `\\begin{align*}${latex}\\end{align*}`, defaultPreamble)
}
