/****************************
 * 见澄明H5 - 题库数据 (ES Module)
 * 快速版v4.1 (16题) + 标准版v4.1 (30题)，前端本地加载
 ****************************/

import FAST_QUESTIONS from '../data/questions-fast.json';
import STANDARD_QUESTIONS from '../data/questions-standard.json';

export const questionBank = {
  fast: FAST_QUESTIONS,
  standard: STANDARD_QUESTIONS
};

export default questionBank;
