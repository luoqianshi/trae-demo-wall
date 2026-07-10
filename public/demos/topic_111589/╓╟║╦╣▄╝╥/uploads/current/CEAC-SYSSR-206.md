- [back to menu](..\menu.html)当前需求为Story：CEAC-SYSSR-206 - -CEA2.0
以下为关联Fuli L4

- [CEA-FuncR-39837](.\CEA-FuncR-39837.html)
- [CEA-VehR-77860](.\CEA-VehR-77860.html)
--------------------2.6. 续航里程显示形式显示及设置 TO SettingAPP（IPD1.0）（IPD4.0）【✓】

## 前提条件

a) 电源状态：LDCU_PowerMode = 0x1 Local ON

## 执行输出

---

a) 大屏根据信号 LDCU_RanDis_Mode = 0x2 CTCL/ ~~0x1 WLTP~~ 0x4:Actual Estimate Range 显示续航里程显示形式为 CTCL/ ~~WLTP~~ 实估续航；

b) 用户在大屏设置续航显示标准为“CLTC”时，CDCU 发出 CDCU_LDCU_RanDis_Mode=0x3:CLTC

c) 用户在大屏设置续航显示标准为“ ~~WLTP~~ 实估续航”时，CDCU 发出 CDCU_LDCU_RanDis_Mode= ~~0x2:WLTP~~ 0x4:Actual Estimate Range