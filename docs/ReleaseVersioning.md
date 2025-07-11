# Versioning & Release Strategy

The wallet version follows the standard `<MAJOR>.<MINOR>.<PATCH>` versioning scheme.
We do not use semantic versioning as the wallet is an end user facing product, and not a library or public API with downstream dependents.
Instead, the version provides an indication of higher-level progress over time.

The release cycle should be relatively frequent (ethos of CI/CD) unless specific security auditing or consideration is required.

**Major:** _e.g. 1.X.X_
- Marks a major release or product change, that upgrades the complete usability or experience in a way that changes the essence of the wallet.
- **Examples:** Adding crypto support, moving to a native implementation.

**Minor:** _e.g. X.1.X_
- Marks a milestone or well-defined scope of work.
- The scope should not contain incomplete features, and may contain more than one feature.
  - A first iteration with reduced scope is not incomplete; incomplete is functionality that only works in some happy paths etc.
- **Examples:** Group multi-sig rotation, browser integration.

**Minor:** _e.g. X.X.1_
- This will primarily be used to push bug fixes of an already released previous minor version.
- It may also be used to release smaller features on-demand, but this should be avoided by having a sufficiently regular release cadance of minor versions.
- Each minor release could contain a single critical bug, or multiple smaller bugs/features; this should be handled on a case-by-case basis by the release team.

## Branches

Development for the next feature is always done against `main`.
The `develop` branch is not used, but can temporarily be used if a particular milestone completely revamps the wallet to the point where several pull requests are required before the wallet is back to working condition.

There will be exactly one branch for every minor version released, e.g. `release/1.2.X`.
`1.2.0` and all subsequent patches will live on this branch, and be tagged.
Release candidates will also be tagged, starting at `rc1` - for example - `1.2.0-rc1`.

In general, non-critical bug fixes will applied to the next release only.
More critical bugs must be applied to both `main` and the most recent release branch.
Bugs may be applied to older release branches, if relevant, if there are known users using a whitelabelled version of the app.
PRs are also welcome in this case.

## Compatibility

This repository is home to the Veridian Wallet.
While there are other dev/test/demo tools in the [services](../services) directory, these are not versioned or released.
We do however publish Docker image builds whenever there are changes to those services, or for merges to main. (e.g. [cred server image](https://hub.docker.com/r/cardanofoundation/cf-cred-issuance/tags))

KERIA is the only service with a direct versioning relationship with the wallet.
At present, we use a forked version of KERIA and there is currently a tight coupling w.r.t. versions.
The `KERIA_GIT_REPO_URL` and `KERIA_GIT_REF` of the [Earthfile](../Earthfile) has the best matching.

In the near future, we intend to harden the versioning and release strategy of KERIA & Signify with well defined semantic versioning, and a versioning matrix for the wallet can live here.
