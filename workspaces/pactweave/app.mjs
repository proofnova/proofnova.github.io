import { analyzeRequest, runBrowser } from "./browser.mjs";

const translations = {
  en: {
    skip: "Skip to the workspace",
    architecture: "Architecture",
    headline: "One Skill.<br>Every Workflow.<br><span>Verified.</span>",
    lead: "Turn a request into a contract. Run registered tools. Keep the evidence that proves the result.",
    try: "Try a real workflow ↗",
    quickstart: "Local CLI quick start →",
    policy: "No account · No API key · No data upload · No paid calls",
    artNote: "A result needs evidence.",
    scopeEyebrow: "HONEST BY DESIGN",
    scopeTitle: "One entry. Clear boundaries.",
    browserPill: "Browser available",
    browserTitle: "Real deterministic execution",
    browserText:
      "Intent analysis, contracts, registered pure tools, bounded review, local document search and in-memory state run in your browser.",
    localPill: "Local CLI Required",
    localTitle: "Your machine, your authority",
    localText:
      "Disk persistence, restart recovery, trusted project commands and configured model providers require the local CLI. These are not simulated here.",
    unsupportedPill: "Explicitly bounded",
    unsupportedTitle: "Unknown tasks stay honest",
    unsupportedText:
      "A request outside registered capabilities returns BLOCKED with missing inputs or prerequisites. Natural language is never turned into arbitrary shell commands.",
    workspaceTitle: "See what actually ran.",
    workspaceIntro:
      "Use the sample, inspect its contract, then change a criterion to see a real failure.",
    inputTitle: "Your workflow",
    sample: "Sample",
    sampleInvoice: "Invoice reconciliation",
    sampleBlocked: "Missing task: BLOCKED",
    sampleFailure: "Unmet criterion: not PASS",
    request: "User request",
    spec: "Task specification (JSON)",
    specHelp:
      "Explicit adapter, structured input and a measurable criterion. Request text is kept separately above.",
    run: "Run & verify ↗",
    reset: "Reset sample",
    inputPrivacy:
      "Inputs stay in this page's memory. Reloading clears the workflow. Only your language preference is saved.",
    resultsTitle: "Execution evidence",
    ready: "Ready. Nothing has executed yet.",
    intent: "Request intent",
    contract: "Task Contract",
    plan: "Execution plan",
    cache: "Session cache",
    knowledge: "Wiki / RAG queries",
    llm: "LLM calls",
    loop: "PactLoop events",
    evidence: "Verification evidence",
    json: "Final JSON",
    download: "Download execution record",
    architectureTitle: "A contract runs through everything.",
    architectureIntro:
      "Knowledge and models are optional branches inside the loop, not mandatory gates.",
    imageLanguages: "Image editions:",
    imageCaption:
      "Architecture and product direction designed by ProofNova. Drawn from shared vector geometry in four languages. PactLoop, WeaveMesh and PactVault are internal modules; pactweave is the only public skill.",
    step1: "Understand the original request",
    step1text:
      "Preserve original bytes, find missing inputs and separate assumptions from confirmed constraints.",
    step2: "Bind the Task Contract",
    step2text:
      "Acceptance criteria and permission boundaries survive every plan and repair.",
    step3: "Run PactLoop with WeaveMesh",
    step3text:
      "Execute only registered capabilities. Retrieve knowledge or request a configured model only when needed.",
    step4: "Review, store and explain",
    step4text:
      "Critical failures cannot be averaged away. Keep evidence and explicit PASS or BLOCKED outcomes.",
    architectureDoc: "Architecture documentation →",
    footer: "Local-first tools. Evidence before claims.",
    source: "Read the source ↗",
    changed: "Input changed. Run again to generate current evidence.",
    running: "Running the actual local engine…",
    complete:
      "Execution record ready. Inspect the state and failed checks before treating the task as complete.",
    invalid: "Cannot run this input:",
    notRecorded: "Not recorded by this execution.",
    noQueries: "No knowledge query requested; retrieval was skipped.",
    cacheNote:
      "Browser memory only. Exact response reuse requires a configured provider; this page does not configure one.",
    iterations: "Iterations",
    modelCalls: "Model calls",
    checks: "Evidence records",
    tooLarge: "Task JSON must be at most 500,000 characters.",
    requestInvoice:
      "Reconcile this invoice and payment. Verify that exactly one invoice is paid, preserving unallocated money.",
    requestBlocked:
      "Help me with this task. I have not supplied an executor or a completion criterion yet.",
    requestFailure:
      "Reconcile this invoice and payment, but require an impossible total of 99 paid invoices to demonstrate a failed criterion.",
  },
  ko: {
    skip: "작업 화면으로 건너뛰기",
    architecture: "아키텍처",
    headline: "하나의 스킬.<br>모든 업무의 연결.<br><span>근거로 검증.</span>",
    lead: "요청을 실행 계약으로 바꾸고 등록된 도구를 실행합니다. 결과를 입증하는 근거를 함께 남깁니다.",
    try: "실제 워크플로 실행 ↗",
    quickstart: "로컬 CLI 시작하기 →",
    policy: "계정 없음 · API 키 없음 · 입력 전송 없음 · 유료 호출 없음",
    artNote: "결과에는 근거가 필요합니다.",
    scopeEyebrow: "명확한 지원 범위",
    scopeTitle: "진입점은 하나, 경계는 명확하게.",
    browserPill: "브라우저 실행 가능",
    browserTitle: "실제 결정적 코드 실행",
    browserText:
      "요청 분석, 계약, 등록된 순수 도구, 제한된 반복 검토, 로컬 문서 검색과 메모리 상태가 브라우저에서 실행됩니다.",
    localPill: "로컬 CLI 필요",
    localTitle: "내 환경에서, 허용한 범위로",
    localText:
      "디스크 저장·재시작 복구·신뢰한 프로젝트 명령·설정한 모델 제공자는 로컬 CLI가 필요합니다. 이 화면에서 작동하는 것처럼 연출하지 않습니다.",
    unsupportedPill: "지원 범위를 명시",
    unsupportedTitle: "모르는 작업을 완료로 꾸미지 않습니다",
    unsupportedText:
      "등록된 기능 밖의 요청은 누락 입력이나 필요한 환경을 알리며 BLOCKED를 반환합니다. 자연어로 임의의 셸 명령을 만들지 않습니다.",
    workspaceTitle: "실제로 실행한 내용을 확인하세요.",
    workspaceIntro:
      "예제를 실행하고 계약을 확인한 뒤, 기준을 바꿔 실제 실패도 확인하세요.",
    inputTitle: "실행할 작업",
    sample: "예제",
    sampleInvoice: "송장·입금 대사",
    sampleBlocked: "작업 정보 누락: BLOCKED",
    sampleFailure: "기준 미충족: 통과 불가",
    request: "사용자 원본 요청",
    spec: "작업 명세 (JSON)",
    specHelp:
      "실행기, 구조화된 입력, 측정 가능한 기준을 명시합니다. 요청 원문은 위 입력란에 별도로 보존합니다.",
    run: "실행하고 검증 ↗",
    reset: "예제 초기화",
    inputPrivacy:
      "입력은 현재 페이지 메모리에만 남습니다. 새로고침하면 작업이 지워집니다. 언어 선택만 저장됩니다.",
    resultsTitle: "실행 근거",
    ready: "준비 완료. 아직 실행한 작업은 없습니다.",
    intent: "요청 의도 분석",
    contract: "작업 계약",
    plan: "실행 계획",
    cache: "세션 캐시",
    knowledge: "Wiki / RAG 조회 기록",
    llm: "LLM 호출",
    loop: "PactLoop 이벤트",
    evidence: "검증 근거",
    json: "최종 JSON",
    download: "실행 기록 내려받기",
    architectureTitle: "모든 단계에 계약을 유지합니다.",
    architectureIntro:
      "지식 검색과 모델은 반복 중 필요할 때만 사용하는 분기입니다. 필수 관문이 아닙니다.",
    imageLanguages: "이미지 언어:",
    imageCaption:
      "아키텍처와 제품 방향은 ProofNova가 설계했습니다. 같은 도형과 색상 규칙으로 네 언어의 벡터 도식을 새로 그렸습니다. PactLoop·WeaveMesh·PactVault는 내부 모듈이며 공개 스킬은 pactweave 하나입니다.",
    step1: "원본 요청 이해",
    step1text:
      "원문을 보존하고 누락 입력을 찾으며 가정과 확정된 제약을 구분합니다.",
    step2: "작업 계약 확정",
    step2text: "모든 계획과 수정에서 수용 기준과 권한 경계를 유지합니다.",
    step3: "WeaveMesh와 PactLoop 실행",
    step3text:
      "등록된 기능만 실행합니다. 지식 검색과 설정한 모델 호출은 필요할 때만 수행합니다.",
    step4: "검토·저장·설명",
    step4text:
      "중요한 실패를 평균 점수로 덮지 않습니다. 근거와 PASS 또는 BLOCKED 상태를 남깁니다.",
    architectureDoc: "아키텍처 문서 →",
    footer: "로컬 우선 도구. 주장보다 검증 근거.",
    source: "소스 보기 ↗",
    changed: "입력이 바뀌었습니다. 현재 입력의 근거를 다시 생성하세요.",
    running: "실제 로컬 엔진을 실행하고 있습니다…",
    complete:
      "실행 기록이 준비되었습니다. 완료로 판단하기 전에 상태와 실패한 검사를 확인하세요.",
    invalid: "이 입력은 실행할 수 없습니다:",
    notRecorded: "이번 실행에서 기록되지 않았습니다.",
    noQueries: "지식 조회 요청이 없어 검색을 생략했습니다.",
    cacheNote:
      "브라우저 메모리 전용입니다. 응답 재사용에는 설정한 제공자가 필요하며 이 화면은 모델 제공자를 설정하지 않습니다.",
    iterations: "반복 횟수",
    modelCalls: "모델 호출",
    checks: "근거 기록",
    tooLarge: "작업 JSON은 500,000자 이하여야 합니다.",
    requestInvoice:
      "이 송장과 입금을 대사하세요. 미배분액을 보존하며 정확히 한 건의 송장이 완납되었는지 검증하세요.",
    requestBlocked:
      "이 작업을 도와주세요. 실행기와 완료 기준은 아직 제공하지 않았습니다.",
    requestFailure:
      "이 송장과 입금을 대사하되 완납 송장 99건이라는 불가능한 기준으로 실제 검증 실패를 보여주세요.",
  },
  ja: {
    skip: "ワークスペースへ移動",
    architecture: "アーキテクチャ",
    headline: "ひとつのスキル。<br>業務をつなぐ。<br><span>根拠で検証。</span>",
    lead: "依頼を実行契約に変え、登録済みツールを実行し、結果を確かめる根拠を残します。",
    try: "実際のワークフローを試す ↗",
    quickstart: "ローカル CLI を始める →",
    policy: "アカウント不要 · API キー不要 · 入力送信なし · 有料呼び出しなし",
    artNote: "結果には根拠が必要です。",
    scopeEyebrow: "明確な対応範囲",
    scopeTitle: "入口はひとつ。境界は明確。",
    browserPill: "ブラウザで実行可能",
    browserTitle: "決定的なコードを実行",
    browserText:
      "依頼分析、契約、登録済みの純粋ツール、上限付きレビュー、ローカル文書検索、メモリ状態をブラウザで実行します。",
    localPill: "ローカル CLI が必要",
    localTitle: "自分の環境で、許可した範囲だけ",
    localText:
      "ディスク永続化、再起動後の復元、信頼したプロジェクトコマンド、設定済みモデルにはローカル CLI が必要です。この画面では模擬実行しません。",
    unsupportedPill: "範囲を明示",
    unsupportedTitle: "未知の仕事を完了扱いしません",
    unsupportedText:
      "登録機能で対応できない依頼は、不足入力や前提条件を示す BLOCKED になります。自然言語から任意のシェルコマンドは生成しません。",
    workspaceTitle: "実際に実行した内容を確認。",
    workspaceIntro:
      "例を実行し、契約を確認し、判定基準を変えて実際の失敗も確かめてください。",
    inputTitle: "ワークフロー",
    sample: "実行例",
    sampleInvoice: "請求書・入金の照合",
    sampleBlocked: "タスク不足: BLOCKED",
    sampleFailure: "基準未達: 通過しない例",
    request: "元の依頼",
    spec: "タスク仕様 (JSON)",
    specHelp:
      "実行アダプター、構造化入力、測定できる基準を指定します。依頼原文は上の欄で保持します。",
    run: "実行して検証 ↗",
    reset: "例をリセット",
    inputPrivacy:
      "入力はこのページのメモリだけに保持します。再読み込みで消去されます。言語の選択だけを保存します。",
    resultsTitle: "実行の根拠",
    ready: "準備完了。まだ何も実行していません。",
    intent: "依頼の意図",
    contract: "タスク契約",
    plan: "実行計画",
    cache: "セッションキャッシュ",
    knowledge: "Wiki / RAG 検索履歴",
    llm: "LLM 呼び出し",
    loop: "PactLoop イベント",
    evidence: "検証の根拠",
    json: "最終 JSON",
    download: "実行記録をダウンロード",
    architectureTitle: "契約をすべての段階で維持。",
    architectureIntro:
      "知識検索とモデルはループ内で必要な場合だけ使う分岐であり、必須の入口ではありません。",
    imageLanguages: "画像の言語：",
    imageCaption:
      "アーキテクチャと製品方針は ProofNova の設計です。共通の図形と配色で4言語のベクター図を描いています。PactLoop、WeaveMesh、PactVault は内部モジュールで、公開スキルは pactweave ひとつです。",
    step1: "元の依頼を理解",
    step1text:
      "原文を保持し、不足入力を見つけ、仮定と確定した制約を分離します。",
    step2: "タスク契約に結び付ける",
    step2text: "受け入れ基準と権限の境界を、計画や修復のたびに維持します。",
    step3: "WeaveMesh と PactLoop",
    step3text:
      "登録済み機能だけを実行し、知識検索や設定済みモデルは必要な場合だけ使います。",
    step4: "レビュー・保存・説明",
    step4text:
      "重要な失敗は平均点で相殺しません。根拠と PASS または BLOCKED を記録します。",
    architectureDoc: "アーキテクチャ文書 →",
    footer: "ローカル優先。主張より根拠。",
    source: "ソースを読む ↗",
    changed: "入力が変わりました。現在の入力で再実行してください。",
    running: "実際のローカルエンジンを実行中…",
    complete:
      "実行記録を用意しました。完了と判断する前に、状態と失敗した検査を確認してください。",
    invalid: "この入力は実行できません:",
    notRecorded: "今回の実行では記録されていません。",
    noQueries: "知識検索の要求がないため検索を省略しました。",
    cacheNote:
      "ブラウザのメモリ専用です。応答再利用には設定済みプロバイダーが必要で、この画面はモデルを設定しません。",
    iterations: "反復回数",
    modelCalls: "モデル呼び出し",
    checks: "根拠の記録",
    tooLarge: "タスク JSON は 500,000 文字以内にしてください。",
    requestInvoice:
      "この請求書と入金を照合し、未配賦額を保持しながら、ちょうど1件が完済されたことを検証してください。",
    requestBlocked:
      "この仕事を手伝ってください。実行アダプターと完了基準はまだ指定していません。",
    requestFailure:
      "請求書と入金を照合し、完済99件という不可能な基準で検証の失敗を示してください。",
  },
  zh: {
    skip: "跳至工作区",
    architecture: "架构",
    headline: "一个技能。<br>连接各种工作。<br><span>用证据验证。</span>",
    lead: "将请求转化为执行契约，运行已注册工具，并保留能够核验结果的证据。",
    try: "运行真实工作流 ↗",
    quickstart: "本地 CLI 快速开始 →",
    policy: "无需账号 · 无需 API 密钥 · 不上传输入 · 无付费调用",
    artNote: "结果需要证据。",
    scopeEyebrow: "明确支持边界",
    scopeTitle: "一个入口，清晰边界。",
    browserPill: "可在浏览器运行",
    browserTitle: "真实的确定性执行",
    browserText:
      "请求分析、契约、已注册纯工具、有界审查、本地文档检索和内存状态均在浏览器中运行。",
    localPill: "需要本地 CLI",
    localTitle: "在自己的环境中，按授权执行",
    localText:
      "磁盘持久化、重启恢复、受信任项目命令和已配置模型提供方需要本地 CLI。本页面不会假装执行这些功能。",
    unsupportedPill: "明确限定范围",
    unsupportedTitle: "未知任务不会被伪装成完成",
    unsupportedText:
      "超出注册能力的请求会返回 BLOCKED，说明缺少的输入或前提条件。不会把自然语言随意转换为 shell 命令。",
    workspaceTitle: "查看实际执行的内容。",
    workspaceIntro: "运行示例、检查契约，再修改判定条件，观察真实的失败结果。",
    inputTitle: "工作流",
    sample: "示例",
    sampleInvoice: "发票与付款核对",
    sampleBlocked: "任务缺失：BLOCKED",
    sampleFailure: "条件未满足：不通过",
    request: "用户原始请求",
    spec: "任务规范 (JSON)",
    specHelp: "明确适配器、结构化输入和可测量条件。请求原文在上方单独保留。",
    run: "运行并验证 ↗",
    reset: "重置示例",
    inputPrivacy: "输入只保存在当前页面内存中，刷新即清除。仅保存语言选择。",
    resultsTitle: "执行证据",
    ready: "已就绪，尚未执行任何任务。",
    intent: "请求意图",
    contract: "任务契约",
    plan: "执行计划",
    cache: "会话缓存",
    knowledge: "Wiki / RAG 查询记录",
    llm: "LLM 调用",
    loop: "PactLoop 事件",
    evidence: "验证证据",
    json: "最终 JSON",
    download: "下载执行记录",
    architectureTitle: "让契约贯穿每个阶段。",
    architectureIntro: "知识检索与模型是循环中按需使用的分支，不是强制入口。",
    imageLanguages: "图片语言：",
    imageCaption:
      "架构与产品方向由 ProofNova 设计。四种语言的矢量图采用统一的图形与配色。PactLoop、WeaveMesh、PactVault 是内部模块；唯一公开技能是 pactweave。",
    step1: "理解原始请求",
    step1text: "保留原文，识别缺失输入，区分假设与已确认的约束。",
    step2: "绑定任务契约",
    step2text: "每次规划与修复都保持验收条件和权限边界。",
    step3: "运行 WeaveMesh 与 PactLoop",
    step3text: "仅执行已注册能力，只在需要时检索知识或调用已配置模型。",
    step4: "审查、保存与解释",
    step4text: "关键失败不能被平均分抵消。保留证据并明确给出 PASS 或 BLOCKED。",
    architectureDoc: "架构文档 →",
    footer: "本地优先，证据先于主张。",
    source: "查看源码 ↗",
    changed: "输入已变化，请重新运行以生成当前证据。",
    running: "正在运行真实的本地引擎…",
    complete: "执行记录已生成。判定任务完成前，请检查状态及失败的验证项。",
    invalid: "无法运行此输入：",
    notRecorded: "本次执行未记录。",
    noQueries: "未请求知识查询，已跳过检索。",
    cacheNote:
      "仅使用浏览器内存。响应复用需要已配置提供方，本页面未配置模型提供方。",
    iterations: "迭代次数",
    modelCalls: "模型调用",
    checks: "证据记录",
    tooLarge: "任务 JSON 不得超过 500,000 个字符。",
    requestInvoice:
      "核对这张发票与付款，保留未分配金额，并验证恰好一张发票已付清。",
    requestBlocked: "请协助完成这项工作。我尚未提供执行器和完成条件。",
    requestFailure:
      "核对发票与付款，但要求99张发票已付清这一不可能条件，以展示真实验证失败。",
  },
};

