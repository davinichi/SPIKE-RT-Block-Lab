const {app,BrowserWindow,ipcMain,dialog,shell}=require('electron');
const path=require('node:path');
let server,url,window,busy=false;
app.disableHardwareAcceleration();
app.setName('SBL-RT Windows');
app.setPath('userData',path.join(__dirname,'user-data'));
app.whenReady().then(async()=>{
 const module=await import('./server.mjs');({server,url}=await module.startServer());
 window=new BrowserWindow({show:!process.env.SBL_SMOKE,width:1440,height:960,minWidth:1050,minHeight:740,title:'SBL-RT Windows 0.1.1',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const guard=e=>{if(e.sender!==window.webContents||e.senderFrame!==e.sender.mainFrame||new URL(e.senderFrame.url).origin!==url)throw Error('Invalid sender');};
 window.webContents.setWindowOpenHandler(({url:target})=>{if(target.startsWith(url+'/'))shell.openExternal(target);return {action:'deny'};});
 window.webContents.on('will-navigate',(e,target)=>{if(new URL(target).origin!==url)e.preventDefault();});
 ipcMain.handle('sbl:transfer',e=>{guard(e);return shell.openExternal(url+'/transfer.html');});
 ipcMain.handle('sbl:build',async(e,program)=>{guard(e);if(busy)throw Error('ビルド中です。');if(JSON.stringify(program).length>200000)throw Error('作品が大きすぎます。');const selection=await dialog.showOpenDialog(window,{title:'準備済みSPIKE-RT v0.2.0フォルダーを選択',properties:['openDirectory']});if(selection.canceled)return {cancelled:true};busy=true;try{const {build}=await import('./build-service.mjs');return await build(program,selection.filePaths[0],path.join(app.getPath('userData'),'builds'));}catch(e){return {ok:false,message:e.message};}finally{busy=false;}});
 await window.loadURL(url);
 window.webContents.on('will-prevent-unload',event=>{if(dialog.showMessageBoxSync(window,{type:'question',buttons:['編集に戻る','閉じる'],defaultId:0,cancelId:0,message:'編集中の作品を保存しましたか？'})===1)event.preventDefault();});
 if(process.env.SBL_SMOKE){await new Promise(resolve=>setTimeout(resolve,2000));const state=await window.webContents.executeJavaScript('({title:document.title,blocks:window.sblTest.workspace.getAllBlocks(false).length,files:Object.keys(window.sblTest.generate()||{}),status:document.getElementById("status").textContent})');require('node:fs').writeFileSync(path.join(__dirname,'smoke-result.json'),JSON.stringify(state,null,2));const img=await window.webContents.capturePage();require('node:fs').writeFileSync(path.join(__dirname,'smoke.png'),img.toPNG());window.destroy();app.quit();}
}).catch(e=>{require('node:fs').appendFileSync(path.join(__dirname,'startup-error.txt'),String(e.stack||e)+'\n');if(!process.env.SBL_SMOKE)dialog.showErrorBox('SBL-RT 起動エラー',e.message);app.quit();});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>server?.close());
