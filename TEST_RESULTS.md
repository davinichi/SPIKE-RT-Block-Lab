# Validation status — 0.1.1

- Node.js 24 tests: 8 passed (generator, rejection cases, recursion/expansion limits, single state ownership, local server traversal).
- Generated C host integration: app.c, sbl_myblocks.c, sbl_rt_runtime.c compiled as separate objects with GCC 11 and -Wall -Wextra -Werror, then linked for display, motor, distance and My Block samples.
- Fake-device execution: all four samples reached task exit. A motor interrupted during its wait reached brake/cleanup at the simulated stop time. This is a fake-device test, not a device driver or real-time guarantee.
- Windows Electron screen: editor started and exited with code 0 from a normal temporary folder; default sample had 5 Blockly blocks and generated all 11 source/configuration files. Screenshot reviewed. Workspace-folder execution encountered Windows AppContainer ACL errors; no ACL or security settings were changed. Normal-folder execution used the Electron sandbox enabled and GPU acceleration disabled.
- Full SPIKE-RT toolchain: successful GitHub Actions run 42134555980 built all four samples (display, motor, distance, myblock) against official SPIKE-RT v0.2.0, commit 62a2824e4b513aaf65fde4670ccbc5620e1733a6, with official ARM GCC 10.3-2021.10. The upstream SDK was not patched. Downloaded sample binaries matched SHA256SUMS.txt and passed the upload screen's size/vector checks. This is a build verification, not a hardware test.
- Hardware: no Hub flashing, startup, stop latency, sensor calibration, power-cycle, unplugged execution or standard OS restoration performed for this version.
- GitHub publication: https://davinichi.github.io/SPIKE-RT-Block-Lab/ deployed successfully. Top page, editor, firmware guide, DFU page, generator and Blockly asset returned HTTP 200 and matched the repository files. Windows ZIP creation and host integration tests also succeeded in Actions run 42134555980. Workflow definitions alone are not evidence of a successful build.

Do not infer this app's hardware verification from older EBL-RT / SBL / toolkit testing records.

0.1.1 adds a regression test rejecting reserved F for motors, sensors and My Blocks, while accepting E. The SDK stays unmodified. 0.1.0 accidentally exposed F; use the corrected version.
