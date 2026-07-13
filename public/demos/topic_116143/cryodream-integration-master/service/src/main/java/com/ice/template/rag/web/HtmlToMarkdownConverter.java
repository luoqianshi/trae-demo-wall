package com.ice.template.rag.web;

import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;

/**
 * 轻量级 HTML -> Markdown 转换器。
 *
 * <p>仅覆盖文章正文常见标签（标题、段落、列表、链接、图片、代码、引用、加粗/斜体），
 * 足以把 readability4j 清洗后的正文转为可读 Markdown。</p>
 */
public final class HtmlToMarkdownConverter {

    private HtmlToMarkdownConverter() {
    }

    public static String convert(Element root) {
        if (root == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (Node node : root.childNodes()) {
            renderNode(node, sb);
        }
        return normalize(sb.toString());
    }

    private static void renderNode(Node node, StringBuilder sb) {
        if (node instanceof TextNode) {
            String text = ((TextNode) node).text();
            if (text != null && !text.isBlank()) {
                sb.append(text);
            }
            return;
        }
        if (!(node instanceof Element)) {
            return;
        }
        Element el = (Element) node;
        String tag = el.tagName().toLowerCase();
        switch (tag) {
            case "h1":
                appendHeading(sb, el, "# ");
                break;
            case "h2":
                appendHeading(sb, el, "## ");
                break;
            case "h3":
                appendHeading(sb, el, "### ");
                break;
            case "h4":
                appendHeading(sb, el, "#### ");
                break;
            case "h5":
            case "h6":
                appendHeading(sb, el, "##### ");
                break;
            case "p":
                sb.append(inline(el)).append("\n\n");
                break;
            case "br":
                sb.append("\n");
                break;
            case "hr":
                sb.append("\n---\n\n");
                break;
            case "ul":
                renderList(el, sb, false);
                break;
            case "ol":
                renderList(el, sb, true);
                break;
            case "blockquote":
                for (String line : inline(el).split("\n")) {
                    sb.append("> ").append(line).append("\n");
                }
                sb.append("\n");
                break;
            case "pre":
                sb.append("\n```\n").append(el.text()).append("\n```\n\n");
                break;
            case "img":
                appendImage(sb, el);
                sb.append("\n\n");
                break;
            case "figure":
            case "div":
            case "section":
            case "article":
            case "main":
                for (Node child : el.childNodes()) {
                    renderNode(child, sb);
                }
                break;
            default:
                sb.append(inline(el));
                break;
        }
    }

    private static void appendHeading(StringBuilder sb, Element el, String prefix) {
        String text = inline(el).trim();
        if (!text.isEmpty()) {
            sb.append(prefix).append(text).append("\n\n");
        }
    }

    private static void renderList(Element listEl, StringBuilder sb, boolean ordered) {
        int index = 1;
        for (Element li : listEl.children()) {
            if (!"li".equalsIgnoreCase(li.tagName())) {
                continue;
            }
            String marker = ordered ? (index++ + ". ") : "- ";
            sb.append(marker).append(inline(li).trim()).append("\n");
        }
        sb.append("\n");
    }

    private static void appendImage(StringBuilder sb, Element el) {
        String src = el.hasAttr("src") ? el.attr("src") : el.attr("data-src");
        String alt = el.attr("alt");
        if (src != null && !src.isBlank()) {
            sb.append("![").append(alt == null ? "" : alt).append("](").append(src).append(")");
        }
    }

    private static String inline(Element el) {
        StringBuilder sb = new StringBuilder();
        for (Node node : el.childNodes()) {
            if (node instanceof TextNode) {
                sb.append(((TextNode) node).text());
            } else if (node instanceof Element) {
                Element child = (Element) node;
                String tag = child.tagName().toLowerCase();
                switch (tag) {
                    case "a":
                        String href = child.attr("href");
                        String text = inline(child).trim();
                        if (href != null && !href.isBlank() && !text.isEmpty()) {
                            sb.append("[").append(text).append("](").append(href).append(")");
                        } else {
                            sb.append(text);
                        }
                        break;
                    case "strong":
                    case "b":
                        sb.append("**").append(inline(child).trim()).append("**");
                        break;
                    case "em":
                    case "i":
                        sb.append("*").append(inline(child).trim()).append("*");
                        break;
                    case "code":
                        sb.append("`").append(child.text()).append("`");
                        break;
                    case "img":
                        appendImage(sb, child);
                        break;
                    case "br":
                        sb.append("\n");
                        break;
                    default:
                        sb.append(inline(child));
                        break;
                }
            }
        }
        return sb.toString();
    }

    private static String normalize(String md) {
        if (md == null) {
            return "";
        }
        return md.replaceAll("[ \\t]+\n", "\n")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }
}
