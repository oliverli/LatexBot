# LatexBot

Telegram Bot to convert any given LaTeX code in a Telegram Chat into a rendered picture for easy viewing.

Expanded on the original [LatexBot](https://github.com/luigifreitas/LatexBot). Unfortunately, the dependencies were all outdated and it didn't work anymore.

`\convert` converts any LaTeX code in a math environment

`\convertraw` converts any (multiline) LaTeX code in a normal LaTeX environment. Math mode has to be manually enabled with `$`s or a suitable environment. No adding of preamble packages are allowed.

`\convertwithpreambleraw` converts any (multiline) LaTeX code in a normal LaTeX environment. Everything is the same as `\convertraw`, except any lines starting with `\use` will be added to the preamble and not the main LaTeX body. Hence, no fancy stuff such as `\makeatletter`, etc.

## Dependencies
Requires the following `node_modules`:
 - `node-telegram-bot-api`
 - `tmp` (only required if running in native mode)
 - `request` (only required if running in web mode)

## Usage
Copy your bot token into `token.txt` and launch the app using:
```
node server.js
```
Then everything should be up and running!

The app will check for the existence of `pdflatex` and `convert` (part of ImageMagick) to check if a native rendering of the latex equations is possible. This unfortunately only works Linux machines. (If any Windows/Mac Developer will like to contribute, please do!)

If a native rendering is possible, the app will use the local installation of `pdflatex` to render the equations. `convert` will then be used to convert the rendered PDF equations to PNG.

To run in native mode, a full TeX installation should be available on the server running this app to ensure maximum compatibility. Otherwise, `texliveonfly` could possibly be employed on TeXLive installations. This was not done as the TeX installation may not be managed by `tlmgr`. 

If a native rendering is not possible, then the app will use the rendering endpoint provided by [quicklatex.com](quicklatex.com). 

The generated image will then be sent to the user calling the bot.

## Contributing
Feel free to make a PR!

Contributors:  
oliverli, sunjerry019
