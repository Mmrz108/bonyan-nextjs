import { describe, expect, it } from "vitest";
import {
  isAuthPublicPath,
  isProtectedAppPath,
  resolveAuthRedirect,
  stripLocalePrefix,
} from "@/lib/auth/path-guards";

describe("stripLocalePrefix", () => {
  it("removes locale prefixes", () => {
    expect(stripLocalePrefix("/en/dashboard")).toBe("/dashboard");
    expect(stripLocalePrefix("/ar/login")).toBe("/login");
    expect(stripLocalePrefix("/en")).toBe("/");
  });
});

describe("path classification", () => {
  it("treats login as public", () => {
    expect(isAuthPublicPath("/login")).toBe(true);
    expect(isProtectedAppPath("/login")).toBe(false);
  });

  it("protects app routes but keeps marketing home public", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/projects")).toBe(true);
    expect(isProtectedAppPath("/")).toBe(false);
  });
});

describe("resolveAuthRedirect", () => {
  it("sends anonymous users on private routes to login", () => {
    expect(resolveAuthRedirect("/dashboard", false)).toEqual({
      action: "to-login",
    });
  });

  it("allows anonymous marketing home", () => {
    expect(resolveAuthRedirect("/", false)).toEqual({ action: "allow" });
  });

  it("allows authenticated marketing home", () => {
    expect(resolveAuthRedirect("/", true)).toEqual({ action: "allow" });
  });

  it("sends authenticated users away from login", () => {
    expect(resolveAuthRedirect("/login", true)).toEqual({
      action: "to-dashboard",
    });
  });

  it("allows authenticated dashboard access", () => {
    expect(resolveAuthRedirect("/dashboard", true)).toEqual({
      action: "allow",
    });
  });

  it("allows anonymous login access", () => {
    expect(resolveAuthRedirect("/login", false)).toEqual({ action: "allow" });
  });
});
