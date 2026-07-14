import axios from 'axios';

const bvids = [
  { id: 122, bvid: 'BV1Sf4y1d7t4' },
  { id: 122, bvid: 'BV1yc411W71v' },
  { id: 123, bvid: 'BV1Fr4y1R744' },
  { id: 123, bvid: 'BV1BLVz6kErV' },
  { id: 123, bvid: 'BV17CQaYsEH6' },
];

async function main() {
  for (const x of bvids) {
    try {
      const r: any = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${x.bvid}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.bilibili.com/',
        },
        timeout: 8000,
      });
      const d = r.data.data;
      const sec = d.duration;
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      console.log(`#${x.id} ${x.bvid} [${min}:${String(s).padStart(2,'0')}] ${d.title.slice(0, 60)}`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`#${x.id} ${x.bvid} 失败: ${(e as Error).message.slice(0,40)}`);
    }
  }
}

main().catch(console.error);
