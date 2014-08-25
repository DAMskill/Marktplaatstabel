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
REM For an easy revert if it's just a mistake (perhaps you forked a repo, then ended up pushing to the original instead of to a new one) here's another possibility:
REM git reset --hard 71c27777543ccfcb0376dcdd8f6777df055ef479
REM Obviously swap in that number for the number of the repo you want to return to.
REM
REM Everything since then will be deleted once you push again. To do that, the next step would be:
REM git push --force
REM 
REM Source: ://stackoverflow.com/questions/448919/how-can-i-remove-a-commit-on-github
