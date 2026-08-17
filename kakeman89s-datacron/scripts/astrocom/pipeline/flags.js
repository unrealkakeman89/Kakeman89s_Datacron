export function conflictFlag(code, severity, message, fields = []) {
  return { code, severity, message, fields };
}

export function hasBlocking(record) {
  return (record.conflictFlags ?? []).some((flag) => flag.severity === "blocking");
}

export function appendFlag(record, flag) {
  const existing = record.conflictFlags ?? [];
  if (existing.some((item) => item.code === flag.code && item.message === flag.message)) {
    return record;
  }
  return {
    ...record,
    conflictFlags: [...existing, flag]
  };
}
