/**
 * Extension EditableGrid - Drag & Drop des colonnes
 * Ajoute la fonctionnalité de déplacement des colonnes avec sauvegarde
 */

// Étendre EditableGrid avec les nouvelles propriétés
EditableGrid.prototype.enableColumnDragDrop = true;
EditableGrid.prototype.columnOrderChanged = function(oldIndex, newIndex, columnName) {};
EditableGrid.prototype.dragColumnClassName = "dragging-column";
EditableGrid.prototype.dropZoneClassName = "drop-zone";

/**
 * Initialise le drag & drop des colonnes
 */
EditableGrid.prototype.initColumnDragDrop = function() {
    if (!this.enableColumnDragDrop) return;
    
    var self = this;
    
    // Restaurer l'ordre des colonnes sauvegardé
    this.restoreColumnOrder();
    
    // Ajouter les event listeners aux headers quand la table est rendue
    var originalTableRendered = this.tableRendered;
    this.tableRendered = function(containerid, className, tableid) {
        // Appeler la fonction originale
        originalTableRendered.call(this, containerid, className, tableid);
        
        // Initialiser le drag & drop
        self.setupColumnDragDrop();
    };
};

/**
 * Configure le drag & drop sur les headers de colonnes
 */
EditableGrid.prototype.setupColumnDragDrop = function() {
    if (!this.tHead || !this.tHead.rows || !this.tHead.rows[0]) return;
    
    var self = this;
    var headerRow = this.tHead.rows[0];
    
    for (var i = 0; i < headerRow.cells.length; i++) {
        var cell = headerRow.cells[i];
        
        // Ajouter les attributs de drag
        cell.draggable = true;
        cell.columnIndex = i;
        cell.style.cursor = 'move';
        
        // Event listeners pour le drag
        cell.addEventListener('dragstart', function(e) {
            self.handleDragStart.call(self, e);
        });
        
        cell.addEventListener('dragover', function(e) {
            self.handleDragOver.call(self, e);
        });
        
        cell.addEventListener('drop', function(e) {
            self.handleDrop.call(self, e);
        });
        
        cell.addEventListener('dragend', function(e) {
            self.handleDragEnd.call(self, e);
        });
        
        cell.addEventListener('dragenter', function(e) {
            self.handleDragEnter.call(self, e);
        });
        
        cell.addEventListener('dragleave', function(e) {
            self.handleDragLeave.call(self, e);
        });
    }
};

/**
 * Gestion du début de drag
 */
