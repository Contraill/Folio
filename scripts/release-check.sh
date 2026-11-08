#!/usr/bin/env bash
# Reports which release gates hold (docs/deployment.md, "Releasing"). Reads only: it changes nothing, so it can run
# at any point, as often as needed. Needs gh, logged in as the owner, and curl.
# usage: scripts/release-check.sh
set -uo pipefail

repo=Contraill/Folio controller=Contraill/folio-controller site=https://oztozlu.dev
open=0
gate() { # gate <description> <command...>: ok if the command succeeds
  local what=$1; shift
  if "$@" >/dev/null 2>&1; then echo "  ok    $what"; else echo "  open  $what"; open=$((open + 1)); fi
}
is() { [ "$(gh api "$1" --jq "$2" 2>/dev/null)" = "$3" ]; } # is <api path> <jq> <expected>

echo "Before merging"
gate "the latest Preview run on develop succeeded" \
  test "$(gh run list -R $repo -w preview.yml -b develop -L 1 --json conclusion --jq '.[0].conclusion')" = success
gate "main requires the CI checks job" is "repos/$repo/branches/main/protection" '.required_status_checks.contexts | index("checks") != null' true
gate "main refuses force pushes" is "repos/$repo/branches/main/protection" '.allow_force_pushes.enabled' false
gate "main can't be deleted" is "repos/$repo/branches/main/protection" '.allow_deletions.enabled' false
gate "production deploys from main only" is "repos/$repo/environments/production/deployment-branch-policies" '[.branch_policies[].name] == ["main"]' true
gate "the Preview deploys from develop only" is "repos/$repo/environments/preview/deployment-branch-policies" '[.branch_policies[].name] == ["develop"]' true
gate "workflow tokens are read-only by default" is "repos/$repo/actions/permissions/workflow" '.default_workflow_permissions' read
gate "actions must be pinned to a commit" is "repos/$repo/actions/permissions" '.sha_pinning_required' true
gate "no repository-level secrets" is "repos/$repo/actions/secrets" '.total_count' 0

echo "After the first deploy"
main=$(gh api "repos/$repo/commits/main" --jq .sha 2>/dev/null)
gate "oztozlu.dev serves main ($(printf %.7s "$main"))" \
  test "$(curl -fsS --max-time 15 "$site/_build.json" 2>/dev/null | sed -n 's/.*"sha": *"\([0-9a-f]*\)".*/\1/p')" = "$main"
gate "the controller starts production syncs" is "repos/$controller/actions/variables/FOLIO_TARGETS" '.value | contains("production.yml@main")' true

echo "Going public"
gate "the repository is public" is "repos/$repo" '.visibility' public
gate "private vulnerability reporting is on" is "repos/$repo/private-vulnerability-reporting" '.enabled' true
gate "outside contributors' workflow runs need approval" is "repos/$repo/actions/permissions/fork-pr-contributor-approval" '.approval_policy' all_external_contributors

echo
if [ "$open" -eq 0 ]; then echo "Every gate holds."; else echo "$open gate(s) open."; fi
