import { Router, Response } from 'express';
import db from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateImage, generateImages, buildTemplatePrompt } from '../services/imageGenerator';

const router = Router();

// 单张图片生成
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt, size = '1024x768', filename } = req.body;
    if (!prompt) {
      res.status(400).json({ code: 400, message: 'prompt为必填项' });
      return;
    }

    const result = await generateImage({ prompt, size, filename });

    if (result.success) {
      res.json({ code: 0, data: { url: result.url } });
    } else {
      res.status(500).json({ code: 500, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 为模板批量生成封面
router.post('/generate-template-covers', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { templateIds } = req.body;

    // 获取模板列表
    let templates: any[];
    if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
      const placeholders = templateIds.map(() => '?').join(',');
      templates = db.prepare(
        `SELECT * FROM pbl_templates WHERE id IN (${placeholders})`
      ).all(...templateIds) as any[];
    } else {
      templates = db.prepare('SELECT * FROM pbl_templates WHERE cover_image IS NULL OR cover_image = ?').all('') as any[];
    }

    if (templates.length === 0) {
      res.json({ code: 0, message: '没有需要生成封面的模板', data: [] });
      return;
    }

    const prompts = templates.map((t: any) => ({
      id: String(t.id),
      prompt: buildTemplatePrompt({
        name: t.name,
        category: t.category,
        description: t.description || '',
        grade_level: t.grade_level || '',
      }),
      size: '1024x768',
      filename: `template_${t.id}_cover`,
    }));

    const results = await generateImages(prompts, undefined);

    // 更新数据库中的cover_image
    const updateStmt = db.prepare('UPDATE pbl_templates SET cover_image = ? WHERE id = ?');
    const successList: any[] = [];

    for (const r of results) {
      if (r.success && r.url) {
        updateStmt.run(r.url, parseInt(r.id));
        const template = templates.find((t: any) => t.id === parseInt(r.id));
        successList.push({ id: r.id, name: template?.name, url: r.url });
      }
    }

    const failed = results.filter(r => !r.success);
    res.json({
      code: 0,
      data: {
        total: results.length,
        success: successList.length,
        failed: failed.length,
        results: successList,
        errors: failed.map(r => ({ id: r.id, error: r.error })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 为营地生成封面
router.post('/generate-camp-cover/:campId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campId = parseInt(req.params.campId);
    const camp = db.prepare('SELECT * FROM camps WHERE id = ?').get(campId) as any;

    if (!camp) {
      res.status(404).json({ code: 404, message: '营地不存在' });
      return;
    }

    const template = camp.template_id
      ? (db.prepare('SELECT * FROM pbl_templates WHERE id = ?').get(camp.template_id) as any)
      : null;

    const prompt = `A modern educational camp banner illustration for "${camp.name}". ${camp.description || 'Project-based learning camp'}. ${template ? `Theme: ${template.name}. ${template.description || ''}` : ''}. Clean flat design with subtle gradients, conveying learning and collaboration, suitable for an educational platform. No text.`;

    const result = await generateImage({
      prompt,
      size: '1024x768',
      filename: `camp_${campId}_cover`,
    });

    if (result.success) {
      db.prepare('UPDATE camps SET cover_image = ? WHERE id = ?').run(result.url, campId);
      res.json({ code: 0, data: { id: campId, url: result.url } });
    } else {
      res.status(500).json({ code: 500, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 为展示项目生成封面
router.post('/generate-showcase-cover/:showcaseId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const showcaseId = parseInt(req.params.showcaseId);
    const showcase = db.prepare('SELECT * FROM pbl_showcase_projects WHERE id = ?').get(showcaseId) as any;

    if (!showcase) {
      res.status(404).json({ code: 404, message: '展示项目不存在' });
      return;
    }

    const prompt = `A professional project showcase thumbnail for "${showcase.title}". ${showcase.description || 'Student project showcase'}. Modern flat design, clean composition, conveying achievement and creativity. No text overlay.`;

    const result = await generateImage({
      prompt,
      size: '1024x1024',
      filename: `showcase_${showcaseId}_cover`,
    });

    if (result.success) {
      db.prepare('UPDATE pbl_showcase_projects SET cover_image = ? WHERE id = ?').run(result.url, showcaseId);
      res.json({ code: 0, data: { id: showcaseId, url: result.url } });
    } else {
      res.status(500).json({ code: 500, message: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 获取生成状态/进度
router.get('/generate-status', authMiddleware, (_req: AuthRequest, res: Response): void => {
  try {
    const totalTemplates = (db.prepare('SELECT COUNT(*) as cnt FROM pbl_templates').get() as any).cnt;
    const withCover = (db.prepare(
      "SELECT COUNT(*) as cnt FROM pbl_templates WHERE cover_image IS NOT NULL AND cover_image != ''"
    ).get() as any).cnt;

    const totalCamps = (db.prepare('SELECT COUNT(*) as cnt FROM camps').get() as any).cnt;
    const campsWithCover = (db.prepare(
      "SELECT COUNT(*) as cnt FROM camps WHERE cover_image IS NOT NULL AND cover_image != ''"
    ).get() as any).cnt;

    res.json({
      code: 0,
      data: {
        templates: { total: totalTemplates, withCover },
        camps: { total: totalCamps, withCover: campsWithCover },
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;