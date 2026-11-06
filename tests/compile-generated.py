"""Compile separate generated objects and exercise stop cleanup using a fake device layer.
This is a host integration test, not an official SDK or hardware test.
"""
from pathlib import Path
import subprocess,os,json,shutil
root=Path(__file__).resolve().parents[1]
out=root/'generated/host-test'
headers=out/'include'
headers.mkdir(parents=True,exist_ok=True)
header='''#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
typedef int pbio_error_t;
typedef struct {int port; double count; int speed;} pup_motor_t;
typedef uint64_t SYSTIM;
typedef int pbio_color_t;
#define PBIO_COLOR_RED 0
#define PBIO_COLOR_YELLOW 1
#define PBIO_COLOR_GREEN 2
#define PBIO_COLOR_BLUE 3
#define PBIO_COLOR_WHITE 4
#define PBIO_COLOR_MAGENTA 5
#define HUB_BUTTON_LEFT 2
#define HUB_BUTTON_RIGHT 4
typedef struct {int port;} pup_device_t;
typedef unsigned hub_button_t;
#define PBIO_SUCCESS 0
#define PBIO_ERROR_AGAIN 1
#define PUP_DIRECTION_CLOCKWISE 0
#define HUB_BUTTON_CENTER 1
#define E_OK 0
#define LOG_ERROR 3
#define LOG_NOTICE 5
'''+''.join(f'#define PBIO_PORT_ID_{p} {i}\n' for i,p in enumerate('ABCDEF'))+'''
int dly_tsk(uint32_t us);void ext_tsk(void);void syslog(int level,const char *fmt,...);
pbio_error_t hub_button_is_pressed(hub_button_t *buttons);
pup_motor_t *pup_motor_get_device(int port);
pbio_error_t pup_motor_setup(pup_motor_t *motor,int direction,bool reset);
pbio_error_t pup_motor_set_speed(pup_motor_t *motor,int speed);
pbio_error_t pup_motor_brake(pup_motor_t *motor);
pup_device_t *pup_ultrasonic_sensor_get_device(int port);
int32_t pup_ultrasonic_sensor_distance(pup_device_t *dev);
pbio_error_t hub_display_image(uint8_t *pixels);
'''
header+='\nint get_tim(SYSTIM *now); int32_t pup_motor_get_count(pup_motor_t*); int32_t pup_motor_get_speed(pup_motor_t*); pbio_error_t pup_motor_stop(pup_motor_t*); pbio_error_t pup_motor_hold(pup_motor_t*); pbio_error_t pup_motor_set_power(pup_motor_t*,int); pbio_error_t pup_motor_reset_count(pup_motor_t*); pup_device_t *pup_color_sensor_get_device(int); pup_device_t *pup_force_sensor_get_device(int); int32_t pup_color_sensor_reflection(pup_device_t*); int32_t pup_color_sensor_ambient(pup_device_t*); float pup_force_sensor_force(pup_device_t*); pbio_error_t hub_display_off(void); pbio_error_t hub_display_char(char); pbio_error_t hub_display_number(int8_t); pbio_error_t hub_display_pixel(uint8_t,uint8_t,uint8_t); pbio_error_t hub_light_on_color(pbio_color_t); pbio_error_t hub_light_off(void); void hub_speaker_stop(void); void hub_speaker_set_volume(uint8_t); void hub_speaker_play_tone(uint16_t,int32_t); uint16_t hub_battery_get_voltage(void);\n'
(headers/'fake.h').write_text(header)
for name in ['kernel.h','kernel_cfg.h','t_syslog.h','spike/hub/button.h','spike/hub/display.h','spike/pup/motor.h','spike/pup/ultrasonicsensor.h','spike/pup/colorsensor.h','spike/pup/forcesensor.h','spike/hub/light.h','spike/hub/speaker.h','spike/hub/battery.h']:
    p=headers/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('#include "fake.h"\n')
