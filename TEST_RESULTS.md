# Validation status — 0.1.0

- Node.js 24 tests: 7 passed (generator, rejection cases, recursion/expansion limits, single state ownership, local server traversal).
- Generated C host integration: app.c, sbl_myblocks.c, sbl_rt_runtime.c compiled as separate objects with GCC 11 and -Wall -Wextra -Werror, then linked for display, motor, distance and My Block samples.
- Fake-device execution: all four samples reached task exit. A motor interrupted during its wait reached brake/cleanup at the simulated stop time. This is a fake-device test, not a device driver or real-time guarantee.
- Windows Electron screen: editor started and exited with code 0 from a normal temporary folder; default sample had 5 Blockly blocks and generated all 11 source/configuration files. Screenshot reviewed. Workspace-folder execution encountered Windows AppContainer ACL errors; no ACL or security settings were changed. Normal-folder execution used the Electron sandbox enabled and GPU acceleration disabled.
- Full SPIKE-RT toolchain: local machine lacked Docker; WSL status query was denied and the existing local SPIKE-RT clone lacked submodule contents. GitHub Actions provides a full SDK build; use its successful run and artifacts as the source of truth.
- Hardware: no Hub flashing, startup, stop latency, sensor calibration, power-cycle, unplugged execution or standard OS restoration performed for this version.
- GitHub publication: status is reported in the delivery response; workflow definitions alone are not evidence of a successful build.

Do not infer this app's hardware verification from older EBL-RT / SBL / toolkit testing records.
