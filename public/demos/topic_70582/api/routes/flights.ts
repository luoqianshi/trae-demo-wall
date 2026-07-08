import express from 'express';
import type { Request, Response } from 'express';
import { flightService } from '../../server/services/flightService';

const router = express.Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const flights = await flightService.searchFlights(
      String(from),
      String(to),
      String(date)
    );

    res.json({
      success: true,
      data: flights,
      count: flights.length,
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

router.get('/detail', async (req: Request, res: Response) => {
  try {
    const { flightNo, date } = req.query;

    if (!flightNo || !date) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      });
    }

    const flight = await flightService.getFlightDetails(
      String(flightNo),
      String(date)
    );

    if (!flight) {
      return res.status(404).json({
        success: false,
        error: '航班信息未找到',
      });
    }

    res.json({
      success: true,
      data: flight,
    });
  } catch (error) {
    console.error('Flight detail error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

export default router;