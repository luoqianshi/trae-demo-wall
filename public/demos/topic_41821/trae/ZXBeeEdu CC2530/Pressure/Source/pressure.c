/*********************************************************************************************
* 文件：pressure.c
* 作者：Dengcy 2015.1.28
* 说明：压力驱动程序
*       通过P0_1、P0_5端口控制压力传感器的工作
* 修改：Xuzhy 2015.9.24
* 注释：BMP085_Read_TEMP()函数返回类型应为long型
*********************************************************************************************/

/*********************************************************************************************
* 头文件
*********************************************************************************************/
#include <ioCC2530.h>
#include "pressure.h"

/*********************************************************************************************
* 全局变量
*********************************************************************************************/
int16_t ac1;
int16_t ac2;
int16_t ac3;
uint16_t ac4;
uint16_t ac5;
uint16_t ac6;
int16_t b1;
int16_t b2;
int16_t mb;
int16_t mc;
int16_t md;

int16_t BMP085_Read_2B(uint8_t addr)
{
    uint8_t msb, lsb;
    I2C_Start();
    I2C_Write_Byte(BMP085_SLAVE_ADDR);
    I2C_Write_Byte(addr);
    I2C_Start();
    I2C_Write_Byte(BMP085_SLAVE_ADDR+1);
    msb=I2C_Read_Byte();
    Sendack(0);
    lsb=I2C_Read_Byte();
    Sendack(1);
    I2C_Stop();
    return (int16_t)((msb << 8) | lsb);
}

uint32_t BMP085_Read_3B(uint8_t addr)
{
    uint8_t msb, lsb, xlsb;
    //uint32_t up = 0;
    I2C_Start();
    I2C_Write_Byte(BMP085_SLAVE_ADDR);
    I2C_Write_Byte(addr);
    I2C_Start();
    I2C_Write_Byte(BMP085_SLAVE_ADDR+1);
    msb=I2C_Read_Byte();
    Sendack(0);
    lsb=I2C_Read_Byte();
    Sendack(0);
    xlsb=I2C_Read_Byte();
    Sendack(1);
    I2C_Stop();
    return (((uint32_t) msb << 16) | ((uint32_t) lsb << 8) | (uint32_t) xlsb) >> (8-OSS);
}

int32_t BMP085_Read_TEMP(void)
{
    //int16_t temp;
    I2C_Write(BMP085_SLAVE_ADDR, 0xF4, 0x2E);
    delay(50);
    return (int32_t)(BMP085_Read_2B(0xF6)&0xffff);//Modyfied by Xuzhy
}

int32_t BMP085_Read_Pressure(void)
{
    //long pressure;
    I2C_Write(BMP085_SLAVE_ADDR, 0xF4, (0x34 + (OSS << 6)));
    delay(50);
    return ((int32_t)BMP085_Read_3B(0xF6));
}

/*********************************************************************************************
* 名称：pressure_init()
* 功能：压力传感器初始化
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void pressure_init(void)
{
    SCLDirOut();
    SDADirOut();
    ac1 = BMP085_Read_2B(0xAA);
    ac2 = BMP085_Read_2B(0xAC);
    ac3 = BMP085_Read_2B(0xAE);
    ac4 = BMP085_Read_2B(0xB0);
    ac5 = BMP085_Read_2B(0xB2);
    ac6 = BMP085_Read_2B(0xB4);
    b1 =  BMP085_Read_2B(0xB6);
    b2 =  BMP085_Read_2B(0xB8);
    mb =  BMP085_Read_2B(0xBA);
    mc =  BMP085_Read_2B(0xBC);
    md =  BMP085_Read_2B(0xBE);
}


/*********************************************************************************************
* 名称：Multiple_Read_BMP085(long int *press){
* 功能：获取压力值
* 参数：无
* 返回：无
* 修改：
* 注释：
*********************************************************************************************/
void Multiple_Read_BMP085(long int *press)
{
    int32_t ut, up;
    int32_t x1, x2, b5, b6, x3, b3, p;
    uint32_t b4, b7;
    
    long pressure;
    
    ut = BMP085_Read_TEMP();
    up = BMP085_Read_Pressure();

    x1 = (((int32_t)ut - ac6) * ac5) >> 15;
    x2 = ((int32_t)mc << 11) / (x1 + md);
    b5 = x1 + x2;
    //dat->temp = ((b5 + 8) >> 4);

    //dat->press = BMP085_Read_Pressure();
    b6 = b5 - 4000;
    x1 = (b2 * (b6 * b6) >> 12) >> 11;
    x2 = (ac2 * b6) >> 11;
    x3 = x1 + x2;
    b3 = (((((int32_t)ac1) * 4 + x3) << OSS) + 2) >> 2;
    x1 = (ac3 * b6) >> 13;
    x2 = (b1 * ((b6 * b6) >> 12)) >> 16;
    x3 = ((x1 + x2) + 2) >> 2;
    b4 = (ac4 * (uint32_t)(x3 + 32768)) >> 15;
    b7 = ((uint32_t)up - b3) * (50000 >> OSS);
    if( b7 < 0x80000000)
        p = (b7 * 2) / b4 ;
    else
        p = (b7 / b4) * 2;
    x1 = (p >> 8) * (p >> 8);
    x1 = (x1 * 3038) >> 16;
    x2 = (-7357 * p) >> 16;
    pressure = p + ((x1 + x2 + 3791) >> 4);
    *press = pressure;
}


