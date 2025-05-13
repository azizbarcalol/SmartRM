let donnees = [];
let excelImporte = false;

// Ajouter manuellement les données
function ajouterDonnees() {
    if (excelImporte) {
        alert("⚠️ Vous avez déjà importé un fichier Excel. Ajout manuel désactivé.");
        return;
    }

    const annee = document.getElementById('annee').value;
    const mois = document.getElementById('mois').value;
    const adr = document.getElementById('adr').value;
    const revpar = document.getElementById('revpar').value;
    const taux = document.getElementById('taux').value;
    const rns = document.getElementById('rns').value;
    const revenu = document.getElementById('revenu').value;

    if (annee && mois && adr && revpar && taux && rns && revenu) {
        donnees.push({ annee, mois, adr, revpar, taux, rns, revenu });
        afficherTableau();
        alert("✅ Donnée ajoutée avec succès !");
    } else {
        alert("❌ Merci de remplir tous les champs !");
    }
}

// Importer un fichier Excel
function importerExcel() {
    const fichier = document.getElementById('importExcel').files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        donnees = [];
        jsonData.forEach(item => {
            donnees.push({
                annee: item['Année'],
                mois: item['Mois'],
                adr: item['ADR'],
                revpar: item['RevPAR'],
                taux: item['Taux'],
                rns: item['RNs'],
                revenu: item['Revenu']
            });
        });

        afficherTableau();
        excelImporte = true;
        document.getElementById('formulaireZone').style.display = 'none';
        alert("✅ Fichier Excel importé avec succès !");
    };

    reader.readAsArrayBuffer(fichier);
}

// Afficher les données dans le tableau
function afficherTableau() {
    const tbody = document.querySelector("#tableau tbody");
    tbody.innerHTML = "";

    donnees.forEach(data => {
        const row = `<tr>
                        <td>${data.annee}</td>
                        <td>${data.mois}</td>
                        <td>${data.adr}</td>
                        <td>${data.revpar}</td>
                        <td>${data.taux}</td>
                        <td>${data.rns}</td>
                        <td>${data.revenu}</td>
                    </tr>`;
        tbody.innerHTML += row;
    });
}

// Générer le graphique et interprétation
function genererGraphique() {
    const ctx = document.getElementById('graphique').getContext('2d');
    const labels = donnees.map(d => d.annee + " " + d.mois);
    const adrData = donnees.map(d => parseFloat(d.adr));
    const revparData = donnees.map(d => parseFloat(d.revpar));
    const tauxData = donnees.map(d => parseFloat(d.taux));
    const revenuData = donnees.map(d => parseFloat(d.revenu));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'ADR (DT)', data: adrData, borderColor: 'blue', fill: false },
                { label: 'RevPAR (DT)', data: revparData, borderColor: 'green', fill: false },
                { label: "Taux d'Occupation (%)", data: tauxData, borderColor: 'red', fill: false },
                { label: "Revenu (DT)", data: revenuData, borderColor: 'orange', fill: false }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Évolution des Indicateurs de Performance' }
            }
        }
    });

    interpretationEtConseil(revparData);
}

// Générer interprétation + recommandation
function interpretationEtConseil(revparData) {
    let interpretation = "";
    let recommandation = "";

    if (revparData.length >= 2) {
        const dernier = revparData[revparData.length - 1];
        const precedent = revparData[revparData.length - 2];
        const evolution = ((dernier - precedent) / precedent) * 100;

        if (evolution > 5) {
            interpretation = "✅ RevPAR en forte hausse de " + evolution.toFixed(1) + "%.";
            recommandation = "Poursuivre la stratégie actuelle, possibilité d'augmenter légèrement les prix.";
        } else if (evolution < -5) {
            interpretation = "⚠️ RevPAR en baisse de " + Math.abs(evolution.toFixed(1)) + "%.";
            recommandation = "Revoir la politique tarifaire et lancer des promotions.";
        } else {
            interpretation = "ℹ️ RevPAR stable.";
            recommandation = "Surveiller les tendances et préparer des ajustements rapides.";
        }
    } else {
        interpretation = "Pas assez de données.";
        recommandation = "Ajouter plus de périodes pour analyser.";
    }

    document.getElementById('interpretation').innerText = interpretation;
    document.getElementById('recommandation').innerText = "Conseil : " + recommandation;
}

// Exporter en PDF
function exporterPDF() {
    const element = document.body;
    html2pdf()
        .from(element)
        .save('Dashboard_Movenpick.pdf');
}
