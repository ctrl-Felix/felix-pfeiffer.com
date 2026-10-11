You handle the open Dependabot pull requests of ctrl-Felix/felix-pfeiffer.com. Dependabot opens them against `staging`.

0. Get to know the project. Read CLAUDE.md, above all the sections on branches, routines and security. This prompt allows you to create branches, open pull requests to `main` and merge them. Every other rule in CLAUDE.md still applies.

1. List the open pull requests by `dependabot[bot]`. If there are none, go to step 7. Handle each pull request on its own. For a grouped one, assess every package in it.

2. Research the change:
   - Read the pull request, the release notes and the changelog for every version between the current and the new one.
   - Find where the repo uses the package: imports, config files, Dockerfiles, workflows.
   - Find which other dependencies are affected: peer dependencies, packages that depend on it, `npm ls <package>`.
   - Estimate how much code has to be rewritten.

3. Rate the probability that something breaks:
   - Low: the changes are clearly laid out, no compatibility downgrade or bridging package is needed and the change is not complex.
   - Medium: one of those is not true, or you find another concrete reason why something could break.
   - High: several of those are not true, or a breaking change needs real code changes across the project.

4. Decide. You may handle the update yourself if at least one is true:
   - it needs no code changes,
   - it needs code changes that have no impact on other dependencies,
   - the probability that something breaks is Low.
   Otherwise change nothing. Comment on the Dependabot pull request that it needs a manual review, with the impact, the rating and the concrete reasons. Send Felix a push notification with the link and one sentence on why.

5. Handle the update:
   a. Create a new branch from `main`: `git fetch origin && git branch deps/<package>-<new version> origin/main && git checkout deps/<package>-<new version>`. Never work on `staging` or `main` directly.
   b. Apply only Dependabot's own commits: `git cherry-pick $(git rev-list --reverse origin/staging..origin/<dependabot branch>)`. Never merge the Dependabot branch, it is based on `staging` and would carry unreleased work into `main`. If the cherry-pick conflicts, abort it and apply the same versions with npm (`npm install <package>@<version>`) or by hand for workflow and Dockerfile bumps. Never edit `package-lock.json` by hand.
   c. Make the code changes the update needs.
   d. Run `npm ci`, `npm run lint`, `npm test` and `npm run build`. If one fails and the fix is beyond what step 4 allows, treat it as a manual review (step 4) and delete your branch.
   e. Push the branch and open a pull request to `main` titled `Update <package> to <version>`. In the body, link the Dependabot pull request and give the impact, the rating and the local test results.
   f. Schedule a check-in 3 minutes after creating the pull request. At each check-in, read all checks on the pull request's head commit:
      - all green: merge the pull request with a merge commit,
      - still running: schedule another check-in in 3 minutes, at most 10 times, then report it as stuck,
      - one failed: do not merge. Comment the failing check and its cause on the pull request and send Felix a push notification.
      Never skip, disable or re-run a check to get it green, and never bypass branch protection.

6. After a merge:
   a. Bring `main` into `staging`: `git checkout staging && git pull origin staging && git merge origin/main`, run `npm test`, push to `staging`. If the merge conflicts, stop and send Felix a push notification.
   b. Dependabot then closes its pull request as up to date. If it does not, close it with a comment linking the merged pull request.
   c. Delete the branches you created on GitHub: your `deps/*` branches and the `claude/*` branch of this session if it was pushed (`git push origin --delete <branch>`). NEVER delete `staging` or `main`, and never delete a branch you did not create.

7. Record the usage of this run, always, also when nothing changed:
   a. `git checkout staging && git pull origin staging`, then `npm run usage:update -- --routine "Dependency update check"`.
   b. `git add src/data/tokenUsage.json src/data/messageCount.json src/data/routineUsage.json`, commit `Record routine usage` and `git push origin staging`.
   c. If the push is rejected, run `git pull --no-rebase origin staging`. On a conflict in those three files, run `git checkout --theirs` on them, run the same `usage:update` command again, add the files, commit and push again.

8. End with a short summary: each pull request, the decision, the rating and the outcome.
