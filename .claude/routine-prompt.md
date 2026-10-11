<what this routine should do>

Usage tracking is required on every run, also when the task changed nothing:
1. Work on `staging`: `git checkout staging && git pull origin staging`. Run `npm ci` if `node_modules` is missing.
2. When the task is done, run `npm run usage:update`.
3. `git add src/data/tokenUsage.json src/data/messageCount.json src/data/routineUsage.json` and commit `Record routine usage`. Other changes of the task go in their own commits before it.
4. `git push origin staging`. If the push is rejected, run `git pull --no-rebase origin staging`. On a conflict in those three files run `git checkout --theirs` on them, run `npm run usage:update` again, add them and commit. Then push again.
