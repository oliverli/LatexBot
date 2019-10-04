# LatexBot

Telegram to convert any given LaTeX code in a Telegram Chat into a rendered picture for easy viewing

Expanded on the original [LatexBot](https://github.com/luigifreitas/LatexBot). Unfortunately, the dependencies were all outdated and it didn't work anymore.

`\convert` converts any LaTeX code in a math environment

`\convertraw` converts any (multiline) LaTeX code in a normal LaTeX environment. Math mode has to be manually enabled with `$`s or a suitable environment. No adding of preamble packages are allowed.

`\convertwithpreambleraw` converts any (multiline) LaTeX code in a normal LaTeX environment. Everything is the same as `\convertraw`, except any lines starting with `\use` will be added to the preamble and not the main LaTeX body. Hence, no fancy stuff such as `\makeatletter`, etc.

Contributors:  
oliverli, sunjerry019
