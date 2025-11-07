# Relatório de Detecção de Bad Smells e Refatoração Segura

**Disciplina:** Engenharia de Software
**Trabalho:** Detecção de Bad Smells e Refatoração Segura
**Aluno:** Henrique Jardim
**Data:** 5 de Novembro de 2025

## 1. Análise de Smells

O código original na classe `ReportGenerator` foi deliberadamente escrito com diversos Bad Smells, tornando-o difícil de entender, modificar e manter. A análise manual e a ferramenta de análise estática convergiram para os seguintes problemas:

### Bad Smell 1: Método Longo (Long Method)

O método `generateReport` possui mais de 50 linhas de código e concentra múltiplas responsabilidades:
1.  Inicialização de variáveis (`report`, `total`).
2.  Geração do cabeçalho do relatório (lógica de formatação CSV e HTML).
3.  Lógica de negócio de filtragem e priorização por papel do usuário (`ADMIN` e `USER`).
4.  Lógica de formatação da linha do item (lógica de formatação CSV e HTML).
5.  Acúmulo do total.
6.  Geração do rodapé do relatório (lógica de formatação CSV e HTML).

Essa concentração de responsabilidades viola o **Princípio da Responsabilidade Única (SRP)**, tornando qualquer alteração arriscada e demorada.

### Bad Smell 2: Condicionais Complexas (Complex Conditional)

O método está sobrecarregado com estruturas `if/else if` aninhadas para lidar com o tipo de relatório (`reportType`) e o papel do usuário (`user.role`). A lógica de negócio (filtragem e priorização) está misturada com a lógica de formatação (CSV/HTML), resultando em um fluxo de controle altamente complexo.

### Bad Smell 3: Código Duplicado (Duplicated Code)

A lógica de formatação da linha do item e o acúmulo do total (`total += item.value;`) são repetidos em quatro locais diferentes dentro do *loop* principal, variando apenas ligeiramente para acomodar o tipo de relatório (CSV ou HTML). Essa duplicação dificulta a manutenção, pois qualquer correção ou melhoria na formatação deve ser aplicada em múltiplos pontos.

## 2. Relatório da Ferramenta

A ferramenta de análise estática **ESLint** com o plugin **eslint-plugin-sonarjs** confirmou a gravidade dos problemas. O plugin SonarJS é crucial por introduzir métricas que a análise manual pode negligenciar, como a **Complexidade Cognitiva**.

A execução do comando `npx eslint src/` no código original resultou no seguinte relatório:

\`\`\`
/home/ubuntu/bad-smells-refactoring/src/ReportGenerator.js
  11:3   error  Refactor this function to reduce its Cognitive Complexity from 27 to the 5 allowed  sonarjs/cognitive-complexity
  43:14  error  Merge this if statement with the nested one                                         sonarjs/no-collapsible-if

✖ 2 problems (2 errors, 0 warnings)
\`\`\`

O erro mais crítico, **`sonarjs/cognitive-complexity`**, reportou um valor de **27** para o método `generateReport`, excedendo em muito o limite de **5** configurado. Isso validou a percepção manual de que o método era excessivamente complexo e difícil de entender.

## 3. Processo de Refatoração

O Bad Smell mais crítico corrigido foi a **Condicional Complexa / Método Longo** (Complexidade Cognitiva de 27). A refatoração buscou separar as responsabilidades de **Lógica de Negócio (Quem vê o quê)** e **Formatação (Como o relatório é gerado)**.

**Técnica Aplicada:** **Replace Conditional with Polymorphism** (Substituir Condicional por Polimorfismo) e **Extract Method** (Extrair Método).

A refatoração introduziu:
1.  **Estratégias de Formatação (`CsvReportFormat`, `HtmlReportFormat`):** Classes responsáveis por saber como formatar o cabeçalho, rodapé e cada item.
2.  **Estratégias de Usuário (`AdminUserStrategy`, `StandardUserStrategy`):** Classes responsáveis por implementar a lógica de negócio (filtragem e priorização) para cada papel.

O método `generateReport` foi drasticamente simplificado, delegando a lógica complexa para as classes de estratégia.

### Antes da Refatoração (Trecho Crítico)

O trecho abaixo mostra a mistura de lógica de negócio e formatação:

\`\`\`javascript
// src/ReportGenerator.js (Original)
// ...
    for (const item of items) {
      if (user.role === 'ADMIN') {
        // Admins veem todos os itens
        if (item.value > 1000) {
          // Lógica bônus para admins
          item.priority = true;
        }
        if (reportType === 'CSV') {
          report += `${item.id},${item.name},${item.value},${user.name}\n`;
          total += item.value;
        } else if (reportType === 'HTML') {
          const style = item.priority ? ' style="font-weight:bold;"' : '';
          report += `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
          total += item.value;
        }
      } else if (user.role === 'USER') {
        // Users comuns só veem itens de valor baixo
        if (item.value <= 500) {
          if (reportType === 'CSV') {
            report += `${item.id},${item.name},${item.value},${user.name}\n`;
            total += item.value;
          } else if (reportType === 'HTML') {
            report += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
            total += item.value;
          }
        }
      }
    }
// ...
\`\`\`

### Depois da Refatoração (Método Principal Simplificado)

O método `generateReport` refatorado se tornou um método de coordenação, com baixa complexidade cognitiva:

\`\`\`javascript
// src/ReportGenerator.refactored.js (Refatorado)
// ...
  generateReport(reportType, user, items) {
    const formatStrategy = formatFactory.getStrategy(reportType);
    const userStrategy = userFactory.getStrategy(user.role);
    let report = '';
    let total = 0;

    // Seção do Cabeçalho
    report += formatStrategy.getReportHeader(user);

    // Seção do Corpo (Lógica de Negócio e Formatação Separadas)
    for (const item of items) {
      if (userStrategy.shouldInclude(item)) {
        const processedItem = userStrategy.processItem(item);
        report += formatStrategy.formatItem(processedItem, user);
        total += processedItem.value;
      }
    }

    // Seção do Rodapé
    report += formatStrategy.getReportFooter(total);

    return report.trim();
  }
// ...
\`\`\`

## 4. Conclusão

A refatoração demonstrou que a redução de Bad Smells, como o Método Longo e as Condicionais Complexas, melhora significativamente a **legibilidade** e a **manutenibilidade** do código. A aplicação do padrão **Strategy** (Substituir Condicional por Polimorfismo) permitiu isolar a lógica de negócio e a lógica de formatação, tornando o código mais flexível a futuras alterações.

O uso de uma **suíte de testes existente como rede de segurança** foi fundamental. A garantia de que todos os testes continuaram passando após a refatoração provou que as melhorias de design não introduziram regressões funcionais, validando o processo como uma **Refatoração Segura**.
