# AstroLens AI Demo - 示例数据说明

本 Demo 中的示例数据为 JavaScript 模拟生成的仿真数据，用于展示平台对各航天数据格式的解析和可视化能力。

## 数据文件列表

| 文件名 | 格式 | 来源 | 说明 |
|--------|------|------|------|
| hyb2_tir_20180921_030724_l2.fit | FITS | Hayabusa2 TIR | 龙宫小行星 L2 级校准温度图像 (256×256) |
| g_06330mm_ta_maxaptemp_otesdsv1-7_v001.fits | FITS | OSIRIS-REx OTES | 贝努小行星最大孔径温度表 (面片数据) |
| solar_wind_202308.cdf | CDF | 模拟数据 | 太阳风参数时间序列 (365天) |
| mars_elevation_mola.h5 | HDF5 | 模拟数据 | 火星表面 MOLA 高程数据 |

## 数据来源

真实的 FITS 数据文件来自 NASA 和 JAXA 的公开行星数据归档：
- Hayabusa2 TIR: JAXA DARTS archives
- OSIRIS-REx OTES: NASA PDS archives

## 在线资源

- NASA PDS: https://pds.nasa.gov/
- JAXA DARTS: https://www.darts.isas.jaxa.jp/
- FITS 标准: https://fits.gsfc.nasa.gov/
