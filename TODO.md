# Terminal Emulator Enhancement

## Plan
Move command execution logic from Terminal component to store's runCommand for centralization.

## Steps
- [x] Update runCommand in editorStore.js to handle commands and return output
- [x] Update Terminal.jsx to use runCommand instead of executeCommand
- [ ] Test command execution and cwd updates
