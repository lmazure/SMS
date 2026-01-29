---
trigger: always_on
---

We are in WSL2.

- to build: `wsl --cd /home/laurent/code/GitHub/lmazure/SMS npm run build`
- to test all tests: `wsl --cd /home/laurent/code/GitHub/lmazure/SMS npm run test`
- to test a test file: `wsl --cd /home/laurent/code/GitHub/lmazure/SMS npm run test src/tests/<test file>`
- to build the documentation: `wsl --cd /home/laurent/code/GitHub/lmazure/SMS npm run generate-docs`