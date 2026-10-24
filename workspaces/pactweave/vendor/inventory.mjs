// Generated from pinned first-party ProofNova public resources.
export const adapters = [
  {
    id: "csv-harmonizer",
    title: "CSV harmonizer",
    domain: "data",
    description:
      "Normalize CSV aliases, types and duplicate identities while preserving rejected rows and source provenance.",
    required: ["sources", "schema", "keys"],
    version: 1,
    source_commit: "30d5433343b0e3fa09ebafdf59e66c7ae92f5721",
    source_repository: "https://github.com/proofnova/csv-harmonizer",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["sources", "schema", "keys"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Ambiguous headers, malformed quoting and conflicting identities must not silently merge.",
    files: {
      "browser.mjs": {
        sha256:
          "3ffc84c348e85484abf9029e5e16569e6217cdf76af827ec77c2e88daa7fbdd3",
        bytes: 21430,
      },
      "node.mjs": {
        sha256:
          "ef266ac931f3d56c3dc549916a3ba3ccaf70ce957ea2e5029f1e4f2f0c2c8632",
        bytes: 18855,
      },
      "cases.json": {
        sha256:
          "8b24da533c30725e70b4347b2be9dc2b82b0592e80eeb4ab529a4802c5754b24",
        bytes: 1293,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "nested-record-flattener",
    title: "Nested record flattener",
    domain: "data",
    description:
      "Flatten nested order and event arrays without losing parent context or row provenance.",
    required: ["records", "expand", "columns"],
    version: 1,
    source_commit: "61843176a3f1ede2deb3f99194c1a3454066b23d",
    source_repository: "https://github.com/proofnova/nested-record-flattener",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["records", "expand", "columns"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Missing arrays and required fields stay visible; output retains record and child indices.",
    files: {
      "browser.mjs": {
        sha256:
          "4cc888ccc26df54960618978f1694743cf76a7f2ec65f37e23d1a6cb4f58f408",
        bytes: 19758,
      },
      "node.mjs": {
        sha256:
          "ab9370ae125f1d5acc1dd5f2725348092f74fb6ba85685b31e3004cd486ee970",
        bytes: 17183,
      },
      "cases.json": {
        sha256:
          "4f2058b90a93971a2dd17e0db3da9908a52033d908db720cc1dc0aa23beba585",
        bytes: 1158,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "time-series-repair",
    title: "Time-series repair",
    domain: "data",
    description:
      "Align time-series records to an explicit grid and identify duplicates, missing intervals and ordering problems.",
    required: ["start", "end", "interval_seconds", "samples"],
    version: 1,
    source_commit: "e334753063429a872999727b00281264efaba5f3",
    source_repository: "https://github.com/proofnova/time-series-repair",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["start", "end", "interval_seconds", "samples"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Missing observations remain null, not zero; duplicate buckets retain their source rows.",
    files: {
      "browser.mjs": {
        sha256:
          "b3f8be72bbadeecf208988557425d9e3526e044ea3de62179e775e4d763a6fe6",
        bytes: 19286,
      },
      "node.mjs": {
        sha256:
          "1ef1f09f27f8e2e5b4d38d5a3a17b7beade47d981b0bd9a5447bb8ff8ebafe13",
        bytes: 16711,
      },
      "cases.json": {
        sha256:
          "49828b8585cb732f6ac7fadb6d96e24a168fc74751b9443233182c5d033d59c8",
        bytes: 1120,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "schema-drift",
    title: "Schema drift analyst",
    domain: "data",
    description:
      "Compare data snapshots and classify removed fields, type changes, new nulls and optional properties.",
    required: ["before", "after"],
    version: 1,
    source_commit: "5d5ff1fa4a080ed3374c67631503ef3a49bc867c",
    source_repository: "https://github.com/proofnova/schema-drift",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["before", "after"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "An empty sample cannot prove field removal; null and optionality are separate changes.",
    files: {
      "browser.mjs": {
        sha256:
          "f3def18074067e045a0769dd6570d6803f64453045926da6f530f319d1a0ed06",
        bytes: 19386,
      },
      "node.mjs": {
        sha256:
          "ed83f9edf6dd66427a83168e381bfe6d2de5ea8549fce973541519fb9dfad9bf",
        bytes: 16811,
      },
      "cases.json": {
        sha256:
          "88b65e45fa1e5504bdd8b32141c3a80d99dfc84f3a1bde3d4a2eda953083c807",
        bytes: 821,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "relational-quality",
    title: "Relational quality gate",
    domain: "data",
    description:
      "Check composite keys, required values and foreign-key relationships across related tables.",
    required: ["tables"],
    version: 1,
    source_commit: "38e4deec7c554dc87fcaefc7adece407d41b158f",
    source_repository: "https://github.com/proofnova/relational-quality",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["tables"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Partial-null foreign keys are not silently treated as a valid optional relation.",
    files: {
      "browser.mjs": {
        sha256:
          "14b9d6f078e7300cefce36da5c234318e629164ecab41c7c8dbe9c82fa2157b9",
        bytes: 20018,
      },
      "node.mjs": {
        sha256:
          "0037257dd3e36d1eff75e9256f65ffffe48fa6e5d1c17d3045bb16f3288bfc64",
        bytes: 17443,
      },
      "cases.json": {
        sha256:
          "a7e76eb1f9dd86e9f6ad08355255b714b93e25facaa5959c899708b7c463af29",
        bytes: 1757,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "change-impact",
    title: "Change impact planner",
    domain: "software",
    description:
      "Follow project ownership and transitive dependencies to identify tests affected by changed files.",
    required: ["projects", "changed_files"],
    version: 1,
    source_commit: "74d1d31c59462db691be932fa659fa8e3e672ea0",
    source_repository: "https://github.com/proofnova/change-impact",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["projects", "changed_files"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A changed shared dependency reaches every dependent; unknown scope cannot produce an empty green plan.",
    files: {
      "browser.mjs": {
        sha256:
          "d32627b04599ba7232730ca7aae6ab24941b1db975d01b1ef8a99e34f5a00386",
        bytes: 19279,
      },
      "node.mjs": {
        sha256:
          "02be3c9bf66759f7fcdf664b9ec95013a68087f0081aa47cfaa3c11e33c962ca",
        bytes: 16704,
      },
      "cases.json": {
        sha256:
          "ed4e68fd18a6d7dc2b43524fafbecae7dccfd0a3b4968efdeab740253543b843",
        bytes: 1669,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "api-contract-diff",
    title: "API contract diff",
    domain: "software",
    description:
      "Classify directional API input and output contract changes, and hold unsupported syntax for review.",
    required: ["before", "after"],
    version: 1,
    source_commit: "7d370567c3bd72ebb4e5e93e942f114009297ace",
    source_repository: "https://github.com/proofnova/api-contract-diff",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["before", "after"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "New required inputs and weakened output guarantees are breaking; unsupported keywords never imply compatibility.",
    files: {
      "browser.mjs": {
        sha256:
          "9618fe384978ca22cca881e819fc9240af0d0276ab983fa83039ff38f898ae18",
        bytes: 23846,
      },
      "node.mjs": {
        sha256:
          "da9147d5c6d82772568e61a19aa5bf90e4132f48d70d8c8b3d4156237e3a981b",
        bytes: 21271,
      },
      "cases.json": {
        sha256:
          "faa37508671c1855170b37cbc67ea1435d310b6b23d5bd530ccc0da62e864a55",
        bytes: 1323,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "ci-matrix-cover",
    title: "Minimum-cost CI matrix",
    domain: "software",
    description:
      "Find the lowest-cost CI job combination that covers every declared environment and feature requirement.",
    required: ["requirements", "jobs"],
    version: 1,
    source_commit: "27c42fda235bfdf88ef35da17e194d83cb86cc20",
    source_repository: "https://github.com/proofnova/ci-matrix-cover",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["requirements", "jobs"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Every declared requirement must be covered; an over-budget optimum is not a feasible plan.",
    files: {
      "browser.mjs": {
        sha256:
          "cd8b031bc5a4077b24cf68dbe192fd20044dfac16d426c7519875ece0e267158",
        bytes: 19446,
      },
      "node.mjs": {
        sha256:
          "6f781069a05cb0c34f7d3560b3a62f399d76631e23c75a7a40dbfba6c9483020",
        bytes: 16871,
      },
      "cases.json": {
        sha256:
          "3678919eaf36f154988cb2a4636a78945513601eb4699d71fcdcd6f11ad6b077",
        bytes: 1186,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "release-propagation",
    title: "Release propagation planner",
    domain: "software",
    description:
      "Plan version and dependency-range changes through a workspace dependency graph.",
    required: ["packages", "changes"],
    version: 1,
    source_commit: "ed28df9b88b96f12e2571b68c3ea70cb77b23361",
    source_repository: "https://github.com/proofnova/release-propagation",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["packages", "changes"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Exact and caret/tilde ranges differ, including the special semantics of zero-major versions.",
    files: {
      "browser.mjs": {
        sha256:
          "699a9ee32feaefd10b04807492ace025d819d6cbf03188086d5df81252505591",
        bytes: 20686,
      },
      "node.mjs": {
        sha256:
          "1bed27f33ae6d6a8c6d193fe8af8a8083ae7de8bd98a98ef2312920c0b6db91f",
        bytes: 18111,
      },
      "cases.json": {
        sha256:
          "73c45d464a2279f1a4ec83034470ff6794ebebea318d96d19505baeb6e1fa030",
        bytes: 1237,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "patch-preflight",
    title: "Exact patch preflight",
    domain: "software",
    description:
      "Validate and apply unified diffs against the exact original text in memory before changing files.",
    required: ["files", "patch"],
    version: 1,
    source_commit: "4834f6ba2489bb083c67e18bafd653f6a8c76b44",
    source_repository: "https://github.com/proofnova/patch-preflight",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["files", "patch"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Wrong context, traversal, missing sources and mismatched hunk counts are rejected.",
    files: {
      "browser.mjs": {
        sha256:
          "81d3f972528c4832a45b0779296bc7eb142aaf1821931ff5f1193a479edff2fd",
        bytes: 21893,
      },
      "node.mjs": {
        sha256:
          "18c0d2934a126e67f3c9cad0d58c1771a215b799d10f8529bdfd2910c96c7769",
        bytes: 19318,
      },
      "cases.json": {
        sha256:
          "41faa08f7d2101445dd0fb8a3d9ddce036a5d3a18330f03727e7d1c44900fb3b",
        bytes: 706,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "trace-reconstruction",
    title: "Trace reconstruction",
    domain: "operations",
    description:
      "Reconstruct distributed trace spans and identify missing parents, duplicates and invalid time boundaries.",
    required: ["spans"],
    version: 1,
    source_commit: "5e8541ca55a95b45c20258725e9d88cdd7661b1d",
    source_repository: "https://github.com/proofnova/trace-reconstruction",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["spans"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Parent/child duration is not double-counted as wall latency; zero-duration spans do not inflate concurrency.",
    files: {
      "browser.mjs": {
        sha256:
          "8bb6a4584f0d6a6978d8d3051d5e73609b4cce5ee960843c0f255b5f8c279323",
        bytes: 20449,
      },
      "node.mjs": {
        sha256:
          "b3675e4aa578c79c88d92dfbe4ba8599ee8866eacf85c30373c2f39f8b58c26f",
        bytes: 17874,
      },
      "cases.json": {
        sha256:
          "ee94c5e16a882fc7c11ce5f9cf546871fe276c979db8c2850f0d53f8785a1a88",
        bytes: 1013,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "slo-burn-rate",
    title: "Multi-window SLO analyst",
    domain: "operations",
    description:
      "Evaluate paired long and short error-budget windows while separating missing observations from healthy signals.",
    required: ["now", "objective", "bins", "policies"],
    version: 1,
    source_commit: "8a2541134949f3ec101474800abd982adb0bfafe",
    source_repository: "https://github.com/proofnova/slo-burn-rate",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["now", "objective", "bins", "policies"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Missing or zero-traffic windows yield insufficient-data instead of a false clear result.",
    files: {
      "browser.mjs": {
        sha256:
          "e2779962dd96609ca9c829b04da7f52ae7578fefd0ac19a0554bc2c36f7c4046",
        bytes: 19879,
      },
      "node.mjs": {
        sha256:
          "bbb455a8e7c2991ed5564aa5fccb33507ab47c070762f67eadbd302799e7d828",
        bytes: 17304,
      },
      "cases.json": {
        sha256:
          "2fa549bd1203dbf4a1b78865135d0ee6095c80ee6c8a7dcd664dc870429c4e09",
        bytes: 1280,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "retry-reconciliation",
    title: "Retry and reconciliation planner",
    domain: "operations",
    description:
      "Turn dependency, attempt-limit, lease and ambiguous external-result records into explicit next actions.",
    required: ["now", "tasks"],
    version: 1,
    source_commit: "35ec50dc2b7e7c8454bedbadea5d1a30b0b2a908",
    source_repository: "https://github.com/proofnova/retry-reconciliation",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["now", "tasks"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "An expired lease or unknown side-effect result cannot automatically become another external write.",
    files: {
      "browser.mjs": {
        sha256:
          "37fa772f1df489b46892a00d0aa9537e1353683a97c42458c9ce73dd72bd9c44",
        bytes: 20660,
      },
      "node.mjs": {
        sha256:
          "fc147e07f5d06c6e1098901a25000a2e3f8b22d07c9ef96aab0acd43860d0d39",
        bytes: 18085,
      },
      "cases.json": {
        sha256:
          "67686c319ed1de62529d0afde0b006b423c0cb81a230fac8ec45bf3d65d7d650",
        bytes: 1089,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "capacity-placement",
    title: "Capacity placement solver",
    domain: "operations",
    description:
      "Assign workloads to minimum-cost nodes under CPU, memory, label and placement constraints.",
    required: ["nodes", "jobs"],
    version: 1,
    source_commit: "396cf2c2573b5923b7b0099bbb83a269203718bb",
    source_repository: "https://github.com/proofnova/capacity-placement",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["nodes", "jobs"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Affinity, resource totals and spread groups are checked together; exhausted search cannot claim optimality.",
    files: {
      "browser.mjs": {
        sha256:
          "8b675aaa02a471fa9b82870583d43762a48f7c01860c9f8ca1eadff139b49482",
        bytes: 20044,
      },
      "node.mjs": {
        sha256:
          "09270f16685e2f02973ffd3a0dadd75128105c0ca63cda54b35f7bdf42835128",
        bytes: 17469,
      },
      "cases.json": {
        sha256:
          "8408d84b64809cf09176d9f52612fc1ae1d2b5a256a76c33ded962fec8b12755",
        bytes: 1539,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "restore-manifest",
    title: "Restore manifest verifier",
    domain: "operations",
    description:
      "Verify backup bytes, chunks and whole-file hashes before declaring files ready to restore.",
    required: ["objects", "files"],
    version: 1,
    source_commit: "bceaf716aa4de8f053ddf46c1c384afc884c994c",
    source_repository: "https://github.com/proofnova/restore-manifest",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["objects", "files"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Every referenced chunk and the complete reconstructed file must match; paths cannot escape a restore root.",
    files: {
      "browser.mjs": {
        sha256:
          "2f235f5970ae48bb4588b47badfc82e36f880a363b07c9e83299e36c1227cdfa",
        bytes: 20115,
      },
      "node.mjs": {
        sha256:
          "ebc105aa226196fb6faa43396e4db70ee998cfcae2772510e6b42680223b5a50",
        bytes: 17540,
      },
      "cases.json": {
        sha256:
          "e1b3f06188c7b7908cff36a3a59af72cdddb9f713639d17c4403fe4f2d083b40",
        bytes: 1174,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "invoice-reconciliation",
    title: "Invoice/payment reconciliation",
    domain: "business",
    description:
      "Reconcile split, excess, duplicate and ambiguous payments while conserving invoice balances and unallocated money.",
    required: ["invoices", "payments"],
    version: 1,
    source_commit: "0cea2f346312b43d604a314d4d537a567f06c67e",
    source_repository: "https://github.com/proofnova/invoice-reconciliation",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["invoices", "payments"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Duplicate bank references cannot be counted twice; received equals allocated plus unallocated per currency.",
    files: {
      "browser.mjs": {
        sha256:
          "5bcc2c523353091b45999b03fef6cd6b10a7023a7bcfd0b2bb92e02a4fba6e8d",
        bytes: 22066,
      },
      "node.mjs": {
        sha256:
          "74aec99cd25a89f807bd4644fe670e48ed3b4e81f89ecb477271e5c58dd3f651",
        bytes: 19491,
      },
      "cases.json": {
        sha256:
          "870afc408562c0f979e5ea8a30241d552e48d45d7087cdaae66e489dbf6ae7f8",
        bytes: 1122,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "procurement-quotes",
    title: "Landed quote comparator",
    domain: "business",
    description:
      "Compare landed purchase costs including pack sizes, minimum orders, tax, shipping, exchange rates and lead times.",
    required: ["quantity", "base_currency", "quotes"],
    version: 1,
    source_commit: "20b19a798a931048dd08ff9b106512776df04f84",
    source_repository: "https://github.com/proofnova/procurement-quotes",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["quantity", "base_currency", "quotes"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Pack rounding, shipping, currency scale and tax can reverse a unit-price-only ranking.",
    files: {
      "browser.mjs": {
        sha256:
          "e07e69c8ab409e14217ad2095a044213497b10969d8077c85e90410ee701bf9a",
        bytes: 20579,
      },
      "node.mjs": {
        sha256:
          "a432242785a4a2048a0e0504054b1e546cb2348a8253b157e52384c0ac00b667",
        bytes: 18004,
      },
      "cases.json": {
        sha256:
          "3700b36aea5ba8de40390efd836dc0cb667999dc6f946ee2be2a73485b63d3f1",
        bytes: 1458,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "inventory-rebalance",
    title: "Inventory rebalance solver",
    domain: "business",
    description:
      "Rebalance surplus and shortage inventory across locations at minimum total cost under transfer limits.",
    required: ["stocks", "routes"],
    version: 1,
    source_commit: "8122a266cbd82ce070a9d8ccc9a3f426c8219af3",
    source_repository: "https://github.com/proofnova/inventory-rebalance",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["stocks", "routes"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A greedy route choice can be globally worse; supply, demand and route capacities must be conserved.",
    files: {
      "browser.mjs": {
        sha256:
          "7b701534eeb4a89eb047a36d45139c6b27e64b61c357a307ae9592ae401626b2",
        bytes: 20472,
      },
      "node.mjs": {
        sha256:
          "a354f695ff699afa3d682660ee3c190ac3e6fba10970b87838714e6029d10754",
        bytes: 17897,
      },
      "cases.json": {
        sha256:
          "989a54bd4defaf41e131b09708f645466d9e31331d73126ff087e39ae741a7d3",
        bytes: 1948,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "coverage-roster",
    title: "Coverage roster solver",
    domain: "business",
    description:
      "Assign required shifts while respecting availability, skills, workload limits and overlapping assignments.",
    required: ["workers", "slots"],
    version: 1,
    source_commit: "1670a94e586acf1e132ffa68e41420b839852b42",
    source_repository: "https://github.com/proofnova/coverage-roster",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["workers", "slots"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "One person cannot cover overlapping slots; skill and whole-slot availability both matter.",
    files: {
      "browser.mjs": {
        sha256:
          "05185a4b5b106d5b177b7c45b7c0069aabf7d7957172c6716cc45d179e56b4b7",
        bytes: 20755,
      },
      "node.mjs": {
        sha256:
          "9715e071956830ef3c842e47507850aadb062d1b978d61d0b4fb4d574d27235a",
        bytes: 18180,
      },
      "cases.json": {
        sha256:
          "f94937c2e03eb3808f89be40492cf21b6183f2869161a8b984a254a302e83b75",
        bytes: 1896,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "billing-auditor",
    title: "Proration and tier billing auditor",
    domain: "business",
    description:
      "Audit prorated and tiered charges, identifying duplicate, missing and incorrectly calculated billing rows.",
    required: ["period", "subscriptions", "statement"],
    version: 1,
    source_commit: "c79c02c28582909b0b123bfe8edbb7caf92eacf0",
    source_repository: "https://github.com/proofnova/billing-auditor",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["period", "subscriptions", "statement"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Charge rounding is per declared line; a mismatched total cannot hide individual duplicate or missing charges.",
    files: {
      "browser.mjs": {
        sha256:
          "e1dbfa16c3a25859a9f1202da34a77b968b51d754ca774138c9817d931726970",
        bytes: 20937,
      },
      "node.mjs": {
        sha256:
          "f509cb7f0b0aed57471add7eb0d23c4293ec9ef4435a563a99145c363777bde0",
        bytes: 18362,
      },
      "cases.json": {
        sha256:
          "00015fa9e8b7b0859d9310750c76cbc8aaf8939d6da873437fadd613780cb389",
        bytes: 1398,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "citation-grounding",
    title: "Citation grounding auditor",
    domain: "research",
    description:
      "Check quotations against document versions and line ranges, and expose structured conflicting claims.",
    required: ["documents", "claims"],
    version: 1,
    source_commit: "fad0410e0866848088280880e7202b348dca86c4",
    source_repository: "https://github.com/proofnova/citation-grounding",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["documents", "claims"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A real quote is not automatically semantic support, and a changed source cannot reuse an old digest.",
    files: {
      "browser.mjs": {
        sha256:
          "b3681e37aae4c680d5116d720f6362a973e8d5dea64e3f688f5717416ac5e1d1",
        bytes: 19971,
      },
      "node.mjs": {
        sha256:
          "5ba15b3ead453a232fd1f00b89d6157e3d69c7922ba7f322f395610318c2ebfe",
        bytes: 17396,
      },
      "cases.json": {
        sha256:
          "09cfbf0646d63011479d586076862b872b30baf43b30c3a2fe3ae20c31a94376",
        bytes: 1469,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "document-redline",
    title: "Anchored document redline",
    domain: "research",
    description:
      "Separate document additions, removals, moves and edits using stable section identities and word-level differences.",
    required: ["before", "after"],
    version: 1,
    source_commit: "23e706506d92e56edbf3c2e029247a9efa944a2a",
    source_repository: "https://github.com/proofnova/document-redline",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["before", "after"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Inserting one section must not label every following section as moved.",
    files: {
      "browser.mjs": {
        sha256:
          "19eb0abcb1159ca531772fedf9fc4aebf58e86d4e55c3d8af428e2e3cab5375a",
        bytes: 19080,
      },
      "node.mjs": {
        sha256:
          "c437fed821e9cd4147d5c9ad8eefcbcdc8196990180ae8fb43791d04cd7aceea",
        bytes: 16505,
      },
      "cases.json": {
        sha256:
          "3713303d236bf9c159f63db5ba18a0869707ca8508acac36303504144eac0c61",
        bytes: 1142,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "requirement-evidence",
    title: "Requirement evidence ledger",
    domain: "research",
    description:
      "Link requirements and child conditions to tests and execution evidence for the current revision.",
    required: [
      "requirements",
      "now",
      "max_age_seconds",
      "revision",
      "evidence",
    ],
    version: 1,
    source_commit: "23341fbd54b791c2e7afea6c5f15627e5a8b43ff",
    source_repository: "https://github.com/proofnova/requirement-evidence",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: [
        "requirements",
        "now",
        "max_age_seconds",
        "revision",
        "evidence",
      ],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Skipped, stale, future, conflicting or wrong-revision evidence cannot count as completion.",
    files: {
      "browser.mjs": {
        sha256:
          "d563b88de2b9593894268cb4ab6bd02a56eb7112f0435ccaf0a0f9f8ffecb621",
        bytes: 20141,
      },
      "node.mjs": {
        sha256:
          "573b67a3bd732bac76562eabb6ae06c3439f97c24e783479fc8b2597deeeaa11",
        bytes: 17566,
      },
      "cases.json": {
        sha256:
          "34ee51a65815c0ce5aef6fd7ad2cb7aa7168e56e1b891508420a05ba5112218d",
        bytes: 1629,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "research-screening",
    title: "Research screening ledger",
    domain: "research",
    description:
      "Deduplicate research records, apply explicit screening rules and separate missing data from review disagreements.",
    required: ["records"],
    version: 1,
    source_commit: "53da42c70ce2bff577c2e73e58505bf3c0130658",
    source_repository: "https://github.com/proofnova/research-screening",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["records"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Missing metadata is not an exclusion decision; duplicate DOI conflicts are not silently merged.",
    files: {
      "browser.mjs": {
        sha256:
          "6ae96c024862ddb171b60f2f6c1e779af31206c8a1b5512216f6230d54cba169",
        bytes: 21666,
      },
      "node.mjs": {
        sha256:
          "030737fb7f529057a164e63beee7141f3cac261a7b9c93d536fda5f42e3c8610",
        bytes: 19091,
      },
      "cases.json": {
        sha256:
          "1b970769bf3c9bff783567a9b0de2428c509edaa1e556460ada8efeb349abb91",
        bytes: 1234,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "action-ledger",
    title: "Evidence-bound action ledger",
    domain: "research",
    description:
      "Bind proposed meeting actions to source statements, owners and deadlines, holding ambiguous proposals for review.",
    required: ["turns", "owners", "timezone", "proposals"],
    version: 1,
    source_commit: "9634c76bc24f84ea6ff3dfa6afb153d0d5a8075b",
    source_repository: "https://github.com/proofnova/action-ledger",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["turns", "owners", "timezone", "proposals"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A plausible task without a matching quote or owner/date evidence remains held.",
    files: {
      "browser.mjs": {
        sha256:
          "4a07ffeb0b85e85d45572b7b42ec0586d176248f3012304b7b783160f7af43f8",
        bytes: 20996,
      },
      "node.mjs": {
        sha256:
          "f0d339b35f2a8f6ff5da912dfa38d31b89bb05d658c340b8edd8e7469b1696bb",
        bytes: 18421,
      },
      "cases.json": {
        sha256:
          "a441ce6a185b41b5b0aed69781392b24ee01a9930225efc91877e4a68935b764",
        bytes: 1432,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "prerequisite-learning",
    title: "Prerequisite learning planner",
    domain: "learning",
    description:
      "Find a minimum-time learning path from current mastery and prerequisite constraints to a declared goal.",
    required: ["concepts", "activities", "goals", "budget_minutes"],
    version: 1,
    source_commit: "49c27d3021b5464e1c70d2243d69da05668809a5",
    source_repository: "https://github.com/proofnova/prerequisite-learning",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["concepts", "activities", "goals", "budget_minutes"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A cheap activity cannot bypass an unmet prerequisite; already-mastered concepts need no repeat work.",
    files: {
      "browser.mjs": {
        sha256:
          "ca5276a3a35755c7330d467d0b16fae734e3b91872ab70def70666d16564b52d",
        bytes: 20750,
      },
      "node.mjs": {
        sha256:
          "493d5ce9dcc7403b9a9eb52786c1a9bc1ec673e9dd31c2986fb3907e5aaf7bc3",
        bytes: 18175,
      },
      "cases.json": {
        sha256:
          "515362438fa4f37324c946b4fec2fe800b8d76eac3de1d539edcc888154c4a09",
        bytes: 2064,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "assessment-blueprint",
    title: "Assessment blueprint assembler",
    domain: "learning",
    description:
      "Assemble assessments satisfying quality, topic, difficulty, timing, item-family and answer-distribution constraints.",
    required: ["items", "blueprint", "max_minutes"],
    version: 1,
    source_commit: "e91f84bca16d4527f3fa829288561ff1e0aac110",
    source_repository: "https://github.com/proofnova/assessment-blueprint",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["items", "blueprint", "max_minutes"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A duplicated option or invalid answer index cannot enter a seemingly complete assessment.",
    files: {
      "browser.mjs": {
        sha256:
          "d11841ec46ac0a77a1252e9549a2acc3285ad150bec0a1ac8c880059f6e9b440",
        bytes: 21302,
      },
      "node.mjs": {
        sha256:
          "3c2cfb926e0334d5a2c350d988ed78462413053786491da6bdee21c487daf06f",
        bytes: 18727,
      },
      "cases.json": {
        sha256:
          "96164921c28fd16c5aed7303a54a1c01da4d7c35aacb63421bab22423dfb7d6c",
        bytes: 2005,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "keyboard-workflow",
    title: "Keyboard workflow auditor",
    domain: "learning",
    description:
      "Audit whether declared user tasks are reachable through keyboard controls, states and interaction paths.",
    required: ["states", "actions", "start", "goal"],
    version: 1,
    source_commit: "09c073d348215bb07eacd6a7b6d610d0563d31ee",
    source_repository: "https://github.com/proofnova/keyboard-workflow",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["states", "actions", "start", "goal"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "A pointer-only or unnamed button cannot make a keyboard workflow reachable; this is a bounded graph audit.",
    files: {
      "browser.mjs": {
        sha256:
          "e56304a1b5ad81a3b83d6694843bdb8817e41b978341586a2c0fb6c4f6dea4bc",
        bytes: 20346,
      },
      "node.mjs": {
        sha256:
          "794540a79192a8ff608c7bb7baf5e0843177bddb9a676ed836f9224ab908c988",
        bytes: 17771,
      },
      "cases.json": {
        sha256:
          "510e3664e4a5da0c634c230a13401d808839792783c55d122823b06c6225820e",
        bytes: 1668,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "localization-contract",
    title: "ICU localization gate",
    domain: "learning",
    description:
      "Validate nested ICU message arguments, selectors, plural branches and protected tokens across translations.",
    required: ["source", "target"],
    version: 1,
    source_commit: "422d44be6ef83b1875a10043c82333188f0000c4",
    source_repository: "https://github.com/proofnova/localization-contract",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: ["source", "target"],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Nested plurals and quoted literal braces must not be mistaken for missing or extra arguments.",
    files: {
      "browser.mjs": {
        sha256:
          "5a43d538e0647e621e6aebcbbb051cc29f112f30af63b51e37ed69ff1587b66f",
        bytes: 19999,
      },
      "node.mjs": {
        sha256:
          "95a24fe7e0db4944a875b181d4fc502c82a637a0fc878ac13f7f3e5b2c26c648",
        bytes: 17424,
      },
      "cases.json": {
        sha256:
          "ed25a6b3e811c2e9dad791e52a9c008649ce11b1d188a2ecd2cfa42c2c1861b0",
        bytes: 735,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
  {
    id: "time-window-itinerary",
    title: "Time-window itinerary solver",
    domain: "learning",
    description:
      "Find a shortest complete itinerary under travel times, opening windows, visit durations and budget limits.",
    required: [
      "stops",
      "travel_minutes",
      "start_minute",
      "end_minute",
      "budget",
    ],
    version: 1,
    source_commit: "5ffb87e7099790993aa2fe7f7cb1317abd0ee12a",
    source_repository: "https://github.com/proofnova/time-window-itinerary",
    license: "MIT",
    side_effects: [],
    capabilities: ["local.compute"],
    execution_environment: ["browser", "node22"],
    input_contract: {
      format: "JSON object",
      required_root_keys: [
        "stops",
        "travel_minutes",
        "start_minute",
        "end_minute",
        "budget",
      ],
      money: "Declared decimal strings; exact minor-unit results are strings",
      timestamps: "Explicit RFC3339 offsets where applicable",
      reference:
        "cases.json gives the complete normal and edge-case structures",
    },
    acceptance:
      "Nearest-first routing can miss a closing window; search exhaustion cannot prove infeasibility.",
    files: {
      "browser.mjs": {
        sha256:
          "b5747e391e80c6e73421f5eff98a8aefb4de4fe30c202a831a24bd662a60a6d6",
        bytes: 20346,
      },
      "node.mjs": {
        sha256:
          "2dd3066ac35315f5512d528372ba9b46f42e090962ae028bd142a7ab77bc8cb7",
        bytes: 17771,
      },
      "cases.json": {
        sha256:
          "007f83fe20e554615e2d66162f2e4d17054ba1bf47de6db1222336bd88e6d221",
        bytes: 1658,
      },
      LICENSE: {
        sha256:
          "fffe848866f589187027d7e357f9044deb82d7ef928836b07bf03cec5ba5fe3f",
        bytes: 1066,
      },
    },
  },
];
