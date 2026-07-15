// 墨脉 MoMai - 数据模块
// 包含所有数据 ref：notes, folders, tags, codeTemplates, codeLanguages, subTagsMap
window.MoMaiModules = window.MoMaiModules || {};
window.MoMaiModules.data = function(Vue, deps) {
    const { ref, computed } = Vue;

    // Hierarchy Tags definition
    const bigTags = ref(['学习科研', '编程学习', '考研复习', '文学创作', '程序员周报']);
    const subTagsMap = ref({
        '学习科研': ['双链交互', 'D3.js集群', '学术大纲'],
        '编程学习': ['Java', 'Java SE', 'API', '前端', '后端', '集合框架'],
        '考研复习': ['英语大纲', '政治思维', '历年真题'],
        '文学创作': ['世界观设定', '人物小传', '烟雨江南'],
        '程序员周报': ['低代码沙箱', '本地持久化', 'Tailwind样式']
    });

    const javaFolders = [
        { id: 'java/basic', title: 'Java 基础' },
        { id: 'java/se', title: 'Java SE' },
        { id: 'java/collections', title: '集合框架' },
        { id: 'java/api', title: '前后端 API' }
    ];

    const customFolders = ref([]);
    const isAddingFolder = ref(false);
    const newFolderName = ref('');
    const newFolderInput = ref(null);
    const addingFolderParentId = ref(null);
    const expandedFolders = ref({});
    const folderContextMenu = ref({
        visible: false,
        x: 0,
        y: 0,
        targetFolderId: null
    });

    const selectedBigTag = ref('');
    const selectedSubTags = ref([]);

    const codeLanguages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' },
        { value: 'sql', label: 'SQL' },
        { value: 'json', label: 'JSON' },
        { value: 'markdown', label: 'Markdown' }
    ];

    const codeTemplates = {
        javascript: `function mountPlugin(sandboxId) {
  console.log("MoMai plugin loaded:", sandboxId);
}`,
        python: `def summarize_note(title, tags):
    return f"{title} -> {', '.join(tags)}"

print(summarize_note("墨脉笔记", ["双链", "标签"]))`,
        java: `public class MoMaiPlugin {
    public static void main(String[] args) {
        System.out.println("MoMai plugin loaded");
    }
}`,
        html: `<section class="momai-card">
  <h2>墨脉插件</h2>
  <p>这里是自定义 HTML 小组件。</p>
</section>`,
        css: `.momai-card {
  padding: 16px;
  border-radius: 12px;
  background: #fdfaf2;
}`,
        sql: `SELECT title, category, tags
FROM notes
WHERE category = '学习科研';`,
        json: `{
  "name": "MoMai",
  "features": ["双链图谱", "标签筛选", "插件沙箱"]
}`,
        markdown: `## 墨脉插件说明

- 支持多语言代码块
- 支持本地保存
- 支持创作者扩展`
    };

    const filteredSubTags = computed(() => {
        if (selectedBigTag.value) {
            return subTagsMap.value[selectedBigTag.value] || [];
        }
        return Object.values(subTagsMap.value).flat();
    });

    // Default Rich Notes Database
    const notes = ref([
        {
            id: 'note1',
            title: '✨ 墨脉(MoMai) 核心架构愿景',
            category: '学习科研',
            folder: 'mm/vision',
            tags: ['双链交互', 'D3.js集群'],
            blocks: [
                { id: 'b1_1', type: 'h2', content: '🏛️ 中国区专属：单网页超级知识脑图' },
                { id: 'b1_2', type: 'paragraph', content: '欢迎体验墨脉笔记。它是集 <strong>Notion 块编辑器</strong>、<strong>Obsidian 力导向网网双链</strong> 与 <strong>开放插件沙箱</strong> 于一体的单文件 HTML 效率神器。' },
                { id: 'b1_3', type: 'callout', content: '<strong>评委提示：</strong> 在编辑器里的任意空白行，键入 <code>/</code> 即可快速唤出快捷块组件，支持实时添加 h1 标题、待办事项和科学代码！' }
            ]
        },
        {
            id: 'note2',
            title: '🧱 块级编辑器交互规范',
            category: '学习科研',
            folder: 'mm/editor',
            tags: ['学术大纲'],
            blocks: [
                { id: 'b2_1', type: 'h2', content: '🧱 块级(Block) 编辑机制细节' },
                { id: 'b2_2', type: 'todo', checked: false, content: '测试回车(Enter) 新增空白块交互' },
                { id: 'b2_3', type: 'todo', checked: true, content: '测试块级上下移动位置与删除' },
                { id: 'b2_4', type: 'paragraph', content: '通过引入 Vue3 数据双向绑定，每一个 Block 都有自己的独立数据域，完美实现了 Notion 级的高度响应。' }
            ]
        },
        {
            id: 'note3',
            title: '🕸️ Obsidian式知识图谱前端渲染',
            category: '学习科研',
            folder: 'mm/graph',
            tags: ['D3.js集群'],
            blocks: [
                { id: 'b3_1', type: 'h2', content: '🕸️ D3.js 力导向关系网路渲染' },
                { id: 'b3_2', type: 'paragraph', content: '右侧图谱并非只是静态展示，而是使用了著名的 D3.js 开发库。节点的大小反映了笔记内容的长度，节点的连线则直接读取了分类。' },
                { id: 'b3_3', type: 'callout', content: '你可以直接在右侧图谱中双击任何球形节点，编辑器将光速定位并载入对应的笔记数据！' }
            ]
        },
        {
            id: 'note4',
            title: '🔌 开发者沙箱与开放式插件市场',
            category: '学习科研',
            folder: 'mm/plugin',
            tags: ['低代码沙箱'],
            blocks: [
                { id: 'b4_1', type: 'h2', content: '🔌 为其他创作者赋予无线可能的沙箱环境' },
                { id: 'b4_2', type: 'paragraph', content: '在单网页文件限制下，创作者如何共享创意？我们基于动态样式钩子和 Web Audio 原生发声，在右下角集成并模拟了番茄钟、白噪音白板。' },
                { id: 'b4_3', type: 'code', language: 'javascript', isTemplate: true, content: 'function mountPlugin(sandboxId) {\n  console.log("MoMai plugin loaded:", sandboxId);\n}' },
                { id: 'b4_4', type: 'code', language: 'python', isTemplate: true, content: 'def summarize_note(title, tags):\n    return f"{title} -> {\', \'.join(tags)}"\n\nprint(summarize_note("墨脉笔记", ["双链", "标签"]))' },
                { id: 'b4_5', type: 'code', language: 'java', isTemplate: true, content: 'public class MoMaiPlugin {\n    public static void main(String[] args) {\n        System.out.println("MoMai plugin loaded");\n    }\n}' }
            ]
        },
        {
            id: 'java_basic',
            title: '☕ Java 基础语法',
            category: '编程学习',
            folder: 'java/basic',
            tags: ['Java', 'Java SE'],
            blocks: [
                { id: 'jb_1', type: 'h2', content: 'Java 基础：变量、方法与类' },
                { id: 'jb_2', type: 'paragraph', content: 'Java 学习可以从类型、变量、方法、类和对象开始。它们是后续理解 Java SE、集合框架和后端接口开发的基础。' },
                { id: 'jb_3', type: 'code', language: 'java', isTemplate: true, content: 'public class HelloJava {\n    public static void main(String[] args) {\n        String name = "MM";\n        System.out.println("Hello " + name);\n    }\n}' }
            ]
        },
        {
            id: 'java_se',
            title: '📘 Java SE 核心库',
            category: '编程学习',
            folder: 'java/se',
            tags: ['Java', 'Java SE', '集合框架'],
            blocks: [
                { id: 'js_1', type: 'h2', content: 'Java SE：标准版核心能力' },
                { id: 'js_2', type: 'paragraph', content: 'Java SE 是 Java Standard Edition，包含基础语法、核心类库、集合、IO、异常、多线程和 JVM 基础。它是学习后端开发前必须掌握的一层。' },
                { id: 'js_3', type: 'callout', content: '<strong>关联标签：</strong> 这条笔记同时连接 Java 基础、集合框架和后端 API 学习。' }
            ]
        },
        {
            id: 'java_collections',
            title: '🧺 Java 集合框架',
            category: '编程学习',
            folder: 'java/collections',
            tags: ['Java', 'Java SE', '集合框架'],
            blocks: [
                { id: 'jc_1', type: 'h2', content: 'List、Map、Set 的使用场景' },
                { id: 'jc_2', type: 'paragraph', content: '集合框架用于组织数据。比如后端查询数据库后，可能用 List 返回多条记录，再通过 API 传给前端页面。' },
                { id: 'jc_3', type: 'code', language: 'java', isTemplate: true, content: 'List<String> users = new ArrayList<>();\nusers.add("Alice");\nusers.add("Bob");\nSystem.out.println(users);' }
            ]
        },
        {
            id: 'java_backend_api',
            title: '🧩 后端：用户登录 API',
            category: '编程学习',
            folder: 'java/api',
            tags: ['Java', '后端', 'API'],
            blocks: [
                { id: 'ja_1', type: 'h2', content: '后端登录接口' },
                { id: 'ja_2', type: 'paragraph', content: '这条笔记记录后端如何提供登录 API。它和前端登录表单共享同一个 API 标签，因此会在右侧图谱中自动关联。' },
                { id: 'ja_3', type: 'code', language: 'java', isTemplate: true, content: '@PostMapping("/api/login")\npublic LoginResult login(@RequestBody LoginRequest request) {\n    return authService.login(request);\n}' }
            ]
        },
        {
            id: 'java_frontend_api',
            title: '🖥️ 前端：登录表单请求',
            category: '编程学习',
            folder: 'java/api',
            tags: ['前端', 'API'],
            blocks: [
                { id: 'jf_1', type: 'h2', content: '前端调用登录 API' },
                { id: 'jf_2', type: 'paragraph', content: '前端页面负责收集用户名和密码，并请求后端的 /api/login。因为它也打了 API 标签，所以会和后端接口笔记连接起来。' },
                { id: 'jf_3', type: 'code', language: 'javascript', isTemplate: true, content: 'async function login(form) {\n  const res = await fetch("/api/login", {\n    method: "POST",\n    body: JSON.stringify(form)\n  });\n  return res.json();\n}' }
            ]
        }
    ]);

    notes.value = notes.value.map((note, index) => ({
        ...note,
        createdAt: note.createdAt || (Date.now() - (notes.value.length - index) * 60000)
    }));

    return {
        notes,
        bigTags,
        subTagsMap,
        javaFolders,
        customFolders,
        isAddingFolder,
        newFolderName,
        newFolderInput,
        addingFolderParentId,
        expandedFolders,
        folderContextMenu,
        selectedBigTag,
        selectedSubTags,
        codeLanguages,
        codeTemplates,
        filteredSubTags
    };
};
