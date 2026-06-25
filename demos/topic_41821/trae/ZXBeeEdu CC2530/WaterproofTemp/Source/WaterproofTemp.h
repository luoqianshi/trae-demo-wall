/*********************************************************************************************
* 文件：WaterproofTemp.h
* 作者：Dengcy 2015.2.5
* 说明：寄存器宏定义
* 修改：
* 注释：
*********************************************************************************************/
#ifndef DS18B20_H_
#define DS18B20_H_

/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include "ioCC2530.h"

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define SEARCH_ROM      0xF0              //搜索ROM
#define READ_ROM        0x33              //读ROM
#define MATCH_ROM       0x55              //匹配ROM(挂多个DS18B20时使用)
#define SKIP_ROM        0xCC              //跳过匹配ROM(单个DS18B20时跳过)
#define ALARM_SEARCH    0xEC              //警报搜索

#define CONVERT_T       0x44              //开始转换温度
#define WR_SCRATCHPAD   0x4E              //写便笺
#define RD_SCRATCHPAD   0xBE              //读便笺
#define CPY_CCTATCHPAD  0x48              //复制便笺
#define RECALL_EE       0xB8              //未启用
#define RD_PWR_SUPPLY   0xB4              //读电源供应

#define HIGH            1                 //高电平
#define LOW             0                 //低电平

#define DQ            P0_5                //DS18B20数据IO口
#define DQ_DIR_OUT    0x20                //DS18B20 IO方向
#define CL_DQ()     DQ = LOW              //清除数据
#define SET_DQ()    DQ = HIGH             //设置数据
#define SET_OUT()   P0DIR |=  DQ_DIR_OUT  //设置IO方向,out设置IO方向为输出
#define SET_IN()    P0DIR &= ~DQ_DIR_OUT  //设置IO方向,in设备IO方向为输入

/*********************************************************************************************
* 函数原型
*********************************************************************************************/
typedef unsigned short uint16;              //数据类型重定义 

extern unsigned char FRACTION_INDEX[16];    //小数值查询表

extern unsigned char sensor_data_value[2];  //传感器数据

extern void delay_nus(uint16 n);            //延时n us函数

extern void DS18B20_Write(unsigned char x); //DS18B20写命令

extern unsigned char DS18B20_Read(void);    //DS18B20读数据

extern void DS18B20_Init(void);             //DS18B20初始化/复位

extern void DS18B20_SendConvert(void);      //发送转换温度命令

extern void DS18B20_GetTem(void);           //DS18B20获取温度

#endif
