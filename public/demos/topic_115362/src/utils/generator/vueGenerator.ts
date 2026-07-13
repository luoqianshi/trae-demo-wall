import type { Control, ProjectConfig, GeneratedFile } from "@/types";

// 首字母大写
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// 驼峰转短横线
const kebab = (s: string) => s.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");

export function generateVueFiles(config: ProjectConfig, controls: Control[]): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const module = config.moduleName;
  const entity = config.entityName;
  const apiName = module;

  if (config.frontendType === "pc") {
    files.push({
      path: `src/views/${module}/form.vue`,
      lang: "vue",
      side: "frontend",
      content: generatePcForm(config, controls),
    });
    files.push({
      path: `src/views/${module}/index.vue`,
      lang: "vue",
      side: "frontend",
      content: generatePcList(config, controls),
    });
  } else {
    files.push({
      path: `src/views/${module}/index.vue`,
      lang: "vue",
      side: "frontend",
      content: generateMobileForm(config, controls),
    });
  }

  files.push({
    path: `src/api/${apiName}.ts`,
    lang: "typescript",
    side: "frontend",
    content: generateApi(config, controls),
  });
  files.push({
    path: `src/router/modules/${module}.ts`,
    lang: "typescript",
    side: "frontend",
    content: generateRouter(config),
  });

  return files;
}

// PC 端表单页 (Element Plus)
function generatePcForm(config: ProjectConfig, controls: Control[]): string {
  const formItems = controls
    .filter((c) => c.type !== "table")
    .map((c) => {
      const prop = c.field;
      const label = c.label;
      const required = c.required ? " required" : "";
      const comp = renderElComponent(c, prop);
      return `      <el-form-item label="${label}" prop="${prop}"${required}>
${comp}
      </el-form-item>`;
    })
    .join("\n");

  return `<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>${config.entityName}表单</span>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
${formItems}
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { save${cap(config.entityName)} } from '@/api/${config.moduleName}'

const formRef = ref<FormInstance>()

const form = reactive({
${controls.filter((c) => c.type !== "table").map((c) => `  ${c.field}: ${c.type === "number" || c.type === "switch" ? "null" : "''"}`).join(",\n")}
})

const rules = reactive<FormRules>({
${controls.filter((c) => c.type !== "table").map((c) => `  ${c.field}: [{ required: ${c.required}, message: '请输入${c.label}', trigger: 'blur' }]`).join(",\n")}
})

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      await save${cap(config.entityName)}(form)
      ElMessage.success('保存成功')
    }
  })
}

const handleReset = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.app-container { padding: 20px; }
</style>
`;
}

// PC 端列表页 (Element Plus)
function generatePcList(config: ProjectConfig, controls: Control[]): string {
  const cols = controls
    .filter((c) => c.type !== "table")
    .map((c) => `      <el-table-column prop="${c.field}" label="${c.label}" />`)
    .join("\n");

  return `<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>${config.entityName}列表</span>
          <el-button type="primary" @click="handleAdd">新增</el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border>
${cols}
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          @change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get${cap(config.entityName)}Page, delete${cap(config.entityName)} } from '@/api/${config.moduleName}'

const loading = ref(false)
const tableData = ref<any[]>([])
const page = reactive({ current: 1, size: 10, total: 0 })

const fetchData = async () => {
  loading.value = true
  try {
    const res = await get${cap(config.entityName)}Page({ current: page.current, size: page.size })
    tableData.value = res.records
    page.total = res.total
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  // 跳转表单页
}

const handleEdit = (row: any) => {
  // 跳转表单页并传 id
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' }).then(async () => {
    await delete${cap(config.entityName)}(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

onMounted(fetchData)
</script>

<style scoped>
.app-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
`;
}

// 移动端表单页 (Vant)
function generateMobileForm(config: ProjectConfig, controls: Control[]): string {
  const fields = controls
    .filter((c) => c.type !== "table")
    .map((c) => {
      const prop = c.field;
      const label = c.label;
      const comp = renderVantComponent(c, prop);
      return `    <van-field name="${prop}" label="${label}">\n${comp}\n    </van-field>`;
    })
    .join("\n");

  return `<template>
  <div class="mobile-page">
    <van-nav-bar title="${config.entityName}表单" />
    <van-form @submit="handleSubmit">
${fields}
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">提交</van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { showToast } from 'vant'
import { save${cap(config.entityName)} } from '@/api/${config.moduleName}'

const form = reactive({
${controls.filter((c) => c.type !== "table").map((c) => `  ${c.field}: ''`).join(",\n")}
})

const handleSubmit = async () => {
  await save${cap(config.entityName)}(form)
  showToast('保存成功')
}
</script>

<style scoped>
.mobile-page { min-height: 100vh; background: #f7f8fa; }
</style>
`;
}

