import { Router } from 'express';
import { collectNews } from '../services/newsCrawler';

const router = Router();

router.post('/crawl/run', async (req, res) => {
  try {
    const result = await collectNews();
    
    res.json({
      code: 200,
      message: '采集完成',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      message: error.message || '采集失败',
      data: null
    });
  }
});

export default router;