#pragma optimize=none
/*******************************/
void delay(unsigned int k)	
{						
unsigned int i,j;				
for(i=0;i<k;i++)
{			
for(j=0;j<121;j++)			
{;}}						
}

#pragma optimize=none
void Delay5us()
{
    _nop_();_nop_();_nop_();_nop_();
    _nop_();_nop_();_nop_();_nop_();
	_nop_();_nop_();_nop_();_nop_();
	_nop_();_nop_();_nop_();_nop_();
}


void I2C_Start(void)
{   
  SDA=1;    
  SCL=1;   
  Delay5us();
  SDA=0;    
  SCL=0;
}


void I2C_Stop(void)
{
    
  SCL=0;
    
  SDA=0;
    
  SCL=1;
    
  SDA=1;

}

void Sendack(uint8_t h)

{
    
  SCL=0;
    
  SDA=h&0x01;
    
  SCL=1;
    
  Delay5us();
    
  SCL=0;

}



uint8_t I2C_Check_ack(void)

{
    
  SCL=0;
    
  SDA=1;
    
  SCL=1;
    
  if(SDA==1)
    
  {
        
    SCL=0;
        
    return 0;
    
  }
    
  SCL=0;
    
  return 1;

}



void I2C_Write_Byte(uint8_t b)

{
    
  uint8_t e=8;
    
  while(e--)
  {
        
    SCL=0;
        
    if(b&0x80)
      SDA=1;
        
    else 
      SDA=0;
       
    b<<=1;
        
    SCL=1;
    
  }
    
  SCL=0;
    
  I2C_Check_ack();

}



uint8_t I2C_Read_Byte(void)

{
    
  uint8_t i=8;
    
  uint8_t c=0;
    
  SCL=0;
    
  SDA=1;
    
  while(i--)
  {
        
    c<<=1;
        
    SCL=0;
        
    Delay5us();
       
    SCL=1;
        
    if(SDA==1)c|=0x01;
        
    else c&=0xfe;
    
  }
    
  SCL=0;
    
  return c;

}



void I2C_Write(uint8_t Slave_Addr, uint8_t REG_Address,uint8_t REG_data)

{
    
  I2C_Start();
    
  I2C_Write_Byte(Slave_Addr);
    
  I2C_Write_Byte(REG_Address);
    
  I2C_Write_Byte(REG_data);
    
  I2C_Stop();

}



uint8_t I2C_Read(uint8_t Slave_Addr, uint8_t REG_Address)

{
    
  uint8_t REG_data;
    
  I2C_Start();
    
  I2C_Write_Byte(Slave_Addr);
   
  I2C_Write_Byte(REG_Address);
    
  I2C_Start();
    
  I2C_Write_Byte(Slave_Addr+1);
   
  REG_data=I2C_Read_Byte();
    
  Sendack(1);
    
  I2C_Stop();
    
  return REG_data;

}

