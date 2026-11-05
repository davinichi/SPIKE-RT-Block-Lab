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
typedef struct {int port;} pup_motor_t;
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
(headers/'fake.h').write_text(header)
for name in ['kernel.h','kernel_cfg.h','t_syslog.h','spike/hub/button.h','spike/hub/display.h','spike/pup/motor.h','spike/pup/ultrasonicsensor.h']:
    p=headers/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('#include "fake.h"\n')
stub='''#include "fake.h"
#include <stdio.h>
#include <stdlib.h>
static uint32_t clock_us;static int run_count,brake_count,display_count,ended;static pup_motor_t motor;
int dly_tsk(uint32_t us){clock_us+=us;return E_OK;}
void ext_tsk(void){ended=1;}
void syslog(int level,const char *fmt,...){(void)level;(void)fmt;}
pbio_error_t hub_button_is_pressed(hub_button_t *buttons){*buttons=(clock_us>=3100000&&clock_us<3120000)||(getenv("STOP_EARLY")&&clock_us>=3500000)?1:0;return 0;}
pup_motor_t *pup_motor_get_device(int port){motor.port=port;return &motor;}
pbio_error_t pup_motor_setup(pup_motor_t *m,int direction,bool reset){(void)m;(void)direction;(void)reset;return 0;}
pbio_error_t pup_motor_set_speed(pup_motor_t *m,int speed){(void)m;if(speed)run_count++;return 0;}
pbio_error_t pup_motor_brake(pup_motor_t *m){(void)m;brake_count++;return 0;}
pup_device_t *pup_ultrasonic_sensor_get_device(int port){static pup_device_t dev;dev.port=port;return &dev;}
int32_t pup_ultrasonic_sensor_distance(pup_device_t *dev){(void)dev;return 100;}
pbio_error_t hub_display_image(uint8_t *pixels){(void)pixels;display_count++;return 0;}
extern void main_task(intptr_t);
int main(void){main_task(0);if(!ended)return 2;if(getenv("EXPECT_MOTOR")&&(!run_count||!brake_count))return 3;if(getenv("STOP_EARLY")&&clock_us>3510000)return 4;printf("ended=%d runs=%d brakes=%d images=%d time_us=%u\\n",ended,run_count,brake_count,display_count,clock_us);return 0;}
'''
(out/'fake.c').write_text(stub)
compiler=os.environ.get('HOST_CC',r'C:\cygwin64\bin\gcc.exe')
os.environ['PATH']=(str(Path(compiler).parent)+os.pathsep if Path(compiler).is_absolute() else "")+os.environ.get('PATH','')
results=[]
for sample in ['display','motor','distance','myblock']:
    src=root/'generated'/sample
    objects=[]
    for name in ['app.c','sbl_myblocks.c','sbl_rt_runtime.c']:
        obj=out/(sample+'-'+name+'.o');subprocess.run([compiler,'-std=c11','-Wall','-Wextra','-Werror','-I'+str(headers),'-I'+str(src),'-c',str(src/name),'-o',str(obj)],check=True);objects.append(str(obj))
    exe=out/(sample+'.exe');subprocess.run([compiler,'-std=c11','-Wall','-Wextra','-Werror','-I'+str(headers),str(out/'fake.c'),*objects,'-o',str(exe)],check=True)
    env={**os.environ,**({'EXPECT_MOTOR':'1'} if sample=='motor' else {})}
    r=subprocess.run([str(exe)],capture_output=True,text=True,check=True,timeout=10,env=env)
    results.append({'sample':sample,'result':r.stdout.strip()})
    if sample=='motor':
        r=subprocess.run([str(exe)],capture_output=True,text=True,check=True,timeout=10,env={**env,'STOP_EARLY':'1'})
        results.append({'sample':'motor-stop-during-wait','result':r.stdout.strip()})
(out/'results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
