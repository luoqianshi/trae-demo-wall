import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import ReviewPage from "./page";
import type { WardrobeItem } from "@/types/wardrobe";

const { listDraftWardrobeItems } = vi.hoisted(() => ({
  listDraftWardrobeItems: vi.fn()
}));

vi.mock("@/lib/wardrobe/repository-instance", () => ({
  getWardrobeRepository: () => ({
    listDraftWardrobeItems
  })
}));

const draftItem = (
  id: string,
  originalFilename: string,
  recognitionStatus: WardrobeItem["recognitionStatus"] = "success",
  overrides: Partial<WardrobeItem> = {}
): WardrobeItem => ({
  id,
  imagePath: `/api/uploads/${id}.png`,
  originalFilename,
  status: "draft",
  recognitionStatus,
  category: "top",
  primaryColor: "白色",
  material: "棉",
  seasons: ["summer"],
  scenarios: ["casual"],
  formality: "casual",
  styles: ["minimal"],
  warmth: "light",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
  ...overrides
});

describe("ReviewPage", () => {
  it("keeps upload entry inside the review module and provides batch correction controls", async () => {
    listDraftWardrobeItems.mockReturnValue([
      draftItem("item-1", "白衬衫.jpg"),
      draftItem("item-2", "黑裤子.jpg", "failed"),
      draftItem("item-3", "商品链接", "failed", {
        imagePath: "/product-source-placeholder.svg",
        sourceType: "product_url",
        productUrl: "https://example.com/item/123"
      })
    ]);

    render(await ReviewPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getAllByText("晨间衣橱").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Morning Atelier").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "后台导航" })).toHaveClass("hidden", "lg:flex");
    expect(within(screen.getByRole("navigation", { name: "后台导航" })).getByRole("link", { name: "入库整理" })).toHaveClass(
      "bg-amber-50",
      "text-[#D97706]"
    );
    expect(screen.getByRole("heading", { name: "入库整理" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "选择图片上传" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "粘贴商品详情页" })).toBeInTheDocument();
    expect(screen.getByLabelText("拍照录入")).toHaveAttribute("name", "photos");
    expect(screen.getByLabelText("拍照录入")).toHaveAttribute("capture", "environment");
    expect(screen.getByLabelText("从相册批量选择")).toHaveAttribute("multiple");
    const photoUploadRegion = screen.getByRole("region", { name: "选择图片上传" });
    const cameraUploadLabel = within(photoUploadRegion).getByText("拍照录入").closest("label");
    const albumUploadLabel = within(photoUploadRegion).getByText("从相册批量选择").closest("label");
    expect(cameraUploadLabel).toHaveClass("w-full", "justify-center", "gap-2", "bg-[#D97706]");
    expect(albumUploadLabel).toHaveClass("w-full", "justify-center", "gap-2", "border-stone-300", "bg-white");
    expect(cameraUploadLabel?.parentElement).toHaveClass("grid", "gap-3");
    expect(cameraUploadLabel?.parentElement).not.toHaveClass("sm:grid-cols-2");
    expect(cameraUploadLabel?.querySelector("svg")).toBeInTheDocument();
    expect(albumUploadLabel?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上传并进入整理" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "粘贴商品详情页" })).toHaveAttribute("name", "productDetailText");
    expect(screen.getByRole("button", { name: "生成待整理草稿" })).toBeInTheDocument();
    expect(screen.getByLabelText("批量季节")).toHaveAttribute("name", "batch:season");
    expect(screen.getByLabelText("批量场景")).toHaveAttribute("name", "batch:scenario");
    expect(screen.getByLabelText("批量正式程度")).toHaveAttribute("name", "batch:formality");
    expect(screen.getByLabelText("批量风格")).toHaveAttribute("name", "batch:style");
    expect(screen.getByLabelText("批量厚薄")).toHaveAttribute("name", "batch:warmth");
    expect(screen.getByLabelText("纳入批量修改 白衬衫.jpg")).toHaveAttribute("name", "batchItemId");
    expect(screen.getByLabelText("纳入批量修改 黑裤子.jpg")).toHaveAttribute("name", "batchItemId");
    expect(screen.getByText("识别失败，可直接手动填写后保存。")).toBeInTheDocument();
    expect(screen.getByText("来源：商品链接")).toBeInTheDocument();
  });

  it("shows the embedded upload entry when there are no draft items", async () => {
    listDraftWardrobeItems.mockReturnValue([]);

    render(await ReviewPage({ searchParams: Promise.resolve({ error: "empty" }) }));

    expect(screen.getByText("暂无待整理单品。")).toBeInTheDocument();
    expect(screen.getByText("请选择至少一张图片。")).toBeInTheDocument();
    expect(screen.queryByText("请粘贴商品详情页。")).not.toBeInTheDocument();
    expect(screen.getByLabelText("拍照录入")).toHaveAttribute("type", "file");
    expect(screen.queryByRole("link", { name: "上传照片" })).not.toBeInTheDocument();
  });

  it("shows product detail empty errors inside the intake module", async () => {
    listDraftWardrobeItems.mockReturnValue([]);

    render(await ReviewPage({ searchParams: Promise.resolve({ error: "empty-product-detail" }) }));

    expect(screen.getByText("请粘贴商品详情页。")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "粘贴商品详情页" })).toHaveAttribute("name", "productDetailText");
  });
});
