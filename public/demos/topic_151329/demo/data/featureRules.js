/**
 * featureRules.js
 * 用途：特征规则表，用于高级模式配置预览展示。
 * 挂载到 window.FeatureRules。
 * 按专业ID(d001/d002等)组织，每个专业下包含多个规则表(type)，
 * 每个规则表包含若干条目(entries)，用于第二层"特征抽取"。
 */
window.FeatureRules = {
    'd001': [  // 工艺管道专业
        {type:'CategoryCode', name:'分类码规则表', entries:[
            {include:'无缝碳钢管', exclude:'', returnValue:'无缝碳钢管', attributes:{类别:'碳钢P',子类:'P_CS无缝'}},
            {include:'合金钢管', exclude:'', returnValue:'合金钢管', attributes:{类别:'合金P',子类:'P_AS合金'}},
            {include:'镀锌钢管', exclude:'', returnValue:'镀锌钢管', attributes:{类别:'镀锌P',子类:'P_ZN镀锌'}}
        ]},
        {type:'Material', name:'材质规则表', entries:[
            {include:'20#', exclude:'', returnValue:'20#', attributes:{类别:'碳钢'}},
            {include:'15CrMo', exclude:'', returnValue:'15CrMo', attributes:{类别:'合金'}},
            {include:'Q235', exclude:'', returnValue:'Q235', attributes:{类别:'碳钢'}},
            {include:'Q345', exclude:'', returnValue:'Q345', attributes:{类别:'低合金'}}
        ]},
        {type:'Size', name:'尺寸规则表', entries:[
            {include:'DN50', exclude:'', returnValue:'DN50', attributes:{规格:'Sch40-100'}},
            {include:'DN100', exclude:'', returnValue:'DN100', attributes:{规格:'Sch40-100'}},
            {include:'DN200', exclude:'', returnValue:'DN200', attributes:{规格:'Sch60-100'}}
        ]},
        {type:'PipeSchedule', name:'管表号规则表', entries:[
            {include:'SCH40', exclude:'', returnValue:'SCH40', attributes:{等级:'Sch40-100'}},
            {include:'SCH60', exclude:'', returnValue:'SCH60', attributes:{等级:'Sch60-100'}},
            {include:'SCH80', exclude:'', returnValue:'SCH80', attributes:{等级:'Sch80-100'}}
        ]}
    ],
    'd002': [  // 电气专业
        {type:'CategoryCode', name:'分类码规则表', entries:[
            {include:'电力电缆', exclude:'', returnValue:'电力电缆', attributes:{类别:'电缆'}},
            {include:'配电箱', exclude:'', returnValue:'配电箱', attributes:{类别:'配电'}},
            {include:'桥架', exclude:'', returnValue:'桥架', attributes:{类别:'桥架'}}
        ]}
    ]
};
