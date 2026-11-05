const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('SBLDesktop',{build:program=>ipcRenderer.invoke('sbl:build',program),openTransfer:()=>ipcRenderer.invoke('sbl:transfer')});
