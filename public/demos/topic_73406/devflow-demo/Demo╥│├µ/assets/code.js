(function () {
  var codeFiles = [
    {
      name: 'app/services/auth_service.py',
      html:
        '<span class="cm"># app/services/auth_service.py</span>\n' +
        '<span class="kw">from</span> datetime <span class="kw">import</span> datetime, timedelta\n' +
        '<span class="kw">from</span> typing <span class="kw">import</span> Optional\n' +
        '<span class="kw">import</span> jwt\n' +
        '<span class="kw">from</span> passlib.context <span class="kw">import</span> CryptContext\n' +
        '<span class="kw">from</span> sqlalchemy <span class="kw">import</span> select\n' +
        '<span class="kw">from</span> sqlalchemy.ext.asyncio <span class="kw">import</span> AsyncSession\n' +
        '\n' +
        '<span class="kw">from</span> app.models.user <span class="kw">import</span> User\n' +
        '<span class="kw">from</span> app.schemas.auth <span class="kw">import</span> LoginRequest, RegisterRequest, TokenResponse\n' +
        '<span class="kw">from</span> app.core.config <span class="kw">import</span> settings\n' +
        '\n' +
        'pwd_context = CryptContext(schemes=[<span class="str">"bcrypt"</span>])\n' +
        '\n' +
        '\n' +
        '<span class="kw">class</span> <span class="fn">AuthService</span>:\n' +
        '    <span class="str">"""用户认证服务 - 由 Skill Phase 7 自动生成"""</span>\n' +
        '\n' +
        '    <span class="kw">async def</span> <span class="fn">register</span>(self, db: AsyncSession, req: RegisterRequest) -> User:\n' +
        '        <span class="cm"># 检查邮箱是否已注册</span>\n' +
        '        result = <span class="kw">await</span> db.execute(\n' +
        '            select(User).where(User.email == req.email)\n' +
        '        )\n' +
        '        <span class="kw">if</span> result.scalar_one_or_none():\n' +
        '            <span class="kw">raise</span> ValueError(<span class="str">"邮箱已被注册"</span>)\n' +
        '\n' +
        '        user = User(\n' +
        '            email=req.email,\n' +
        '            username=req.username,\n' +
        '            password_hash=pwd_context.hash(req.password),\n' +
        '            role=<span class="str">"tester"</span>,\n' +
        '            created_at=datetime.utcnow()\n' +
        '        )\n' +
        '        db.add(user)\n' +
        '        <span class="kw">await</span> db.commit()\n' +
        '        <span class="kw">await</span> db.refresh(user)\n' +
        '        <span class="kw">return</span> user\n' +
        '\n' +
        '    <span class="kw">async def</span> <span class="fn">login</span>(self, db: AsyncSession, req: LoginRequest) -> TokenResponse:\n' +
        '        result = <span class="kw">await</span> db.execute(\n' +
        '            select(User).where(User.email == req.email)\n' +
        '        )\n' +
        '        user = result.scalar_one_or_none()\n' +
        '        <span class="kw">if not</span> user <span class="kw">or not</span> pwd_context.verify(req.password, user.password_hash):\n' +
        '            <span class="kw">raise</span> ValueError(<span class="str">"邮箱或密码错误"</span>)\n' +
        '\n' +
        '        token = self._create_token(user.id, user.role)\n' +
        '        <span class="kw">return</span> TokenResponse(access_token=token, token_type=<span class="str">"bearer"</span>)\n' +
        '\n' +
        '    <span class="kw">def</span> <span class="fn">_create_token</span>(self, user_id: <span class="num">int</span>, role: str) -> str:\n' +
        '        payload = {\n' +
        '            <span class="str">"sub"</span>: str(user_id),\n' +
        '            <span class="str">"role"</span>: role,\n' +
        '            <span class="str">"exp"</span>: datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS)\n' +
        '        }\n' +
        '        <span class="kw">return</span> jwt.encode(payload, settings.SECRET_KEY, algorithm=<span class="str">"HS256"</span>)'
    },
    {
      name: 'app/routers/test_cases.py',
      html:
        '<span class="cm"># app/routers/test_cases.py</span>\n' +
        '<span class="kw">from</span> fastapi <span class="kw">import</span> APIRouter, Depends, Query\n' +
        '<span class="kw">from</span> sqlalchemy.ext.asyncio <span class="kw">import</span> AsyncSession\n' +
        '<span class="kw">from</span> typing <span class="kw">import</span> Optional\n' +
        '\n' +
        '<span class="kw">from</span> app.core.deps <span class="kw">import</span> get_db, get_current_user\n' +
        '<span class="kw">from</span> app.models.user <span class="kw">import</span> User\n' +
        '<span class="kw">from</span> app.schemas.case <span class="kw">import</span> CaseCreate, CaseResponse, CaseListResponse\n' +
        '<span class="kw">from</span> app.services.case_service <span class="kw">import</span> CaseService\n' +
        '\n' +
        'router = APIRouter(prefix=<span class="str">"/api/v1/cases"</span>, tags=[<span class="str">"测试用例"</span>])\n' +
        'case_service = CaseService()\n' +
        '\n' +
        '\n' +
        '<span class="dec">@router.post</span>(<span class="str">""</span>, response_model=CaseResponse, status_code=<span class="num">201</span>)\n' +
        '<span class="kw">async def</span> <span class="fn">create_case</span>(\n' +
        '    data: CaseCreate,\n' +
        '    db: AsyncSession = Depends(get_db),\n' +
        '    user: User = Depends(get_current_user)\n' +
        '):\n' +
        '    <span class="str">"""创建测试用例 - Skill Phase 5 API 设计 → Phase 7 实现"""</span>\n' +
        '    <span class="kw">return await</span> case_service.create(db, data, user.id)\n' +
        '\n' +
        '\n' +
        '<span class="dec">@router.get</span>(<span class="str">""</span>, response_model=CaseListResponse)\n' +
        '<span class="kw">async def</span> <span class="fn">list_cases</span>(\n' +
        '    scenario_id: Optional[<span class="num">int</span>] = Query(<span class="kw">None</span>),\n' +
        '    status: Optional[str] = Query(<span class="kw">None</span>),\n' +
        '    priority: Optional[str] = Query(<span class="kw">None</span>),\n' +
        '    page: <span class="num">int</span> = Query(<span class="num">1</span>, ge=<span class="num">1</span>),\n' +
        '    page_size: <span class="num">int</span> = Query(<span class="num">20</span>, ge=<span class="num">1</span>, le=<span class="num">100</span>),\n' +
        '    db: AsyncSession = Depends(get_db),\n' +
        '    user: User = Depends(get_current_user)\n' +
        '):\n' +
        '    <span class="str">"""分页查询用例列表，支持多条件筛选"""</span>\n' +
        '    <span class="kw">return await</span> case_service.list(\n' +
        '        db, user.id, scenario_id, status, priority, page, page_size\n' +
        '    )\n' +
        '\n' +
        '\n' +
        '<span class="dec">@router.delete</span>(<span class="str">"/{case_id}"</span>, status_code=<span class="num">204</span>)\n' +
        '<span class="kw">async def</span> <span class="fn">delete_case</span>(\n' +
        '    case_id: <span class="num">int</span>,\n' +
        '    db: AsyncSession = Depends(get_db),\n' +
        '    user: User = Depends(get_current_user)\n' +
        '):\n' +
        '    <span class="str">"""删除测试用例（软删除）"""</span>\n' +
        '    <span class="kw">await</span> case_service.delete(db, case_id, user.id)'
    },
    {
      name: 'src/views/ScenarioView.vue',
      html:
        '<span class="cm">&lt;!-- src/views/ScenarioView.vue - Skill Phase 7 前端自动生成 --&gt;</span>\n' +
        '<span class="kw">&lt;template&gt;</span>\n' +
        '  <span class="kw">&lt;div</span> class=<span class="str">"scenario-page"</span><span class="kw">&gt;</span>\n' +
        '    <span class="cm">&lt;!-- 搜索与操作栏 --&gt;</span>\n' +
        '    <span class="kw">&lt;div</span> class=<span class="str">"toolbar"</span><span class="kw">&gt;</span>\n' +
        '      <span class="kw">&lt;el-input</span>\n' +
        '        v-model=<span class="str">"searchText"</span>\n' +
        '        placeholder=<span class="str">"搜索场景名称..."</span>\n' +
        '        clearable\n' +
        '        @input=<span class="str">"debouncedFetch"</span>\n' +
        '      <span class="kw">/&gt;</span>\n' +
        '      <span class="kw">&lt;el-button</span> type=<span class="str">"primary"</span> @click=<span class="str">"showCreateDialog"</span><span class="kw">&gt;</span>\n' +
        '        新建场景\n' +
        '      <span class="kw">&lt;/el-button&gt;</span>\n' +
        '    <span class="kw">&lt;/div&gt;</span>\n' +
        '\n' +
        '    <span class="cm">&lt;!-- 场景列表 --&gt;</span>\n' +
        '    <span class="kw">&lt;el-table</span> :data=<span class="str">"scenarios"</span> v-loading=<span class="str">"loading"</span><span class="kw">&gt;</span>\n' +
        '      <span class="kw">&lt;el-table-column</span> prop=<span class="str">"name"</span> label=<span class="str">"名称"</span> <span class="kw">/&gt;</span>\n' +
        '      <span class="kw">&lt;el-table-column</span> prop=<span class="str">"base_url"</span> label=<span class="str">"基础URL"</span> <span class="kw">/&gt;</span>\n' +
        '      <span class="kw">&lt;el-table-column</span> prop=<span class="str">"case_count"</span> label=<span class="str">"用例数"</span> <span class="kw">/&gt;</span>\n' +
        '      <span class="kw">&lt;el-table-column</span> label=<span class="str">"操作"</span><span class="kw">&gt;</span>\n' +
        '        <span class="kw">&lt;template</span> #default=<span class="str">"{ row }"</span><span class="kw">&gt;</span>\n' +
        '          <span class="kw">&lt;el-button</span> size=<span class="str">"small"</span> @click=<span class="str">"editScenario(row)"</span><span class="kw">&gt;</span>编辑<span class="kw">&lt;/el-button&gt;</span>\n' +
        '          <span class="kw">&lt;el-button</span> size=<span class="str">"small"</span> type=<span class="str">"danger"</span> @click=<span class="str">"deleteScenario(row)"</span><span class="kw">&gt;</span>删除<span class="kw">&lt;/el-button&gt;</span>\n' +
        '        <span class="kw">&lt;/template&gt;</span>\n' +
        '      <span class="kw">&lt;/el-table-column&gt;</span>\n' +
        '    <span class="kw">&lt;/el-table&gt;</span>\n' +
        '\n' +
        '    <span class="cm">&lt;!-- 分页 --&gt;</span>\n' +
        '    <span class="kw">&lt;el-pagination</span>\n' +
        '      v-model:current-page=<span class="str">"page"</span>\n' +
        '      :total=<span class="str">"total"</span>\n' +
        '      @current-change=<span class="str">"fetchScenarios"</span>\n' +
        '    <span class="kw">/&gt;</span>\n' +
        '  <span class="kw">&lt;/div&gt;</span>\n' +
        '<span class="kw">&lt;/template&gt;</span>\n' +
        '\n' +
        '<span class="kw">&lt;script</span> setup lang=<span class="str">"ts"</span><span class="kw">&gt;</span>\n' +
        '<span class="kw">import</span> { ref, onMounted } <span class="kw">from</span> <span class="str">\'vue\'</span>\n' +
        '<span class="kw">import</span> { useScenarioStore } <span class="kw">from</span> <span class="str">\'@/stores/scenario\'</span>\n' +
        '<span class="kw">import</span> { useDebounceFn } <span class="kw">from</span> <span class="str">\'@vueuse/core\'</span>\n' +
        '\n' +
        '<span class="kw">const</span> store = useScenarioStore()\n' +
        '<span class="kw">const</span> scenarios = ref([])\n' +
        '<span class="kw">const</span> loading = ref(<span class="num">false</span>)\n' +
        '<span class="kw">const</span> searchText = ref(<span class="str">\'\'</span>)\n' +
        '<span class="kw">const</span> page = ref(<span class="num">1</span>)\n' +
        '<span class="kw">const</span> total = ref(<span class="num">0</span>)\n' +
        '\n' +
        '<span class="kw">const</span> fetchScenarios = <span class="kw">async</span> () => {\n' +
        '  loading.value = <span class="num">true</span>\n' +
        '  <span class="kw">const</span> res = <span class="kw">await</span> store.list({ page: page.value, keyword: searchText.value })\n' +
        '  scenarios.value = res.data.items\n' +
        '  total.value = res.data.total\n' +
        '  loading.value = <span class="num">false</span>\n' +
        '}\n' +
        '\n' +
        '<span class="kw">const</span> debouncedFetch = useDebounceFn(fetchScenarios, <span class="num">300</span>)\n' +
        'onMounted(fetchScenarios)\n' +
        '<span class="kw">&lt;/script&gt;</span>'
    }
  ];

  window.switchCode = function (idx) {
    var f = codeFiles[idx];
    document.getElementById('codeFilename').textContent = f.name;
    document.getElementById('codeContent').innerHTML = f.html;
    // highlight active button
    for (var i = 0; i < 3; i++) {
      var btn = document.getElementById('codeBtn' + i);
      if (i === idx) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = 'var(--accent)';
      } else {
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }
  };

  // init
  switchCode(0);
})();
