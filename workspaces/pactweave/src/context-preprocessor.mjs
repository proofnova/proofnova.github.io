import { assert, canonical, clone, digest } from "./shared.mjs";
export async function preprocessContext({
  contract,
  sessionRecords = [],
  maxChars = 24000,
}) {
  assert(
    Number.isInteger(maxChars) && maxChars >= 0 && maxChars <= 200000,
    "Invalid context budget",
  );
  const preserved = {
    original_request: contract.original_request,
    contract_digest: contract.contract_digest,
    constraints: contract.constraints,
    acceptance_criteria: contract.acceptance_criteria,
    forbidden_actions: contract.forbidden_actions,
    permitted_actions: contract.permitted_actions,
    assumptions: contract.assumptions,
    required_inputs: contract.required_inputs,
  };
  const seen = new Set(),
    supplemental = [];
  let used = 0,
    duplicates = 0,
    omitted = 0;
  for (const record of sessionRecords) {
    const str = canonical(record),
      hash = await digest(str);
    if (seen.has(hash)) {
      duplicates++;
      continue;
    }
    seen.add(hash);
    if (used + str.length > maxChars) {
      omitted++;
      continue;
    }
    supplemental.push(clone(record));
    used += str.length;
  }
  return {
    preserved: clone(preserved),
    supplemental,
    context_digest: await digest({ preserved, supplemental }),
    duplicates_removed: duplicates,
    omitted_records: omitted,
    supplemental_chars: used,
    preserved_chars: canonical(preserved).length,
    policy:
      "Original/contract constraints always preserved; supplemental budget does not truncate them.",
  };
}
