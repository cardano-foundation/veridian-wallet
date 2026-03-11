# Virtual Wallet helpers — Test runner API

This API presents a set of test helpers used to interact with KERIA instance. Use these helpers to create Virtual Wallets and exercise multisig flows. They provide high-level operations for identifier and group workflows.

Behavior overview:
- Virtual Wallets boot and connect to KERIA.
- Virtual Wallets can participate in multisig group creation and joining flows.
- Helpers include utilities to wait for operation completion and to poll for incoming exchange notifications when needed.

Notes:
- KERIA default ports: boot 3903, connect 3901. Override host with the `KERIA_IP` environment variable.
- For Android emulator, device-side agent URLs commonly use `10.0.2.2` so the emulator can reach the host.

The contract and concrete implementations for these helpers live alongside the test helpers in this directory.