const $ = (id) => document.getElementById(id);
const languageKey = "proofnova.language.v1";
let language = "en";
try {
  const stored = localStorage.getItem(languageKey);
  if (Object.hasOwn(translations, stored)) language = stored;
} catch {}
let current = null;
let generation = 0;
let busy = false;
let noticeKey = "ready";
let noticeDetail = "";
let sampleUntouched = true;
const text = (key) =>
  translations[language][key] ?? translations.en[key] ?? key;
const architectureLocales = {
  en: {
    file: "en",
    document: "architecture.md",
    alt: "PactWeave architecture: request, intent, task contract, model-free context preprocessing, PactLoop with WeaveMesh, optional knowledge and models, then PactVault and verification evidence.",
  },
  ko: {
    file: "ko",
    document: "architecture.ko.md",
    alt: "PactWeave 아키텍처: 사용자 요청, 의도 분석, 작업 계약, 무모델 문맥 정리, WeaveMesh를 실행하는 PactLoop, 선택적 지식·모델 조회, PactVault와 검증 근거.",
  },
  ja: {
    file: "ja",
    document: "architecture.ja.md",
    alt: "PactWeaveアーキテクチャ：ユーザーの依頼、意図分析、タスク契約、モデル不要の文脈整理、WeaveMeshを実行するPactLoop、必要時の知識・モデル参照、PactVaultと検証根拠。",
  },
  zh: {
    file: "zh-CN",
    document: "architecture.zh-CN.md",
    alt: "PactWeave架构：用户请求、意图分析、任务契约、无模型上下文整理、通过WeaveMesh执行的PactLoop、按需知识与模型、PactVault和验证证据。",
  },
};
const pretty = (value) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

