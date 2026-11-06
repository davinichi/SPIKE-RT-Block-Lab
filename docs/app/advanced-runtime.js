export const RUNTIME_DECLARATIONS=`
extern double sbl_vars[32];
extern bool sbl_end_requested;
void sbl_end_program(void);
double sbl_number(double v);
double sbl_operation(int op,double a,double b);
double sbl_math(int fn,double v);
double sbl_clamp(double v,double low,double high);
double sbl_sensor(int kind,int port);
void sbl_timer_reset(void);
bool sbl_motor_command(unsigned mask,double speed,double amount,int unit);
bool sbl_motor_stop(unsigned mask,int mode);
bool sbl_motor_power(int port,double power);
bool sbl_encoder_reset(int port);
bool sbl_pixel(double x,double y,double brightness);
bool sbl_display_number(double number);
bool sbl_display_text(const char *text);
bool sbl_light(int color);
bool sbl_tone(double hz,double ms,double volume);
void sbl_sound_stop(void);
`;
export const ADVANCED_RUNTIME=`
#include <math.h>
#include <spike/hub/light.h>
#include <spike/hub/speaker.h>
#include <spike/hub/battery.h>
#include <spike/pup/colorsensor.h>
#include <spike/pup/forcesensor.h>
double sbl_vars[32];
bool sbl_end_requested=false;
void sbl_end_program(void) {sbl_end_requested=true;failed=true;stop_all();}
static pup_motor_t *sbl_motors[5];
static pup_device_t *sbl_sensors[5];
static SYSTIM sbl_timer_start;
static double sbl_fault(void) { failed=true; stop_all(); syslog(LOG_ERROR,"SBL-RT: invalid value, device or arithmetic"); return 0; }
double sbl_number(double v) { return isfinite(v)?v:sbl_fault(); }
static bool sbl_range(double v,double lo,double hi) { if (!isfinite(v)||v<lo||v>hi) { (void)sbl_fault(); return false; } return true; }
double sbl_operation(int op,double a,double b) {
 if(!isfinite(a)||!isfinite(b))return sbl_fault();
 switch(op) {
 case 0:return sbl_number(a+b); case 1:return sbl_number(a-b); case 2:return sbl_number(a*b);
 case 3:return b==0?sbl_fault():sbl_number(a/b); case 4:return sbl_number(pow(a,b));
 case 5: { if(b==0)return sbl_fault(); double r=fmod(a,b); if(r!=0&&((r<0)!=(b<0)))r+=b; return sbl_number(r); }
 case 6:return fmin(a,b);case 7:return fmax(a,b);case 8:return a<b;case 9:return a<=b;case 10:return a>b;case 11:return a>=b;case 12:return a==b;case 13:return a!=b;
 default:return sbl_fault(); }
}
double sbl_math(int fn,double v) {
 const double rad=0.017453292519943295;if(!isfinite(v))return sbl_fault();
 switch(fn) {
 case 0:return fabs(v);case 1:return floor(v);case 2:return ceil(v);case 3:return sbl_number(sqrt(v));
 case 4:return sbl_number(sin(v*rad));case 5:return sbl_number(cos(v*rad));case 6:return sbl_number(tan(v*rad));
 case 7:return sbl_number(asin(v)/rad);case 8:return sbl_number(acos(v)/rad);case 9:return sbl_number(atan(v)/rad);
 case 10:return sbl_number(log(v));case 11:return sbl_number(log10(v));case 12:return sbl_number(exp(v));case 13:return sbl_number(pow(10,v));
 case 14:return -v;case 15:return !v;case 16:return floor(v+0.5);default:return sbl_fault(); }
}
double sbl_clamp(double v,double lo,double hi) {if(!isfinite(v)||!isfinite(lo)||!isfinite(hi)||lo>hi)return sbl_fault();return fmin(hi,fmax(lo,v));}
void sbl_timer_reset(void) {if(get_tim(&sbl_timer_start)!=E_OK)(void)sbl_fault();}
double sbl_sensor(int kind,int p) {
 if(!keep_running())return 0;
 if(kind==10) { SYSTIM now;if(get_tim(&now)!=E_OK)return sbl_fault();return (double)(now-sbl_timer_start)/1000000.0; }
 if(kind==11)return hub_battery_get_voltage();
 if(kind==8||kind==9) {hub_button_t b=0;if(!check_error(hub_button_is_pressed(&b)))return 0;return (b&(kind==8?HUB_BUTTON_LEFT:HUB_BUTTON_RIGHT))!=0;}
 if(p<0||p>=5)return sbl_fault();
 if(kind==0||kind==1){if(!sbl_motors[p])return sbl_fault();return kind==0?pup_motor_get_count(sbl_motors[p]):pup_motor_get_speed(sbl_motors[p]);}
 if(!sbl_sensors[p])return sbl_fault();
 if(kind==2||kind==3){int32_t mm=pup_ultrasonic_sensor_distance(sbl_sensors[p]);if(kind==3)return mm>=0;return mm<0?sbl_fault():mm/10.0;}
 if(kind==4||kind==5){int32_t n=kind==4?pup_color_sensor_reflection(sbl_sensors[p]):pup_color_sensor_ambient(sbl_sensors[p]);return n<0?sbl_fault():sbl_number(n);}
 if(kind==6||kind==7){double n=pup_force_sensor_force(sbl_sensors[p]);if(n<0||!isfinite(n))return sbl_fault();return kind==7?n>=3.0:n;}
 return sbl_fault();
}
bool sbl_motor_stop(unsigned mask,int mode) {
 if(mask==0)mask=31;
 for(int p=0;p<5;p++)if((mask&(1U<<p))&&sbl_motors[p]){pbio_error_t err=mode==0?pup_motor_brake(sbl_motors[p]):mode==1?pup_motor_stop(sbl_motors[p]):pup_motor_hold(sbl_motors[p]);if(!check_error(err))return false;}
 return keep_running();
}
bool sbl_motor_command(unsigned mask,double speed,double amount,int unit) {
 if(!keep_running()||!sbl_range(speed,-100,100)||mask==0||mask>31)return false;
 if(unit!=0&&(!sbl_range(amount,0.001,unit==1?3600:360000)||speed==0)){(void)sbl_fault();return false;}
 int32_t start[5]={0};int velocity=(int)lround(speed*10.5);
 for(int p=0;p<5;p++)if(mask&(1U<<p)){if(!sbl_motors[p]){(void)sbl_fault();return false;}start[p]=pup_motor_get_count(sbl_motors[p]);}
 for(int p=0;p<5;p++)if(mask&(1U<<p))if(!check_error(pup_motor_set_speed(sbl_motors[p],velocity)))return false;
 if(unit==0)return keep_running();
 if(unit==1){if(!wait_ms((uint32_t)llround(amount*1000)))return false;return sbl_motor_stop(mask,0);}
 unsigned pending=mask;double target=amount*(unit==3?360.0:1.0);unsigned elapsed=0;
 while(pending){if(!keep_running())return false;for(int p=0;p<5;p++)if(pending&(1U<<p)){double traveled=fabs((double)pup_motor_get_count(sbl_motors[p])-(double)start[p]);if(traveled>=target){if(!check_error(pup_motor_brake(sbl_motors[p])))return false;pending&=~(1U<<p);}}
 if(!pending){break;}
 if(elapsed>=180000){(void)sbl_fault();return false;}if(!wait_ms(10))return false;elapsed+=10;}
 return keep_running();
}
bool sbl_motor_power(int p,double power) {if(!keep_running()||!sbl_range(power,-100,100)||p<0||p>=5||!sbl_motors[p])return false;return check_error(pup_motor_set_power(sbl_motors[p],(int)power));}
bool sbl_encoder_reset(int p) {if(!keep_running()||p<0||p>=5||!sbl_motors[p])return false;return check_error(pup_motor_reset_count(sbl_motors[p]));}
bool sbl_pixel(double x,double y,double b) {if(!keep_running()||!sbl_range(x,0,4)||!sbl_range(y,0,4)||!sbl_range(b,0,100))return false;return check_error(hub_display_pixel((uint8_t)y,(uint8_t)x,(uint8_t)b));}
bool sbl_display_number(double n) {if(!keep_running()||!sbl_range(n,-99,99))return false;return check_error(hub_display_number((int8_t)n));}
bool sbl_display_text(const char *text) {for(unsigned i=0;text[i];i++){if(!keep_running()||!check_error(hub_display_char(text[i]))||!wait_ms(300)||!check_error(hub_display_off())||!wait_ms(50))return false;}return keep_running();}
bool sbl_light(int color) {static const pbio_color_t colors[]={PBIO_COLOR_RED,PBIO_COLOR_YELLOW,PBIO_COLOR_GREEN,PBIO_COLOR_BLUE,PBIO_COLOR_WHITE,PBIO_COLOR_MAGENTA};if(!keep_running()||color<0||color>5)return false;return check_error(hub_light_on_color(colors[color]));}
bool sbl_tone(double hz,double ms,double volume) {if(!keep_running()||!sbl_range(hz,32,20000)||!sbl_range(ms,0,60000)||!sbl_range(volume,0,100))return false;hub_speaker_set_volume((uint8_t)volume);hub_speaker_play_tone((uint16_t)hz,-1);bool ok=wait_ms((uint32_t)ms);hub_speaker_stop();return ok;}
void sbl_sound_stop(void) {hub_speaker_stop();}
`;
