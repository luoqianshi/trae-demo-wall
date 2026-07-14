# Vue 3 组合式 API

## ref 和 reactive
ref 用于基本类型，reactive 用于对象。

```javascript
import { ref, reactive } from 'vue';

const count = ref(0);
const state = reactive({ name: 'LearnNote' });
```

## computed
计算属性，自动追踪依赖并缓存结果。

## watch
监听响应式数据变化，执行副作用。

## 生命周期
- onMounted
- onUpdated  
- onUnmounted

## 模板语法
v-if, v-for, v-bind, v-on, v-model