EditableGrid.prototype.handleDragStart = function(e) {
    this.draggedColumn = {
        element: e.target,
        index: e.target.columnIndex,
        name: this.columns[e.target.columnIndex].name
    };
    
    e.target.classList.add(this.dragColumnClassName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
};

/**
 * Gestion du drag over
 */
EditableGrid.prototype.handleDragOver = function(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
};

/**
 * Gestion de l'entrée dans une zone de drop
 */
EditableGrid.prototype.handleDragEnter = function(e) {
    if (e.target !== this.draggedColumn.element) {
        e.target.classList.add(this.dropZoneClassName);
    }
};

/**
 * Gestion de la sortie d'une zone de drop
 */
EditableGrid.prototype.handleDragLeave = function(e) {
    e.target.classList.remove(this.dropZoneClassName);
};

/**
 * Gestion du drop
 */
EditableGrid.prototype.handleDrop = function(e) {
    if (e.stopPropagation) e.stopPropagation();
    
    var targetIndex = e.target.columnIndex;
    var sourceIndex = this.draggedColumn.index;
    
    if (sourceIndex !== targetIndex) {
        this.moveColumn(sourceIndex, targetIndex);
    }
    
    return false;
};

/**
 * Gestion de la fin de drag
 */
EditableGrid.prototype.handleDragEnd = function(e) {
    // Nettoyer les classes CSS
    var headers = this.tHead.rows[0].cells;
    for (var i = 0; i < headers.length; i++) {
        headers[i].classList.remove(this.dragColumnClassName);
        headers[i].classList.remove(this.dropZoneClassName);
    }
    
    this.draggedColumn = null;
};

/**
 * Déplace une colonne d'un index à un autre
 */
EditableGrid.prototype.moveColumn = function(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    var columnNames = [];
    var newColumns = [];
    var oldColumnName = this.columns[fromIndex].name;
    
    // Créer le nouvel ordre des colonnes
    for (var i = 0; i < this.columns.length; i++) {
        newColumns.push(this.columns[i]);
    }
    
    // Déplacer la colonne dans le tableau
    var movedColumn = newColumns.splice(fromIndex, 1)[0];
    newColumns.splice(toIndex, 0, movedColumn);
    
    // Extraire les noms dans le nouvel ordre
    for (var i = 0; i < newColumns.length; i++) {
        columnNames.push(newColumns[i].name);
    }
    
    // Utiliser la méthode sortColumns existante
    if (this.sortColumns(columnNames)) {
        // Sauvegarder le nouvel ordre
        this.saveColumnOrder();
        
        // Callback utilisateur
        this.columnOrderChanged(fromIndex, toIndex, oldColumnName);
        
        // Re-rendre le grid
        this.refreshGrid();
    }
};

/**
 * Sauvegarde l'ordre des colonnes
 */
EditableGrid.prototype.saveColumnOrder = function() {
    if (!this.enableStore) return;
    
    var columnOrder = [];
    for (var i = 0; i < this.columns.length; i++) {
        columnOrder.push(this.columns[i].name);
    }
    
    this.localset('columnOrder', JSON.stringify(columnOrder));
};

/**
 * Restaure l'ordre des colonnes sauvegardé
 */
EditableGrid.prototype.restoreColumnOrder = function() {
    if (!this.enableStore) return;
    
    var savedOrder = this.localget('columnOrder');
    if (savedOrder) {
        try {
            var columnNames = JSON.parse(savedOrder);
            
            // Vérifier que tous les noms de colonnes sont valides
            var allValid = true;
            for (var i = 0; i < columnNames.length; i++) {
                if (this.getColumnIndex(columnNames[i]) === -1) {
                    allValid = false;
                    break;
                }
            }
            
            // Vérifier que nous avons le bon nombre de colonnes
            if (allValid && columnNames.length === this.columns.length) {
                this.sortColumns(columnNames);
            } else {
                // Ordre sauvegardé invalide, le supprimer
                this.localunset('columnOrder');
            }
        } catch (e) {
            console.warn('Erreur lors de la restauration de l\'ordre des colonnes:', e);
            this.localunset('columnOrder');
        }
    }
};

/**
 * Remet l'ordre des colonnes par défaut
 */
EditableGrid.prototype.resetColumnOrder = function() {
    this.localunset('columnOrder');
    
    // Recharger les données pour restaurer l'ordre original
    if (this.lastURL) {
        if (this.lastURL.indexOf('.json') !== -1) {
            this.loadJSON(this.lastURL);
        } else {
            this.loadXML(this.lastURL);
        }
    } else {
        console.warn('Impossible de restaurer l\'ordre original: aucune URL source disponible');
    }
};

/**
 * Obtient l'ordre actuel des colonnes
 */
EditableGrid.prototype.getColumnOrder = function() {
    var order = [];
    for (var i = 0; i < this.columns.length; i++) {
        order.push({
            index: i,
            name: this.columns[i].name,
            label: this.columns[i].label
        });
    }
    return order;
};

/**
 * Définit un nouvel ordre de colonnes
 */
EditableGrid.prototype.setColumnOrder = function(columnNames) {
    if (this.sortColumns(columnNames)) {
        this.saveColumnOrder();
        this.refreshGrid();
        return true;
    }
    return false;
};

// Extension pour l'initialisation automatique
var originalInit = EditableGrid.prototype.init;
EditableGrid.prototype.init = function(name, config) {
    // Appeler l'init original
    originalInit.call(this, name, config);
    
    // Initialiser le drag & drop
    this.initColumnDragDrop();
};