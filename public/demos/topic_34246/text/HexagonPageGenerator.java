package text;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

public class HexagonPageGenerator {
    public static void main(String[] args) {
        // 生成 "全自动烤鸡机.html"
        generateHexagonPage(
                "全自动烤鸡机.html",
                "#ff9900",   // strokeColor
                "#ffcc00",   // fillColor
                new double[]{0.2, 0.9, 0.8, 1.0, 0.2, 0.3} // 六边形数值
        );
    }

    public static void generateHexagonPage(String fileName, String strokeColor,
                                           String fillColor, double[] values) {
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"UTF-8\">\n");
        html.append("<title>动态六边形</title>\n");
        html.append("<style>\n");
        html.append("@font-face{font-family:'Minecraft';src:url('./Minecraft.ttf') format('truetype');}\n");
        html.append("text{font-family:'Minecraft', monospace !important;}\n");
        html.append("body{margin:0;overflow:hidden;}\n");
        html.append("svg{width:600px;height:600px;display:block;margin:auto;}\n");
        html.append(".outline{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;}\n");
        html.append(".fill{opacity:0;}\n");
        html.append(".fill.exit{opacity:0;}\n");
        html.append("</style>\n</head>\n<body>\n");

        html.append("<svg viewBox=\"-500 -500 1000 1000\">\n");
        html.append("  <polygon id=\"fill\" class=\"fill\"/>\n");
        html.append("  <path id=\"outline\" class=\"outline\"/>\n");
        html.append("</svg>\n");

        // JS 部分
        html.append("<script>\n");
        html.append("let outline=document.getElementById('outline');\n");
        html.append("let fill=document.getElementById('fill');\n");
        html.append("window.strokeColor='").append(strokeColor).append("';\n");

        html.append("const values=").append(javaArrayToJS(values)).append(";\n");
        html.append("const R=200;\n");
        html.append("const angleStep=Math.PI*2/6;\n");
        html.append("const fillColor='").append(fillColor).append("';\n");

        html.append("function getPoints(vals){\n");
        html.append(" return vals.map((v,i)=>{\n");
        html.append("  let angle=-Math.PI/2+i*angleStep;\n");
        html.append("  let x=Math.cos(angle)*v*R;\n");
        html.append("  let y=Math.sin(angle)*v*R;\n");
        html.append("  return `${x},${y}`;\n");
        html.append(" }).join(' ');\n}\n");

        // drawHexagon()
        html.append("function drawHexagon(){\n");
        html.append(" const pts=getPoints(values);\n");
        html.append(" fill.setAttribute('points',pts);\n");
        html.append(" fill.style.fill=fillColor;\n");
        html.append(" outline.setAttribute('d','M'+pts.split(' ').join(' L')+' Z');\n");
        html.append(" outline.style.stroke=strokeColor;\n");
        html.append(" const length=outline.getTotalLength();\n");
        html.append(" outline.style.strokeDasharray=length;\n");
        html.append(" outline.style.strokeDashoffset=length;\n");
        html.append(" fill.style.opacity=0;\n");
        html.append(" let start=null;const duration=600;\n");
        html.append(" function animate(time){\n");
        html.append("  if(!start) start=time;\n");
        html.append("  let t=(time-start)/duration;\n");
        html.append("  if(t>1) t=1;\n");
        html.append("  t=t<0.5?2*t*t:-1+(4-2*t)*t;\n");
        html.append("  outline.style.strokeDashoffset=length*(1-t);\n");
        html.append("  fill.style.opacity=0.4*t;\n");
        html.append("  if(t<1) requestAnimationFrame(animate);\n");
        html.append(" }\n");
        html.append(" requestAnimationFrame(animate);\n");
        html.append("}\n");

        // exitHexagon()
        html.append("function exitHexagon(){\n");
        html.append(" const length=outline.getTotalLength();\n");
        html.append(" let start=null;const duration=600;\n");
        html.append(" function animateExit(time){\n");
        html.append("  if(!start) start=time;\n");
        html.append("  let t=(time-start)/duration;\n");
        html.append("  if(t>1) t=1;\n");
        html.append("  t=t<0.5?2*t*t:-1+(4-2*t)*t;\n");
        html.append("  outline.style.strokeDashoffset=length*t;\n");
        html.append("  fill.style.opacity=0.4*(1-t);\n");
        html.append("  if(t<1) requestAnimationFrame(animateExit);\n");
        html.append(" }\n");
        html.append(" requestAnimationFrame(animateExit);\n");
        html.append("}\n");

        html.append("drawHexagon();\n");
        html.append("</script>\n</body>\n</html>");

        try (FileWriter writer = new FileWriter(fileName)) {
            writer.write(html.toString());
            System.out.println("已生成: " + fileName);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String javaArrayToJS(double[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            sb.append(arr[i]);
            if (i < arr.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
