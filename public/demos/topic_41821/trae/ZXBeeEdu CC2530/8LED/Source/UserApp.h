/*********************************************************************************************
* 文件：UserApp.h
* 作者：Zengwx 2015.1.28
* 说明：UserApp头文件
* 修改：
* 注释：
*********************************************************************************************/
#ifndef USER_APP_H
#define USER_APP_H

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define MY_REPORT_EVT                0x0001
#define MY_8LED_EVT                  0x0002

#ifdef SPI_LCD
#define MY_LCD_EVT 0x0004
#endif

#define NODE_NAME  "022"
#define NODE_CATEGORY 1

/*********************************************************************************************
* 函数原型
*********************************************************************************************/
extern void sensor_init(void); 
extern void sensor_control(uint8 cmd);
extern uint16 updateV0(char *val);
extern uint8 updateV1(char *val);
extern uint16 updateV2(char *val);
extern void sensor_update(void);
extern void lcd_update(void);
extern int usr_process_command_call(char *ptag, char *pval, char *pout);
extern void MyEventProcess( uint16 event );
extern void write_595(uint8 byte);
extern void flash_8led(uint8 cmd);
#endif 