# React Hooks 学习笔记

## useState
用于管理组件状态的基础 Hook。

```jsx
const [count, setCount] = useState(0);
```

## useEffect
处理副作用，如数据获取、订阅等。第二个参数控制执行时机。

## useContext
跨组件传递数据，避免 prop drilling。

## useReducer
处理复杂状态逻辑，类似于 Redux。

## 最佳实践
1. 只在函数组件顶层调用 Hook
2. 不要在循环、条件或嵌套函数中调用
3. 使用自定义 Hook 复用状态逻辑