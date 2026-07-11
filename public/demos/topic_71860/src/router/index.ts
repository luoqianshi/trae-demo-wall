import { createRouter, createWebHistory } from 'vue-router'
import RoleSelect from '../views/RoleSelect.vue'
import Home from '../views/Home.vue'
import ContractTerms from '../views/ContractTerms.vue'
import IdCardUpload from '../views/IdCardUpload.vue'
import SignaturePage from '../views/SignaturePage.vue'
import SubmitSuccess from '../views/SubmitSuccess.vue'
import ContractDetail from '../views/ContractDetail.vue'
import AuditList from '../views/AuditList.vue'
import AuditDetail from '../views/AuditDetail.vue'

const routes = [
  { path: '/', name: 'RoleSelect', component: RoleSelect },
  { path: '/home', name: 'Home', component: Home },
  { path: '/contract-terms', name: 'ContractTerms', component: ContractTerms },
  { path: '/idcard-upload', name: 'IdCardUpload', component: IdCardUpload },
  { path: '/signature', name: 'SignaturePage', component: SignaturePage },
  { path: '/submit-success', name: 'SubmitSuccess', component: SubmitSuccess },
  { path: '/contract-detail/:id', name: 'ContractDetail', component: ContractDetail },
  { path: '/audit-list', name: 'AuditList', component: AuditList },
  { path: '/audit-detail/:id', name: 'AuditDetail', component: AuditDetail },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
