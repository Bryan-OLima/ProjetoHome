# Prova de conceito: Qwen3 no S20 FE

Esta pasta valida o candidato padrão de modelo local do Projeto Home no ambiente-alvo.

## Modelo

- Base: `Qwen/Qwen3-1.7B`.
- Quantização: `Q4_K_M` de Bartowski.
- Arquivo: `Qwen_Qwen3-1.7B-Q4_K_M.gguf`.
- Tamanho: `1.282.439.584` bytes.
- SHA-256: `72c5c3cb38fa32d5256e2fe30d03e7a64c6c79e668ad84057e3bd66e250b24fb`.

O repositório oficial do Qwen fornece GGUF Q8_0. A variante Q4_K_M usada aqui foi quantizada a partir do modelo oficial para reduzir o consumo de RAM no aparelho de 6 GB.

## Preparação no Termux

```bash
pkg install llama-cpp time
mkdir -p ~/ProjetoHome/models
cp ~/storage/downloads/ProjetoHome/models/Qwen_Qwen3-1.7B-Q4_K_M.gguf ~/ProjetoHome/models/
cd ~/ProjetoHome/experiments/qwen-runtime
chmod +x validate.sh
```

## Execução

Feche aplicativos pesados, mantenha a tela ligada e execute:

```bash
./validate.sh
```

Os resultados ficam em `results/<data-hora>/`. Envie os arquivos dessa pasta para análise.

Para validar também a API HTTP usada pelo backend:

```bash
chmod +x validate-api.sh
./validate-api.sh
```

## O que é medido

- integridade SHA-256 do modelo;
- versão e recursos detectados pelo `llama.cpp`;
- memória disponível antes e depois;
- processamento de prompt com 512 tokens;
- geração de 128 tokens com quatro threads;
- pico de memória de uma inferência real;
- resposta curta em português, sem modo de raciocínio;
- temperatura da bateria antes e depois, quando acessível.

## Critério inicial de aprovação

- processo termina sem ser encerrado pelo Android;
- nenhuma falha de alocação ou corrupção do modelo;
- geração sustentada de pelo menos 4 tokens/s;
- pico de RSS abaixo de 2,5 GB com contexto de 4096 tokens;
- resposta coerente em português;
- temperatura final abaixo de 45 °C no ensaio curto.

Esses limites são de triagem. O teste de convivência com o backend e o perfil opcional Qwen3-4B só deve ocorrer após esta etapa.

## Resultado no aparelho

Validação executada no Samsung Galaxy S20 FE `SM-G780G`, em 28 de julho de 2026:

- integridade SHA-256 aprovada;
- processamento de prompt no benchmark: `17,46 tokens/s`;
- geração no benchmark: `11,52 tokens/s`;
- processamento de prompt pela API: `16,18 tokens/s`;
- geração pela API: `9,89 tokens/s`;
- resposta da API: 67 tokens em aproximadamente 10 segundos;
- pico de RSS: `1.769.068 kB`;
- temperatura do ensaio completo: `34,2 °C` para `39,0 °C`;
- temperatura no ensaio da API: estável em `36,5 °C`;
- nenhuma falha de alocação, corrupção, swap do processo ou encerramento pelo Android;
- resposta coerente em português, com duas frases e término normal.

### Decisão

O `Qwen3-1.7B Q4_K_M` está aprovado como modelo local padrão, inicialmente com quatro threads, contexto de 4096 tokens e backend de CPU.

O backend informou ausência de GPU utilizável, mas o desempenho em CPU já atende ao critério. O servidor de produção deverá permanecer restrito ao endereço local e configurar autenticação e CORS antes de qualquer exposição à rede.