function exampleSpec(kind) {
  if (kind === "blocked")
    return { project_id: "browser-demo", session_id: "missing-task" };
  return {
    project_id: "browser-demo",
    session_id: kind === "failure" ? "failed-criterion" : "invoice-demo",
    task: {
      adapter: "invoice-reconciliation",
      input: {
        invoices: [{ id: "i", currency: "USD", total: "10.00" }],
        payments: [
          { id: "p", currency: "USD", amount: "12.00", invoice_id: "i" },
        ],
      },
    },
    acceptance_criteria: [
      {
        id: "invoice-paid",
        path: "result.summary.paid",
        operator: "equals",
        expected: kind === "failure" ? 99 : 1,
        critical: true,
      },
      {
        id: "overpayment-preserved",
        path: "result.totals.USD.unallocated",
        operator: "equals",
        expected: "200",
        critical: true,
      },
    ],
  };
}

function state(value) {
  $("state").textContent = value;
  $("state").dataset.state = value;
}
function notice(key) {
  noticeKey = key;
  noticeDetail = "";
  $("notice").textContent = text(key);
}
function invalidate() {
  generation++;
  current = null;
  $("download").disabled = true;
  state("READY");
  notice("changed");
  $("metrics").hidden = true;
  for (const id of [
    "intent",
    "contract",
    "plan",
    "cache",
    "knowledge",
    "llm",
    "loop",
    "evidence",
    "json",
  ])
    $(`${id}-output`).textContent = "—";
}
function resetSample() {
  invalidate();
  sampleUntouched = true;
  const kind = $("example").value;
  $("request").value = text(
    kind === "blocked"
      ? "requestBlocked"
      : kind === "failure"
        ? "requestFailure"
        : "requestInvoice",
  );
  $("spec").value = pretty(exampleSpec(kind));
  notice("ready");
}
function applyLanguage() {
  const architecture = architectureLocales[language] ?? architectureLocales.en;
  const imagePath = `./assets/architecture/pactweave-architecture-${architecture.file}.svg?v=redraw-20261025`;
  $("architecture-image").setAttribute("src", imagePath);
  $("architecture-image").setAttribute("alt", architecture.alt);
  $("architecture-image-link").setAttribute("href", imagePath);
  $("architecture-document").setAttribute(
    "href",
    `./docs/${architecture.document}`,
  );
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    if (node.dataset.i18n === "headline") node.innerHTML = text("headline");
    else node.textContent = text(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-lang]"))
    node.setAttribute("aria-pressed", String(node.dataset.lang === language));
  if (sampleUntouched && !current && !busy)
    $("request").value = text(
      $("example").value === "blocked"
        ? "requestBlocked"
        : $("example").value === "failure"
          ? "requestFailure"
          : "requestInvoice",
    );
  $("notice").textContent =
    `${text(noticeKey)}${noticeDetail ? ` ${noticeDetail}` : ""}`;
  if (current) renderResult(current.result, current.analysis);
}

