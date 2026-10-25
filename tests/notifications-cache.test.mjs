import { test } from "node:test";
import assert from "node:assert/strict";
import { isNotificationIdentityCurrent, mergeReadNotification } from "../src/hooks/queries/notifications/notificationCache.ts";

const notification = {
  id: "notice-1", appointmentId: "appointment-1", type: "appointment_created",
  serviceName: "Corte", barberShopName: "Escola", startsAt: "2030-01-07T12:00:00Z",
  timezone: "America/Sao_Paulo", createdAt: "2030-01-01T12:00:00Z", readAt: null,
};
const meta = { currentPage: 2, perPage: 15, lastPage: 3, total: 40 };

test("resposta de leitura atualiza somente o aviso correspondente sem mutar a lista original", () => {
  const other = { ...notification, id: "notice-2" };
  const list = { data: [notification, other], meta };
  const read = { ...notification, readAt: "2030-01-02T12:00:00Z" };
  const updated = mergeReadNotification(list, read);
  assert.equal(updated.data[0].readAt, read.readAt);
  assert.equal(updated.data[1], other);
  assert.equal(updated.meta, meta);
  assert.equal(list.data[0].readAt, null);
});

test("resposta repetida mantém o mesmo instante de leitura confirmado pelo servidor", () => {
  const read = { ...notification, readAt: "2030-01-02T12:00:00Z" };
  const list = { data: [notification], meta };
  assert.deepEqual(mergeReadNotification(mergeReadNotification(list, read), read), { data: [read], meta });
});

test("leitura não cria páginas inexistentes nem acrescenta um aviso em outra página", () => {
  const read = { ...notification, readAt: "2030-01-02T12:00:00Z" };
  assert.equal(mergeReadNotification(undefined, read), undefined);
  const list = { data: [{ ...notification, id: "notice-2" }], meta };
  assert.deepEqual(mergeReadNotification(list, read), list);
});

test("cache só recebe respostas da mesma sessão e geração ainda autenticada", () => {
  const expected = { sessionId: "session-a", generation: "generation-a" };
  assert.equal(isNotificationIdentityCurrent(expected, { ...expected }), true);
  assert.equal(isNotificationIdentityCurrent(expected, undefined), false);
  assert.equal(isNotificationIdentityCurrent(expected, { ...expected, sessionId: "session-b" }), false);
  assert.equal(isNotificationIdentityCurrent(expected, { ...expected, generation: "generation-b" }), false);
});
