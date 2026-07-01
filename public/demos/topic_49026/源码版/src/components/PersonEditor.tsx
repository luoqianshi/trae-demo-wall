import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { BackHeader } from './BackHeader'
import { useDataStore } from '../stores/useDataStore'
import { warmthToColor, warmthLabel, warmthBgGradient } from '../lib/warmthColor'
import type { Person, PersonProfile, CareerEntry, SharedExperience } from '../types'

interface PersonEditorProps {
  person?: Person
  onClose: () => void
}

export function PersonEditor({ person, onClose }: PersonEditorProps) {
  const addPerson = useDataStore((s) => s.addPerson)
  const updatePerson = useDataStore((s) => s.updatePerson)
  const loadPersons = useDataStore((s) => s.loadPersons)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 基础字段
  const [name, setName] = useState(person?.name || '')
  const [relationship, setRelationship] = useState<Person['relationship']>(
    person?.relationship || 'other'
  )
  const [sentiment, setSentiment] = useState(person?.sentiment || 70)
  const [traits, setTraits] = useState<string[]>(person?.traits || [])
  const [newTrait, setNewTrait] = useState('')
  const [tags, setTags] = useState<string[]>(person?.tags || [])
  const [newTag, setNewTag] = useState('')

  // 身份信息
  const [nicknames, setNicknames] = useState<string[]>(person?.profile.identity.nicknames || [])
  const [newNickname, setNewNickname] = useState('')
  const [gender, setGender] = useState<PersonProfile['identity']['gender']>(person?.profile.identity.gender || undefined)
  const [age, setAge] = useState(person?.profile.identity.age?.toString() || '')
  const [birthday, setBirthday] = useState(person?.profile.identity.birthday || '')
  const [zodiac, setZodiac] = useState(person?.profile.identity.zodiac || '')
  const [hometown, setHometown] = useState(person?.profile.identity.hometown || '')
  const [currentCity, setCurrentCity] = useState(person?.profile.identity.currentCity || '')

  // 职业信息
  const [company, setCompany] = useState(person?.profile.career.company || '')
  const [title, setTitle] = useState(person?.profile.career.title || '')
  const [department, setDepartment] = useState(person?.profile.career.department || '')
  const [industry, setIndustry] = useState(person?.profile.career.industry || '')
  const [workStyle, setWorkStyle] = useState(person?.profile.career.workStyle || '')
  const [strengths, setStrengths] = useState<string[]>(person?.profile.career.strengths || [])
  const [newStrength, setNewStrength] = useState('')
  const [weaknesses, setWeaknesses] = useState<string[]>(person?.profile.career.weaknesses || [])
  const [newWeakness, setNewWeakness] = useState('')
  const [careerHistory, setCareerHistory] = useState(person?.profile.career.careerHistory || [])

  // 性格
  const [openness, setOpenness] = useState(person?.profile.personality.openness || 50)
  const [conscientiousness, setConscientiousness] = useState(person?.profile.personality.conscientiousness || 50)
  const [extraversion, setExtraversion] = useState(person?.profile.personality.extraversion || 50)
  const [agreeableness, setAgreeableness] = useState(person?.profile.personality.agreeableness || 50)
  const [neuroticism, setNeuroticism] = useState(person?.profile.personality.neuroticism || 50)
  const [mbti, setMbti] = useState(person?.profile.personality.mbti || '')
  const [personalityDesc, setPersonalityDesc] = useState(person?.profile.personality.description || '')

  // 偏好
  const [likes, setLikes] = useState<string[]>(person?.profile.preferences.likes || [])
  const [newLike, setNewLike] = useState('')
  const [dislikes, setDislikes] = useState<string[]>(person?.profile.preferences.dislikes || [])
  const [newDislike, setNewDislike] = useState('')
  const [allergies, setAllergies] = useState<string[]>(person?.profile.preferences.allergies || [])
  const [newAllergy, setNewAllergy] = useState('')
  const [dietary, setDietary] = useState<string[]>(person?.profile.preferences.dietary || [])
  const [newDietary, setNewDietary] = useState('')
  const [hobbies, setHobbies] = useState<string[]>(person?.profile.preferences.hobbies || [])
  const [newHobby, setNewHobby] = useState('')
  const [commStyle, setCommStyle] = useState(person?.profile.preferences.communicationStyle || '')

  // 价值观
  const [coreValues, setCoreValues] = useState<string[]>(person?.profile.values.coreValues || [])
  const [newCoreValue, setNewCoreValue] = useState('')
  const [motivations, setMotivations] = useState<string[]>(person?.profile.values.motivations || [])
  const [newMotivation, setNewMotivation] = useState('')
  const [fears, setFears] = useState<string[]>(person?.profile.values.fears || [])
  const [newFear, setNewFear] = useState('')
  const [goals, setGoals] = useState<string[]>(person?.profile.values.goals || [])
  const [newGoal, setNewGoal] = useState('')

  // 社交角色
  const [roleInMyLife, setRoleInMyLife] = useState(person?.profile.socialRole.roleInMyLife || '')
  const [myRoleInTheirLife, setMyRoleInTheirLife] = useState(person?.profile.socialRole.myRoleInTheirLife || '')
  const [powerDynamic, setPowerDynamic] = useState<PersonProfile['socialRole']['powerDynamic']>(
    person?.profile.socialRole.powerDynamic || 'equal'
  )
  const [trustLevel, setTrustLevel] = useState(person?.profile.socialRole.trustLevel || 50)
  const [intimacyLevel, setIntimacyLevel] = useState(person?.profile.socialRole.intimacyLevel || 50)

  // 共同经历
  const [sharedExperiences, setSharedExperiences] = useState(person?.profile.sharedExperiences || [])

  // 折叠面板状态
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))

  const isQuickAdd = !person

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim()) return

    const profile: PersonProfile = {
      identity: {
        fullName: name.trim(),
        nicknames,
        gender,
        age: age ? parseInt(age) : undefined,
        birthday: birthday || undefined,
        zodiac: zodiac || undefined,
        hometown: hometown || undefined,
        currentCity: currentCity || undefined,
      },
      career: {
        company: company || undefined,
        title: title || undefined,
        department: department || undefined,
        industry: industry || undefined,
        workStyle: workStyle || undefined,
        strengths,
        weaknesses,
        careerHistory,
      },
      personality: {
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        mbti: mbti || undefined,
        description: personalityDesc,
      },
      preferences: {
        likes,
        dislikes,
        allergies,
        dietary,
        hobbies,
        communicationStyle: commStyle,
      },
      values: {
        coreValues,
        motivations,
        fears,
        goals,
      },
      socialRole: {
        roleInMyLife,
        myRoleInTheirLife,
        powerDynamic,
        trustLevel,
        intimacyLevel,
      },
      sharedExperiences,
    }

    const personData: Partial<Person> = {
      name: name.trim(),
      relationship,
      sentiment,
      traits,
      tags,
      profile,
    }

    if (person) {
      await updatePerson(person.id, personData)
    } else {
      await addPerson(personData)
    }

    await loadPersons()
    onClose()
  }

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return
    setList([...list, value.trim()])
    setValue('')
  }

  const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index))
  }

  const Section = ({ title, sectionKey, children }: { title: string; sectionKey: string; children: React.ReactNode }) => (
    <div className="border border-ink-muted/10 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-canvas/50 hover:bg-canvas transition-colors"
      >
        <span className="text-xs font-medium text-ink-secondary">{title}</span>
        {expandedSections.has(sectionKey) ? <ChevronUp className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />}
      </button>
      {expandedSections.has(sectionKey) && (
        <div className="p-4 space-y-4">{children}</div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        aria-label="关闭"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
      />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10">
          <BackHeader
            title={person ? '编辑人物档案' : '添加人物档案'}
            onBack={onClose}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* 基础信息 */}
          <Section title="基础信息" sectionKey="basic">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-tertiary">姓名</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入姓名"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">关系</label>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value as Person['relationship'])}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50">
                  <option value="spouse">配偶</option>
                  <option value="family">家人</option>
                  <option value="colleague">同事</option>
                  <option value="friend">朋友</option>
                  <option value="leader">领导</option>
                  <option value="mentor">导师</option>
                  <option value="subordinate">下属</option>
                  <option value="client">客户</option>
                  <option value="rival">对手</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
            <div>
              <div
                className="flex items-center justify-between mb-2 rounded-lg px-3 py-2 relative overflow-hidden"
                style={{ background: warmthBgGradient(sentiment, 0.42) }}
              >
                <label className="text-xs font-medium text-ink-tertiary relative z-10">关系暖度</label>
                <span
                  className="text-xs font-medium transition-colors duration-300 relative z-10"
                  style={{ color: warmthToColor(sentiment) }}
                >
                  {warmthLabel(sentiment)}
                </span>
              </div>
              {/* 视觉暖度滑块：轨道用全色域渐变 */}
              <input
                type="range"
                min={0}
                max={100}
                value={sentiment}
                onChange={(e) => setSentiment(Number(e.target.value))}
                className="w-full warmth-slider"
                style={{
                  background: `linear-gradient(to right,
                    hsl(205, 55%, 52%),
                    hsl(210, 42%, 55%),
                    hsl(160, 40%, 58%),
                    hsl(44, 72%, 64%),
                    hsl(18, 62%, 60%),
                    hsl(11, 82%, 60%)
                  )`,
                  height: '6px',
                  borderRadius: '3px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-2xs text-ink-muted">疏远</span>
                <span className="text-2xs text-ink-muted">亲密</span>
              </div>
            </div>
            <TagInput label="特点标签" tags={traits} newValue={newTrait} setNewValue={setNewTrait}
              onAdd={() => addItem(traits, setTraits, newTrait, setNewTrait)}
              onRemove={(i) => removeItem(traits, setTraits, i)} />
            <TagInput label="标签" tags={tags} newValue={newTag} setNewValue={setNewTag}
              onAdd={() => addItem(tags, setTags, newTag, setNewTag)}
              onRemove={(i) => removeItem(tags, setTags, i)} />
          </Section>

          {/* 身份信息 */}
          <Section title="身份信息" sectionKey="identity">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-tertiary">性别</label>
                <select value={gender || ''} onChange={(e) => setGender(e.target.value as PersonProfile['identity']['gender'] || undefined)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50">
                  <option value="">未设置</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">年龄</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder="28"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">生日</label>
                <input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="MM-DD"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">星座</label>
                <input value={zodiac} onChange={(e) => setZodiac(e.target.value)} placeholder="双鱼座"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">籍贯</label>
                <input value={hometown} onChange={(e) => setHometown(e.target.value)} placeholder="杭州"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">现居城市</label>
                <input value={currentCity} onChange={(e) => setCurrentCity(e.target.value)} placeholder="上海"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
            </div>
            <TagInput label="昵称" tags={nicknames} newValue={newNickname} setNewValue={setNewNickname}
              onAdd={() => addItem(nicknames, setNicknames, newNickname, setNewNickname)}
              onRemove={(i) => removeItem(nicknames, setNicknames, i)} />
          </Section>

          {/* 职业信息 */}
          <Section title="职业信息" sectionKey="career">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-tertiary">公司</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="公司名称"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">职位</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="产品经理"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">部门</label>
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="技术部"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">行业</label>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="互联网"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-tertiary">工作风格</label>
              <textarea value={workStyle} onChange={(e) => setWorkStyle(e.target.value)} placeholder="描述TA的工作风格..."
                rows={2}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50 resize-none" />
            </div>
            <TagInput label="优势" tags={strengths} newValue={newStrength} setNewValue={setNewStrength}
              onAdd={() => addItem(strengths, setStrengths, newStrength, setNewStrength)}
              onRemove={(i) => removeItem(strengths, setStrengths, i)} />
            <TagInput label="弱点" tags={weaknesses} newValue={newWeakness} setNewValue={setNewWeakness}
              onAdd={() => addItem(weaknesses, setWeaknesses, newWeakness, setNewWeakness)}
              onRemove={(i) => removeItem(weaknesses, setWeaknesses, i)} />
            {/* 职业历史 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-ink-tertiary">职业历史</label>
                <button onClick={() => setCareerHistory([...careerHistory, { company: '', title: '', period: '', highlights: [] }])}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-ink-tertiary hover:text-zen-terracotta hover:bg-canvas transition-colors">
                  <Plus className="w-3 h-3" /> 添加
                </button>
              </div>
              {careerHistory.length === 0 && (
                <p className="text-xs text-ink-muted">暂无职业历史记录</p>
              )}
              {careerHistory.map((entry, idx) => (
                <CareerHistoryItem key={idx} entry={entry} index={idx}
                  onUpdate={(updated) => {
                    const next = [...careerHistory]
                    next[idx] = updated
                    setCareerHistory(next)
                  }}
                  onRemove={() => setCareerHistory(careerHistory.filter((_, i) => i !== idx))} />
              ))}
            </div>
          </Section>

          {/* 性格特质 */}
          <Section title="性格特质（大五人格）" sectionKey="personality">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '开放性', value: openness, set: setOpenness, desc: '好奇心、创造力' },
                { label: '尽责性', value: conscientiousness, set: setConscientiousness, desc: '自律、可靠' },
                { label: '外向性', value: extraversion, set: setExtraversion, desc: '社交、活力' },
                { label: '宜人性', value: agreeableness, set: setAgreeableness, desc: '合作、信任' },
                { label: '神经质', value: neuroticism, set: setNeuroticism, desc: '情绪稳定性' },
              ].map((trait) => (
                <div key={trait.label}>
                  <div className="flex justify-between">
                    <label className="text-xs font-medium text-ink-tertiary">{trait.label}</label>
                    <span className="text-xs text-ink-muted">{trait.value}</span>
                  </div>
                  <p className="text-2xs text-ink-muted">{trait.desc}</p>
                  <input type="range" min={0} max={100} value={trait.value}
                    onChange={(e) => trait.set(Number(e.target.value))}
                    className="w-full mt-1 accent-zen-terracotta" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-tertiary">MBTI</label>
                <input value={mbti} onChange={(e) => setMbti(e.target.value)} placeholder="INTJ"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-tertiary">性格描述</label>
              <textarea value={personalityDesc} onChange={(e) => setPersonalityDesc(e.target.value)} placeholder="AI生成的性格描述..."
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50 resize-none" />
            </div>
          </Section>

          {/* 偏好 */}
          <Section title="偏好与习惯" sectionKey="preferences">
            <TagInput label="喜好" tags={likes} newValue={newLike} setNewValue={setNewLike}
              onAdd={() => addItem(likes, setLikes, newLike, setNewLike)}
              onRemove={(i) => removeItem(likes, setLikes, i)} />
            <TagInput label="反感" tags={dislikes} newValue={newDislike} setNewValue={setNewDislike}
              onAdd={() => addItem(dislikes, setDislikes, newDislike, setNewDislike)}
              onRemove={(i) => removeItem(dislikes, setDislikes, i)} />
            <TagInput label="过敏" tags={allergies} newValue={newAllergy} setNewValue={setNewAllergy}
              onAdd={() => addItem(allergies, setAllergies, newAllergy, setNewAllergy)}
              onRemove={(i) => removeItem(allergies, setAllergies, i)} />
            <TagInput label="饮食偏好" tags={dietary} newValue={newDietary} setNewValue={setNewDietary}
              onAdd={() => addItem(dietary, setDietary, newDietary, setNewDietary)}
              onRemove={(i) => removeItem(dietary, setDietary, i)} />
            <TagInput label="爱好" tags={hobbies} newValue={newHobby} setNewValue={setNewHobby}
              onAdd={() => addItem(hobbies, setHobbies, newHobby, setNewHobby)}
              onRemove={(i) => removeItem(hobbies, setHobbies, i)} />
            <div>
              <label className="text-xs font-medium text-ink-tertiary">沟通风格</label>
              <textarea value={commStyle} onChange={(e) => setCommStyle(e.target.value)} placeholder="描述TA的沟通方式..."
                rows={2}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50 resize-none" />
            </div>
          </Section>

          {/* 价值观 */}
          <Section title="价值观与动机" sectionKey="values">
            <TagInput label="核心价值观" tags={coreValues} newValue={newCoreValue} setNewValue={setNewCoreValue}
              onAdd={() => addItem(coreValues, setCoreValues, newCoreValue, setNewCoreValue)}
              onRemove={(i) => removeItem(coreValues, setCoreValues, i)} />
            <TagInput label="驱动因素" tags={motivations} newValue={newMotivation} setNewValue={setNewMotivation}
              onAdd={() => addItem(motivations, setMotivations, newMotivation, setNewMotivation)}
              onRemove={(i) => removeItem(motivations, setMotivations, i)} />
            <TagInput label="担忧/恐惧" tags={fears} newValue={newFear} setNewValue={setNewFear}
              onAdd={() => addItem(fears, setFears, newFear, setNewFear)}
              onRemove={(i) => removeItem(fears, setFears, i)} />
            <TagInput label="目标/愿望" tags={goals} newValue={newGoal} setNewValue={setNewGoal}
              onAdd={() => addItem(goals, setGoals, newGoal, setNewGoal)}
              onRemove={(i) => removeItem(goals, setGoals, i)} />
          </Section>

          {/* 社交角色 */}
          <Section title="关系定位" sectionKey="socialRole">
            <div>
              <label className="text-xs font-medium text-ink-tertiary">TA在我生活中的角色</label>
              <input value={roleInMyLife} onChange={(e) => setRoleInMyLife(e.target.value)} placeholder="如：人生伴侣、情感支柱..."
                className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-tertiary">我在TA生活中的角色</label>
              <input value={myRoleInTheirLife} onChange={(e) => setMyRoleInTheirLife(e.target.value)} placeholder="如：经济支柱、丈夫..."
                className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-tertiary">权力关系</label>
              <select value={powerDynamic} onChange={(e) => setPowerDynamic(e.target.value as PersonProfile['socialRole']['powerDynamic'])}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-ink-muted/20 text-sm outline-none focus:border-zen-terracotta/50">
                <option value="equal">平等</option>
                <option value="superior">我主导</option>
                <option value="subordinate">TA主导</option>
                <option value="complex">复杂</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-tertiary">信任度: {trustLevel}</label>
                <input type="range" min={0} max={100} value={trustLevel} onChange={(e) => setTrustLevel(Number(e.target.value))}
                  className="w-full mt-1 accent-zen-terracotta" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-tertiary">亲密度: {intimacyLevel}</label>
                <input type="range" min={0} max={100} value={intimacyLevel} onChange={(e) => setIntimacyLevel(Number(e.target.value))}
                  className="w-full mt-1 accent-zen-terracotta" />
              </div>
            </div>
          </Section>

          {/* 共同经历 */}
          <Section title="共同经历" sectionKey="sharedExperiences">
            <div className="flex justify-end mb-2">
              <button onClick={() => setSharedExperiences([...sharedExperiences, {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
                title: '',
                description: '',
                date: '',
                category: 'daily',
                sentiment: 50,
              }])}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-ink-tertiary hover:text-zen-terracotta hover:bg-canvas transition-colors">
                <Plus className="w-3 h-3" /> 添加经历
              </button>
            </div>
            {sharedExperiences.length === 0 && (
              <p className="text-xs text-ink-muted">暂无共同经历记录</p>
            )}
            {sharedExperiences.map((exp, idx) => (
              <SharedExperienceItem key={exp.id} experience={exp} index={idx}
                onUpdate={(updated) => {
                  const next = [...sharedExperiences]
                  next[idx] = updated
                  setSharedExperiences(next)
                }}
                onRemove={() => setSharedExperiences(sharedExperiences.filter((_, i) => i !== idx))} />
            ))}
          </Section>

          {isQuickAdd && (
            <div className="space-y-2">
              <p className="text-xs text-ink-tertiary">
                只需填写以上信息即可保存。其他档案可在后续对话中自动补充，或点击下方按钮手动填写。
              </p>
              <button
                type="button"
                onClick={() => setExpandedSections(new Set(['basic', 'identity', 'career', 'personality', 'preferences', 'values', 'socialRole', 'sharedExperiences']))}
                className="w-full py-2 text-xs text-zen-terracotta hover:bg-canvas rounded-lg transition-colors border border-dashed border-ink-muted/20"
              >
                完善更多信息
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-ink-muted/20 sticky bottom-0 bg-surface">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-ink-secondary hover:bg-canvas-warm transition-colors">
            取消
          </button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zen-terracotta text-white hover:bg-zen-terracotta/90 transition-colors disabled:opacity-40">
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function CareerHistoryItem({
  entry,
  index,
  onUpdate,
  onRemove,
}: {
  entry: CareerEntry
  index: number
  onUpdate: (updated: CareerEntry) => void
  onRemove: () => void
}) {
  const [newHighlight, setNewHighlight] = useState('')

  const addHighlight = () => {
    if (!newHighlight.trim()) return
    onUpdate({ ...entry, highlights: [...entry.highlights, newHighlight.trim()] })
    setNewHighlight('')
  }

  const removeHighlight = (i: number) => {
    onUpdate({ ...entry, highlights: entry.highlights.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="border border-ink-muted/10 rounded-lg p-3 space-y-3 bg-canvas/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-secondary">#{index + 1}</span>
        <button onClick={onRemove} className="text-ink-muted hover:text-zen-rose">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-ink-tertiary">公司</label>
          <input value={entry.company} onChange={(e) => onUpdate({ ...entry, company: e.target.value })} placeholder="公司名称"
            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-tertiary">职位</label>
          <input value={entry.title} onChange={(e) => onUpdate({ ...entry, title: e.target.value })} placeholder="职位"
            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-tertiary">时间段</label>
          <input value={entry.period} onChange={(e) => onUpdate({ ...entry, period: e.target.value })} placeholder="2020-2023"
            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-ink-tertiary">亮点</label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {entry.highlights.map((h, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-canvas text-xs text-ink-secondary">
              {h}
              <button onClick={() => removeHighlight(i)} className="hover:text-zen-rose">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
              placeholder="添加亮点..."
              className="w-24 px-2 py-1 rounded-md bg-canvas border border-ink-muted/20 text-xs text-ink-primary outline-none focus:border-zen-terracotta/50" />
            <button onClick={addHighlight}
              className="w-5 h-5 rounded-md flex items-center justify-center bg-canvas text-ink-tertiary hover:text-zen-terracotta">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SharedExperienceItem({
  experience,
  index,
  onUpdate,
  onRemove,
}: {
  experience: SharedExperience
  index: number
  onUpdate: (updated: SharedExperience) => void
  onRemove: () => void
}) {
  return (
    <div className="border border-ink-muted/10 rounded-lg p-3 space-y-3 bg-canvas/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-secondary">#{index + 1}</span>
        <button onClick={onRemove} className="text-ink-muted hover:text-zen-rose">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-ink-tertiary">标题</label>
          <input value={experience.title} onChange={(e) => onUpdate({ ...experience, title: e.target.value })} placeholder="经历标题"
            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-tertiary">日期</label>
          <input value={experience.date} onChange={(e) => onUpdate({ ...experience, date: e.target.value })} placeholder="2024-01-15"
            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-ink-tertiary">描述</label>
        <textarea value={experience.description} onChange={(e) => onUpdate({ ...experience, description: e.target.value })} placeholder="描述这段共同经历..."
          rows={2}
          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-ink-tertiary">分类</label>
          <select value={experience.category} onChange={(e) => onUpdate({ ...experience, category: e.target.value as SharedExperience['category'] })}
            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-ink-muted/20 text-xs outline-none focus:border-zen-terracotta/50">
            <option value="travel">旅行</option>
            <option value="work">工作</option>
            <option value="family">家庭</option>
            <option value="crisis">危机</option>
            <option value="celebration">庆祝</option>
            <option value="daily">日常</option>
          </select>
        </div>
        <div>
          <div className="flex justify-between">
            <label className="text-xs font-medium text-ink-tertiary">情感值: {experience.sentiment}</label>
          </div>
          <input type="range" min={0} max={100} value={experience.sentiment}
            onChange={(e) => onUpdate({ ...experience, sentiment: Number(e.target.value) })}
            className="w-full mt-1 accent-zen-terracotta" />
        </div>
      </div>
    </div>
  )
}

function TagInput({
  label,
  tags,
  newValue,
  setNewValue,
  onAdd,
  onRemove,
}: {
  label: string
  tags: string[]
  newValue: string
  setNewValue: (v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-tertiary">{label}</label>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas text-xs text-ink-secondary">
            {tag}
            <button onClick={() => onRemove(i)} className="hover:text-zen-rose">
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
            placeholder={`添加${label}...`}
            className="w-24 px-2 py-1 rounded-md bg-canvas border border-ink-muted/20 text-xs text-ink-primary outline-none focus:border-zen-terracotta/50" />
          <button onClick={onAdd}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-canvas text-ink-tertiary hover:text-zen-terracotta">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
