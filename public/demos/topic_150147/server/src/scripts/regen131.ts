import { generateImage } from '../services/imageGenerator';

const NEGATIVE_PROMPT = 'low quality, worst quality, blurry, distorted, ugly, creepy, dark, horror, scary, nsfw, gore, blood, text, watermark, signature, logo, messy composition, map, world map, globe, eiffel tower, paris, france, tokyo tower, human, person, people, face, hands, character';

const STYLE_SUFFIX = 'clean anime illustration, soft and pleasant color palette with gentle gradients, clean and simple composition, soft natural lighting, smooth cel-shading, delicate linework, warm and inviting atmosphere, gentle bokeh background, Pixiv-style illustration, high quality, suitable for kids, educational and inspiring mood, no text, no watermarks';

const prompt = `A flat lay arrangement of cultural icons from English-speaking countries on a wooden desk: British red telephone booth, Big Ben clock tower, cup of english tea, Statue of Liberty, american hamburger, Australian Sydney Opera House, kangaroo, Canadian maple leaf, beaver. Travel and culture exploration theme for children, warm cozy desk setup, educational illustration style. ${STYLE_SUFFIX}`;

async function main() {
  console.log('重新生成 #131 英语国家文化探索');
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`  第 ${attempt} 次尝试...`);
    const result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `task_cover_131_v${7 + attempt}`,
      negative_prompt: NEGATIVE_PROMPT,
    });
    if (result.success && result.url) {
      console.log(`  成功: ${result.url.split('/').pop()}`);
      return;
    }
    console.log(`  失败: ${result.error}`);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('  全部失败');
}

main().catch(console.error);
