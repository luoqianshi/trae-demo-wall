import dotenv from 'dotenv';
dotenv.config();

import { callAI, rewriteArticle, generateQuizQuestions } from './services/aiService';

async function testSimple() {
  console.log('🧪 测试1: 简单对话...\n');
  try {
    const result = await callAI(
      '用一句话介绍你自己',
      '你是一个英语教育专家，擅长改写英语文章和出考题'
    );
    console.log('✅ 成功:', result.substring(0, 100));
    return true;
  } catch (err: any) {
    console.log('❌ 失败:', err.message);
    return false;
  }
}

async function testRewrite() {
  console.log('\n🧪 测试2: 文章改写（四级难度）...\n');
  
  const sample = `The quick brown fox jumps over the lazy dog. This is a classic sentence used for typing practice. It contains every letter of the English alphabet. Many people use this sentence to test their keyboard and improve their typing speed.`;
  
  try {
    const result = await rewriteArticle(sample, 3);
    console.log('✅ 改写成功!');
    console.log('英文长度:', result.content.length);
    console.log('英文前100字:', result.content.substring(0, 100));
    console.log('翻译前50字:', result.translatedContent?.substring(0, 50));
    return true;
  } catch (err: any) {
    console.log('❌ 失败:', err.message);
    return false;
  }
}

async function testQuiz() {
  console.log('\n🧪 测试3: 题目生成...\n');
  
  const sample = `The Internet has become an important part of modern life. People use it for work, education, and entertainment. However, spending too much time online can also have negative effects on health and social relationships.`;
  
  try {
    const questions = await generateQuizQuestions(sample, 3, 4);
    console.log('✅ 生成', questions.length, '道题');
    if (questions.length > 0) {
      console.log('第一题:', questions[0].question?.substring(0, 60));
    }
    return true;
  } catch (err: any) {
    console.log('❌ 失败:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 智谱AI功能测试\n');
  
  const t1 = await testSimple();
  if (!t1) {
    console.log('\n基础调用失败，跳过后续测试');
    process.exit(1);
  }
  
  await testRewrite();
  await testQuiz();
  
  console.log('\n🎉 测试完成!');
  process.exit(0);
}

main().catch(err => {
  console.error('测试异常:', err);
  process.exit(1);
});
