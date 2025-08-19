# � Gráfico Donut com Total - Visual Personalizado para Power BI

[![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-F2C811?style=flat-square&logo=powerbi)](https://powerbi.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> Um visual personalizado moderno e responsivo para Power BI que cria um gráfico de rosca (donut) com exibição do total no centro, desenvolvido com TypeScript e SVG nativo para máxima performance.

## ✨ Funcionalidades Principais

### � Visualização
- **Gráfico de Rosca Responsivo**: Adapta-se automaticamente a qualquer tamanho de tela
- **Total Centralizado**: Exibe o valor total calculado no centro do gráfico
- **Rótulos de Dados**: Valores e percentuais configuráveis nas fatias (interno/externo)
- **Legenda Inteligente**: Posicionamento configurável (centro-esquerda/centro-direita)
- **Design Clean**: Interface moderna com transições suaves

### � Personalização
- **Cores por Categoria**: Sistema completo de cores personalizáveis para cada categoria
- **Painel de Formatação**: Interface em português com todas as opções funcionais
- **Raio Interno Configurável**: Controle total sobre a espessura da rosca (1-99%)
- **Bordas Opcionais**: Ative/desative bordas nas fatias
- **Tamanhos de Fonte**: Controle independente para total, legenda e rótulos

### � Interatividade Avançada
- **Seleção Inteligente**: Clique nas fatias para filtrar dados
- **Multi-seleção**: Suporte a Ctrl+clique para múltiplas seleções
- **Efeitos de Destaque**: Transparência automática para dados não selecionados
- **Integração Power BI**: Funciona perfeitamente com filtros e slicers

## � Instalação e Uso

### 1. � Instalação no Power BI Desktop

1. Baixe o arquivo `DonutWithTotal7C5B4E2A8F9D1E3C.1.1.0.0.pbiviz` da pasta `dist/`
2. Abra o Power BI Desktop
3. Vá em **Arquivo > Importar > Visual do arquivo**
4. Selecione o arquivo `.pbiviz` baixado
5. O visual aparecerá no painel de visualizações

### 2. � Configuração dos Dados

Configure os campos no painel **Campos**:
- **Categoria**: Campo de texto para as categorias (obrigatório)
- **Valores**: Campo numérico para os valores (obrigatório)

### 3. ⚙️ Configuração no Painel de Formatação

#### � **Total**
- **Mostrar**: Ativar/desativar exibição do total
- **Rótulo**: Texto personalizado (padrão: "Total")
- **Cor**: Cor do texto do total
- **Tamanho do texto**: Tamanho da fonte do total

#### �️ **Legenda**
- **Mostrar**: Ativar/desativar legenda
- **Posição**: Centralizar à esquerda ou à direita
- **Cor**: Cor do texto da legenda
- **Tamanho do texto**: Tamanho da fonte da legenda

#### � **Rótulos de dados**
- **Mostrar**: Ativar/desativar rótulos nas fatias
- **Mostrar valor**: Exibir valores numéricos
- **Mostrar percentual**: Exibir percentuais
- **Posição**: Interno (dentro das fatias) ou Externo (fora das fatias)
- **Cor**: Cor dos rótulos

#### � **Gráfico Donut**
- **Raio interno (1-99%)**: Controla a espessura da rosca
- **Mostrar bordas**: Ativa bordas brancas entre as fatias

#### � **Cores por categoria**
- **Cor**: Personalizar cor individual de cada categoria

## � Tecnologias Utilizadas

- **TypeScript**: Linguagem principal para type safety
- **SVG Nativo**: Renderização de alta performance
- **Power BI Visual API**: Integração completa com Power BI
- **LESS**: Pré-processador CSS para estilos

## �️ Desenvolvimento Local

```bash
# Clonar o repositório
git clone https://github.com/Alelourenco/GraficoDonut-PowerBI.git
cd GraficoDonut-PowerBI

# Instalar dependências
npm install

# Modo desenvolvimento
npm run start

# Criar pacote
npm run package
```

## � Exemplo de Dados

| Categoria | Valor |
|-----------|-------|
| Vendas | 150000 |
| Marketing | 75000 |
| Suporte | 45000 |
| TI | 120000 |

## �‍� Desenvolvedor

**Alexandre Lourenço**  
*Data Scientist & Power BI Developer*

� **Email**: [alexandre.2.lourenco@outlook.com](mailto:alexandre.2.lourenco@outlook.com)  
� **LinkedIn**: [Alexandre Lourenço](https://www.linkedin.com/in/alexandre-lourencodatasciencie/)  
� **GitHub**: [@Alelourenco](https://github.com/Alelourenco)

---

### � Se este projeto foi útil para você, não esqueça de dar uma ⭐!

**Especializações:**
- � Visuais customizados para Power BI
- � Análise de dados e dashboards
- � Automação de relatórios
- � Data Science e Machine Learning

---

*Desenvolvido com ❤️ para a comunidade Power BI do Brasil*
