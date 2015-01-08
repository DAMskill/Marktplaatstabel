REM
REM Remove files from repository completely
REM ---------------------------------------
REM Remove *.log and *.pid completely from repository
REM Links: - https://help.github.com/articles/remove-sensitive-data
REM        - http://rtyley.github.io/bfg-repo-cleaner/

git filter-branch --force --index-filter "git rm -r --cached --ignore-unmatch *.log *.pid" --prune-empty --tag-name-filter cat -- --all

REM
REM How can I remove a commit on github
REM -----------------------------------
REM For an easy revert if it's just a mistake (perhaps you forked a repo,
REM then ended up pushing to the original instead of to a new one) here's another possibility:
REM git reset --hard 71c27777543ccfcb0376dcdd8f6777df055ef479
REM Obviously swap in that number for the number of the repo you want to return to.
REM
REM Everything since then will be deleted once you push again. To do that, the next step would be:
REM git push --force
REM 
REM Source: ://stackoverflow.com/questions/448919/how-can-i-remove-a-commit-on-github

REM How to modify a specified commit?
REM ---------------------------------
REM git rebase --interactive bbc643cd^
REM You can use git rebase, for example, if you want to modify
REM back to commit bbc643cd, run
REM 
REM $ git rebase --interactive bbc643cd^
REM In the default editor, modify 'pick' to 'edit' in the line
REM whose commit you want to modify. Make your changes and then 
REM commit them with the same message you had before:
REM 
REM $ git commit -a --amend --no-edit
REM to modify the commit, and after that
REM 
REM $ git rebase --continue
REM to return back to the previous head commit.
REM 
REM WARNING: Note that this will change the SHA-1 of that
REM commit as well as all children -- in other words, this 
REM rewrites the history from that point forward. You can 
REM break repos doing this if you push using the command git push -f
REM 
REM Source: http://stackoverflow.com/questions/1186535/how-to-modify-a-specified-commit
