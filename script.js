(() => {
  'use strict';

  const CONFIG = Object.freeze({
    ufm: 252.59,
    exercicio: 2026,
    decretoUfm: 'Decreto nº 13.857, de 13 de novembro de 2025',
    leiMulta: 'Lei Complementar nº 429/2023',
    leiFatores: 'Lei Complementar nº 20/2002',
    versao: '2.4.0',
    arquivoZonas: './zonasfiscais.txt',
    areaPorVaga: 15,
    historyStorageKey: 'multaCompensatoriaHistoricoV24'
  });

  /*
   * A coluna de fator existente em zonasfiscais.txt pertence à Planta Genérica
   * de Valores e NÃO é o Fator de Localização da multa compensatória.
   * Para a multa, o FL é obtido exclusivamente pela zona fiscal, conforme a
   * tabela própria abaixo.
   */
  const LOCATION_ZONES = Object.freeze([
    Object.freeze({ zone: 1, color: 'Azul', factor: 1.00 }),
    Object.freeze({ zone: 2, color: 'Ciano', factor: 1.10 }),
    Object.freeze({ zone: 3, color: 'Laranja', factor: 1.20 }),
    Object.freeze({ zone: 4, color: 'Verde', factor: 1.40 }),
    Object.freeze({ zone: 5, color: 'Vermelho', factor: 1.70 }),
    Object.freeze({ zone: 6, color: 'Cinza', factor: 2.00 }),
    Object.freeze({ zone: 7, color: 'Magenta', factor: 2.50 }),
    Object.freeze({ zone: 8, color: 'Preto', factor: 3.30 }),
    Object.freeze({ zone: 9, color: 'Marrom', factor: 4.00 }),
    Object.freeze({ zone: 10, color: 'Bege', factor: 5.00 })
  ]);

  const FACTOR_DEFINITIONS = Object.freeze({
    vmq: {
      id: 'fator-vmq',
      name: 'Valor do m² da construção',
      code: 'VMQ',
      options: [
        ['Alvenaria residencial', 10.6234],
        ['Alvenaria comercial', 11.5403],
        ['Madeira', 3.9079],
        ['Mista (alvenaria/madeira)', 7.0826],
        ['Galpão industrial', 5.4078],
        ['Demais tipos de construção', 11.5403]
      ]
    },
    ft: {
      id: 'fator-ft',
      name: 'Topografia',
      code: 'FT',
      options: [
        ['Ao nível ou acima da via pública', 1.00],
        ['Encostas', 0.50],
        ['Abaixo do nível da via pública', 0.70],
        ['Alagado', 0.50]
      ]
    },
    fv: {
      id: 'fator-fv',
      name: 'Largura da via',
      code: 'FV',
      options: [
        ['Até 4,00 m', 0.50],
        ['Acima de 4,00 m até 8,00 m', 0.75],
        ['Acima de 8,00 m', 1.00]
      ]
    },
    fs: {
      id: 'fator-fs',
      name: 'Situação do lote',
      code: 'FS',
      options: [
        ['Encravado', 0.50],
        ['Esquina', 1.00],
        ['Meio de quadra', 1.00]
      ]
    },
    fi: {
      id: 'fator-fi',
      name: 'Condição/idade',
      code: 'FI',
      options: [
        ['De 0 a 5 anos', 1.000],
        ['Acima de 5 até 10 anos', 0.921],
        ['Acima de 10 até 15 anos', 0.858],
        ['Acima de 15 até 20 anos', 0.785],
        ['Acima de 20 até 25 anos', 0.702],
        ['Acima de 25 anos', 0.609],
        ['Sem idade comprovada', 1.000]
      ]
    },
    fa: {
      id: 'fator-fa',
      name: 'Padrão de acabamento',
      code: 'FA',
      options: [
        ['Residencial multifamiliar — padrão luxo', 2.00],
        ['Residencial multifamiliar — padrão alto', 1.50],
        ['Residencial multifamiliar — padrão normal', 1.00],
        ['Residencial multifamiliar — padrão baixo', 0.75],
        ['Residencial multifamiliar — padrão popular', 0.50],
        ['Residencial unifamiliar — padrão luxo', 2.00],
        ['Residencial unifamiliar — padrão alto', 1.50],
        ['Residencial unifamiliar — padrão normal', 1.00],
        ['Residencial unifamiliar — padrão baixo', 0.75],
        ['Residencial unifamiliar — padrão popular', 0.50],
        ['Comercial — padrão alto', 1.50],
        ['Comercial — padrão normal', 1.00]
      ]
    },
    fu: {
      id: 'fator-fu',
      name: 'Tipo e uso da edificação',
      code: 'FU',
      options: [
        ['Residencial multifamiliar — apartamento (fração ideal menor que 25%)', 1.40],
        ['Residencial multifamiliar — sobrado (fração ideal ≥ 25% e < 100%)', 1.30],
        ['Residencial unifamiliar (fração ideal igual a 100%)', 1.00],
        ['Comercial e serviço — sala (fração ideal menor que 25%)', 1.20],
        ['Comercial e serviço (fração ideal ≥ 25% e < 100%)', 1.10],
        ['Comercial e serviço (fração ideal igual a 100%)', 1.00],
        ['Galpão fechado', 1.00],
        ['Galpão aberto', 0.50],
        ['Garagem autônoma', 0.50]
      ]
    }
  });

  const FACTOR_ORDER = ['vmq', 'ft', 'fv', 'fs', 'fa', 'fi', 'fu'];

  const IRREGULARITIES = Object.freeze([
    {
      key: 'pavimentosExcedidos',
      title: 'Área correspondente aos pavimentos excedentes',
      shortTitle: 'Pavimentos excedentes',
      description: 'Informe a área construída situada nos pavimentos que excedem o limite aplicável.',
      infractionFactor: 0.40
    },
    {
      key: 'areaExtrapolaCA',
      title: 'Área excedente ao coeficiente de aproveitamento',
      shortTitle: 'Coeficiente de aproveitamento excedente',
      description: 'Informe somente a parcela da área computável que excede o coeficiente permitido.',
      infractionFactor: 0.10
    },
    {
      key: 'areaRecuoFrontal',
      title: 'Área edificada sobre o recuo frontal',
      shortTitle: 'Ocupação do recuo frontal',
      description: 'Informe a área da edificação situada dentro do recuo frontal obrigatório.',
      infractionFactor: 0.20
    },
    {
      key: 'areaRecuoLateralFundos',
      title: 'Área edificada sobre recuos laterais ou de fundos',
      shortTitle: 'Ocupação dos recuos laterais/fundos',
      description: 'Informe a área da edificação situada dentro dos recuos laterais ou de fundos.',
      infractionFactor: 0.15
    },
    {
      key: 'areaVagasGaragem',
      title: 'Área correspondente às vagas de garagem faltantes',
      shortTitle: 'Vagas de garagem faltantes',
      description: `Considere ${CONFIG.areaPorVaga.toFixed(0)} m² para cada vaga obrigatória não atendida.`,
      infractionFactor: 0.10,
      hasParkingConverter: true
    },
    {
      key: 'areaExtrapolaTaxaOcupacao',
      title: 'Área excedente à taxa de ocupação',
      shortTitle: 'Taxa de ocupação excedente',
      description: 'Informe a parcela da projeção da edificação que excede a taxa de ocupação permitida.',
      infractionFactor: 0.15
    },
    {
      key: 'areaLazerFaltante',
      title: 'Área de lazer faltante',
      shortTitle: 'Área de lazer faltante',
      description: 'Informe a diferença entre a área de lazer exigida e a área efetivamente disponibilizada.',
      infractionFactor: 0.05
    },
    {
      key: 'areaPermeavelFaltante',
      title: 'Área permeável faltante',
      shortTitle: 'Área permeável faltante',
      description: 'Informe a diferença entre a área permeável exigida e a área efetivamente mantida.',
      infractionFactor: 0.10
    }
  ]);

  const HELP = Object.freeze({
    fl: {
      title: 'Fator de localização — FL',
      html: `<p>O imóvel é enquadrado em uma das dez zonas fiscais por meio do setor, da quadra e da face da inscrição imobiliária. Depois desse enquadramento, a calculadora aplica a <b>tabela específica da multa compensatória</b>.</p><p><b>Importante:</b> os fatores da Planta Genérica de Valores, que podem variar aproximadamente de 1,64 a 25, não são utilizados como FL da multa.</p><ul><li>Zona 1 — Azul: FL 1,00</li><li>Zona 2 — Ciano: FL 1,10</li><li>Zona 3 — Laranja: FL 1,20</li><li>Zona 4 — Verde: FL 1,40</li><li>Zona 5 — Vermelho: FL 1,70</li><li>Zona 6 — Cinza: FL 2,00</li><li>Zona 7 — Magenta: FL 2,50</li><li>Zona 8 — Preto: FL 3,30</li><li>Zona 9 — Marrom: FL 4,00</li><li>Zona 10 — Bege: FL 5,00</li></ul><p>Confira o logradouro, o bairro e a zona retornados antes de calcular.</p>`
    },
    vmq: {
      title: 'Valor do metro quadrado da construção — VMQ',
      html: `<p>É o valor-base do metro quadrado, expresso como múltiplo da UFM, conforme o tipo construtivo predominante.</p><ul><li>Considere o sistema construtivo principal da área analisada.</li><li>Em edificações mistas, selecione a categoria prevista para alvenaria/madeira.</li><li>Referência: parâmetros cadastrais da ${CONFIG.leiFatores}.</li></ul>`
    },
    ft: {
      title: 'Fator de topografia — FT',
      html: `<p>Representa a condição predominante do terreno em relação à via pública e à sua conformação física.</p><ul><li><b>Ao nível ou acima:</b> terreno com implantação ordinária em relação à via.</li><li><b>Encosta:</b> terreno com declividade relevante.</li><li><b>Abaixo do nível:</b> cota predominante inferior à via.</li><li><b>Alagado:</b> condição física de alagamento do terreno.</li></ul>`
    },
    fv: {
      title: 'Fator de largura da via — FV',
      html: `<p>Utiliza a largura da via pública que proporciona o acesso principal ao lote.</p><ul><li>Considere a largura cadastral ou tecnicamente comprovada da via.</li><li>Não confunda largura da pista com largura total do logradouro quando o critério legal exigir a via completa.</li></ul>`
    },
    fs: {
      title: 'Fator de situação do lote — FS',
      html: `<p>Classifica a posição e a condição de acesso do lote.</p><ul><li><b>Encravado:</b> sem testada ou acesso direto ordinário ao logradouro.</li><li><b>Esquina:</b> com testadas para dois ou mais logradouros.</li><li><b>Meio de quadra:</b> situação ordinária entre lotes vizinhos.</li></ul>`
    },
    fi: {
      title: 'Fator de condição/idade — FI',
      html: `<p>Aplica a depreciação associada à idade da edificação.</p><ul><li>Use a idade documentalmente comprovada.</li><li>Na ausência de comprovação, selecione “Sem idade comprovada”.</li><li>Registre nas observações a fonte utilizada para determinar a idade quando necessário.</li></ul>`
    },
    fa: {
      title: 'Fator de acabamento — FA',
      html: `<p>Representa o padrão construtivo e de acabamento predominante da edificação.</p><ul><li>A avaliação deve considerar o conjunto da edificação, e não um elemento isolado.</li><li>Observe materiais, instalações, esquadrias, revestimentos e nível geral de execução.</li><li>Referência: padrões de avaliação da ${CONFIG.leiFatores}.</li></ul>`
    },
    fu: {
      title: 'Fator de uso e tipo — FU',
      html: `<p>Relaciona o uso da edificação à sua configuração e, quando aplicável, à fração ideal da unidade.</p><ul><li>Identifique primeiro se o uso é residencial, comercial/serviço, galpão ou garagem autônoma.</li><li>Nos condomínios, utilize a fração ideal constante nos documentos do imóvel.</li></ul>`
    }
  });

  const state = {
    zoneRecords: new Map(),
    location: null,
    lastResult: null,
    zoneTableLoaded: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setDefaultDate();
    populateFactorSelects();
    populateManualZones();
    renderIrregularities();
    bindEvents();
    loadZoneTable();
    renderHistory();
    updateReview();
  }

  function setDefaultDate() {
    const input = $('#data-calculo');
    if (!input.value) input.value = toIsoDate(new Date());
  }

  function populateFactorSelects() {
    Object.entries(FACTOR_DEFINITIONS).forEach(([key, definition]) => {
      const select = document.getElementById(definition.id);
      select.innerHTML = `<option value="">Selecione uma opção</option>` + definition.options.map(([label, value]) =>
        `<option value="${value}" data-label="${escapeHtml(label)}">${escapeHtml(label)} (${definition.code} = ${formatFactor(value)})</option>`
      ).join('');
      select.dataset.factorKey = key;
    });
  }

  function renderIrregularities() {
    const container = $('#irregularidades-lista');
    container.innerHTML = IRREGULARITIES.map(item => {
      const parkingConverter = item.hasParkingConverter ? `
        <div class="vagas-converter">
          <input id="vagas-${item.key}" type="number" min="0" step="1" placeholder="Quantidade de vagas" aria-label="Quantidade de vagas faltantes">
          <button type="button" class="button ghost convert-parking" data-key="${item.key}">Converter</button>
        </div>` : '';

      return `
        <article class="irregularity-item" data-key="${item.key}">
          <div class="irregularity-top">
            <input class="irregularity-toggle" id="check-${item.key}" type="checkbox" data-key="${item.key}">
            <label class="irregularity-title" for="check-${item.key}">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.description)}</small>
            </label>
            <span class="percentage-chip">Fator da infração: ${formatPercent(item.infractionFactor)}</span>
          </div>
          <div class="irregularity-inputs" id="inputs-${item.key}" hidden>
            <div class="field-group">
              <label for="area-${item.key}">Área da irregularidade</label>
              <div class="input-unit-wrap">
                <input id="area-${item.key}" class="area-input" data-key="${item.key}" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00">
                <span>m²</span>
              </div>
              ${parkingConverter}
            </div>
            <div class="calculated-field">
              <span>Valor parcial da multa (Fator da infração: ${formatPercent(item.infractionFactor)})</span>
              <strong id="partial-${item.key}">—</strong>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function bindEvents() {
    $('#calculadora-form').addEventListener('submit', handleSubmit);
    $('#inscricao-imobiliaria').addEventListener('input', handleInscriptionInput);
    $('#inscricao-imobiliaria').addEventListener('blur', () => {
      if (isValidInscription($('#inscricao-imobiliaria').value) && state.zoneTableLoaded) lookupZone();
    });
    $('#buscar-zona').addEventListener('click', lookupZone);
    $('#arquivo-zonas').addEventListener('change', handleZoneFile);
    $('#zona-manual').addEventListener('change', syncManualZoneFields);
    $('#aplicar-localizacao-manual').addEventListener('click', applyManualLocation);

    $$('input[name="modoDocumento"]').forEach(input => input.addEventListener('change', handleModeChange));
    FACTOR_ORDER.forEach(key => {
      const select = document.getElementById(FACTOR_DEFINITIONS[key].id);
      select.addEventListener('change', () => {
        updateFactorBadge(key);
        updateReview();
        updateIrregularityPreviews();
      });
    });

    $('#irregularidades-lista').addEventListener('change', event => {
      if (event.target.matches('.irregularity-toggle')) toggleIrregularity(event.target.dataset.key, event.target.checked);
    });
    $('#irregularidades-lista').addEventListener('input', event => {
      if (event.target.matches('.area-input')) {
        normalizeAreaTyping(event.target);
        updateReview();
        updateIrregularityPreviews();
      }
    });
    $('#irregularidades-lista').addEventListener('click', event => {
      const button = event.target.closest('.convert-parking');
      if (button) convertParkingSpaces(button.dataset.key);
    });

    $$('.help-button').forEach(button => button.addEventListener('click', () => openHelp(button.dataset.help)));
    $('#limpar').addEventListener('click', clearForm);
    $('#imprimir').addEventListener('click', printResult);
    $('#editar-calculo').addEventListener('click', () => $('#etapa-imovel').scrollIntoView({ behavior: 'smooth', block: 'start' }));

    ['processo', 'interessado', 'responsavel', 'unidade', 'observacoes', 'data-calculo'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateReview);
    });

    const clearHistoryButton = $('#limpar-historico');
    if (clearHistoryButton) clearHistoryButton.addEventListener('click', clearHistory);
  }

  async function loadZoneTable() {
    setInscriptionStatus('Carregando a tabela de zonas fiscais…', '');
    try {
      const response = await fetch(CONFIG.arquivoZonas, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const count = parseZoneTable(text);
      if (!count) throw new Error('Nenhum registro válido encontrado');
      setInscriptionStatus(`Tabela de zonas carregada: ${formatInteger(count)} registros disponíveis.`, 'success');
    } catch (error) {
      state.zoneTableLoaded = false;
      setInscriptionStatus('A tabela zonasfiscais.txt não foi carregada. Adicione o arquivo à pasta do site, use “Carregar tabela de zonas” ou selecione manualmente a zona fiscal.', 'error');
      console.warn('Falha ao carregar tabela de zonas:', error);
    }
  }

  function parseZoneTable(text) {
    const records = new Map();

    text.split(/\r?\n/).forEach(line => {
      if (!line.trim().startsWith('|')) return;
      const columns = line.split('|').slice(1, -1).map(value => value.trim());
      if (columns.length < 7) return;

      const [sectorRaw, blockRaw, faceRaw, street, district, zoneRaw, colorRaw, valuationFactorRaw = ''] = columns;
      if (!/^\d+$/.test(sectorRaw) || !/^\d+$/.test(blockRaw) || !/^\d+$/.test(faceRaw) || !/^\d+$/.test(zoneRaw)) return;

      const zoneInfo = getLocationZone(Number(zoneRaw));
      if (!zoneInfo) return;

      const valuationFactor = parsePtNumber(valuationFactorRaw);
      const record = {
        sector: Number(sectorRaw),
        block: Number(blockRaw),
        face: Number(faceRaw),
        street: cleanText(street),
        district: cleanText(district),
        zone: zoneInfo.zone,
        color: zoneInfo.color || cleanText(colorRaw),
        factor: zoneInfo.factor,
        valuationFactor: Number.isFinite(valuationFactor) && valuationFactor > 0 ? valuationFactor : null
      };

      const key = makeZoneKey(record.sector, record.block, record.face);
      if (!records.has(key)) records.set(key, []);
      records.get(key).push(record);
    });

    state.zoneRecords = records;
    state.zoneTableLoaded = records.size > 0;
    populateManualZones();
    return [...records.values()].reduce((sum, list) => sum + list.length, 0);
  }

  function populateManualZones() {
    const select = $('#zona-manual');
    select.innerHTML = '<option value="">Selecione a zona fiscal</option>' + LOCATION_ZONES.map(item =>
      `<option value="${item.zone}" data-color="${escapeHtml(item.color)}" data-factor="${item.factor}">Zona ${item.zone} — ${escapeHtml(item.color)} (FL = ${formatFactor(item.factor)})</option>`
    ).join('');
  }

  function handleZoneFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const count = parseZoneTable(String(reader.result || ''));
      if (count) {
        setInscriptionStatus(`Tabela carregada manualmente: ${formatInteger(count)} registros.`, 'success');
        if (isValidInscription($('#inscricao-imobiliaria').value)) lookupZone();
      } else {
        setInscriptionStatus('O arquivo selecionado não contém registros reconhecíveis.', 'error');
      }
    };
    reader.onerror = () => setInscriptionStatus('Não foi possível ler o arquivo selecionado.', 'error');
    reader.readAsText(file, 'UTF-8');
  }

  function handleInscriptionInput(event) {
    event.target.value = maskInscription(event.target.value);
    event.target.removeAttribute('aria-invalid');
    if (event.target.value.length < 15) {
      clearLocation(false);
      setInscriptionStatus(state.zoneTableLoaded ? 'Preencha os 12 dígitos da inscrição reduzida.' : 'Tabela de zonas indisponível; use o carregamento manual.', '');
    }
    updateReview();
  }

  function lookupZone() {
    const input = $('#inscricao-imobiliaria');
    const inscription = input.value.trim();
    input.removeAttribute('aria-invalid');

    if (!isValidInscription(inscription)) {
      input.setAttribute('aria-invalid', 'true');
      setInscriptionStatus('Inscrição inválida. Use o formato 000.000.00.0000.', 'error');
      clearLocation(false);
      return;
    }
    if (!state.zoneTableLoaded) {
      setInscriptionStatus('A tabela de zonas não está disponível. Carregue o arquivo zonasfiscais.txt ou informe a localização manualmente.', 'error');
      $('#localizacao-manual').open = true;
      return;
    }

    const [sector, block, face] = inscription.split('.').slice(0, 3).map(Number);
    const matches = state.zoneRecords.get(makeZoneKey(sector, block, face));
    if (!matches?.length) {
      clearLocation(false);
      setInscriptionStatus(`Nenhum registro encontrado para setor ${sector}, quadra ${block} e face ${face}. Confira a inscrição ou use o ajuste manual.`, 'error');
      $('#localizacao-manual').open = true;
      return;
    }

    const record = matches[0];
    const zoneInfo = getLocationZone(record.zone);
    if (!zoneInfo) {
      clearLocation(false);
      setInscriptionStatus(`A zona fiscal ${record.zone} não possui FL configurado na tabela da multa.`, 'error');
      return;
    }

    setLocation({
      zone: zoneInfo.zone,
      color: zoneInfo.color,
      factor: zoneInfo.factor,
      street: record.street,
      district: record.district,
      valuationFactor: record.valuationFactor,
      source: 'automatic'
    });
    setInscriptionStatus(matches.length > 1
      ? `Localização encontrada. Existem ${matches.length} registros para esta chave; foi utilizado o primeiro registro da tabela.`
      : 'Localização encontrada automaticamente.', 'success');
  }

  function syncManualZoneFields() {
    const option = $('#zona-manual').selectedOptions[0];
    if (!option?.value) {
      $('#zona-numero-manual').value = '';
      $('#fator-fl-manual').value = '';
      return;
    }
    $('#zona-numero-manual').value = `Zona ${option.value} — ${option.dataset.color || ''}`;
    $('#fator-fl-manual').value = formatFactor(Number(option.dataset.factor));
  }

  function applyManualLocation() {
    const option = $('#zona-manual').selectedOptions[0];
    if (!option?.value) {
      showError('Selecione uma das zonas fiscais para aplicar a localização manual.');
      $('#zona-manual').focus();
      return;
    }

    const zoneInfo = getLocationZone(Number(option.value));
    if (!zoneInfo) {
      showError('A zona selecionada não possui FL configurado na tabela da multa.');
      return;
    }

    setLocation({
      zone: zoneInfo.zone,
      color: zoneInfo.color,
      factor: zoneInfo.factor,
      street: $('#logradouro-manual').value.trim() || 'Logradouro não informado',
      district: $('#bairro-manual').value.trim() || 'Bairro não informado',
      source: 'manual'
    });
    setInscriptionStatus('Localização definida manualmente. Registre a justificativa nas observações, quando aplicável.', 'success');
    $('#localizacao-manual').open = false;
  }

  function setLocation(location) {
    state.location = location;
    const zoneLabel = getZoneLabel(location);
    $('#zona-logradouro').textContent = location.street;
    $('#zona-bairro').textContent = location.district;
    $('#zona-identificacao').textContent = zoneLabel;
    $('#zona-fator').textContent = `FL = ${formatFactor(location.factor)}`;
    $('#zona-card').hidden = false;
    $('#fator-fl-display').textContent = `${zoneLabel} — ${location.street}`;
    $('#badge-fl').textContent = `FL = ${formatFactor(location.factor)}`;
    updateReview();
    updateIrregularityPreviews();
  }

  function clearLocation(clearManualFields = true) {
    state.location = null;
    $('#zona-card').hidden = true;
    $('#fator-fl-display').textContent = 'Informe a inscrição imobiliária';
    $('#badge-fl').textContent = 'FL = —';
    if (clearManualFields) {
      $('#zona-manual').value = '';
      $('#logradouro-manual').value = '';
      $('#bairro-manual').value = '';
      $('#zona-numero-manual').value = '';
      $('#fator-fl-manual').value = '';
    }
    updateReview();
    updateIrregularityPreviews();
  }

  function handleModeChange() {
    const administrative = getMode() === 'administrativo';
    $('#campos-administrativos').hidden = !administrative;
    updateReview();
  }

  function toggleIrregularity(key, checked) {
    const item = $(`.irregularity-item[data-key="${key}"]`);
    const inputs = $(`#inputs-${key}`);
    item.classList.toggle('active', checked);
    inputs.hidden = !checked;
    if (checked) {
      setTimeout(() => $(`#area-${key}`).focus(), 0);
    } else {
      $(`#area-${key}`).value = '';
      const parking = $(`#vagas-${key}`);
      if (parking) parking.value = '';
    }
    updateReview();
    updateIrregularityPreviews();
  }

  function convertParkingSpaces(key) {
    const quantityInput = $(`#vagas-${key}`);
    const quantity = Number(quantityInput.value);
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
      showError('Informe uma quantidade inteira e não negativa de vagas faltantes.');
      quantityInput.focus();
      return;
    }
    $(`#area-${key}`).value = formatNumber(quantity * CONFIG.areaPorVaga);
    hideError();
    updateReview();
    updateIrregularityPreviews();
  }

  function normalizeAreaTyping(input) {
    input.removeAttribute('aria-invalid');
    input.value = input.value.replace(/[^\d.,]/g, '').slice(0, 16);
  }

  function updateFactorBadge(key) {
    const definition = FACTOR_DEFINITIONS[key];
    const select = document.getElementById(definition.id);
    const value = Number(select.value);
    $(`#badge-${key}`).textContent = Number.isFinite(value) && value > 0 ? `${definition.code} = ${formatFactor(value)}` : `${definition.code} = —`;
  }

  function updateIrregularityPreviews() {
    const factors = collectFactors(false);
    const bmc = factors ? calculateBmc(factors) : null;
    IRREGULARITIES.forEach(item => {
      const area = getArea(item.key);
      const partialValue = bmc && area > 0 ? bmc * area * item.infractionFactor : null;
      $(`#partial-${item.key}`).textContent = partialValue ? formatCurrency(partialValue) : '—';
    });
  }

  function updateReview() {
    const inscription = $('#inscricao-imobiliaria').value.trim();
    $('#review-imovel').textContent = inscription || 'Não informado';
    $('#review-localizacao').textContent = state.location
      ? `${state.location.street} — ${state.location.district} | ${getZoneLabel(state.location)}`
      : 'Localização não definida';

    const factorCount = FACTOR_ORDER.reduce((count, key) => count + (Number(document.getElementById(FACTOR_DEFINITIONS[key].id).value) > 0 ? 1 : 0), 0) + (state.location?.factor > 0 ? 1 : 0);
    $('#review-fatores').textContent = `${factorCount} de 8`;
    const factors = collectFactors(false);
    $('#review-bmc-preview').textContent = factors ? `BMC preliminar: ${formatCurrency(calculateBmc(factors))}/m²` : 'Base ainda não calculável';

    const areas = collectAreas();
    const activeEntries = areas.filter(entry => entry.area > 0);
    const reportedAreaTotal = activeEntries.reduce((sum, entry) => sum + entry.area, 0);
    $('#review-irregularidades').textContent = activeEntries.length ? `${activeEntries.length} selecionada${activeEntries.length === 1 ? '' : 's'}` : 'Nenhuma selecionada';
    $('#review-area').textContent = `Soma das áreas informadas: ${formatNumber(reportedAreaTotal)} m²`;
  }

  function handleSubmit(event) {
    event.preventDefault();
    hideError();
    clearInvalidState();
    const validation = validateForm();
    if (!validation.valid) {
      showError(validation.messages.join(' '));
      validation.firstInvalid?.focus();
      return;
    }

    const result = calculateResult();
    state.lastResult = result;
    renderResult(result);
    buildPrintDocument(result);
    saveHistory(result);
    $('#resultado').hidden = false;
    $('#resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateForm() {
    const messages = [];
    let firstInvalid = null;
    const inscription = $('#inscricao-imobiliaria');
    if (!isValidInscription(inscription.value.trim())) {
      markInvalid(inscription);
      messages.push('Preencha a inscrição imobiliária no formato 000.000.00.0000.');
      firstInvalid ||= inscription;
    }
    if (!state.location?.factor) {
      messages.push('Localize o imóvel ou informe o fator de localização manualmente.');
      firstInvalid ||= inscription;
    }

    FACTOR_ORDER.forEach(key => {
      const select = document.getElementById(FACTOR_DEFINITIONS[key].id);
      if (!(Number(select.value) > 0)) {
        markInvalid(select);
        messages.push(`Selecione: ${FACTOR_DEFINITIONS[key].name}.`);
        firstInvalid ||= select;
      }
    });

    const checked = $$('.irregularity-toggle:checked');
    const positiveAreas = [];
    checked.forEach(toggle => {
      const input = $(`#area-${toggle.dataset.key}`);
      const raw = input.value.trim();
      const area = parsePtNumber(raw);
      if (!raw || !Number.isFinite(area) || area < 0) {
        markInvalid(input);
        messages.push('Todas as irregularidades marcadas devem possuir área válida e não negativa.');
        firstInvalid ||= input;
      }
      if (area > 0) positiveAreas.push(area);
    });
    if (!checked.length || !positiveAreas.length) {
      messages.push('Marque pelo menos uma irregularidade e informe uma área superior a zero.');
      firstInvalid ||= $('#irregularidades-lista');
    }

    return { valid: messages.length === 0, messages: [...new Set(messages)], firstInvalid };
  }

  function calculateResult() {
    const factors = collectFactors(true);
    const bmc = calculateBmc(factors);
    const areas = collectAreas().filter(entry => entry.area > 0);
    areas.forEach(entry => {
      entry.partialValue = bmc * entry.area * entry.infractionFactor;
    });
    const total = areas.reduce((sum, entry) => sum + entry.partialValue, 0);

    return {
      mode: getMode(),
      inscription: $('#inscricao-imobiliaria').value.trim(),
      calculationDate: $('#data-calculo').value || toIsoDate(new Date()),
      location: { ...state.location },
      factors,
      bmc,
      areas,
      total,
      process: $('#processo').value.trim(),
      interested: $('#interessado').value.trim(),
      responsible: $('#responsavel').value.trim(),
      unit: $('#unidade').value.trim(),
      observations: $('#observacoes').value.trim(),
      generatedAt: new Date()
    };
  }

  function collectFactors(requireAll) {
    const factors = {};
    for (const key of FACTOR_ORDER) {
      const definition = FACTOR_DEFINITIONS[key];
      const select = document.getElementById(definition.id);
      const value = Number(select.value);
      if (!(value > 0)) return requireAll ? null : null;
      const selected = select.selectedOptions[0];
      factors[key] = {
        code: definition.code,
        name: definition.name,
        label: selected.dataset.label || selected.textContent.replace(/\s*\([^)]*\)\s*$/, ''),
        value
      };
    }
    if (!(state.location?.factor > 0)) return null;
    factors.fl = {
      code: 'FL',
      name: 'Localização',
      label: `${getZoneLabel(state.location)} — ${state.location.street}`,
      value: state.location.factor
    };
    return factors;
  }

  function collectAreas() {
    return IRREGULARITIES.map(item => {
      const active = $(`#check-${item.key}`).checked;
      const area = active ? getArea(item.key) : 0;
      return {
        ...item,
        area: Number.isFinite(area) && area > 0 ? area : 0,
        partialValue: 0
      };
    });
  }

  function calculateBmc(factors) {
    return CONFIG.ufm * factors.vmq.value * factors.ft.value * factors.fv.value * factors.fs.value * factors.fa.value * factors.fi.value * factors.fu.value * factors.fl.value;
  }

  function renderResult(result) {
    const administrative = result.mode === 'administrativo';
    $('#resultado-selo').textContent = administrative ? 'DEMONSTRATIVO ADMINISTRATIVO' : 'SIMULAÇÃO';
    $('#resultado-titulo').textContent = formatCurrency(result.total);
    $('#resultado-subtitulo').textContent = `Cálculo realizado com UFM de ${CONFIG.exercicio}: ${formatCurrency(CONFIG.ufm)}.`;
    $('#resultado-bmc').textContent = `${formatCurrency(result.bmc)}/m²`;
    $('#resultado-quantidade').textContent = String(result.areas.length);

    const rows = result.areas.map(entry => resultRow(entry)).join('');
    $('#resultado-irregularidades-corpo').innerHTML = rows;
    $('#formula-bmc').textContent = makeBmcFormula(result);
    $('#formula-vmc').textContent = makeVmcFormula(result);
  }

  function resultRow(entry) {
    return `<tr>
      <td><strong>${escapeHtml(entry.shortTitle)}</strong></td>
      <td class="numeric">${formatNumber(entry.area)} m²</td>
      <td class="numeric">${formatPercent(entry.infractionFactor)}</td>
      <td class="numeric"><strong>${formatCurrency(entry.partialValue)}</strong></td>
    </tr>`;
  }

  function buildPrintDocument(result) {
    const administrative = result.mode === 'administrativo';
    $('#print-badge').textContent = administrative ? 'DEMONSTRATIVO ADMINISTRATIVO' : 'SIMULAÇÃO ORIENTATIVA';

    const identification = [
      ['Natureza do documento', administrative ? 'Demonstrativo administrativo' : 'Simulação orientativa'],
      ['Inscrição imobiliária', result.inscription],
      ['Logradouro', result.location.street],
      ['Bairro', result.location.district],
      ['Zona fiscal', getZoneLabel(result.location)],
      ['Fator de localização', `FL = ${formatFactor(result.location.factor)}`],
      ['Data-base do cálculo', formatDate(result.calculationDate)],
      ['Processo administrativo', administrative ? (result.process || 'Não informado') : 'Não aplicável'],
      ['Interessado', administrative ? (result.interested || 'Não informado') : 'Não informado'],
      ['Responsável/unidade', administrative ? [result.responsible, result.unit].filter(Boolean).join(' — ') || 'Não informado' : 'Não aplicável']
    ];
    $('#print-identificacao').innerHTML = identification.map(([label, value]) =>
      `<div class="print-info-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
    ).join('');

    const factorRows = ['fl', 'vmq', 'ft', 'fv', 'fs', 'fi', 'fa', 'fu'].map(key => {
      const factor = result.factors[key];
      return `<tr><td>${escapeHtml(factor.name)} — ${factor.code}</td><td>${escapeHtml(factor.label)}</td><td class="numeric">${formatFactor(factor.value)}</td></tr>`;
    }).join('');
    $('#print-fatores-corpo').innerHTML = factorRows;
    $('#print-irregularidades-corpo').innerHTML = result.areas.map(entry => resultRow(entry)).join('');

    $('#print-bmc').textContent = `${formatCurrency(result.bmc)}/m²`;
    $('#print-total').textContent = formatCurrency(result.total);
    $('#print-formula-bmc').textContent = makeBmcFormula(result);
    $('#print-formula-vmc').textContent = makeVmcFormula(result);

    const observationSection = $('#print-observacoes-section');
    observationSection.hidden = !result.observations;
    $('#print-observacoes').textContent = result.observations || '—';
    $('#print-nota-natureza').textContent = administrative
      ? 'Este demonstrativo registra os parâmetros utilizados no cálculo administrativo e deve ser interpretado em conjunto com os documentos e decisões constantes do processo.'
      : 'Este documento apresenta uma simulação orientativa. Não constitui lançamento, cobrança, decisão administrativa ou reconhecimento definitivo dos parâmetros informados.';
    $('#print-emissao').textContent = `Emitido em ${formatDateTime(result.generatedAt)}`;
  }

  function makeBmcFormula(result) {
    const f = result.factors;
    return `BMC = VMQ × FT × FV × FS × FA × FI × FU × FL × UFM = ${formatFactor(f.vmq.value)} × ${formatFactor(f.ft.value)} × ${formatFactor(f.fv.value)} × ${formatFactor(f.fs.value)} × ${formatFactor(f.fa.value)} × ${formatFactor(f.fi.value)} × ${formatFactor(f.fu.value)} × ${formatFactor(f.fl.value)} × ${formatCurrency(CONFIG.ufm)} = ${formatCurrency(result.bmc)}/m²`;
  }

  function makeVmcFormula(result) {
    const terms = result.areas.map(entry => `[${formatCurrency(result.bmc)}/m² × ${formatNumber(entry.area)} m² × ${formatPercent(entry.infractionFactor)}]`).join(' + ');
    const partials = result.areas.map(entry => formatCurrency(entry.partialValue)).join(' + ');
    return `VMC = Σ[BMC × área da irregularidade × fator da infração] = ${terms} = ${partials} = ${formatCurrency(result.total)}`;
  }

  function printResult() {
    if (!state.lastResult) {
      showError('Calcule o valor antes de imprimir.');
      return;
    }
    buildPrintDocument(state.lastResult);
    window.print();
  }

  function clearForm() {
    if (!window.confirm('Deseja limpar todos os campos deste cálculo?')) return;
    $('#calculadora-form').reset();
    setDefaultDate();
    clearLocation(true);
    hideError();
    clearInvalidState();
    $$('.irregularity-item').forEach(item => item.classList.remove('active'));
    $$('.irregularity-inputs').forEach(element => { element.hidden = true; });
    FACTOR_ORDER.forEach(updateFactorBadge);
    $('#campos-administrativos').hidden = true;
    $('#resultado').hidden = true;
    state.lastResult = null;
    setInscriptionStatus(state.zoneTableLoaded ? `Tabela de zonas pronta: ${formatInteger([...state.zoneRecords.values()].reduce((sum, list) => sum + list.length, 0))} registros.` : 'Tabela de zonas indisponível.', state.zoneTableLoaded ? 'success' : 'error');
    updateReview();
    updateIrregularityPreviews();
    $('#etapa-imovel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openHelp(key) {
    const help = HELP[key];
    if (!help) return;
    $('#help-title').textContent = help.title;
    $('#help-content').innerHTML = help.html;
    const dialog = $('#help-dialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  function saveHistory(result) {
    try {
      const history = getHistory();
      history.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: result.generatedAt.toISOString(),
        inscription: result.inscription,
        street: result.location.street,
        mode: result.mode,
        total: result.total,
        bmc: result.bmc
      });
      localStorage.setItem(CONFIG.historyStorageKey, JSON.stringify(history.slice(0, 8)));
      renderHistory();
    } catch (error) {
      console.warn('Não foi possível salvar o histórico local:', error);
    }
  }

  function getHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONFIG.historyStorageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function renderHistory() {
    const container = $('#historico-lista');
    const section = $('#historico-calculos');
    if (!container || !section) return;
    const history = getHistory();
    section.hidden = history.length === 0;
    container.innerHTML = history.map(item => `
      <article class="history-item">
        <div><strong>${escapeHtml(item.inscription)}</strong><span>${escapeHtml(item.street || 'Logradouro não informado')}</span></div>
        <div><span>${item.mode === 'administrativo' ? 'Administrativo' : 'Simulação'}</span><small>${formatDateTime(new Date(item.createdAt))}</small></div>
        <strong>${formatCurrency(Number(item.total))}</strong>
      </article>`).join('');
  }

  function clearHistory() {
    if (!window.confirm('Deseja apagar o histórico salvo neste navegador?')) return;
    localStorage.removeItem(CONFIG.historyStorageKey);
    renderHistory();
  }

  function getHistorySafeCount() {
    return getHistory().length;
  }

  function getMode() {
    return $('input[name="modoDocumento"]:checked')?.value || 'simulacao';
  }

  function getArea(key) {
    return parsePtNumber($(`#area-${key}`).value);
  }

  function getLocationZone(zone) {
    const zoneNumber = Number(zone);
    return LOCATION_ZONES.find(item => item.zone === zoneNumber) || null;
  }

  function getZoneLabel(location) {
    if (location.zoneLabel) return location.zoneLabel;
    const color = location.color ? ` — ${location.color}` : '';
    return `Zona ${location.zone}${color}`;
  }

  function makeZoneKey(sector, block, face) {
    return `${Number(sector)}|${Number(block)}|${Number(face)}`;
  }

  function isValidInscription(value) {
    return /^\d{3}\.\d{3}\.\d{2}\.\d{4}$/.test(value);
  }

  function maskInscription(value) {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    if (digits.length) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 12));
    return parts.join('.');
  }

  function parsePtNumber(value) {
    if (typeof value === 'number') return value;
    const raw = String(value ?? '').trim().replace(/\s/g, '');
    if (!raw) return 0;
    let normalized = raw;
    if (raw.includes(',') && raw.includes('.')) normalized = raw.replace(/\./g, '').replace(',', '.');
    else if (raw.includes(',')) normalized = raw.replace(',', '.');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  function formatNumber(value, digits = 2) {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value) || 0);
  }

  function formatFactor(value) {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 }).format(Number(value) || 0);
  }

  function formatPercent(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  function formatInteger(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  }

  function formatDate(isoDate) {
    if (!isoDate) return '—';
    const [year, month, day] = String(isoDate).split('-').map(Number);
    if (!year || !month || !day) return String(isoDate);
    return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
  }

  function formatDateTime(date) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function cleanText(value) {
    return String(value || '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function setInscriptionStatus(message, type) {
    const element = $('#inscricao-status');
    element.textContent = message;
    element.className = `field-status${type ? ` ${type}` : ''}`;
  }

  function showError(message) {
    const box = $('#erro');
    box.textContent = message;
    box.hidden = false;
  }

  function hideError() {
    $('#erro').hidden = true;
    $('#erro').textContent = '';
  }

  function markInvalid(element) {
    element?.setAttribute?.('aria-invalid', 'true');
  }

  function clearInvalidState() {
    $$('[aria-invalid="true"]').forEach(element => element.removeAttribute('aria-invalid'));
  }

  // Exposto somente para testes manuais no console do navegador.
  window.CalculadoraMulta = Object.freeze({
    config: CONFIG,
    parseZoneTable,
    parsePtNumber,
    getHistoryCount: getHistorySafeCount
  });
})();
