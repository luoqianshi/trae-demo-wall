/*********************************************************************************************
* 文件：UserApp.h
* 作者：Dengcy 2015.1.31
* 说明：UserApp头文件
* 修改：
* 注释：
*********************************************************************************************/
#ifndef USER_APP_H
#define USER_APP_H

/*********************************************************************************************
* 宏定义
*********************************************************************************************/
#define MY_REPORT_EVT 0x0001

#ifdef SPI_LCD
#define MY_LCD_EVT 0x0002
#endif

#define NODE_NAME  "100"
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
extern void NodeUartInit(void);

#endif // USER_APP_H