stub='''#include "fake.h"
#include <stdio.h>
#include <stdlib.h>
static uint32_t clock_us;static int run_count,brake_count,display_count,ended;static pup_motor_t motors[5];
int dly_tsk(uint32_t us){clock_us+=us;if(!getenv("STALL"))for(int p=0;p<5;p++)motors[p].count+=motors[p].speed*(double)us/1000000.0;return E_OK;}
void ext_tsk(void){ended=1;}
void syslog(int level,const char *fmt,...){(void)level;(void)fmt;}
pbio_error_t hub_button_is_pressed(hub_button_t *buttons){*buttons=(clock_us>=3100000&&clock_us<3120000)||(getenv("STOP_EARLY")&&clock_us>=3500000)?1:0;return 0;}
pup_motor_t *pup_motor_get_device(int port){motors[port].port=port;return &motors[port];}
pbio_error_t pup_motor_setup(pup_motor_t *m,int direction,bool reset){(void)m;(void)direction;(void)reset;return 0;}
pbio_error_t pup_motor_set_speed(pup_motor_t *m,int speed){m->speed=speed;if(speed)run_count++;return getenv("DEVICE_ERROR")?2:0;}
pbio_error_t pup_motor_brake(pup_motor_t *m){m->speed=0;brake_count++;return 0;}
pup_device_t *pup_ultrasonic_sensor_get_device(int port){static pup_device_t dev;dev.port=port;return &dev;}
int32_t pup_ultrasonic_sensor_distance(pup_device_t *dev){(void)dev;return 100;}
pbio_error_t hub_display_image(uint8_t *pixels){(void)pixels;display_count++;return 0;}
int get_tim(SYSTIM *now){*now=clock_us;return E_OK;}
int32_t pup_motor_get_count(pup_motor_t *m){return (int32_t)m->count;}
int32_t pup_motor_get_speed(pup_motor_t *m){return m->speed;}
pbio_error_t pup_motor_stop(pup_motor_t *m){return pup_motor_brake(m);}
pbio_error_t pup_motor_hold(pup_motor_t *m){return pup_motor_brake(m);}
pbio_error_t pup_motor_set_power(pup_motor_t *m,int v){return pup_motor_set_speed(m,v*10);}
pbio_error_t pup_motor_reset_count(pup_motor_t *m){m->count=0;return 0;}
pup_device_t *pup_color_sensor_get_device(int p){return pup_ultrasonic_sensor_get_device(p);}
pup_device_t *pup_force_sensor_get_device(int p){return pup_ultrasonic_sensor_get_device(p);}
int32_t pup_color_sensor_reflection(pup_device_t *d){(void)d;return 50;}
int32_t pup_color_sensor_ambient(pup_device_t *d){(void)d;return 10;}
float pup_force_sensor_force(pup_device_t *d){(void)d;return 3.5f;}
pbio_error_t hub_display_off(void){return 0;}
pbio_error_t hub_display_char(char c){(void)c;display_count++;return 0;}
pbio_error_t hub_display_number(int8_t n){(void)n;display_count++;return 0;}
pbio_error_t hub_display_pixel(uint8_t y,uint8_t x,uint8_t b){(void)y;(void)x;(void)b;return 0;}
pbio_error_t hub_light_on_color(pbio_color_t c){(void)c;return 0;}
pbio_error_t hub_light_off(void){return 0;}
void hub_speaker_stop(void){}
void hub_speaker_set_volume(uint8_t v){(void)v;}
void hub_speaker_play_tone(uint16_t hz,int32_t ms){(void)hz;(void)ms;}
uint16_t hub_battery_get_voltage(void){return 7400;}
#ifdef ADVANCED_TEST
extern double sbl_vars[32];
extern double sbl_operation(int,double,double);
extern double sbl_math(int,double);
extern double sbl_clamp(double,double,double);
#endif
extern void main_task(intptr_t);
int main(void){
    main_task(0);
    if(!ended){return 2;}
    if(getenv("EXPECT_NO_MOTOR")&&run_count){return 5;}
#ifdef ADVANCED_TEST
    if(getenv("EXPECT_TOTAL")&&sbl_vars[0]!=10){return 6;}
    if(sbl_operation(5,-5,2)!=1 || sbl_math(16,-1.5)!=-1 || sbl_clamp(4,0,2)!=2){return 7;}
#endif
    if(getenv("EXPECT_MOTOR")&&(!run_count||!brake_count)){return 3;}
    if(getenv("STOP_EARLY")&&clock_us>3510000){return 4;}
    if(getenv("EXPECT_TIMEOUT")&&(clock_us<183000000||clock_us>184000000)){return 8;}
    printf("ended=%d runs=%d brakes=%d images=%d time_us=%u\\n",ended,run_count,brake_count,display_count,clock_us);
    return 0;
}
'''
(out/'fake.c').write_text(stub)
compiler=os.environ.get('HOST_CC',r'C:\cygwin64\bin\gcc.exe')
os.environ['PATH']=(str(Path(compiler).parent)+os.pathsep if Path(compiler).is_absolute() else "")+os.environ.get('PATH','')
results=[]
for sample in ['display','motor','distance','myblock','extended','motor_angle','sensors','math_fault','lazy_logic']:
    src=root/'generated'/sample
    objects=[]
    for name in ['app.c','sbl_myblocks.c','sbl_rt_runtime.c']:
        obj=out/(sample+'-'+name+'.o');subprocess.run([compiler,'-std=c11','-Wall','-Wextra','-Werror','-I'+str(headers),'-I'+str(src),'-c',str(src/name),'-o',str(obj)],check=True);objects.append(str(obj))
    exe=out/(sample+'.exe');subprocess.run([compiler,'-std=c11','-Wall','-Wextra','-Werror','-I'+str(headers),str(out/'fake.c'),*(['-DADVANCED_TEST'] if sample in ['extended','motor_angle','sensors','math_fault','lazy_logic'] else []),*objects,'-lm','-o',str(exe)],check=True)
    env={**os.environ,**({'EXPECT_MOTOR':'1'} if sample in ['motor','motor_angle','lazy_logic'] else {'EXPECT_NO_MOTOR':'1'} if sample=='math_fault' else {'EXPECT_TOTAL':'1'} if sample=='extended' else {})}
    r=subprocess.run([str(exe)],capture_output=True,text=True,check=True,timeout=10,env=env)
    results.append({'sample':sample,'result':r.stdout.strip()})
    if sample in ['motor','motor_angle']:
        r=subprocess.run([str(exe)],capture_output=True,text=True,check=True,timeout=10,env={**env,'STOP_EARLY':'1'})
        results.append({'sample':sample+'-stop-during-wait','result':r.stdout.strip()})
    if sample=='motor_angle':
        r=subprocess.run([str(exe)],capture_output=True,text=True,check=True,timeout=10,env={**env,'STALL':'1','EXPECT_TIMEOUT':'1'})
        results.append({'sample':'motor_angle-stall-timeout','result':r.stdout.strip()})
(out/'results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
