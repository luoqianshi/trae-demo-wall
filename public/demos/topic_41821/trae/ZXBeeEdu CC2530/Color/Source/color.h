/*********************************************************************************************
* 文件：TCS3200.h
* 作者：Dengcy 2015.2.3
* 说明：寄存器宏定义
* 修改：
* 注释：
*********************************************************************************************/

#ifndef __TCS3200_H__
#define __TCS3200_H__

/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include <ioCC2530.h>

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define SENSOR_SEL   P0SEL
#define SENSOR_DIR   P0DIR
#define SENSOR_BIT   0x20


#define TCS3200_PIN_S0          P1_0
#define TCS3200_PIN_S1          P0_4
#define TCS3200_PIN_S2          P1_1
#define TCS3200_PIN_S3          P0_6

#define TCS3200_PIN_OE          P1_3

#define TCS3200_FILTER_RED      0x00

#define TCS3200_FILTER_GREEN    0x01

#define TCS3200_FILTER_BLUE     0x02

#define TCS3200_FILTER_NONE     0x03

#define TCS3200_SCALINF_DOWN    0x00

#define TCS3200_SCALING_2       0x01

#define TCS3200_SCALING_20      0x02

#define TCS3200_SCALING_100     0x03

/*********************************************************************************************
* 函数原型
*********************************************************************************************/
extern void TCS3200Init(void);
extern void TCS3200FilterSet(unsigned int ulFilterSet);
extern void TCS3200OutFrequencyScalingSet(unsigned int ulScalingSet);

extern void baipingheng(int *ryz, int *gyz, int *byz);
extern void get_rgb(int ryz, int gyz, int byz, int *rb, int *gb, int *bb);


#endif
