// 渲染 Element Plus 组件
function renderElComponent(c: Control, prop: string): string {
  switch (c.type) {
    case "input":
      return `        <el-input v-model="form.${prop}" placeholder="${c.placeholder}" />`;
    case "textarea":
      return `        <el-input v-model="form.${prop}" type="textarea" :rows="4" placeholder="${c.placeholder}" />`;
    case "number":
      return `        <el-input-number v-model="form.${prop}" />`;
    case "select":
      return `        <el-select v-model="form.${prop}" placeholder="${c.placeholder}">\n${(c.options ?? []).map((o) => `          <el-option label="${o.label}" value="${o.value}" />`).join("\n")}\n        </el-select>`;
    case "radio":
      return `        <el-radio-group v-model="form.${prop}">\n${(c.options ?? []).map((o) => `          <el-radio label="${o.value}">${o.label}</el-radio>`).join("\n")}\n        </el-radio-group>`;
    case "checkbox":
      return `        <el-checkbox-group v-model="form.${prop}">\n${(c.options ?? []).map((o) => `          <el-checkbox label="${o.value}">${o.label}</el-checkbox>`).join("\n")}\n        </el-checkbox-group>`;
    case "date":
      return `        <el-date-picker v-model="form.${prop}" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />`;
    case "time":
      return `        <el-time-picker v-model="form.${prop}" value-format="HH:mm:ss" placeholder="选择时间" />`;
    case "datetime":
      return `        <el-date-picker v-model="form.${prop}" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择日期时间" />`;
    case "switch":
      return `        <el-switch v-model="form.${prop}" :active-value="1" :inactive-value="0" />`;
    case "upload":
      return `        <el-upload action="/api/upload" :limit="1">\n          <el-button type="primary">点击上传</el-button>\n        </el-upload>`;
    default:
      return `        <el-input v-model="form.${prop}" placeholder="${c.placeholder}" />`;
  }
}

// 渲染 Vant 组件
function renderVantComponent(c: Control, prop: string): string {
  const t = (comp: string) => `      <template #input>${comp}</template>`;
  switch (c.type) {
    case "input":
      return t(`<van-input v-model="form.${prop}" placeholder="${c.placeholder}" />`);
    case "textarea":
      return t(`<van-input v-model="form.${prop}" type="textarea" placeholder="${c.placeholder}" />`);
    case "number":
      return t(`<van-stepper v-model="form.${prop}" />`);
    case "select":
      return t(`<van-dropdown-menu><van-dropdown-item v-model="form.${prop}" :options='${JSON.stringify(c.options ?? [])}' /></van-dropdown-menu>`);
    case "radio":
      return t(`<van-radio-group v-model="form.${prop}" direction="horizontal">${(c.options ?? []).map((o) => `<van-radio name="${o.value}">${o.label}</van-radio>`).join("")}</van-radio-group>`);
    case "checkbox":
      return t(`<van-checkbox-group v-model="form.${prop}" direction="horizontal">${(c.options ?? []).map((o) => `<van-checkbox name="${o.value}">${o.label}</van-checkbox>`).join("")}</van-checkbox-group>`);
    case "date":
      return t(`<van-date-picker v-model="form.${prop}" />`);
    case "time":
      return t(`<van-time-picker v-model="form.${prop}" />`);
    case "switch":
      return t(`<van-switch v-model="form.${prop}" />`);
    case "upload":
      return t(`<van-uploader :max-count="1" />`);
    default:
      return t(`<van-input v-model="form.${prop}" placeholder="${c.placeholder}" />`);
  }
}

// API 封装
function generateApi(config: ProjectConfig, controls: Control[]): string {
  const e = cap(config.entityName);
  return `import request from '@/utils/request'

const BASE = '${config.apiPrefix}/${config.moduleName}'

export interface ${e}DTO {
${controls.filter((c) => c.type !== "table").map((c) => `  ${c.field}: ${tsType(c)}`).join("\n")}
}

export interface ${e}Query {
  current?: number
  size?: number
}

// 分页查询
export function get${e}Page(params: ${e}Query) {
  return request.get(BASE + '/page', { params })
}

// 详情
export function get${e}ById(id: string | number) {
  return request.get(BASE + '/' + id)
}

// 新增
export function save${e}(data: ${e}DTO) {
  return request.post(BASE, data)
}

// 修改
export function update${e}(data: ${e}DTO) {
  return request.put(BASE, data)
}

// 删除
export function delete${e}(id: string | number) {
  return request.delete(BASE + '/' + id)
}
`;
}

function tsType(c: Control): string {
  if (c.type === "number") return "number | null";
  if (c.type === "switch") return "number";
  if (c.type === "checkbox") return "string[]";
  return "string";
}

// 路由
function generateRouter(config: ProjectConfig): string {
  const m = config.moduleName;
  const e = config.entityName;
  if (config.frontendType === "pc") {
    return `import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/${m}',
    name: '${cap(e)}List',
    component: () => import('@/views/${m}/index.vue'),
    meta: { title: '${e}列表' },
  },
  {
    path: '/${m}/form',
    name: '${cap(e)}Form',
    component: () => import('@/views/${m}/form.vue'),
    meta: { title: '${e}表单' },
  },
]

export default routes
`;
  }
  return `import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/${m}',
    name: '${cap(e)}',
    component: () => import('@/views/${m}/index.vue'),
    meta: { title: '${e}' },
  },
]

export default routes
`;
}
