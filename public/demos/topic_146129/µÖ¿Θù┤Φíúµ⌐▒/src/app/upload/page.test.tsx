import { vi } from "vitest";
import UploadPage from "./page";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("next/navigation", () => ({
  redirect
}));

describe("UploadPage", () => {
  it("redirects the legacy upload page to the review module", () => {
    expect(() => UploadPage()).toThrow("redirect:/review");
    expect(redirect).toHaveBeenCalledWith("/review");
  });
});
