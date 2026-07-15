# API接口层

对外暴露HTTP接口和WebSocket连接，前端通过这层与后端通信。

输入：
- 前端HTTP请求（上传视频、查询分析结果、获取统计数据）
- 前端WebSocket连接

输出：
- 上传成功响应（返回task_id）
- 球员3D轨迹数据（JSON，含x/y/z坐标）
- 落点数据（JSON，含落点坐标和分区）
- 统计数据（JSON，全部客观数据）
- WebSocket推送分析进度
