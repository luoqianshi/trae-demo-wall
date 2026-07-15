import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const decodeHtml = (html: string): string => {
  return html
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
};

async function main() {
  const articles = await prisma.article.findMany();
  
  console.log(`共 ${articles.length} 篇文章\n`);
  
  let updated = 0;
  for (const article of articles) {
    const decodedTitle = decodeHtml(article.title);
    const decodedContent = decodeHtml(article.originalContent);
    
    if (decodedTitle !== article.title || decodedContent !== article.originalContent) {
      console.log(`更新: ${article.title.substring(0, 50)}...`);
      await prisma.article.update({
        where: { id: article.id },
        data: {
          title: decodedTitle,
          originalContent: decodedContent,
        },
      });
      updated++;
    }
  }
  
  console.log(`\n✅ 完成，更新了 ${updated} 篇文章的标题/内容`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
