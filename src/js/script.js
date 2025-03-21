import { Tache } from './tache.js'
import { Utils } from './utils.js'


/* global alert, localStorage, Notification */
let listeTaches = []

function afficherTaches (filtre = 'toutes') {
  const listeTachesElement = document.getElementById('liste-taches')
  listeTachesElement.innerHTML = ''

  const critereTri = document.getElementById('tri') ? document.getElementById('tri').value : 'date'   // On récupère le critère de tri, si non défini, on trie par date
  const champRecherche = document.getElementById('recherche') // On récupère le champ de recherche
  const termeRecherche = champRecherche ? champRecherche.value.toLowerCase() : ''// On récupère le terme de recherche, si non défini, on recherche tout

  // On applique le tri sur la liste des tâches en fonction du critère choisi par l'utilisateur
  if (critereTri === 'date') {
    listeTaches.sort(Utils.comparerParDate)// On trie par date d'échéance croissante (les tâches sans date d'échéance sont placées en dernier)
  } else if (critereTri === 'priorite') {
    listeTaches.sort(Utils.comparerParPriorite)// On trie par priorité décroissante (élevée -> moyenne -> basse)
  }

  // Même principe pour le filtre : on récupère le critère choisi par l'utilisateur et on filtre la liste des tâches
  let tachesFiltrees = listeTaches
  if (filtre === 'en_cours') {
    tachesFiltrees = listeTaches.filter(t => t.statut === 'en_cours')
  } else if (filtre === 'terminee') {
    tachesFiltrees = listeTaches.filter(t => t.statut === 'terminee')
  }

  // -- Recherche par mot-clé (titre ou description)
  if (termeRecherche) {
    tachesFiltrees = tachesFiltrees.filter(t =>
      t.titre.toLowerCase().includes(termeRecherche) ||
      t.description.toLowerCase().includes(termeRecherche)
    )
  }
  // On parcourt la liste des tâches filtrées pour les afficher dans la page
  tachesFiltrees.forEach((tache, index) => {
  const li = document.createElement('li')

    if (tache.estTerminee()) {
      li.className = 'list-group-item d-flex justify-content-between align-items-center list-group-item-success'
    } else if (tache.dateEcheance && new Date(tache.dateEcheance) < new Date()) {
      li.className = 'list-group-item d-flex justify-content-between align-items-center list-group-item-danger'
    } else {
      li.className = 'list-group-item d-flex justify-content-between align-items-center'
    }

    li.innerHTML = tache.getHtml(index)// On récupère le code HTML de la tâche

    listeTachesElement.appendChild(li)// On ajoute la tâche à la liste
  })

  mettreAJourProgression() // Mise à jour de la barre de progression
  verifierEcheances() // On vérifie si des tâches approchent de leur échéance
}

/*
    * Fonction pour ajouter une tâche à la liste
 */
 function ajouterTache () {
  const titre = document.getElementById('titre').value.trim()
  const description = document.getElementById('description').value.trim()
  let dateEcheance = new Date(document.getElementById('date-echeance').value).toLocaleDateString('fr-fr')
  const priorite = document.getElementById('priorite').value

  if (!titre) {
    alert('Le titre est obligatoire !')// On affiche une alerte si le titre est vide
    return
  }


  const nouvelleTache = new Tache(titre, description, dateEcheance, priorite) //Création de la tâche
  listeTaches.push(nouvelleTache) // Ajout de la tâche à la liste
  afficherTaches()// On réaffiche les tâches
  enregistrerTaches()// On enregistre les tâches
}

/*
    * Fonction pour filtrer les tâches en fonction de leur statut
    @param {string} filtre - Le statut des tâches à afficher
    */
function filtrerTaches (filtre) {
  afficherTaches(filtre)
}

/*
    * Fonction pour supprimer une tâche de la liste
    @param {number} index - L'index de la tâche à supprimer
    */
function supprimerTache (index) {
  listeTaches.splice(index, 1)
  afficherTaches()
  enregistrerTaches()
}

/*
    * Fonction pour mettre à jour la barre de progression
*/
function mettreAJourProgression () {
  const tachesTerminees = listeTaches.filter(t => t.statut === 'terminee').length
  const progression = listeTaches.length ? (tachesTerminees / listeTaches.length) * 100 : 0

  document.getElementById('barre-progression').style.width = `${progression}%`
  document.getElementById('barre-progression').textContent = `${Math.round(progression)}%`
}

/*
    * Fonction pour enregistrer la liste des tâches dans le localStorage
*/
function enregistrerTaches () {
  localStorage.setItem('listeTaches', JSON.stringify(listeTaches))
}

/*
    * Fonction pour charger les tâches enregistrées dans le localStorage
*/
function chargerTaches () {
    const tachesEnregistrees = localStorage.getItem('listeTaches')
    if (tachesEnregistrees) {
      listeTaches = JSON.parse(tachesEnregistrees).map(t => {
        let tache = new Tache()
        tache.titre = t._titre
        tache.description = t._description
        tache.dateEcheance = t._dateEcheance
        tache.priorite = t._priorite
        tache.statut = t._statut
        return tache
      })
    }
    afficherTaches()
  }
  
/*
    * Fonction pour terminer une tâche
    @param {number} index - L'index de la tâche à terminer
*/
function terminerTache (index) {
  const tache = listeTaches[index]// On récupère la tâche à terminer
  if (tache) {
    tache.terminer()// On appelle la méthode terminer() de la tâche
    afficherTaches()// On réaffiche les tâches
    enregistrerTaches()// On enregistre les tâches
    if (Notification.permission === 'granted') {
      new Notification(`La tâche "${tache.titre}" a été terminée !`)
    }
  }
}

/*
    * Fonction pour vérifier si des tâches approchent de leur échéance
*/
function verifierEcheances () {
  const maintenant = new Date()
  listeTaches.forEach(tache => {
    if (tache.dateEcheance) {
      const dateEcheance = new Date(tache.dateEcheance)
      const tempsRestant = dateEcheance - maintenant

      // Si l'échéance est dans moins de 24 heures
      if (tempsRestant > 0 && tempsRestant <= 24 * 60 * 60 * 1000) {
        if (Notification.permission === 'granted') {
          new Notification(`La tâche "${tache.titre}" approche de son échéance !`)
        }
      }
    }
  })
}

// Demander l'autorisation pour afficher les notifications
if (Notification.permission !== 'granted') {
  Notification.requestPermission()
}

// Attacher les fonctions aux éléments de la page
window.onload = chargerTaches
window.ajouterTache = ajouterTache
window.terminerTache = terminerTache
window.supprimerTache = supprimerTache
window.afficherTaches = afficherTaches
window.filtrerTaches = filtrerTaches