function renderResult(result, analysis) {
  state(result.state ?? "ERROR");
  const panels = {
    intent: analysis,
    contract: result.contract,
    plan: result.plan,
    cache: {
      scope: "browser-memory",
      note: text("cacheNote"),
      recorded: result.llm
        ? {
            exact_hits: result.llm.cache_hits,
            actual_calls: result.llm.calls,
            details: result.llm.cache ?? result.metrics?.cache ?? null,
          }
        : null,
    },
    knowledge: result.knowledge_queries?.length
      ? result.knowledge_queries
      : text("noQueries"),
    llm: result.llm,
    loop: result.events,
    evidence: result.evidence,
    json: result,
  };
  for (const [id, value] of Object.entries(panels))
    $(`${id}-output`).textContent =
      value === undefined ? text("notRecorded") : pretty(value);
  const metricValues = [
    [result.iterations, "iterations"],
    [result.llm?.calls ?? result.metrics?.llm_calls, "modelCalls"],
    [
      Array.isArray(result.evidence) ? result.evidence.length : undefined,
      "checks",
    ],
  ];
  $("metrics").replaceChildren(
    ...metricValues.map(([value, label]) => {
      const box = document.createElement("div"),
        number = document.createElement("strong"),
        name = document.createElement("span");
      number.textContent = value === undefined ? "—" : String(value);
      name.textContent = text(label);
      box.append(number, name);
      return box;
    }),
  );
  $("metrics").hidden = false;
  $("download").disabled = false;
}

