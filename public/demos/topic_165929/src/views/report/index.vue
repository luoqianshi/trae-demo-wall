<template>
  <div class="report-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>报表统计中心</span>
        </div>
      </template>

      <el-tabs v-model="activeReport" type="border-card" class="report-tabs">
        <el-tab-pane label="操行分统计" name="score">
          <div class="report-content">
            <div class="report-toolbar">
              <el-select v-model="scoreFilter.classId" placeholder="选择班级" style="width: 180px; margin-right: 10px;" clearable>
                <el-option label="全部班级" value="" />
                <el-option label="计算机2301班" value="1" />
                <el-option label="计算机2302班" value="2" />
                <el-option label="软工2301班" value="3" />
              </el-select>
              <el-date-picker
                v-model="scoreFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="margin-right: 10px;"
              />
              <el-button type="primary" :icon="Search" @click="loadScoreReport">查询</el-button>
              <el-button type="success" :icon="Download" style="margin-left: 10px;" @click="handleExportScore">导出</el-button>
            </div>

            <el-row :gutter="20" class="stat-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ scoreStats.avgScore }}</div>
                      <div class="stat-label">班级平均分</div>
                    </div>
                    <div class="stat-icon blue">
                      <el-icon :size="28"><Medal /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ scoreStats.maxScore }}</div>
                      <div class="stat-label">最高分</div>
                    </div>
                    <div class="stat-icon green">
                      <el-icon :size="28"><TrendCharts /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ scoreStats.minScore }}</div>
                      <div class="stat-label">最低分</div>
                    </div>
                    <div class="stat-icon orange">
                      <el-icon :size="28"><TrendCharts /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ scoreStats.passRate }}%</div>
                      <div class="stat-label">及格率</div>
                    </div>
                    <div class="stat-icon purple">
                      <el-icon :size="28"><CircleCheck /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">操行分排名 Top10</span>
                  </template>
                  <div ref="scoreRankChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">各类型占比</span>
                  </template>
                  <div ref="scoreTypeChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="24">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">月度趋势</span>
                  </template>
                  <div ref="scoreTrendChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="table-card" shadow="never">
              <template #header>
                <span class="chart-title">明细数据</span>
              </template>
              <el-table :data="scoreTableData" stripe>
                <el-table-column type="index" label="排名" width="70" align="center" />
                <el-table-column prop="studentName" label="学生姓名" width="120" />
                <el-table-column prop="className" label="班级" width="140" />
                <el-table-column prop="totalScore" label="总分" width="100" align="center" />
                <el-table-column prop="studyScore" label="学习" width="100" align="center" />
                <el-table-column prop="disciplineScore" label="纪律" width="100" align="center" />
                <el-table-column prop="hygieneScore" label="卫生" width="100" align="center" />
                <el-table-column prop="rankChange" label="排名变化" width="100" align="center">
                  <template #default="{ row }">
                    <span :class="row.rankChange > 0 ? 'up' : row.rankChange < 0 ? 'down' : ''">
                      <el-icon v-if="row.rankChange > 0"><CaretTop /></el-icon>
                      <el-icon v-else-if="row.rankChange < 0"><CaretBottom /></el-icon>
                      {{ Math.abs(row.rankChange) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="手机收取统计" name="phone">
          <div class="report-content">
            <div class="report-toolbar">
              <el-select v-model="phoneFilter.classId" placeholder="选择班级" style="width: 180px; margin-right: 10px;" clearable>
                <el-option label="全部班级" value="" />
                <el-option label="计算机2301班" value="1" />
                <el-option label="计算机2302班" value="2" />
                <el-option label="软工2301班" value="3" />
              </el-select>
              <el-date-picker
                v-model="phoneFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="margin-right: 10px;"
              />
              <el-button type="primary" :icon="Search" @click="loadPhoneReport">查询</el-button>
              <el-button type="success" :icon="Download" style="margin-left: 10px;" @click="handleExportPhone">导出</el-button>
            </div>

            <el-row :gutter="20" class="stat-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ phoneStats.collectedCount }}</div>
                      <div class="stat-label">当前收取人数</div>
                    </div>
                    <div class="stat-icon blue">
                      <el-icon :size="28"><Iphone /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ phoneStats.collectRate }}%</div>
                      <div class="stat-label">收取比例</div>
                    </div>
                    <div class="stat-icon green">
                      <el-icon :size="28"><CircleCheck /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ phoneStats.avgDays }}</div>
                      <div class="stat-label">平均剩余天数</div>
                    </div>
                    <div class="stat-icon orange">
                      <el-icon :size="28"><Clock /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ phoneStats.totalCount }}</div>
                      <div class="stat-label">累计收取</div>
                    </div>
                    <div class="stat-icon purple">
                      <el-icon :size="28"><Histogram /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">剩余天数分布</span>
                  </template>
                  <div ref="phoneDistributionChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">月度变动趋势</span>
                  </template>
                  <div ref="phoneTrendChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="table-card" shadow="never">
              <template #header>
                <span class="chart-title">明细数据</span>
              </template>
              <el-table :data="phoneTableData" stripe>
                <el-table-column type="index" label="序号" width="70" align="center" />
                <el-table-column prop="studentName" label="学生姓名" width="120" />
                <el-table-column prop="className" label="班级" width="140" />
                <el-table-column prop="phoneModel" label="手机型号" width="140" />
                <el-table-column prop="collectDate" label="收取日期" width="120" />
                <el-table-column prop="expectedReturnDate" label="预计归还" width="120" />
                <el-table-column prop="remainingDays" label="剩余天数" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.remainingDays <= 3 ? 'danger' : row.remainingDays <= 7 ? 'warning' : 'success'" size="small">
                      {{ row.remainingDays }}天
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '收取中' ? 'primary' : 'success'" size="small">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="出勤统计" name="attendance">
          <div class="report-content">
            <div class="report-toolbar">
              <el-select v-model="attendanceFilter.classId" placeholder="选择班级" style="width: 180px; margin-right: 10px;" clearable>
                <el-option label="全部班级" value="" />
                <el-option label="计算机2301班" value="1" />
                <el-option label="计算机2302班" value="2" />
                <el-option label="软工2301班" value="3" />
              </el-select>
              <el-date-picker
                v-model="attendanceFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="margin-right: 10px;"
              />
              <el-button type="primary" :icon="Search" @click="loadAttendanceReport">查询</el-button>
              <el-button type="success" :icon="Download" style="margin-left: 10px;" @click="handleExportAttendance">导出</el-button>
            </div>

            <el-row :gutter="20" class="stat-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ attendanceStats.attendanceRate }}%</div>
                      <div class="stat-label">出勤率</div>
                    </div>
                    <div class="stat-icon green">
                      <el-icon :size="28"><CircleCheck /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ attendanceStats.totalLeaveDays }}</div>
                      <div class="stat-label">总请假天数</div>
                    </div>
                    <div class="stat-icon orange">
                      <el-icon :size="28"><Calendar /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ attendanceStats.avgLeaveDays }}</div>
                      <div class="stat-label">人均请假</div>
                    </div>
                    <div class="stat-icon blue">
                      <el-icon :size="28"><User /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ attendanceStats.lateCount }}</div>
                      <div class="stat-label">迟到次数</div>
                    </div>
                    <div class="stat-icon red">
                      <el-icon :size="28"><Warning /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">月度出勤率趋势</span>
                  </template>
                  <div ref="attendanceTrendChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">请假类型分布</span>
                  </template>
                  <div ref="leaveTypeChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="24">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">学生出勤排名 Bottom10</span>
                  </template>
                  <div ref="attendanceRankChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="table-card" shadow="never">
              <template #header>
                <span class="chart-title">明细数据</span>
              </template>
              <el-table :data="attendanceTableData" stripe>
                <el-table-column type="index" label="排名" width="70" align="center" />
                <el-table-column prop="studentName" label="学生姓名" width="120" />
                <el-table-column prop="className" label="班级" width="140" />
                <el-table-column prop="attendanceRate" label="出勤率" width="100" align="center" />
                <el-table-column prop="sickLeave" label="病假" width="80" align="center" />
                <el-table-column prop="personalLeave" label="事假" width="80" align="center" />
                <el-table-column prop="publicLeave" label="公假" width="80" align="center" />
                <el-table-column prop="lateCount" label="迟到" width="80" align="center" />
                <el-table-column prop="absentCount" label="旷课" width="80" align="center" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="基础数据统计" name="basic">
          <div class="report-content">
            <el-row :gutter="20" class="stat-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ basicStats.totalStudents }}</div>
                      <div class="stat-label">学生总数</div>
                    </div>
                    <div class="stat-icon blue">
                      <el-icon :size="28"><User /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ basicStats.totalClasses }}</div>
                      <div class="stat-label">班级总数</div>
                    </div>
                    <div class="stat-icon green">
                      <el-icon :size="28"><OfficeBuilding /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ basicStats.totalTeachers }}</div>
                      <div class="stat-label">教师总数</div>
                    </div>
                    <div class="stat-icon orange">
                      <el-icon :size="28"><Avatar /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ basicStats.avgClassSize }}</div>
                      <div class="stat-label">平均班额</div>
                    </div>
                    <div class="stat-icon purple">
                      <el-icon :size="28"><DataAnalysis /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">性别分布</span>
                  </template>
                  <div ref="genderChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">角色分布</span>
                  </template>
                  <div ref="roleChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">班级人数分布</span>
                  </template>
                  <div ref="classSizeChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="table-card" shadow="never">
              <template #header>
                <span class="chart-title">班级列表概览</span>
              </template>
              <el-table :data="classTableData" stripe>
                <el-table-column type="index" label="序号" width="70" align="center" />
                <el-table-column prop="className" label="班级名称" width="160" />
                <el-table-column prop="headTeacher" label="班主任" width="100" />
                <el-table-column prop="studentCount" label="学生人数" width="100" align="center" />
                <el-table-column prop="maleCount" label="男生" width="80" align="center" />
                <el-table-column prop="femaleCount" label="女生" width="80" align="center" />
                <el-table-column prop="avgScore" label="平均操行分" width="120" align="center" />
                <el-table-column prop="attendanceRate" label="出勤率" width="100" align="center" />
                <el-table-column prop="phoneCollectRate" label="手机收取率" width="110" align="center" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="AI研判统计" name="ai">
          <div class="report-content">
            <div class="report-toolbar">
              <el-select v-model="aiFilter.classId" placeholder="选择班级" style="width: 180px; margin-right: 10px;" clearable>
                <el-option label="全部班级" value="" />
                <el-option label="计算机2301班" value="1" />
                <el-option label="计算机2302班" value="2" />
                <el-option label="软工2301班" value="3" />
              </el-select>
              <el-date-picker
                v-model="aiFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="margin-right: 10px;"
              />
              <el-button type="primary" :icon="Search" @click="loadAiReport">查询</el-button>
              <el-button type="success" :icon="Download" style="margin-left: 10px;" @click="handleExportAi">导出</el-button>
            </div>

            <el-row :gutter="20" class="stat-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ aiStats.monthCount }}</div>
                      <div class="stat-label">本月研判次数</div>
                    </div>
                    <div class="stat-icon blue">
                      <el-icon :size="28"><MagicStick /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ aiStats.totalCount }}</div>
                      <div class="stat-label">总研判次数</div>
                    </div>
                    <div class="stat-icon green">
                      <el-icon :size="28"><Histogram /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ aiStats.effectiveRate }}%</div>
                      <div class="stat-label">方案有效率</div>
                    </div>
                    <div class="stat-icon orange">
                      <el-icon :size="28"><Star /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ aiStats.favoriteCount }}</div>
                      <div class="stat-label">收藏数</div>
                    </div>
                    <div class="stat-icon purple">
                      <el-icon :size="28"><Collection /></el-icon>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">月度研判次数趋势</span>
                  </template>
                  <div ref="aiTrendChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="12">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">高频问题类型分布</span>
                  </template>
                  <div ref="aiTypeChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="24">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">方案评价分布</span>
                  </template>
                  <div ref="aiFeedbackChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="table-card" shadow="never">
              <template #header>
                <span class="chart-title">明细数据</span>
              </template>
              <el-table :data="aiTableData" stripe>
                <el-table-column type="index" label="序号" width="70" align="center" />
                <el-table-column prop="studentName" label="学生姓名" width="120" />
                <el-table-column prop="className" label="班级" width="140" />
                <el-table-column prop="problemType" label="问题类型" width="130">
                  <template #default="{ row }">
                    <el-tag :type="getProblemTypeTag(row.problemType)" size="small">{{ row.problemType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="研判时间" width="170" />
                <el-table-column prop="operator" label="操作人" width="100" />
                <el-table-column prop="feedback" label="评价" width="100" align="center">
                  <template #default="{ row }">
                    <el-rate v-model="row.rating" disabled size="small" />
                  </template>
                </el-table-column>
                <el-table-column prop="isFavorite" label="收藏" width="80" align="center">
                  <template #default="{ row }">
                    <el-icon v-if="row.isFavorite" class="favorite-icon"><StarFilled /></el-icon>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import {
  Search, Download, Medal, TrendCharts, CircleCheck, User,
  Iphone, Clock, Histogram, Calendar, Warning, CaretTop, CaretBottom,
  OfficeBuilding, Avatar, DataAnalysis, MagicStick, Star, Collection, StarFilled
} from '@element-plus/icons-vue'

const activeReport = ref('score')

const scoreFilter = reactive({
  classId: '',
  dateRange: []
})

const phoneFilter = reactive({
  classId: '',
  dateRange: []
})

const attendanceFilter = reactive({
  classId: '',
  dateRange: []
})

const aiFilter = reactive({
  classId: '',
  dateRange: []
})

const scoreStats = ref({
  avgScore: 85.6,
  maxScore: 98,
  minScore: 62,
  passRate: 92.3
})

const phoneStats = ref({
  collectedCount: 86,
  collectRate: 88.7,
  avgDays: 8,
  totalCount: 256
})

const attendanceStats = ref({
  attendanceRate: 96.8,
  totalLeaveDays: 128,
  avgLeaveDays: 1.3,
  lateCount: 32
})

const basicStats = ref({
  totalStudents: 328,
  totalClasses: 8,
  totalTeachers: 45,
  avgClassSize: 41
})

const aiStats = ref({
  monthCount: 68,
  totalCount: 325,
  effectiveRate: 87.5,
  favoriteCount: 52
})

const scoreRankChartRef = ref(null)
const scoreTypeChartRef = ref(null)
const scoreTrendChartRef = ref(null)
const phoneDistributionChartRef = ref(null)
const phoneTrendChartRef = ref(null)
const attendanceTrendChartRef = ref(null)
const leaveTypeChartRef = ref(null)
const attendanceRankChartRef = ref(null)
const genderChartRef = ref(null)
const roleChartRef = ref(null)
const classSizeChartRef = ref(null)
const aiTrendChartRef = ref(null)
const aiTypeChartRef = ref(null)
const aiFeedbackChartRef = ref(null)

const scoreTableData = ref([
  { studentName: '张三', className: '计算机2301班', totalScore: 98, studyScore: 35, disciplineScore: 33, hygieneScore: 30, rankChange: 2 },
  { studentName: '李四', className: '计算机2301班', totalScore: 95, studyScore: 34, disciplineScore: 32, hygieneScore: 29, rankChange: -1 },
  { studentName: '王五', className: '计算机2302班', totalScore: 93, studyScore: 33, disciplineScore: 31, hygieneScore: 29, rankChange: 1 },
  { studentName: '赵六', className: '软工2301班', totalScore: 91, studyScore: 32, disciplineScore: 30, hygieneScore: 29, rankChange: 0 },
  { studentName: '钱七', className: '计算机2302班', totalScore: 89, studyScore: 31, disciplineScore: 30, hygieneScore: 28, rankChange: 3 },
  { studentName: '孙八', className: '软工2301班', totalScore: 87, studyScore: 30, disciplineScore: 29, hygieneScore: 28, rankChange: -2 },
  { studentName: '周九', className: '计算机2301班', totalScore: 85, studyScore: 30, disciplineScore: 28, hygieneScore: 27, rankChange: 1 },
  { studentName: '吴十', className: '计算机2302班', totalScore: 83, studyScore: 29, disciplineScore: 28, hygieneScore: 26, rankChange: -1 },
  { studentName: '郑十一', className: '软工2301班', totalScore: 81, studyScore: 28, disciplineScore: 27, hygieneScore: 26, rankChange: 2 },
  { studentName: '王十二', className: '计算机2301班', totalScore: 79, studyScore: 27, disciplineScore: 27, hygieneScore: 25, rankChange: -3 }
])

const phoneTableData = ref([
  { studentName: '张三', className: '计算机2301班', phoneModel: 'iPhone 14', collectDate: '2024-01-10', expectedReturnDate: '2024-01-20', remainingDays: 5, status: '收取中' },
  { studentName: '李四', className: '计算机2301班', phoneModel: '华为Mate 60', collectDate: '2024-01-12', expectedReturnDate: '2024-01-26', remainingDays: 11, status: '收取中' },
  { studentName: '王五', className: '计算机2302班', phoneModel: '小米14', collectDate: '2024-01-08', expectedReturnDate: '2024-01-18', remainingDays: 3, status: '收取中' },
  { studentName: '赵六', className: '软工2301班', phoneModel: 'OPPO Find X7', collectDate: '2024-01-15', expectedReturnDate: '2024-01-30', remainingDays: 15, status: '收取中' },
  { studentName: '钱七', className: '计算机2302班', phoneModel: 'vivo X100', collectDate: '2024-01-05', expectedReturnDate: '2024-01-15', remainingDays: 0, status: '已归还' },
  { studentName: '孙八', className: '软工2301班', phoneModel: 'iPhone 15 Pro', collectDate: '2024-01-14', expectedReturnDate: '2024-02-14', remainingDays: 30, status: '收取中' },
  { studentName: '周九', className: '计算机2301班', phoneModel: '华为P60', collectDate: '2024-01-11', expectedReturnDate: '2024-01-21', remainingDays: 6, status: '收取中' },
  { studentName: '吴十', className: '计算机2302班', phoneModel: '红米K70', collectDate: '2024-01-09', expectedReturnDate: '2024-01-16', remainingDays: 1, status: '收取中' }
])

const attendanceTableData = ref([
  { studentName: '张三', className: '计算机2301班', attendanceRate: 99.5, sickLeave: 0, personalLeave: 0, publicLeave: 1, lateCount: 1, absentCount: 0 },
  { studentName: '李四', className: '计算机2301班', attendanceRate: 98.2, sickLeave: 1, personalLeave: 0, publicLeave: 0, lateCount: 2, absentCount: 0 },
  { studentName: '王五', className: '计算机2302班', attendanceRate: 97.8, sickLeave: 1, personalLeave: 1, publicLeave: 0, lateCount: 1, absentCount: 0 },
  { studentName: '赵六', className: '软工2301班', attendanceRate: 96.5, sickLeave: 2, personalLeave: 1, publicLeave: 0, lateCount: 3, absentCount: 0 },
  { studentName: '钱七', className: '计算机2302班', attendanceRate: 95.3, sickLeave: 2, personalLeave: 2, publicLeave: 1, lateCount: 2, absentCount: 1 },
  { studentName: '孙八', className: '软工2301班', attendanceRate: 94.8, sickLeave: 3, personalLeave: 2, publicLeave: 0, lateCount: 4, absentCount: 1 },
  { studentName: '周九', className: '计算机2301班', attendanceRate: 93.5, sickLeave: 3, personalLeave: 3, publicLeave: 1, lateCount: 3, absentCount: 2 },
  { studentName: '吴十', className: '计算机2302班', attendanceRate: 92.1, sickLeave: 4, personalLeave: 3, publicLeave: 0, lateCount: 5, absentCount: 2 },
  { studentName: '郑十一', className: '软工2301班', attendanceRate: 90.5, sickLeave: 5, personalLeave: 4, publicLeave: 1, lateCount: 6, absentCount: 3 },
  { studentName: '王十二', className: '计算机2301班', attendanceRate: 88.2, sickLeave: 6, personalLeave: 5, publicLeave: 0, lateCount: 8, absentCount: 4 }
])

const classTableData = ref([
  { className: '计算机2301班', headTeacher: '李老师', studentCount: 45, maleCount: 28, femaleCount: 17, avgScore: 88.2, attendanceRate: 97.5, phoneCollectRate: 91.1 },
  { className: '计算机2302班', headTeacher: '王老师', studentCount: 42, maleCount: 25, femaleCount: 17, avgScore: 86.5, attendanceRate: 96.8, phoneCollectRate: 88.1 },
  { className: '软工2301班', headTeacher: '张老师', studentCount: 40, maleCount: 22, femaleCount: 18, avgScore: 85.3, attendanceRate: 95.2, phoneCollectRate: 85.0 },
  { className: '软工2302班', headTeacher: '刘老师', studentCount: 38, maleCount: 20, femaleCount: 18, avgScore: 84.7, attendanceRate: 96.1, phoneCollectRate: 86.8 },
  { className: '网工2301班', headTeacher: '陈老师', studentCount: 41, maleCount: 26, femaleCount: 15, avgScore: 83.9, attendanceRate: 94.8, phoneCollectRate: 82.9 },
  { className: '大数据2301班', headTeacher: '杨老师', studentCount: 44, maleCount: 27, femaleCount: 17, avgScore: 87.1, attendanceRate: 97.2, phoneCollectRate: 89.7 },
  { className: '人工智能2301班', headTeacher: '黄老师', studentCount: 39, maleCount: 23, femaleCount: 16, avgScore: 86.8, attendanceRate: 96.5, phoneCollectRate: 87.2 },
  { className: '物联网2301班', headTeacher: '周老师', studentCount: 39, maleCount: 24, femaleCount: 15, avgScore: 84.2, attendanceRate: 95.6, phoneCollectRate: 84.6 }
])

const aiTableData = ref([
  { studentName: '张三', className: '计算机2301班', problemType: '纪律问题', createTime: '2024-01-15 10:30:00', operator: '李老师', rating: 5, isFavorite: true },
  { studentName: '李四', className: '计算机2301班', problemType: '学习问题', createTime: '2024-01-14 14:20:00', operator: '李老师', rating: 4, isFavorite: false },
  { studentName: '王五', className: '计算机2302班', problemType: '心理问题', createTime: '2024-01-13 09:15:00', operator: '王老师', rating: 5, isFavorite: true },
  { studentName: '赵六', className: '软工2301班', problemType: '人际问题', createTime: '2024-01-12 16:45:00', operator: '张老师', rating: 3, isFavorite: false },
  { studentName: '钱七', className: '计算机2302班', problemType: '纪律问题', createTime: '2024-01-11 11:00:00', operator: '王老师', rating: 4, isFavorite: false },
  { studentName: '孙八', className: '软工2301班', problemType: '家庭问题', createTime: '2024-01-10 15:30:00', operator: '张老师', rating: 5, isFavorite: true },
  { studentName: '周九', className: '计算机2301班', problemType: '学习问题', createTime: '2024-01-09 10:00:00', operator: '李老师', rating: 4, isFavorite: false },
  { studentName: '吴十', className: '计算机2302班', problemType: '行为问题', createTime: '2024-01-08 13:20:00', operator: '王老师', rating: 3, isFavorite: false }
])

function getProblemTypeTag(type) {
  const types = {
    '纪律问题': 'danger',
    '学习问题': 'primary',
    '心理问题': 'warning',
    '人际问题': 'success',
    '家庭问题': 'info',
    '行为问题': 'warning'
  }
  return types[type] || 'info'
}

function initScoreRankChart() {
  if (!scoreRankChartRef.value) return
  const chart = echarts.init(scoreRankChartRef.value)
  const names = scoreTableData.value.slice(0, 10).map(item => item.studentName).reverse()
  const scores = scoreTableData.value.slice(0, 10).map(item => item.totalScore).reverse()
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: names },
    series: [{
      name: '操行分',
      type: 'bar',
      data: scores,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: '50%',
      label: { show: true, position: 'right', color: '#606266' }
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initScoreTypeChart() {
  if (!scoreTypeChartRef.value) return
  const chart = echarts.init(scoreTypeChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      name: '类型占比',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 40, name: '学习', itemStyle: { color: '#409EFF' } },
        { value: 35, name: '纪律', itemStyle: { color: '#67C23A' } },
        { value: 25, name: '卫生', itemStyle: { color: '#E6A23C' } }
      ]
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initScoreTrendChart() {
  if (!scoreTrendChartRef.value) return
  const chart = echarts.init(scoreTrendChartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均分', '最高分', '最低分'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: months, boundaryGap: false },
    yAxis: { type: 'value', min: 50, max: 100 },
    series: [
      {
        name: '平均分',
        type: 'line',
        data: [82, 83, 85, 84, 86, 87, 85, 86, 88, 87, 86, 85.6],
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '最高分',
        type: 'line',
        data: [95, 96, 97, 95, 98, 97, 96, 98, 99, 97, 96, 98],
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '最低分',
        type: 'line',
        data: [60, 62, 65, 63, 68, 66, 64, 67, 70, 65, 63, 62],
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initPhoneDistributionChart() {
  if (!phoneDistributionChartRef.value) return
  const chart = echarts.init(phoneDistributionChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['1-3天', '4-7天', '8-15天', '15天以上'] },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      name: '人数',
      type: 'bar',
      data: [12, 25, 30, 19],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#f093fb' },
          { offset: 1, color: '#f5576c' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '50%',
      label: { show: true, position: 'top' }
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initPhoneTrendChart() {
  if (!phoneTrendChartRef.value) return
  const chart = echarts.init(phoneTrendChartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收取数', '发放数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        name: '收取数',
        type: 'line',
        data: [45, 52, 48, 56, 60, 58],
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '发放数',
        type: 'line',
        data: [38, 45, 50, 42, 48, 52],
        smooth: true,
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initAttendanceTrendChart() {
  if (!attendanceTrendChartRef.value) return
  const chart = echarts.init(attendanceTrendChartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: months, boundaryGap: false },
    yAxis: { type: 'value', min: 90, max: 100, name: '出勤率(%)' },
    series: [{
      name: '出勤率',
      type: 'line',
      data: [96.5, 95.8, 97.2, 96.8, 97.5, 98.1, 97.8, 98.2, 96.9, 97.3, 96.8, 96.8],
      smooth: true,
      itemStyle: { color: '#67C23A' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
      },
      markLine: {
        data: [{ type: 'average', name: '平均值' }],
        label: { formatter: '平均 {c}%' }
      }
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initLeaveTypeChart() {
  if (!leaveTypeChartRef.value) return
  const chart = echarts.init(leaveTypeChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      name: '请假类型',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 45, name: '病假', itemStyle: { color: '#F56C6C' } },
        { value: 35, name: '事假', itemStyle: { color: '#E6A23C' } },
        { value: 28, name: '公假', itemStyle: { color: '#409EFF' } },
        { value: 20, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initAttendanceRankChart() {
  if (!attendanceRankChartRef.value) return
  const chart = echarts.init(attendanceRankChartRef.value)
  const names = attendanceTableData.value.slice(0, 10).map(item => item.studentName).reverse()
  const rates = attendanceTableData.value.slice(0, 10).map(item => item.attendanceRate).reverse()
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', min: 85, max: 100, name: '出勤率(%)' },
    yAxis: { type: 'category', data: names },
    series: [{
      name: '出勤率',
      type: 'bar',
      data: rates,
      itemStyle: {
        color: function(params) {
          const value = params.value
          if (value >= 95) return '#67C23A'
          if (value >= 90) return '#E6A23C'
          return '#F56C6C'
        },
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: '50%',
      label: { show: true, position: 'right', formatter: '{c}%' }
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initGenderChart() {
  if (!genderChartRef.value) return
  const chart = echarts.init(genderChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      name: '性别分布',
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        position: 'center',
        formatter: '总人数\n{b|{d}%}',
        rich: { b: { fontSize: 24, fontWeight: 'bold', color: '#303133' } }
      },
      emphasis: { label: { show: true } },
      data: [
        { value: 195, name: '男生', itemStyle: { color: '#409EFF' } },
        { value: 133, name: '女生', itemStyle: { color: '#F06292' } }
      ]
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initRoleChart() {
  if (!roleChartRef.value) return
  const chart = echarts.init(roleChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['管理员', '班主任', '任课教师', '学生'] },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      name: '人数',
      type: 'bar',
      data: [8, 12, 25, 328],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '50%',
      label: { show: true, position: 'top' }
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initClassSizeChart() {
  if (!classSizeChartRef.value) return
  const chart = echarts.init(classSizeChartRef.value)
  const names = classTableData.value.map(item => item.className.replace('2301', '').replace('2302', ''))
  const counts = classTableData.value.map(item => item.studentCount)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 0 } },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      name: '人数',
      type: 'bar',
      data: counts,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#11998e' },
          { offset: 1, color: '#38ef7d' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: '50%',
      label: { show: true, position: 'top' }
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initAiTrendChart() {
  if (!aiTrendChartRef.value) return
  const chart = echarts.init(aiTrendChartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['学生研判', '班级分析', '场景咨询'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', name: '次数' },
    series: [
      {
        name: '学生研判',
        type: 'line',
        data: [12, 18, 22, 20, 25, 28, 26, 30, 32, 28, 30, 25],
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '班级分析',
        type: 'line',
        data: [3, 5, 6, 4, 7, 8, 6, 9, 10, 8, 7, 6],
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '场景咨询',
        type: 'line',
        data: [8, 12, 15, 14, 18, 20, 17, 22, 25, 21, 23, 20],
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initAiTypeChart() {
  if (!aiTypeChartRef.value) return
  const chart = echarts.init(aiTypeChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      name: '问题类型',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 85, name: '纪律问题', itemStyle: { color: '#F56C6C' } },
        { value: 72, name: '学习问题', itemStyle: { color: '#409EFF' } },
        { value: 58, name: '心理问题', itemStyle: { color: '#E6A23C' } },
        { value: 45, name: '人际问题', itemStyle: { color: '#67C23A' } },
        { value: 35, name: '家庭问题', itemStyle: { color: '#909399' } },
        { value: 30, name: '行为问题', itemStyle: { color: '#9C27B0' } }
      ]
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initAiFeedbackChart() {
  if (!aiFeedbackChartRef.value) return
  const chart = echarts.init(aiFeedbackChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['有用', '一般', '无用'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        name: '有用',
        type: 'bar',
        stack: 'total',
        data: [18, 25, 30, 28, 35, 38, 35, 40, 42, 38, 40, 35],
        itemStyle: { color: '#67C23A', borderRadius: [0, 0, 0, 0] }
      },
      {
        name: '一般',
        type: 'bar',
        stack: 'total',
        data: [5, 8, 10, 9, 12, 14, 12, 15, 16, 14, 15, 13],
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '无用',
        type: 'bar',
        stack: 'total',
        data: [2, 3, 4, 3, 5, 5, 4, 6, 7, 5, 6, 5],
        itemStyle: { color: '#F56C6C', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function loadScoreReport() {
  nextTick(() => {
    initScoreRankChart()
    initScoreTypeChart()
    initScoreTrendChart()
  })
}

function loadPhoneReport() {
  nextTick(() => {
    initPhoneDistributionChart()
    initPhoneTrendChart()
  })
}

function loadAttendanceReport() {
  nextTick(() => {
    initAttendanceTrendChart()
    initLeaveTypeChart()
    initAttendanceRankChart()
  })
}

function loadBasicReport() {
  nextTick(() => {
    initGenderChart()
    initRoleChart()
    initClassSizeChart()
  })
}

function loadAiReport() {
  nextTick(() => {
    initAiTrendChart()
    initAiTypeChart()
    initAiFeedbackChart()
  })
}

function handleExportScore() {
  ElMessage('正在导出操行分报表...')
}

function handleExportPhone() {
  ElMessage('正在导出手机收取报表...')
}

function handleExportAttendance() {
  ElMessage('正在导出出勤报表...')
}

function handleExportAi() {
  ElMessage('正在导出AI研判报表...')
}

watch(activeReport, (newVal) => {
  nextTick(() => {
    if (newVal === 'score') loadScoreReport()
    else if (newVal === 'phone') loadPhoneReport()
    else if (newVal === 'attendance') loadAttendanceReport()
    else if (newVal === 'basic') loadBasicReport()
    else if (newVal === 'ai') loadAiReport()
  })
})

onMounted(() => {
  nextTick(() => {
    loadScoreReport()
  })
})
</script>

<style scoped lang="scss">
.report-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .report-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .report-content {
    .report-toolbar {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .stat-cards {
      margin: 20px 0;
    }

    .stat-card {
      border: none;
      border-radius: 8px;

      .stat-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .stat-info {
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        &.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
        &.red { background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); }
      }
    }

    .chart-row {
      margin-bottom: 20px;
    }

    .chart-card {
      border: none;
      border-radius: 8px;

      .chart-title {
        font-size: 14px;
        font-weight: 600;
      }
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }

    .table-card {
      border: none;
      border-radius: 8px;
      margin-top: 20px;

      .chart-title {
        font-size: 14px;
        font-weight: 600;
      }
    }

    .up {
      color: #67C23A;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .down {
      color: #F56C6C;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .favorite-icon {
      color: #F7BA2A;
      font-size: 16px;
    }
  }
}
</style>
