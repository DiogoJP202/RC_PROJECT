# PROMPT G3 — Rinkaku vivo, controlado por timeline

Leia `AGENTS.md`, `docs/04_SIMULATION_SPEC.md`, `docs/07_ASSET_PIPELINE.md` e G2. **Execute somente G3.** Construa o sistema de manifestação de kagune tipo Rinkaku com fases `rest activation release growth fixation active retract` e `sampleAt(t)` determinístico em [0,1].

Integre um rig GLB se houver asset licenciado e configurado. Se faltar, faça um **proxy procedural honesto** com root na região lombar, controle spline/bones, forma que nasce da raiz e cresce; rotule no HUD `PROTÓTIPO DE MORFOLOGIA`. Nenhuma animação que seja apenas CSS transform da imagem. Separe partículas RC, shader de revelação, deformação/apêndices e parâmetros de rigidez visual; desative efeitos sem WebGL avançado.

Controles reais: play/pause/reverse/scrub/reset/speed; teclado e reduced motion; interrupção de tween de câmera. Teste 10 ciclos, valores extremos e sequência t=.1→.9→.3→.9 para garantir determinismo. Faça screenshots `rest`, `growth`, `active` no mesmo ângulo. Atualize log, asset ticket e benchmarks curtos. Pare em G3.
