export const httpError = (status, message, extra) => Object.assign(new Error(message), { status, extra });

export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw httpError(400, r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '));
  }
  return r.data;
}
