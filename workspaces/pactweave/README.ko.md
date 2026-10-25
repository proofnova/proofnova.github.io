<a href="README.md"><kbd>English</kbd></a> · <a href="README.ko.md"><kbd>한국어 ✓</kbd></a> · <a href="README.ja.md"><kbd>日本語</kbd></a> · <a href="README.zh-CN.md"><kbd>简体中文</kbd></a>

# ProofNova PactWeave

**One Skill. Every Workflow. Verified.**

요청을 이해하고 실행 계약을 확정한 뒤, 등록된 도구를 실행하고 근거로 결과를 확인하는 하나의 설치형 스킬입니다. 모델은 선택 사항이며 지원하지 않는 작업은 명확하게 중단 상태로 남깁니다.

아키텍처와 제품 방향은 ProofNova가 설계했습니다. PactLoop·WeaveMesh·PactVault는 해당 설계를 독립적으로 구현하는 내부 모듈이며, 공개 스킬은 `pactweave` 하나입니다.

![ProofNova PactWeave 한국어 아키텍처](assets/architecture/pactweave-architecture-ko.svg?v=redraw-20261025)

이미지 언어: [English](assets/architecture/pactweave-architecture-en.svg?v=redraw-20261025) · [한국어](assets/architecture/pactweave-architecture-ko.svg?v=redraw-20261025) · [日本語](assets/architecture/pactweave-architecture-ja.svg?v=redraw-20261025) · [简体中文](assets/architecture/pactweave-architecture-zh-CN.svg?v=redraw-20261025)

## 빠른 시작

Node.js 22 이상이 필요합니다. 필수 런타임 패키지·계정·API 키·유료 제공자·자동 다운로드는 없습니다. 저장소 복제는 사용자가 명시적으로 수행하는 동작입니다. 아래 명령은 로컬 합성 입력을 사용하며 실제 송금이나 외부 서비스 호출을 수행하지 않습니다.

```sh
git clone https://github.com/proofnova/proofnova-pactweave.git
cd proofnova-pactweave
node cli.mjs doctor --json
node cli.mjs analyze examples/invoice.json --json
node cli.mjs run examples/invoice.json --json
node --test
```

예제는 USD 10.00 송장과 USD 12.00 입금을 사용합니다. 계약은 `result.summary.paid`가 `1`인지 요구합니다. 실제 출력에서 해당 조건, 미배분액 보존, 원본 요청 유지, 실행·검토 근거를 확인하세요. 실행 작업이나 수용 기준이 없으면 `BLOCKED`를 반환하며, 기준 미충족을 완료로 보고하면 안 됩니다.

## 공개 스킬 하나 설치

[SKILL.md](SKILL.md)와 상대 경로 소스를 유지해 저장소를 에이전트의 스킬 설치 위치에 복사하고, 사용 중인 호스트의 Agent Skills 호환 로더를 사용하세요. CLI는 에이전트 호스트 없이도 실행됩니다. 선택적으로 `npm link`를 실행하면 현재 체크아웃의 `pactweave` 명령이 등록됩니다. npm 레지스트리에서 패키지를 다운로드하는 단계가 아닙니다.

설치할 스킬 폴더 이름은 반드시 **`pactweave`**이며, 그 안의 최상위에 `pactweave/SKILL.md`와 상대 경로 소스를 그대로 배치하세요. GitHub 저장소 이름 `proofnova-pactweave`는 유지하되 호스트의 스킬 경로에 설치할 때 폴더명을 바꾸면 됩니다. SKILL.md 앞에 `proofnova-pactweave` 하위 폴더를 한 번 더 중첩하지 마세요.

## 실제 브라우저 엔진 실행

