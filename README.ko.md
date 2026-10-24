# Proofnova

<a href="README.md"><kbd>English</kbd></a> <a href="README.ko.md"><kbd><strong>한국어</strong></kbd></a> <a href="README.ja.md"><kbd>日本語</kbd></a> <a href="README.zh-CN.md"><kbd>简体中文</kbd></a>

AI가 실제 업무를 수행하도록 돕는 독립 실행 도구 서른 개입니다. 데이터·개발·운영·비즈니스·연구·학습 업무를 브라우저에서 직접 확인하세요.

**[리소스 모음 열기](https://proofnova.github.io/)**

## 리소스 사용하기

업무를 선택하고 합성 예제를 실행한 뒤, 구조화된 입력을 바꾸고 결과를 확인하세요. 각 도구는 독립 공개 저장소·AI 스킬·명령줄 실행·테스트·복구 안내를 갖춥니다. 입력은 브라우저 안에서 처리하며 계정이나 API 키가 필요하지 않습니다.

## 로컬에서 실행하기

개별 리소스를 복제하고 Node.js 22 이상에서 테스트와 예제 실행 명령을 사용하세요. 다운로드 팩에도 독립 실행 가능한 같은 소스가 들어 있습니다. 이 소개 사이트를 미리 보려면 정적 웹 서버로 여세요. 파일 주소에서 모듈을 직접 여는 방식은 지원하지 않습니다.

```sh
git clone https://github.com/proofnova/csv-harmonizer.git
cd csv-harmonizer
npm test
node cli.mjs example.json
```

## 리소스 목록

| 리소스 | 업무 |
| --- | --- |
| [CSV harmonizer](https://github.com/proofnova/csv-harmonizer) | CSV 열 별칭·자료형·중복·충돌을 정리하고 격리 행과 출처를 반환한다. |
| [Nested record flattener](https://github.com/proofnova/nested-record-flattener) | 주문·이벤트의 중첩 배열을 부모 정보와 행 출처를 보존해 평탄화한다. |
| [Time-series repair](https://github.com/proofnova/time-series-repair) | 시간대·중복·누락·순서가 뒤섞인 계측 자료를 명시한 시간 격자로 정리한다. |
| [Schema drift analyst](https://github.com/proofnova/schema-drift) | 두 데이터 스냅샷의 필드 삭제·형식 변화·새 null·선택 필드를 분류한다. |
| [Relational quality gate](https://github.com/proofnova/relational-quality) | 여러 표의 복합 키·필수 값·외래 키를 검사해 오류 행을 지정한다. |
| [Change impact planner](https://github.com/proofnova/change-impact) | 변경 파일의 소유 프로젝트와 전이 의존성을 따라 실행할 테스트를 정한다. |
| [API contract diff](https://github.com/proofnova/api-contract-diff) | API 입력·출력 계약의 변경을 방향별로 판단하고 지원하지 않는 문법을 보류한다. |
| [Minimum-cost CI matrix](https://github.com/proofnova/ci-matrix-cover) | 필수 환경·기능의 검증 범위를 전부 덮는 최소 비용 CI 작업 조합을 찾는다. |
| [Release propagation planner](https://github.com/proofnova/release-propagation) | 워크스페이스 패키지의 버전과 의존 범위 변경을 전이 관계에 맞춰 계획한다. |
| [Exact patch preflight](https://github.com/proofnova/patch-preflight) | AI가 만든 unified diff를 실제 원문에 맞춰 메모리에서 검증·적용한다. |
| [Trace reconstruction](https://github.com/proofnova/trace-reconstruction) | 뒤섞인 분산 추적 span을 시간순으로 정리하고 부모·중복·경계 오류를 찾는다. |
| [Multi-window SLO analyst](https://github.com/proofnova/slo-burn-rate) | 오류 예산 소모를 긴·짧은 구간에서 함께 계산하고 관측 누락을 분리한다. |
| [Retry and reconciliation planner](https://github.com/proofnova/retry-reconciliation) | 작업 기록의 의존성·시도 한도·lease·불명확한 외부 결과를 다음 행동으로 바꾼다. |
| [Capacity placement solver](https://github.com/proofnova/capacity-placement) | CPU·메모리·라벨·분산 제약을 지키며 작업을 최소 비용 노드에 배치한다. |
| [Restore manifest verifier](https://github.com/proofnova/restore-manifest) | 백업 객체의 실제 바이트·조각·전체 파일 해시를 확인해 복원 가능 목록을 만든다. |
| [Invoice/payment reconciliation](https://github.com/proofnova/invoice-reconciliation) | 분할·초과·중복·모호한 입금을 송장과 맞추고 잔액·미배분액을 보존한다. |
| [Landed quote comparator](https://github.com/proofnova/procurement-quotes) | 묶음 수량·최소 주문·세금·배송·환율·납기를 반영한 실구매 비용을 비교한다. |
| [Inventory rebalance solver](https://github.com/proofnova/inventory-rebalance) | 여러 거점의 초과·부족 재고를 이동 한도 안에서 전역 최소 비용으로 재배치한다. |
| [Coverage roster solver](https://github.com/proofnova/coverage-roster) | 가용 시간·기술·최대 근무량·중복을 지키며 필요한 업무 구간을 배정한다. |
| [Proration and tier billing auditor](https://github.com/proofnova/billing-auditor) | 기간 비례·구간 요금의 예상액을 계산하고 중복·누락·오청구 행을 찾는다. |
| [Citation grounding auditor](https://github.com/proofnova/citation-grounding) | 주장의 인용문·문서 버전·행 범위를 확인하고 구조화된 상충 주장을 드러낸다. |
| [Anchored document redline](https://github.com/proofnova/document-redline) | 문서의 추가·삭제·이동·수정을 안정된 절 ID와 단어 차이로 분리한다. |
| [Requirement evidence ledger](https://github.com/proofnova/requirement-evidence) | 요구사항·하위 조건·테스트·현재 revision의 실행 근거를 연결해 미충족 항목을 찾는다. |
| [Research screening ledger](https://github.com/proofnova/research-screening) | 논문 중복·메타데이터·선정 규칙을 처리하고 누락 자료와 검토 불일치를 분리한다. |
| [Evidence-bound action ledger](https://github.com/proofnova/action-ledger) | 회의에서 추출한 실행 제안을 발언·담당자·기한 근거에 묶고 모호한 제안을 보류한다. |
| [Prerequisite learning planner](https://github.com/proofnova/prerequisite-learning) | 현재 숙련도와 선행 조건에서 목표를 달성하는 최소 학습 시간 경로를 찾는다. |
| [Assessment blueprint assembler](https://github.com/proofnova/assessment-blueprint) | 문항 품질·영역·난도·시간·중복 계열·정답 분포를 함께 만족하는 시험을 구성한다. |
| [Keyboard workflow auditor](https://github.com/proofnova/keyboard-workflow) | 상태·컨트롤·키 조작 경로로 사용자 업무의 키보드 도달 가능성과 막힌 단계를 찾는다. |
| [ICU localization gate](https://github.com/proofnova/localization-contract) | 번역문의 중첩 ICU 인자·선택·복수형·보호 토큰 누락을 검사한다. |
| [Time-window itinerary solver](https://github.com/proofnova/time-window-itinerary) | 이동 시간·방문 가능 시간·체류·예산을 지키며 모든 방문을 마치는 최단 일정을 찾는다. |

## 언어

기본 언어는 영어입니다. 사이트와 모든 안내 문서는 영어·한국어·일본어·중국어 간체 전환을 제공합니다. 자료의 필드 이름과 코드 식별자는 원래 이름을 유지합니다.

## 근거와 한계

공개 실행팩을 새 폴더에 풀어 포함된 테스트와 명령줄 예제를 실행했습니다. 브라우저 확인·정해진 코드의 검사·모델 실험·외부 효과는 서로 다른 근거입니다. 작은 모델 비교는 사용자가 도구와 입력을 선택한 합성 업무 여섯 개·실행 마흔여덟 회의 제한된 실험이며, 도구 서른 개 전체의 모델 성능 검증이 아닙니다. 외부 사용 효과는 아직 확인되지 않았습니다.

## 검토 근거 실습

누락되거나 오래된 검토 증거에 관한 실행 가능한 반례 열일곱 개를 확인하세요.

[Review Evidence Lab](https://proofnova.github.io/review-evidence-lab/)

MIT 라이선스 · Proofnova · 2026
