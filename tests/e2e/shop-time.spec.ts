import { test, expect } from "@playwright/test";
import { shopTimeToIso } from "../../src/utils/shopTime";
test("converte o horário da barbearia independente do fuso do navegador", () => {
  expect(shopTimeToIso("2030-10-22T09:00", "America/Sao_Paulo")).toBe(
    "2030-10-22T12:00:00.000Z",
  );
  expect(shopTimeToIso("2030-10-22T09:00", "Asia/Tokyo")).toBe(
    "2030-10-22T00:00:00.000Z",
  );
});
test("rejeita datas inválidas e horas inexistentes/ambíguas no DST", () => {
  expect(() =>
    shopTimeToIso("2030-02-30T09:00", "America/Sao_Paulo"),
  ).toThrow();
  expect(() => shopTimeToIso("2030-03-10T02:30", "America/New_York")).toThrow();
  expect(() => shopTimeToIso("2030-11-03T01:30", "America/New_York")).toThrow();
});
