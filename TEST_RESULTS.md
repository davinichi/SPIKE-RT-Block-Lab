# Validation status — SBL-RT 0.2.0

## Completed locally

- Node.js 24: 17 tests pass. Includes every visible palette block's translation and Blockly save/load round trip, numeric variable identity, procedure arguments/return values, lazy Boolean evaluation, invalid ports, unsupported instructions, recursion and old project loading.
- Palette: 68 distinct visible block types plus the variable category's dynamic blocks. The implementation also recognizes selected standard Blockly equivalents used by serialized projects.
- GCC 11 host integration: all three C translation units compiled separately with -Wall -Wextra -Werror and linked for ten samples: display, motor, distance, myblock, extended, motor_angle, sensors, math_fault lazy_logic and global_end.
- Thirteen fake-device executions pass: the ten samples, stop during timed and angle motion, and a stalled-angle 180-second timeout. Checks include result=10 from variables/procedure/loop computation, Python-style signed modulo and rounding, zero-division stopping before the next motor command, and global program exit from inside a My Block.
- Windows Electron: 0.2.0 starts, draws the expanded categories, generates all eleven source/configuration files and exits with code 0 from a normal temporary directory. Screenshot visually reviewed. GPU acceleration is disabled; the Electron sandbox remains enabled. No Windows ACL/security settings changed.

## Official target build and distribution

The workflow compiles seven hardware samples with official SPIKE-RT v0.2.0 (62a2824e4b513aaf65fde4670ccbc5620e1733a6) and the official ARM GCC 10.3-2021.10 toolchain, without patching the SDK. Check the completed v0.2.0 workflow run for the actual target-build result and downloadable artifacts:

https://github.com/davinichi/SPIKE-RT-Block-Lab/actions

Previous release 0.1.1 passed the official build. That is not proof that new 0.2.0 code passes; only its own workflow result is evidence. Release workflows also create the unsigned Windows ZIP and sample firmware ZIP. Workflow definitions alone are not proof of success.

## Not performed

No Hub flashing, physical startup, stop latency, sensor calibration, encoder accuracy, power-cycle, unplugged operation, Windows DFU driver installation or standard OS restoration has been tested for 0.2.0. The host device layer is a simulation. target.json keeps hardwareTested:false.

The linked SBL preview returned HTTP 403 in the research environment. Comparison used the existing local SBL 0.7.0 source, not an observed live preview screen. See web/comparison.html for feature differences and unsupported blocks.
