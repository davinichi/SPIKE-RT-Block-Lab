# Validation status — SBL-RT 0.3.1

## Completed locally

- Retrieved the specified public SBL Site's saved version 23 source commit 9c81c6fab69737319230440b38a215ba2ee7a3aa via the Sites source repository. The seven block-related files match the earlier local SBL 0.7.0 byte for byte. The live page still returned 403, so no live-screen observation is claimed. The user confirmed the correct category count is 15.
- Node.js 24: 20 tests pass. Automatic equality covers all 15 groups, names/order, 119 static palette entries, and 141 block-definition signatures: visible Japanese fields, menu options, input names/types, colours and connection shape. Random variable IDs are normalized. The fixture was generated from the separately retrieved source. Hash checks ensure the vendored files remain unmodified. Dynamic categories reuse the unchanged SBL callbacks.
- Supported palette entries generate C; all unsupported palette entries load/save/reload and fail generation explicitly. Unsupported/F values remain saved without port substitution. SBL-format numeric variable identities, named arguments and procedure returns are tested, along with legacy SBL-RT loading. No claim is made that .spikelab/.ev3lab files are imported directly.
- GCC 11 host integration: all three C translation units separately compile with -Wall -Wextra -Werror and link for ten samples. Thirteen fake-device executions pass, including stop during timed/angle motion, stalled-angle timeout, zero division, lazy Boolean evaluation and global end inside a procedure.
- Windows Electron: 0.3.1 starts with sandbox enabled and GPU acceleration disabled. Fifteen categories open and draw; the SBL My Block dialog creates a canonical return definition, which saves/reloads. A named unsupported recording block and a distance sensor on F remain intact after reload and block C export. Normal projects still generate all eleven source/configuration files. Hidden integration runner exits with code 0. Screenshots reviewed. No ACL or security settings changed.

## Official target build and distribution

The completed 0.3.0 candidate workflow 42144692828 (commit 7fb33256) passed tests, Windows packaging and all seven official target sample builds. It used official SPIKE-RT v0.2.0 (62a2824e4b513aaf65fde4670ccbc5620e1733a6) and official ARM GCC 10.3-2021.10 without SDK patches. The release tag repeats these checks and publishes the Windows and firmware ZIPs.

https://github.com/davinichi/SPIKE-RT-Block-Lab/actions/runs/42144692828

The public Pages deployment 42144692211 succeeded. The landing page, editor, per-category comparison, audit JSON and canonical block source all returned HTTP 200 and matched the local published files byte for byte. This verifies content publication, separately from Hub operation.

## Not performed and remaining differences

No Hub flashing, physical startup, stop latency, sensor calibration, encoder accuracy, unplugged operation, DFU driver installation or standard OS restoration was tested. The host device layer is a simulation; target.json retains hardwareTested:false.

SBL block presentation now uses the same source and the canonical 15 groups; RT warning icons and capability errors are deliberate additions. Unsupported events, vehicle motion, ramp/sync, orientation/colour ID, PID, CSV, text variables/lists, random, abacus and animated lamp blocks remain editable/preservable but cannot generate C. The form preserves SBL's 8-argument/8-output data model, while RT export accepts only 2 numeric arguments/1 output. All other limits and numeric/text display differences are recorded in web/comparison.html and web/sbl-ui-audit.json. Four-environment execution/project compatibility is not yet implemented.
