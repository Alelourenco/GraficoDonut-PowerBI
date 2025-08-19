# ÌΩ© Gr√°fico Donut com Total - Visual Personalizado para Power BI

[![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-F2C811?style=flat-square&logo=powerbi)](https://powerbi.microsoft.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> Um visual personalizado moderno e responsivo para Power BI que cria um gr√°fico de rosca (donut) com exibi√ß√£o do total no centro, desenvolvido com TypeScript e SVG nativo para m√°xima performance.

## ‚ú® Funcionalidades Principais

### ÌæØ Visualiza√ß√£o
- **Gr√°fico de Rosca Responsivo**: Adapta-se automaticamente a qualquer tamanho de tela
- **Total Centralizado**: Exibe o valor total calculado no centro do gr√°fico
- **R√≥tulos de Dados**: Valores e percentuais configur√°veis nas fatias (interno/externo)
- **Legenda Inteligente**: Posicionamento configur√°vel (centro-esquerda/centro-direita)
- **Design Clean**: Interface moderna com transi√ß√µes suaves

### Ìæ® Personaliza√ß√£o
- **Cores por Categoria**: Sistema completo de cores personaliz√°veis para cada categoria
- **Painel de Formata√ß√£o**: Interface em portugu√™s com todas as op√ß√µes funcionais
- **Raio Interno Configur√°vel**: Controle total sobre a espessura da rosca (1-99%)
- **Bordas Opcionais**: Ative/desative bordas nas fatias
- **Tamanhos de Fonte**: Controle independente para total, legenda e r√≥tulos

### Ì¥Ñ Interatividade Avan√ßada
- **Sele√ß√£o Inteligente**: Clique nas fatias para filtrar dados
- **Multi-sele√ß√£o**: Suporte a Ctrl+clique para m√∫ltiplas sele√ß√µes
- **Efeitos de Destaque**: Transpar√™ncia autom√°tica para dados n√£o selecionados
- **Integra√ß√£o Power BI**: Funciona perfeitamente com filtros e slicers

## Ì∫Ä Instala√ß√£o e Uso

### 1. Ì≥• Instala√ß√£o no Power BI Desktop

1. Baixe o arquivo `DonutWithTotal7C5B4E2A8F9D1E3C.1.1.0.0.pbiviz` da pasta `dist/`
2. Abra o Power BI Desktop
3. V√° em **Arquivo > Importar > Visual do arquivo**
4. Selecione o arquivo `.pbiviz` baixado
5. O visual aparecer√° no painel de visualiza√ß√µes

### 2. Ì≥ä Configura√ß√£o dos Dados

Configure os campos no painel **Campos**:
- **Categoria**: Campo de texto para as categorias (obrigat√≥rio)
- **Valores**: Campo num√©rico para os valores (obrigat√≥rio)

### 3. ‚öôÔ∏è Configura√ß√£o no Painel de Formata√ß√£o

#### Ì≥ä **Total**
- **Mostrar**: Ativar/desativar exibi√ß√£o do total
- **R√≥tulo**: Texto personalizado (padr√£o: "Total")
- **Cor**: Cor do texto do total
- **Tamanho do texto**: Tamanho da fonte do total

#### Ìø∑Ô∏è **Legenda**
- **Mostrar**: Ativar/desativar legenda
- **Posi√ß√£o**: Centralizar √† esquerda ou √† direita
- **Cor**: Cor do texto da legenda
- **Tamanho do texto**: Tamanho da fonte da legenda

#### Ì¥§ **R√≥tulos de dados**
- **Mostrar**: Ativar/desativar r√≥tulos nas fatias
- **Mostrar valor**: Exibir valores num√©ricos
- **Mostrar percentual**: Exibir percentuais
- **Posi√ß√£o**: Interno (dentro das fatias) ou Externo (fora das fatias)
- **Cor**: Cor dos r√≥tulos

#### ÌΩ© **Gr√°fico Donut**
- **Raio interno (1-99%)**: Controla a espessura da rosca
- **Mostrar bordas**: Ativa bordas brancas entre as fatias

#### Ìæ® **Cores por categoria**
- **Cor**: Personalizar cor individual de cada categoria

## Ì¥ß Tecnologias Utilizadas

- **TypeScript**: Linguagem principal para type safety
- **SVG Nativo**: Renderiza√ß√£o de alta performance
- **Power BI Visual API**: Integra√ß√£o completa com Power BI
- **LESS**: Pr√©-processador CSS para estilos

## Ìª†Ô∏è Desenvolvimento Local

```bash
# Clonar o reposit√≥rio
git clone https://github.com/Alelourenco/GraficoDonut-PowerBI.git
cd GraficoDonut-PowerBI

# Instalar depend√™ncias
npm install

# Modo desenvolvimento
npm run start

# Criar pacote
npm run package
```

## Ì≥ä Exemplo de Dados

| Categoria | Valor |
|-----------|-------|
| Vendas | 150000 |
| Marketing | 75000 |
| Suporte | 45000 |
| TI | 120000 |

## Ì±®‚ÄçÌ≤ª Desenvolvedor

**Alexandre Louren√ßo**  
*Data Scientist & Power BI Developer*

Ì≥ß **Email**: [alexandre.2.lourenco@outlook.com](mailto:alexandre.2.lourenco@outlook.com)  
Ì≤º **LinkedIn**: [Alexandre Louren√ßo](https://www.linkedin.com/in/alexandre-lourencodatasciencie/)  
Ì∞ô **GitHub**: [@Alelourenco](https://github.com/Alelourenco)

---

### Ìºü Se este projeto foi √∫til para voc√™, n√£o esque√ßa de dar uma ‚≠ê!

**Especializa√ß√µes:**
- Ì≥ä Visuais customizados para Power BI
- Ì¥ç An√°lise de dados e dashboards
- Ì¥ñ Automa√ß√£o de relat√≥rios
- Ì≥à Data Science e Machine Learning

---

*Desenvolvido com ‚ù§Ô∏è para a comunidade Power BI do Brasil*
