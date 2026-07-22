import { describe, expect, it } from "vitest";
import {
  createRejectSchema,
  createReportSchema,
  PDF_LANGUAGES,
  REPORT_STATUSES,
} from "@/lib/validations/reports";

describe("report validations", () => {
  const schema = createReportSchema({
    visitRequired: "Visit required",
    titleRequired: "Title required",
  });

  it("accepts a valid create payload", () => {
    const parsed = schema.parse({
      site_visit: "11111111-1111-4111-8111-111111111111",
      title: "Weekly report",
      summary: "All good",
    });
    expect(parsed.title).toBe("Weekly report");
    expect(parsed.summary).toBe("All good");
  });

  it("rejects missing title and invalid visit id", () => {
    const result = schema.safeParse({
      site_visit: "not-a-uuid",
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("requires rejection reason", () => {
    const reject = createRejectSchema({ reasonRequired: "Reason required" });
    expect(reject.safeParse({ reason: "" }).success).toBe(false);
    expect(reject.parse({ reason: "Missing photos" }).reason).toBe(
      "Missing photos",
    );
  });

  it("exposes workflow status and PDF language enums", () => {
    expect(REPORT_STATUSES).toContain("approved");
    expect(PDF_LANGUAGES).toEqual(["en", "ar", "bilingual"]);
  });
});
