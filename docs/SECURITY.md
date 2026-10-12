# Security maintenance

Never publish server credentials in Expo public variables or commits. Only .env.example is tracked; local environment files and Supabase CLI state are ignored. Public Supabase client keys require RLS and are not substitutes for authorization.

Historical credential exposure was identified during repository maintenance. Tokens were already absent from the current source tree. Revoking/rotating affected provider credentials is required; removing a file or rewriting Git history cannot revoke a credential. Do not repost credential values in public issues. Coordinate private vulnerability reports through GitHub's security reporting facilities when enabled.

## Dependency audit policy

npm run audit:dependencies queries npm's current advisory data and fails for unknown advisories or an unavailable audit response. As of 2026-10-12, the following tooling advisories have no compatible fix in this Expo SDK 54 dependency tree:

| Dependency         | Advisory                                 | Exposure and restriction                                                                                                                                                                                                      |
| ------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| braces <=3.0.3     | GHSA-vfj7-8cjw-p6xm                      | Metro/Jest glob parsing; do not accept untrusted build glob patterns.                                                                                                                                                         |
| node-forge <=1.4.0 | GHSA-86w9-cpqp-85rv                      | Expo tooling certificate/signature handling; not application authorization. Do not treat it as a verifier for untrusted signatures.                                                                                           |
| sprintf-js <=1.1.3 | GHSA-hp3w-g68c-fv3c                      | Tooling formatting; do not supply untrusted format strings.                                                                                                                                                                   |
| image-size 1.2.1   | GHSA-5p2g-fcmc-qvqq, GHSA-w3rx-r6r6-pgpr | Metro asset parsing; only build trusted repository images. Version 2.0.4 fixes these issues but removes the file-path API used by Metro 0.83, breaking PNG export. A compatible upstream backport or SDK upgrade is required. |

The gate accepts only these exact advisory/package/range combinations until 2026-11-12, reports them visibly and fails after expiry. npm audit still reports these findings and their dependent-package counts. This is documented risk acceptance for upstream tooling, not a clean audit or a suppression of new vulnerabilities. Remove an exception when a compatible patched release exists; review the exposure before extending it.

Patched transitive overrides for PostCSS, ws and uuid are checked by clean installation, Expo Doctor and production export. Review overrides when upgrading Expo. Native device builds and hosted deployment verification are separate from those checks.
