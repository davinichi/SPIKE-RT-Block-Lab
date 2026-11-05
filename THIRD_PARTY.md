# Third-party components

- Blockly 13.4.0: Apache-2.0, web/vendor/BLOCKLY-LICENSE.txt. https://github.com/google/blockly
- Electron 45.2.1: MIT and Chromium components; portable distribution includes LICENSE and LICENSES.chromium.html. https://github.com/electron/electron
- SPIKE-RT v0.2.0 configuration template: MIT, RT-NOTICE.txt. Copyright Embedded and Real-Time Systems Laboratory, Nagoya University. https://github.com/spike-rt/spike-rt
- WebUSB DFU / DfuSe and Web Serial modules copied from davinichi's existing spike-rt-web-toolkit checkout. Its LICENSE is web/DFU-LICENSE.txt; original module comments are retained. No hardware success for this new app is implied by prior toolkit results.
- Basic Blockly definitions, model, ZIP writer and legacy generator reused from the user's existing SPIKE Block Lab 0.7.0 sources. Their original attribution is retained. These project-owned sources had no general public reuse license in the inspected checkout; this release does not assign a new license to them.

SPIKE-RT, its kernel and device drivers are not bundled with the editor executable. Compiled sample firmware is accompanied by the upstream LICENSE / ReadMe_OSS.txt and source reference in firmware/NOTICE.txt. See upstream for all submodule license terms.