$("workflow-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  invalidate();
  const token = generation;
  busy = true;
  $("run").disabled = true;
  state("RUNNING");
  notice("running");
  try {
    if ($("spec").value.length > 500000) throw new Error(text("tooLarge"));
    const supplied = JSON.parse($("spec").value);
    if (!supplied || typeof supplied !== "object" || Array.isArray(supplied))
      throw new Error("Task specification must be a JSON object.");
    const spec = { ...supplied, request: $("request").value };
    const analysis = await analyzeRequest(spec);
    const result = await runBrowser(spec);
    if (token !== generation) return;
    current = { result, analysis };
    notice("complete");
    renderResult(result, analysis);
  } catch (error) {
    if (token !== generation) return;
    state("ERROR");
    noticeKey = "invalid";
    noticeDetail = error.message;
    $("notice").textContent = `${text("invalid")} ${noticeDetail}`;
  } finally {
    busy = false;
    $("run").disabled = false;
  }
});
for (const id of ["request", "spec"])
  $(id).addEventListener("input", () => {
    sampleUntouched = false;
    invalidate();
  });
$("example").addEventListener("change", resetSample);
$("reset").addEventListener("click", resetSample);
for (const node of document.querySelectorAll("[data-lang]"))
  node.addEventListener("click", () => {
    language = node.dataset.lang;
    try {
      localStorage.setItem(languageKey, language);
    } catch {}
    applyLanguage();
  });
$("download").addEventListener("click", () => {
  if (!current) return;
  const url = URL.createObjectURL(
    new Blob([`${pretty(current.result)}\n`], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "pactweave-execution.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
resetSample();
applyLanguage();
