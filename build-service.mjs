import {spawn} from 'node:child_process';
import {cp,mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {generateProject} from './web/generator.js';
export function run(command,args,{cwd,timeout=600000}={}){return new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});let log='';const timer=setTimeout(()=>{child.kill();reject(Error('処理が時間内に完了しませんでした。Dockerコンテナの状態を確認してください。'));},timeout);const collect=d=>log=(log+d.toString()).slice(-32000);child.stdout.on('data',collect);child.stderr.on('data',collect);child.on('error',e=>{clearTimeout(timer);reject(Error(e.code==='ENOENT'?`${command} が見つかりません。ガイドの準備を確認してください。`:e.message));});child.on('close',code=>{clearTimeout(timer);if(code===0)resolve(log);else reject(Error(`${command} が失敗しました (${code})\n${log}`));});});}
export async function build(program,sdkRoot,outputRoot){
 const cdl=await readFile(new URL('./web/rt-template.cdl',import.meta.url),'utf8');const files=generateProject(program,cdl);
 const tag=(await run('git',['-C',sdkRoot,'describe','--tags','--exact-match'])).trim();if(tag!=='v0.2.0')throw Error('SPIKE-RT v0.2.0のSDKを選んでください。');
 for(const relative of ['asp3/configure.rb','external/libpybricks/lib/pbio/include/pbio/port.h','external/libpybricks/lib/pbio/include/pbio/error.h'])await stat(path.join(sdkRoot,relative));
 await run('docker',['version','--format','{{.Server.Version}}'],{timeout:30000});
 const image='ghcr.io/spike-rt/spike-rt:rich';const imageId=(await run('docker',['image','inspect','--format','{{.Id}}',image],{timeout:30000})).trim();
 const job=path.join(outputRoot,'build-'+randomBytes(6).toString('hex'));const staging=path.join(job,'sdk');await mkdir(job,{recursive:true});
 await cp(sdkRoot,staging,{recursive:true,filter:src=>!['.git','build','user_apps'].includes(path.basename(src))});
 const appDir=path.join(staging,'user_apps','app');await mkdir(appDir,{recursive:true});for(const [name,text]of Object.entries(files))await writeFile(path.join(appDir,name),text);
 const command='set -eu; mkdir -p build/obj-primehub_kernel build/obj-primehub_app; cd build/obj-primehub_kernel; ../../asp3/configure.rb -T primehub_gcc -f -m ../../common/kernel.mk; make -j2 libkernel.a; cd ../obj-primehub_app; ../../asp3/configure.rb -T primehub_gcc -L ../obj-primehub_kernel -a ../../user_apps/app -A app -m ../../common/app.mk; make -j2';
 let log;try{log=await run('docker',['run','--rm','--network','none','--mount',`type=bind,source=${staging},target=/work`,'-w','/work',imageId,'/bin/bash','-c',command]);}catch(e){await writeFile(path.join(job,'build.log'),e.message);throw e;}
 const bin=await readFile(path.join(staging,'build','obj-primehub_app','asp.bin'));if(bin.length<8||bin.length>992*1024)throw Error('生成バイナリーのサイズが不正です。');await writeFile(path.join(job,'asp.bin'),bin);await writeFile(path.join(job,'build.log'),log);await writeFile(path.join(job,'build.json'),JSON.stringify({ref:tag,image:imageId,sha256:createHash('sha256').update(bin).digest('hex'),bytes:bin.length,hardwareTested:false},null,2));
 return {ok:true,message:`ビルド完了\n${path.join(job,'asp.bin')}\nSHA-256 ${createHash('sha256').update(bin).digest('hex')}`,job};
}
