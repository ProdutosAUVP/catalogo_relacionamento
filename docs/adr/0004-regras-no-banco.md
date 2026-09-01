# 0004 — Regras críticas também no banco

## Contexto

Três regras não podem ser violadas em hipótese alguma:

- um item é do catálogo **ou** é específico com link, nunca ambos nem nenhum;
- CPF é gravado só com dígitos, porque é a chave de deduplicação;
- "deu problema", "devolvido" e "cancelado" exigem motivo no histórico.

Validar só na aplicação deixa três portas abertas: script de manutenção,
importação de dados e correção manual em produção.

## Decisão

As regras existem em duas camadas. Zod na aplicação, para que a pessoa receba
uma mensagem legível. CHECK constraint no banco, para que nada grave dado
inválido — venha de onde vier.

## Consequências

Um dado corrompido por script é impossível, não improvável.

Em troca, há duplicação: mudar a regra exige mexer no validador e criar
migration. É duplicação consciente, e as camadas têm papéis diferentes — uma
conversa com a pessoa, a outra protege o dado.

Um efeito colateral útil: o seed roda contra as mesmas constraints, então erro
de modelagem aparece em desenvolvimento.