[데모 열기](https://proofnova.github.io/workspaces/pactweave/). 송장 예제·정보 누락·기준 미충족 예제를 선택하고 요청, 계약, 계획, 캐시 기록, 선택적 지식 조회, 모델 호출 기록, PactLoop 이벤트, 검증 근거, 최종 JSON을 확인하세요. 입력을 변경하면 이전 근거와 다운로드는 무효화됩니다. 입력은 페이지 메모리에만 남고 언어 선택만 저장됩니다. 정적 파일은 일반적으로 내려받지만 작업 입력은 업로드하지 않습니다.

## 기능별 지원 범위

| 기능                                         | 브라우저                 | 로컬 CLI                             |
| -------------------------------------------- | ------------------------ | ------------------------------------ |
| 규칙 기반 의도 분석·유형이 있는 계약 질문    | 지원                     | 지원                                 |
| 등록된 ProofNova 순수 도구 실행              | 지원                     | 지원                                 |
| PactLoop·WeaveMesh 결정적 역할·작업 실행     | 지원                     | 지원                                 |
| 출처를 포함한 로컬 Wiki/RAG 분할·BM25 검색   | 메모리 문서              | 영속 로컬 문서                       |
| 세션 응답 캐시 관리                          | 메모리 전용, 모델 미설정 | TTL·무효화를 지원하는 별도 로컬 캐시 |
| PactVault 저장·복구·보존·내보내기            | 로컬 CLI 필요            | 지원                                 |
| 신뢰한 프로젝트 명령                         | 로컬 CLI 필요            | 명시적 호스트 권한 필요              |
| 모델 제공자 콜백                             | 데모에 설정되지 않음     | Gateway를 통한 선택적 제공자         |
| 유료 호출·무제한 네트워크·자동 코드 다운로드 | 비활성화                 | 기본 비활성화                        |
| 임의 자연어→셸 실행·지원 밖의 의미 작업      | 미지원                   | 명시적 신뢰 기능이 없으면 BLOCKED    |

## 고정된 아키텍처

원본 요청 → 의도 분석 → 작업 계약 → 무모델 문맥 전처리 → PactLoop 계획·실행·검토·수정 → 근거와 최종 보고 순서를 유지합니다. Wiki·RAG·LLM Gateway는 계획·실행·검토 중 명시적인 정보 공백이 있을 때만 사용하는 분기이며, 모든 작업의 필수 시작 단계가 아닙니다.

**PactLoop**는 제한된 반복·부정적 검토·수정·재개 과정에서 원본 요청과 수용 계약을 유지합니다. 중요한 실패를 평균 점수로 상쇄하지 않습니다.

**WeaveMesh**는 등록된 처리기와 의존 작업을 실행합니다. 역할은 실제 실행한 함수를 나타내며 가상의 AI 직원을 뜻하지 않습니다. 독립적이고 유용한 작업만 병렬화하고 공유 쓰기는 직렬화합니다.

**PactVault**는 Resources·Memory·Skills·Sessions를 범위별 식별자·해시·복구와 함께 로컬에 저장합니다. 세션 LLM 응답은 물리적으로 분리된 캐시이며 장기 지식과 다릅니다.

**LLM Gateway**만 제공자를 호출합니다. 유효한 정확 캐시만 호출을 생략할 수 있습니다. 유사한 응답은 신뢰하지 않는 보조 문맥이며 정답이 아닙니다. 출처·계약·권한이 바뀌면 재사용을 무효화합니다.

## 성공 문구가 아닌 측정 가능한 계약

기본 데모는 `invoice-reconciliation` 실행기, 구조화된 송장·입금, 중요한 검증 기준을 명시합니다. 엔진 자체의 실행·다이제스트·스키마·출력 불변조건도 적용됩니다. 빈 기준 목록으로 해당 검사를 끌 수 없습니다. 수정은 같은 계약 안의 입력과 계획에 한정되며 목표나 권한을 바꾸지 못합니다.

## CLI 명령

하나의 진입점에서 `analyze`, `plan`, `run`, `resume`, `status`, `verify`, `explain`, `cache`, `wiki`, `rag`, `memory`, `doctor`, `stats`, `export`를 제공합니다. 현재 인자는 `node cli.mjs --help`로 확인하세요. JSON 출력을 지원합니다. 종료 코드는 성공 0, 실행·검증 실패 1, 전제 정보 부족 2, 승인 필요 3, 예산 소진·취소 4입니다.

전체 인자·작업 ID·재개·선택적 호스트 설정은 [CLI 안내](docs/cli.md)를 확인하세요.

## 실측 결과와 재현

Windows / Node.js 24.13.1에서 **자동 테스트 142/142개가 통과**했으며, 실제 브라우저 UI로 **30개 어댑터의 정상·경계 사례 60/60개**를 실행했습니다. 영어·한국어·일본어·중국어 간체 송장 실행은 모두 PASS였습니다. 작업 누락과 조건 미충족은 BLOCKED, 잘못된 JSON은 ERROR로 처리하고 다운로드를 비활성화했습니다. 390 × 844 모바일 화면에서 가로 넘침이나 누락된 입력 레이블은 없었습니다. **CLI 명령 14개**를 실제 실행해 JSON을 확인했고, 새로 푼 배포 압축본에서도 송장 실행과 전체 142개 테스트가 통과했습니다.

[벤치마크 원본](benchmarks/results/raw.json)은 **기대 동작 16/16개**를 기록합니다. 실제 PASS는 14개이며 나머지 2개는 의도한 BLOCKED입니다. 6개 분야의 기존 개발 예제에서 등록 실행기는 **6/6개 완료**, CPU의 **SmolLM2-135M-Instruct q4**는 64개 새 토큰 제한 아래 엄격한 단일 JSON 결과 검사에서 **0/6개 통과**였습니다. 미공개 평가 문제가 아닌 개발 중 사용한 예제이며, 모델의 일반 추론 능력 측정이 아닙니다. 모델 응답 상당수는 설명문이거나 토큰 제한으로 잘렸습니다. 실행 도구와 구조화 입력은 명시적으로 제공했습니다.

실제 캐시 실험은 **캐시 없이 3회, 캐시 사용 시 2회 호출**, 정확한 적중 1회와 호출 절약 1회를 기록했습니다. 출처 버전이 바뀌면 새 추론을 수행했습니다. 이 캐시 형식 과제의 응답은 모두 정답 검사를 통과하지 못했으므로 **캐시가 답변 품질을 높이지는 않았습니다**. 최종 실험은 실제 추론 11회를 완료했습니다. 실패한 이전 두 회차도 보존했으며, 첫 회차의 EXECUTED 표시는 제공자 시도 12회가 추론 전에 모두 실패했으므로 유효한 모델 비교가 아닙니다. 토큰 절감은 측정하지 않았습니다.

[검증 기록](docs/verification.md), [실험 방법·실패 이력](benchmarks/README.md), [CLI 안내](docs/cli.md), [테스트 로그](docs/evidence/test-run-02.txt), [브라우저 근거](docs/evidence/browser-adapters.json)를 확인하세요. `node --test`와 기록된 설정으로 재현할 수 있습니다. 이 로컬 합성 측정으로 보편적 정확도나 외부 사용자 효과를 입증하지 않습니다.

## 한계와 미지원 범위

등록된 기능을 연결하는 제한된 실행 엔진입니다. 규칙 기반 분석이 모든 요청의 사람 수준 이해를 보장하지 않습니다. 런타임 감지는 모든 언어·운영 플랫폼의 완전 자동화를 의미하지 않습니다. 신뢰한 프로젝트 명령은 사용자 권한으로 로컬 코드를 실행하며 운영체제 샌드박스가 아닙니다. 로컬 저장 기록은 이 프로젝트가 암호화하지 않습니다. 브라우저 실행만으로 디스크 복구나 제공자 연동을 입증하지 않으며 합성 테스트만으로 외부 사용자 효과를 확인할 수 없습니다.

## 권한과 데이터

작업 JSON·일반 답변·조회 문서·캐시 응답은 권한을 부여하지 못합니다. 호스트 정책과 계약의 허용 범위가 교차 적용되고 금지 조건이 우선합니다. 원격 push·파괴적 변경·인증 정보 접근·외부 전송·유료 서비스·운영 변경에는 범위가 명시된 권한이 필요합니다. `.pactweave/`·원본 세션·백업·인증 정보를 Git에 올리지 마세요. 내보내기 가림 처리와 별개로 공유 전 파일을 직접 확인하세요.

## 프로젝트 문서

[아키텍처](docs/architecture.ko.md) · [설계](DESIGN.md) · [연구·반례](RESEARCH.md) · [라이선스 검토](LICENSE_AUDIT.md) · [고지](THIRD_PARTY_NOTICES.md) · [보안](SECURITY.md) · [기여](CONTRIBUTING.md) · [변경 기록](CHANGELOG.md)

목표는 작동하는 도구·명확한 문서·유지 가능한 인터페이스·정직한 근거를 통한 유용한 오픈소스 기여입니다. 기발함과 데모만으로 영향이 입증되지는 않습니다.
