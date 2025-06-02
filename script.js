let kpiChart = null;
let forecastChart = null;
let benchmarkChart = null;

// Fonctions pour gérer les modals
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Mettre à jour les données si nécessaire
  if (modalId === 'benchmark-modal') {
    updateBenchmarkData();
  } else if (modalId === 'recommendations-modal') {
    updateRecommendations();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

function openCalculatorTab(tabId) {
  // Masquer tous les onglets
  document.querySelectorAll('.calculator-tab').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Désactiver tous les boutons d'onglet
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Afficher l'onglet sélectionné et activer son bouton
  document.getElementById(tabId).style.display = 'block';
  event.currentTarget.classList.add('active');
}

// Fonction d'analyse principale
function analyserDonnees() {
  const adr = parseFloat(document.getElementById('adr').value) || 0;
  const revpar = parseFloat(document.getElementById('revpar').value) || 0;
  const occupancy = parseFloat(document.getElementById('occupancy').value) || 0;
  const rn = parseFloat(document.getElementById('rn').value) || 0;
  const revenue = parseFloat(document.getElementById('revenue').value) || 0;

  if (adr === 0 && revpar === 0 && occupancy === 0 && rn === 0 && revenue === 0) {
    document.getElementById('analysisText').innerHTML =
      "<span style='color:red'>⚠ Merci de remplir tous les champs manuellement ou via un fichier Excel.</span>";
    return;
  }

  let analysis = `
    <div class="analysis-section">
      <h3>📊 Analyse des Performances</h3>
      <div class="kpi-grid">
        <div class="kpi-card">
          <h4>ADR (${adr.toFixed(2)} DT)</h4>
          ${getAnalysisForKPI(adr, [300, 250], 'DT', 'Tarif moyen')}
        </div>
        <div class="kpi-card">
          <h4>RevPAR (${revpar.toFixed(2)} DT)</h4>
          ${getAnalysisForKPI(revpar, [200, 150], 'DT', 'Performance globale')}
        </div>
        <div class="kpi-card">
          <h4>Occupation (${occupancy.toFixed(2)}%)</h4>
          ${getAnalysisForKPI(occupancy, [70, 60], '%', 'Remplissage')}
        </div>
      </div>
    </div>
  `;

  let forecast = "<h3>🔮 Prévisions</h3>";
  if (adr >= 300 && occupancy >= 70) {
    forecast += `<p style='color:green'>Croissance forte attendue (+8-12%) avec un RevPAR projeté à ${(revpar * 1.1).toFixed(2)} DT dans 3 mois</p>`;
  } else if (adr < 250 && occupancy < 60) {
    forecast += `<p style='color:red'>Risque de baisse de performance (-5-10%) avec un RevPAR projeté à ${(revpar * 0.95).toFixed(2)} DT dans 3 mois</p>`;
  } else {
    forecast += `<p style='color:orange'>Stabilité avec possibilité de croissance modérée (+2-5%) et un RevPAR projeté à ${(revpar * 1.05).toFixed(2)} DT dans 3 mois</p>`;
  }

  document.getElementById('analysisText').innerHTML = analysis + forecast;
  updateCharts(adr, revpar, occupancy, rn, revenue);
  updateCurrentData(adr, revpar, occupancy);
  updateRecommendations(adr, revpar, occupancy, revenue);
}

function getAnalysisForKPI(value, thresholds, unit, label) {
  if (value >= thresholds[0]) {
    return `<p class="good">✔ Excellent (≥ ${thresholds[0]}${unit}) - ${label} très compétitif</p>`;
  } else if (value >= thresholds[1]) {
    return `<p class="medium">➤ Moyen - Possibilité d'optimisation</p>`;
  } else {
    return `<p class="bad">✖ Faible (< ${thresholds[1]}${unit}) - Nécessite amélioration</p>`;
  }
}

function updateCharts(adr, revpar, occupancy, rn, revenue) {
  const ctx = document.getElementById('kpiChart').getContext('2d');
  if (kpiChart) kpiChart.destroy();
  kpiChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ADR', 'RevPAR', 'Occupation %', 'RN', 'Revenue'],
      datasets: [{
        label: 'Valeurs KPI',
        data: [adr, revpar, occupancy, rn, revenue],
        backgroundColor: [
          'rgba(191, 167, 111, 0.7)',
          'rgba(149, 125, 71, 0.7)',
          'rgba(210, 190, 140, 0.7)',
          'rgba(224, 207, 160, 0.7)',
          'rgba(240, 216, 168, 0.7)'
        ],
        borderColor: [
          'rgba(191, 167, 111, 1)',
          'rgba(149, 125, 71, 1)',
          'rgba(210, 190, 140, 1)',
          'rgba(224, 207, 160, 1)',
          'rgba(240, 216, 168, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Indicateurs Clés de Performance',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2);
                label += context.dataIndex === 2 ? '%' : ' DT';
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toFixed(2);
            }
          }
        }
      }
    }
  });

  const forecastCtx = document.getElementById('forecastChart').getContext('2d');
  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(forecastCtx, {
    type: 'line',
    data: {
      labels: ['Mois actuel', 'Mois +1', 'Mois +2', 'Mois +3'],
      datasets: [{
        label: 'Prévision RevPAR',
        data: [revpar, revpar * 1.05, revpar * 1.08, revpar * 1.1],
        borderColor: 'rgba(95, 75, 35, 1)',
        backgroundColor: 'rgba(191, 167, 111, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Prévision de RevPAR (prochains mois)',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} DT`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value.toFixed(2) + ' DT';
            }
          }
        }
      }
    }
  });
}

// Fonctions pour le calculateur de KPI
function calculateRevPAR() {
  const adr = parseFloat(document.getElementById('calc-adr').value) || 0;
  const occupancy = parseFloat(document.getElementById('calc-occupancy').value) || 0;
  const revpar = adr * (occupancy / 100);
  document.getElementById('revpar-result').textContent = revpar.toFixed(2) + ' DT';
}

function calculateADR() {
  const revenue = parseFloat(document.getElementById('calc-adr-revenue').value) || 0;
  const rooms = parseFloat(document.getElementById('calc-adr-rooms').value) || 1;
  const adr = revenue / rooms;
  document.getElementById('adr-result').textContent = adr.toFixed(2) + ' DT';
}

function calculateTO() {
  const occupied = parseFloat(document.getElementById('calc-to-occupied').value) || 0;
  const available = parseFloat(document.getElementById('calc-to-available').value) || 1;
  const to = (occupied / available) * 100;
  document.getElementById('to-result').textContent = to.toFixed(2) + '%';
}

// Mise à jour des données actuelles pour le benchmark
function updateCurrentData(adr, revpar, occupancy) {
  document.getElementById('current-adr').textContent = adr.toFixed(2);
  document.getElementById('current-revpar').textContent = revpar.toFixed(2);
  document.getElementById('current-occ').textContent = occupancy.toFixed(2);
}

// Mise à jour du benchmark
function updateBenchmarkData() {
  const ctx = document.getElementById('benchmarkChart').getContext('2d');
  if (benchmarkChart) benchmarkChart.destroy();
  
  const currentAdr = parseFloat(document.getElementById('current-adr').textContent) || 0;
  const currentRevpar = parseFloat(document.getElementById('current-revpar').textContent) || 0;
  const currentOcc = parseFloat(document.getElementById('current-occ').textContent) || 0;
  
  const jazAdr = parseFloat(document.querySelector('.jaz-adr').textContent);
  const jazRevpar = parseFloat(document.querySelector('.jaz-revpar').textContent);
  const jazOcc = parseFloat(document.querySelector('.jaz-occ').textContent);
  
  const marriottAdr = parseFloat(document.querySelector('.marriott-adr').textContent);
  const marriottRevpar = parseFloat(document.querySelector('.marriott-revpar').textContent);
  const marriottOcc = parseFloat(document.querySelector('.marriott-occ').textContent);
  
  benchmarkChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ADR (DT)', 'RevPAR (DT)', 'Occupation (%)'],
      datasets: [
        {
          label: 'Hotel Jaz Tour Khalaf',
          data: [jazAdr, jazRevpar, jazOcc],
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Hotel Marriott Sousse',
          data: [marriottAdr, marriottRevpar, marriottOcc],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Mövenpick',
          data: [currentAdr, currentRevpar, currentOcc],
          backgroundColor: 'rgba(191, 167, 111, 0.7)',
          borderColor: 'rgba(191, 167, 111, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Comparaison avec la Concurrence',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2);
                label += context.dataIndex === 2 ? '%' : ' DT';
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Actualisation des données des concurrents
function refreshData(hotel) {
  // Simulation de nouvelles données aléatoires
  const randomFactor = (Math.random() * 0.2) - 0.1; // Entre -10% et +10%
  
  if (hotel === 'jaz') {
    const currentAdr = parseFloat(document.querySelector('.jaz-adr').textContent);
    const currentRevpar = parseFloat(document.querySelector('.jaz-revpar').textContent);
    const currentOcc = parseFloat(document.querySelector('.jaz-occ').textContent);
    
    const newAdr = currentAdr * (1 + randomFactor);
    const newOcc = Math.min(100, Math.max(0, currentOcc * (1 + randomFactor)));
    const newRevpar = newAdr * (newOcc / 100);
    
    document.querySelector('.jaz-adr').textContent = newAdr.toFixed(2);
    document.querySelector('.jaz-revpar').textContent = newRevpar.toFixed(2);
    document.querySelector('.jaz-occ').textContent = newOcc.toFixed(2);
  } else if (hotel === 'marriott') {
    const currentAdr = parseFloat(document.querySelector('.marriott-adr').textContent);
    const currentRevpar = parseFloat(document.querySelector('.marriott-revpar').textContent);
    const currentOcc = parseFloat(document.querySelector('.marriott-occ').textContent);
    
    const newAdr = currentAdr * (1 + randomFactor);
    const newOcc = Math.min(100, Math.max(0, currentOcc * (1 + randomFactor)));
    const newRevpar = newAdr * (newOcc / 100);
    
    document.querySelector('.marriott-adr').textContent = newAdr.toFixed(2);
    document.querySelector('.marriott-revpar').textContent = newRevpar.toFixed(2);
    document.querySelector('.marriott-occ').textContent = newOcc.toFixed(2);
  }
  
  updateBenchmarkData();
}

// Mise à jour des recommandations
function updateRecommendations(adr, revpar, occupancy, revenue) {
  let recommendations = "<h3>Recommandations personnalisées</h3>";
  
  // Recommandations ADR
  let adrRec = [];
  if (adr < 250) {
    adrRec.push("Revoir votre stratégie tarifaire pour augmenter l'ADR");
    adrRec.push("Améliorer la segmentation client pour cibler les clients haut de gamme");
    adrRec.push("Développer des packages premium avec services additionnels");
    adrRec.push("Former le personnel aux techniques d'upselling");
  } else if (adr >= 250 && adr < 300) {
    adrRec.push("Optimiser la gestion des canaux de distribution");
    adrRec.push("Analyser la concurrence pour ajuster les prix stratégiquement");
    adrRec.push("Améliorer l'upselling et le cross-selling");
    adrRec.push("Mettre en place des offres saisonnières premium");
  } else {
    adrRec.push("Maintenir la stratégie tarifaire actuelle");
    adrRec.push("Capitaliser sur votre positionnement haut de gamme");
    adrRec.push("Développer des services additionnels pour augmenter le revenu par client");
    adrRec.push("Renforcer la fidélisation des clients haut de gamme");
  }
  
  // Recommandations Occupation
  let occRec = [];
  if (occupancy < 60) {
    occRec.push("Lancer des promotions ciblées sur les périodes creuses");
    occRec.push("Renforcer les partenariats avec les OTAs et les agences de voyage");
    occRec.push("Améliorer votre visibilité en ligne et votre présence sur les réseaux sociaux");
    occRec.push("Mettre en place des packages attractifs pour les longs séjours");
  } else if (occupancy >= 60 && occupancy < 70) {
    occRec.push("Optimiser la gestion des canaux de distribution");
    occRec.push("Mettre en place des packages attractifs pour les groupes");
    occRec.push("Améliorer les programmes de fidélité pour augmenter les réservations directes");
    occRec.push("Analyser les motifs d'annulation pour réduire le taux d'annulation");
  } else {
    occRec.push("Maintenir la qualité de service pour conserver votre taux d'occupation");
    occRec.push("Optimiser le yield management pour maximiser le revenu");
    occRec.push("Capitaliser sur la fidélisation client pour des réservations récurrentes");
    occRec.push("Mettre en place des offres early-bird pour lisser la demande");
  }
  
  // Recommandations Revenue
  let revRec = [];
  if (revpar < 150) {
    revRec.push("Mettre en place une stratégie agressive pour augmenter à la fois l'ADR et l'occupation");
    revRec.push("Analyser les segments clients les plus rentables");
    revRec.push("Optimiser la répartition des chambres par canal de distribution");
    revRec.push("Réduire les coûts opérationnels sans affecter la qualité de service");
  } else if (revpar >= 150 && revpar < 200) {
    revRec.push("Identifier les opportunités d'augmentation de revenus annexes");
    revRec.push("Optimiser le mix de clientèle pour maximiser le revenu");
    revRec.push("Mettre en place des offres packages incluant des services payants");
    revRec.push("Améliorer la gestion des stocks pour maximiser le revenu");
  } else {
    revRec.push("Maintenir les bonnes pratiques qui génèrent ce bon revenu");
    revRec.push("Identifier des opportunités de revenus additionnels (spa, restauration, etc.)");
    revRec.push("Capitaliser sur la satisfaction client pour générer des recommandations");
    revRec.push("Analyser les données pour identifier d'autres opportunités d'optimisation");
  }
  
  // Mise à jour de l'affichage
  document.getElementById('dynamic-recommendations').innerHTML = recommendations;
  
  const adrList = document.getElementById('adr-recommendations');
  adrList.innerHTML = '';
  adrRec.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    adrList.appendChild(li);
  });
  
  const occList = document.getElementById('occupancy-recommendations');
  occList.innerHTML = '';
  occRec.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    occList.appendChild(li);
  });
  
  const revList = document.getElementById('revenue-recommendations');
  revList.innerHTML = '';
  revRec.forEach(rec => {
    const li = document.createElement('li');
    li.textContent = rec;
    revList.appendChild(li);
  });
}

// Export PDF
function exportToPDF() {
  const element = document.getElementById('dashboard');
  const opt = {
    margin: 10,
    filename: 'smart-revenue-analysis.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

// Gestion du fichier Excel
document.getElementById('excelFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    if (jsonData.length > 0) {
      const firstRow = jsonData[0];
      document.getElementById('adr').value = firstRow.ADR || firstRow.adr || '';
      document.getElementById('revpar').value = firstRow.RevPAR || firstRow.revpar || '';
      document.getElementById('occupancy').value = firstRow.Occupancy || firstRow.occupancy || '';
      document.getElementById('rn').value = firstRow.RN || firstRow.rn || '';
      document.getElementById('revenue').value = firstRow.Revenue || firstRow.revenue || '';
    }
  };
  
  reader.readAsArrayBuffer(file);
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  // Vider les champs du formulaire
  document.getElementById('adr').value = '';
  document.getElementById('revpar').value = '';
  document.getElementById('occupancy').value = '';
  document.getElementById('rn').value = '';
  document.getElementById('revenue').value = '';
});