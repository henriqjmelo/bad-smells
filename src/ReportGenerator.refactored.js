// -------------------------------------------------------------------
// Refatoração: Replace Conditional with Polymorphism e Extract Method
// -------------------------------------------------------------------

// 1. Classes de Estratégia de Formatação (ReportFormatStrategy)
class CsvReportFormat {
  getReportHeader(user) {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  getReportFooter(total) {
    return `\nTotal,,\n${total},,\n`;
  }

  formatItem(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }
}

class HtmlReportFormat {
  getReportHeader(user) {
    let header = '<html><body>\n';
    header += '<h1>Relatório</h1>\n';
    header += `<h2>Usuário: ${user.name}</h2>\n`;
    header += '<table>\n';
    header += '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
    return header;
  }

  getReportFooter(total) {
    let footer = '</table>\n';
    footer += `<h3>Total: ${total}</h3>\n`;
    footer += '</body></html>\n';
    return footer;
  }

  formatItem(item, user) {
    const style = item.priority ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }
}

// 2. Classes de Estratégia de Usuário (UserRoleStrategy)
class AdminUserStrategy {
  shouldInclude(item) {
    // Admins veem todos os itens
    return true;
  }

  processItem(item) {
    // Lógica bônus para admins: priorização
    if (item.value > 1000) {
      item.priority = true;
    }
    return item;
  }
}

class StandardUserStrategy {
  shouldInclude(item) {
    // Users comuns só veem itens de valor baixo
    return item.value <= 500;
  }

  processItem(item) {
    // Não há lógica bônus para users comuns
    return item;
  }
}

// 3. Factory para obter a estratégia de formato
const formatFactory = {
  CSV: new CsvReportFormat(),
  HTML: new HtmlReportFormat(),
  getStrategy(reportType) {
    if (!this[reportType]) {
      throw new Error(`Tipo de relatório desconhecido: ${reportType}`);
    }
    return this[reportType];
  },
};

// 4. Factory para obter a estratégia de usuário
const userFactory = {
  ADMIN: new AdminUserStrategy(),
  USER: new StandardUserStrategy(),
  getStrategy(userRole) {
    if (!this[userRole]) {
      throw new Error(`Papel de usuário desconhecido: ${userRole}`);
    }
    return this[userRole];
  },
};

// 5. Classe ReportGenerator Refatorada
export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

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
}
