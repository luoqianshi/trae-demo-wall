import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminShell } from "./admin-shell";

describe("AdminShell", () => {
  it("locks mobile admin pages to the viewport width", () => {
    const { container } = render(
      <AdminShell activeHref="/review" eyebrow="入库整理" title="修正单品属性">
        <section>内容</section>
      </AdminShell>
    );

    expect(container.firstElementChild).toHaveClass("overflow-x-clip");
    expect(screen.getByRole("main")).toHaveClass("min-w-0", "overflow-x-clip");
    expect(screen.queryByRole("navigation", { name: "移动后台导航" })).not.toBeInTheDocument();
    expect(screen.getByRole("banner", { name: "移动后台页眉" })).toHaveClass("border-b", "border-stone-200");

    const mobileMenu = screen.getByLabelText("页面菜单");

    expect(mobileMenu).toHaveClass("relative", "lg:hidden");
    expect(within(mobileMenu).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "今日推荐",
      "自定义推荐",
      "入库整理",
      "我的衣橱",
      "穿搭组合卡"
    ]);
  });

  it("renders backend page titles without eyebrow labels or brand display font", () => {
    render(
      <AdminShell activeHref="/review" eyebrow="入库整理" title="入库整理">
        <section>内容</section>
      </AdminShell>
    );

    expect(screen.queryByText("入库整理", { selector: "p" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "入库整理" })).not.toHaveClass("brand-title");
    expect(screen.getByRole("heading", { level: 1, name: "入库整理" })).toHaveClass("text-[#D97706]");
  });

  it("uses the approved five backend menu names", () => {
    render(
      <AdminShell activeHref="/wardrobe" eyebrow="我的衣橱" title="我的衣橱">
        <section>内容</section>
      </AdminShell>
    );

    const backendNavigation = screen.getByRole("navigation", { name: "后台导航" });

    expect(within(backendNavigation).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "今日推荐",
      "自定义推荐",
      "入库整理",
      "我的衣橱",
      "穿搭组合卡"
    ]);
    expect(screen.getByLabelText("桌面品牌区")).toHaveClass("border-b", "border-stone-200");
    expect(backendNavigation).toHaveClass("-mx-4");
    expect(screen.queryByText("晨间整理")).not.toBeInTheDocument();
    expect(screen.queryByText("批量录入、分类查看和穿搭组合卡都集中在这里。")).not.toBeInTheDocument();

    const activeLink = within(backendNavigation).getByRole("link", { name: "我的衣橱" });

    expect(activeLink).toHaveClass(
      "bg-amber-50",
      "text-[#D97706]",
      "before:absolute",
      "before:left-0",
      "before:top-0",
      "before:h-full",
      "before:w-1",
      "before:bg-[#D97706]"
    );
  });
});
