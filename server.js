process.env.NTBA_FIX_319 = 1;

const Promise = require('bluebird');

Promise.config({
        cancellation: true,
});

// above due to https://github.com/yagop/node-telegram-bot-api/issues/319

const TelegramBot = require("node-telegram-bot-api");
const { exec, execSync } = require("child_process");
const tmp = require('tmp');
tmp.setGracefulCleanup();

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

// Get executable of pdflatex
const pdflatex = execSync('which pdflatex').toString().trim();
const convert = execSync('which convert').toString().trim();

// Create a bot that uses "polling" to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const defaultPreamble = ["\\usepackage{amsmath}", "\\usepackage{amsfonts}", "\\usepackage{amssymb}", "\\usepackage{graphicx}", "\\usepackage[version=4]{mhchem}"].join("\n");

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
    tmp.dir({unsafeCleanup: true}, function _tempDirCreated(err, pth, cleanupCallback) {
        if (err) throw err;

        var latexfile = path.join(pth, 'render.tex');
        var ws = fs.createWriteStream(latexfile, {emitClose: true});
        var hastikz = preamble.search("tikz") > -1; 

        if(hastikz) ws.write("\\documentclass[tikz]{standalone}\n");
        else ws.write("\\documentclass{standalone}\n");

        ws.write(preamble + "\n");
        ws.write("\\begin{document}\n");
        ws.write(latex + "\n");
        ws.write("\\end{document}");

        ws.end();

        ws.on('close', () => 
        {
            exec(`${pdflatex} -halt-on-error -interaction=nonstopmode -output-directory=${pth} ${latexfile}`, (error, stdout, stderr) => 
            {
                if (error) {
                    bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");

                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");

                    console.log(`stderr: ${stderr}`);
                    return;
                }
                
                // console.log(`stdout: ${stdout}`);
                // https://superuser.com/a/1481216

                exec(`${convert} -density 300 ${path.join(pth, 'render.pdf')} -quality 90 -colorspace RGB ${path.join(pth, 'render.png')}`, (error2, stdout2, stderr2) => 
                {
                    if (error2) {
                        bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");

                        console.log(`error: ${error2.message}`);
                        return;
                    }
                    if (stderr2) {
                        bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");

                        console.log(`stderr: ${stderr2}`);
                        return;
                    }

                    bot.sendPhoto(
                        TelegramChatID, 
                        path.join(pth, 'render.png'), 
                        {}, 
                        { contentType: 'image/png' }
                    );

                });
            });
        })        

        // Manual cleanup
        // cleanupCallback();
    });

    // Manual cleanup
    // tmpdir.removeCallback();

    // request.post("https://quicklatex.com/latex3.f",
    //   {
    //     form: {
    //       formula: `\\begin{align*}\\end{align*}${latex}`,
    //       fsize: "99px",
    //       fcolor: "000000",
    //       mode: "0",
    //       out: "1",
    //       remhost: "quicklatex.com",
    //       preamble: preamble,
    //       errors: "1"
    //     }
    //   }, (error, _, body) => {
    //     if (error) {
    //       bot.sendMessage(TelegramChatID, "Oh no! The LaTeX generator is broken. Please try again later.");
    //     }
    //     else {
    //       const split = body.split("\n");
    //       const image = split[1].split(" ")[0].trim();

    //       if (!error && image != "https://quicklatex.com/cache3/error.png") {
    //         bot.sendPhoto(TelegramChatID, image);
    //       }
    //       else {
    //         let compileError = "";
    //         for (let i = 2; i < split.length; i++) compileError += split[i] + "\n";
    //         bot.sendMessage(TelegramChatID, `Your LaTeX expression failed to compile:\n${compileError}`);
    //       }
    //     }
    //   });
}

async function renderImage(TelegramChatID, latex) {
    return renderImageRaw(TelegramChatID, `$ \\displaystyle \n${latex}\n $`, defaultPreamble);
}
