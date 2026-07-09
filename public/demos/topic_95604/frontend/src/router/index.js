import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
    },
    {
        path: '/warnings',
        name: 'Warnings',
        component: () => import('../views/Warnings.vue')
    },
    {
        path: '/devices',
        name: 'Devices',
        component: () => import('../views/Devices.vue')
    },
    {
        path: '/analysis',
        name: 'Analysis',
        component: () => import('../views/Analysis.vue')
    },
    {
        path: '/history',
        name: 'History',
        component: () => import('../views/History.vue')
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
