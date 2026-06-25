/*********************************************************************************************
* 文件：pressure.h
* 作者：Dengcy 2015.1.28
* 说明：寄存器宏定义
* 修改：Xuzhy 2015.9.24
* 注释：BMP085_Read_TEMP()函数返回类型应为long型
*********************************************************************************************/
#ifndef BMP085_H
#define BMP085_H

/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include <ioCC2530.h>

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define   uint8_t  unsigned char
#define   int16_t  short
#define   uint16_t unsigned short
#define   int32_t  long
#define   uint32_t unsigned long

#define _nop_() asm("NOP")

#define BMP085_SLAVE_ADDR 0xee
#define OSS 0

#define SENSOR_REV02

#ifdef SENSOR_REV01
#define SCL     P1_2
#define SDA     P0_7
#define SCLDirOut() P1DIR|=0x04
#define SDADirOut() P0DIR|=0x80
#define SDADirIn()  P0DIR&=~0x80
#endif

#ifdef SENSOR_REV02
#define SCL     P0_5
#define SDA     P0_1
#define SCLDirOut() P0DIR|=0x20
#define SDADirOut() P0DIR|=0x02
#define SDADirIn()  P0DIR&=~0x02
#endif

typedef struct bmp085_data{
    int16_t temp;
    int32_t press;
} BMP085_DATA;

/*********************************************************************************************
* 函数原型
*********************************************************************************************/
void pressure_init(void);

void Multiple_Read_BMP085(long int *press);
void delay(unsigned int k);
void Delay5us(void);
void I2C_Start(void);

void I2C_Stop(void);

void Sendack(uint8_t h);

uint8_t I2C_Check_ack(void);

void I2C_Write_Byte(uint8_t b);

uint8_t I2C_Read_Byte(void);

void I2C_Write(uint8_t Slave_Addr, uint8_t REG_Address,uint8_t REG_data);

uint8_t I2C_Read(uint8_t slave_address, uint8_t REG_Address);
int16_t BMP085_Read_2B(uint8_t addr);
uint32_t BMP085_Read_3B(uint8_t addr);
int32_t BMP085_Read_TEMP(void);
int32_t BMP085_Read_Pressure(void);
#endif
