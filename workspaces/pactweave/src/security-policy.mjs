const local = new Set(["local.compute", "local.read"]);
export function createPolicy(options = {}) {
  return {
    network: "restricted",
    paid_providers: false,
    automatic_downloads: false,
    grants: [],
    ...options,
    grants: [...new Set(options.grants || [])],
  };
}
export function authorize(action, policy = createPolicy(), details = {}) {
  const contract = details.contract;
  if (policy.revoked || details.signal?.aborted)
    return { allowed: false, reason: "Host policy revoked or cancelled" };
  if (typeof action !== "string")
    return { allowed: false, reason: "Action is missing" };
  if (
    contract?.forbidden_actions?.includes(action) ||
    contract?.forbidden_actions?.includes("*")
  )
    return { allowed: false, reason: "Forbidden by immutable contract" };
  if (contract && !contract.permitted_actions?.includes(action))
    return {
      allowed: false,
      reason: "Action outside contract permitted scope",
    };
  if (local.has(action))
    return { allowed: true, reason: "Pure local computation/read" };
  if (action === "paid.call" && !policy.paid_providers)
    return { allowed: false, reason: "Paid providers disabled" };
  if (action === "network.download" && !policy.automatic_downloads)
    return { allowed: false, reason: "Automatic downloads disabled" };
  if (!policy.grants?.includes(action))
    return {
      allowed: false,
      reason: `Explicit host grant required: ${action}`,
    };
  return { allowed: true, reason: "Explicit host grant within contract scope" };
}
