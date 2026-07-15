# 数据存储

保存分析任务信息和每次分析产出的完整数据。

输入：
- 分析任务信息（任务ID、视频名称、上传时间、处理状态、视频时长、过滤帧数）
- 球员轨迹数据（球员ID、帧号、时间戳、x_table、y_table、x_pixel、y_pixel）
- 球的3D轨迹数据（帧号、时间戳、x_table、y_table、z_height、x_pixel、y_pixel、ball_pixel_size）
- 落点数据（帧号、时间戳、x_table、y_table、分区、回合ID）
- 统计数据（球员ID + 各项客观指标）

输出：
- 查询返回的分析结果（按任务ID或时间范围查询）