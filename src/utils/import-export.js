/**
 * NaaS Pricing Calculator - Import/Export Manager
 * Handles Excel/CSV import and export functionality
 */

// Import DOMPurify from global scope (loaded via CDN in index.html)
const DOMPurify = window.DOMPurify;

class ImportExportManager {
    constructor(calculator) {
        this.calculator = calculator;

        // Initialize validator with error handling
        try {
            this.validator = new ImportValidator();
        } catch (error) {
            console.error('Failed to initialize import validator:', error);
            this.validator = null;
        }

        this.bindEvents();
    }

    bindEvents() {
        // Import/Export buttons
        document.getElementById('importBtn')?.addEventListener('click', () => {
            this.showImportModal();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.showExportModal();
        });

        // Modal events
        document.getElementById('confirmImport')?.addEventListener('click', () => {
            this.processImport();
        });

        document.getElementById('confirmExport')?.addEventListener('click', () => {
            this.processExport();
        });

        // Modal close events
        document.querySelectorAll('.modal-close, #cancelImport, #cancelExport').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    showImportModal() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async processImport() {
        const fileInput = document.getElementById('importFile');
        const importType = document.getElementById('importType').value;

        if (!fileInput.files.length) {
            this.showNotification('Please select a file to import.', 'error');
            return;
        }

        const file = fileInput.files[0];

        try {
            // Step 1: Validate file (if validator is available)
            if (this.validator) {
                console.log('Validating file...');
                const fileValidation = this.validator.validateFile(file);
                if (!fileValidation.isValid) {
                    this.showValidationErrors('File Validation Failed', fileValidation.errors);
                    return;
                }
            } else {
                console.warn('Validator not available, skipping file validation');
            }

            // Step 2: Parse file data
            console.log('Parsing file data...');
            let rawData;
            if (importType === 'excel') {
                rawData = await this.importExcel(file);
            } else {
                rawData = await this.importCSV(file);
            }

            if (!rawData) {
                this.showNotification('Failed to parse file data.', 'error');
                return;
            }

            // Step 3: Validate data structure
            console.log('Validating data structure...');
            const structureValidation = this.validator.validateDataStructure(rawData, importType);
            if (!structureValidation.isValid) {
                this.showValidationErrors('Data Structure Validation Failed', structureValidation.errors);
                return;
            }

            // Step 4: Process and validate component data
            console.log('Processing component data...');
            const processedData = this.processRawData(rawData, importType);
            const validationResults = this.validateProcessedData(processedData);

            // Step 5: Check validation results
            const validComponents = validationResults.filter(r => r.isValid);
            const invalidComponents = validationResults.filter(r => !r.isValid);

            if (invalidComponents.length > 0) {
                this.showValidationReport(validationResults);
                return;
            }

            // Step 6: Apply validated data
            console.log('Applying validated data...');
            const validatedData = {};
            validComponents.forEach(result => {
                validatedData[result.componentType] = result.data;
            });

            this.applyImportedData(validatedData);
            this.closeModal(document.getElementById('importModal'));
            this.showImportSuccess(validationResults);

        } catch (error) {
            console.error('Import error:', error);
            this.showNotification(`Import failed: ${error.message}`, 'error');
        }
    }

    processRawData(rawData, importType) {
        if (importType === 'excel') {
            return this.processExcelData(rawData);
        } else {
            return this.processCSVData(rawData);
        }
    }

    processExcelData(workbook) {
        const processedData = {};

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Map sheet names to component types
            const componentType = this.mapSheetToComponent(sheetName);
            if (componentType) {
                processedData[componentType] = this.parseSheetData(componentType, jsonData);
            }
        });

        return processedData;
    }

    processCSVData(csvData) {
        const processedData = {};

        // Try to determine component type from CSV structure
        const componentType = this.detectComponentFromCSV(csvData[0] || [], csvData);
        if (componentType) {
            processedData[componentType] = this.parseCSVData(componentType, csvData.slice(1)); // Skip header
        }

        return processedData;
    }

    validateProcessedData(processedData) {
        const results = [];

        Object.keys(processedData).forEach(componentType => {
            const componentData = processedData[componentType];
            const validation = this.validator.validateImportData(componentData, componentType);

            results.push({
                componentType,
                ...validation
            });
        });

        return results;
    }

    showValidationErrors(title, errors) {
        const errorList = errors.map(error => `• ${error}`).join('\n');
        this.showNotification(`${title}:\n${errorList}`, 'error');
    }

    showValidationReport(validationResults) {
        const report = this.validator.generateValidationReport(validationResults);

        let message = `Import Validation Report:\n`;
        message += `Valid Components: ${report.validComponents}/${report.totalComponents}\n`;
        message += `Total Errors: ${report.totalErrors}\n`;
        message += `Total Warnings: ${report.totalWarnings}\n\n`;

        const invalidComponents = validationResults.filter(r => !r.isValid);
        if (invalidComponents.length > 0) {
            message += `Failed Components:\n`;
            invalidComponents.forEach(component => {
                message += `• ${component.componentType}: ${component.errors.join(', ')}\n`;
            });
        }

        this.showNotification(message, 'error');
    }

    showImportSuccess(validationResults) {
        const report = this.validator.generateValidationReport(validationResults);

        let message = `Import Successful!\n`;
        message += `Imported ${report.validComponents} component(s)`;

        if (report.totalWarnings > 0) {
            message += `\nWarnings: ${report.totalWarnings}`;
        }

        this.showNotification(message, 'success');
    }

    async importExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const importedData = {};
                    
                    // Process each worksheet
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        // Map sheet names to component types
                        const componentType = this.mapSheetToComponent(sheetName);
                        if (componentType) {
                            importedData[componentType] = this.parseSheetData(componentType, jsonData);
                        }
                    });
                    
                    resolve(importedData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async importCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csvText = e.target.result;
                    const lines = csvText.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    
                    const data = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim());
                            const row = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                            });
                            data.push(row);
                        }
                    }
                    
                    // Try to determine component type from CSV structure
                    const componentType = this.detectComponentFromCSV(headers, data);
                    const importedData = {};
                    if (componentType) {
                        importedData[componentType] = this.parseCSVData(componentType, data);
                    }
                    
                    resolve(importedData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    mapSheetToComponent(sheetName) {
        const mappings = {
            'prtg': ['prtg', 'monitoring', '8 prtg monitoring'],
            'capital': ['capital', 'equipment', '4 capital'],
            'support': ['support', 'services', '6 support'],
            'onboarding': ['onboarding', 'implementation', '3 onboarding'],
            'pbsFoundation': ['pbs', 'foundation', '5 pbs_foundation']
        };

        const lowerSheetName = sheetName.toLowerCase();
        for (const [componentType, keywords] of Object.entries(mappings)) {
            if (keywords.some(keyword => lowerSheetName.includes(keyword))) {
                return componentType;
            }
        }
        return null;
    }

    detectComponentFromCSV(headers, data) {
        const headerStr = headers.join(' ').toLowerCase();
        
        if (headerStr.includes('sensor') || headerStr.includes('monitoring')) {
            return 'prtg';
        } else if (headerStr.includes('equipment') || headerStr.includes('hardware')) {
            return 'capital';
        } else if (headerStr.includes('support') || headerStr.includes('service')) {
            return 'support';
        } else if (headerStr.includes('onboarding') || headerStr.includes('implementation')) {
            return 'onboarding';
        }
        
        return 'generic';
    }

    parseSheetData(componentType, jsonData) {
        const params = {};
        
        switch (componentType) {
            case 'prtg':
                params.sensors = this.extractNumberFromData(jsonData, ['sensor', 'sensors']) || 100;
                params.locations = this.extractNumberFromData(jsonData, ['location', 'locations', 'site']) || 1;
                params.alertRecipients = this.extractNumberFromData(jsonData, ['alert', 'recipient']) || 10;
                params.serviceLevel = this.extractTextFromData(jsonData, ['service', 'level']) || 'enhanced';
                break;
                
            case 'capital':
                params.equipment = this.extractEquipmentFromData(jsonData);
                params.financing = this.extractBooleanFromData(jsonData, ['financing', 'loan']) !== false;
                params.termMonths = this.extractNumberFromData(jsonData, ['term', 'months']) || 36;
                break;
                
            case 'support':
                params.level = this.extractTextFromData(jsonData, ['level', 'tier', 'package']) || 'enhanced';
                params.deviceCount = this.extractNumberFromData(jsonData, ['device', 'count']) || 10;
                params.termMonths = this.extractNumberFromData(jsonData, ['term', 'months']) || 36;
                params.includeEscalation = this.extractBooleanFromData(jsonData, ['escalation', 'cpi']) !== false;
                break;
                
            case 'onboarding':
                params.complexity = this.extractTextFromData(jsonData, ['complexity', 'type']) || 'standard';
                params.sites = this.extractNumberFromData(jsonData, ['site', 'sites']) || 1;
                params.includeAssessment = this.extractBooleanFromData(jsonData, ['assessment']) !== false;
                break;
        }
        
        return params;
    }

    parseCSVData(componentType, data) {
        const params = {};
        
        if (data.length === 0) return params;
        
        // For CSV, try to extract from first row of data
        const row = data[0];
        
        switch (componentType) {
            case 'prtg':
                params.sensors = parseInt(row.sensors || row.Sensors) || 100;
                params.locations = parseInt(row.locations || row.Locations) || 1;
                params.serviceLevel = row.serviceLevel || row['Service Level'] || 'enhanced';
                break;
                
            case 'capital':
                // For capital equipment, expect multiple rows
                params.equipment = data.map(row => ({
                    type: row.type || row.Type || 'router_small',
                    quantity: parseInt(row.quantity || row.Quantity) || 1,
                    customCost: parseFloat(row.cost || row.Cost) || null
                }));
                break;
                
            case 'support':
                params.level = row.level || row.Level || 'enhanced';
                params.deviceCount = parseInt(row.deviceCount || row['Device Count']) || 10;
                break;
        }
        
        return params;
    }

    extractNumberFromData(jsonData, keywords) {
        for (const row of jsonData) {
            for (const cell of row) {
                if (typeof cell === 'string') {
                    const lowerCell = cell.toLowerCase();
                    for (const keyword of keywords) {
                        if (lowerCell.includes(keyword)) {
                            // Look for number in the same row
                            for (const checkCell of row) {
                                if (typeof checkCell === 'number') {
                                    return checkCell;
                                }
                                if (typeof checkCell === 'string') {
                                    const num = parseFloat(checkCell);
                                    if (!isNaN(num)) {
                                        return num;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    extractTextFromData(jsonData, keywords) {
        for (const row of jsonData) {
            for (let i = 0; i < row.length; i++) {
                const cell = row[i];
                if (typeof cell === 'string') {
                    const lowerCell = cell.toLowerCase();
                    for (const keyword of keywords) {
                        if (lowerCell.includes(keyword)) {
                            // Look for text value in next cell
                            if (i + 1 < row.length && typeof row[i + 1] === 'string') {
                                return row[i + 1].toLowerCase();
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    extractBooleanFromData(jsonData, keywords) {
        for (const row of jsonData) {
            for (let i = 0; i < row.length; i++) {
                const cell = row[i];
                if (typeof cell === 'string') {
                    const lowerCell = cell.toLowerCase();
                    for (const keyword of keywords) {
                        if (lowerCell.includes(keyword)) {
                            // Look for boolean value in next cell
                            if (i + 1 < row.length) {
                                const nextCell = row[i + 1];
                                if (typeof nextCell === 'boolean') {
                                    return nextCell;
                                }
                                if (typeof nextCell === 'string') {
                                    const lowerNext = nextCell.toLowerCase();
                                    return lowerNext === 'true' || lowerNext === 'yes' || lowerNext === '1';
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    extractEquipmentFromData(jsonData) {
        const equipment = [];
        
        // Look for equipment data in rows
        for (const row of jsonData) {
            if (row.length >= 3 && typeof row[0] === 'string') {
                const type = row[0].toLowerCase().replace(/\s+/g, '_');
                const quantity = parseInt(row[1]) || 1;
                const cost = parseFloat(row[2]) || null;
                
                // Try to match to known equipment types
                const knownTypes = Object.keys(this.calculator.pricingData.capital.equipmentTypes);
                const matchedType = knownTypes.find(t => 
                    t.includes(type) || type.includes(t.split('_')[0])
                ) || 'router_small';
                
                equipment.push({
                    type: matchedType,
                    quantity,
                    customCost: cost
                });
            }
        }
        
        return equipment;
    }

    applyImportedData(importedData) {
        // Apply imported data to appropriate components
        Object.keys(importedData).forEach(componentType => {
            if (componentManager && componentManager.componentData) {
                componentManager.componentData[componentType] = {
                    ...componentManager.getDefaultParams(componentType),
                    ...importedData[componentType]
                };
            }
            
            // If wizard is active, apply to wizard data
            if (quoteWizard) {
                quoteWizard.wizardData[componentType] = {
                    enabled: true,
                    params: importedData[componentType]
                };
                localStorage.setItem('naas_full_quote', JSON.stringify(quoteWizard.wizardData));
            }
        });

        // Refresh current view
        this.refreshCurrentView();
    }

    processExport() {
        const exportType = document.getElementById('exportType').value;
        const includeCurrent = document.getElementById('exportCurrent').checked;
        const includeHistory = document.getElementById('exportHistory').checked;
        const includeComponents = document.getElementById('exportComponents').checked;

        try {
            if (exportType === 'excel') {
                this.exportExcel(includeCurrent, includeHistory, includeComponents);
            } else if (exportType === 'csv') {
                this.exportCSV(includeCurrent, includeHistory, includeComponents);
            } else if (exportType === 'pdf') {
                this.exportPDF(includeCurrent, includeHistory, includeComponents);
            }

            this.closeModal(document.getElementById('exportModal'));
            this.showNotification('Export completed successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error during export. Please try again.', 'error');
        }
    }

    exportExcel(includeCurrent, includeHistory, includeComponents) {
        const wb = XLSX.utils.book_new();

        if (includeCurrent) {
            this.addCurrentQuoteToWorkbook(wb);
        }

        if (includeComponents) {
            this.addComponentDataToWorkbook(wb);
        }

        if (includeHistory) {
            this.addHistoryToWorkbook(wb);
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `NaaS_Quote_${timestamp}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
    }

    addCurrentQuoteToWorkbook(wb) {
        const currentData = this.getCurrentQuoteData();
        
        // Summary sheet
        const summaryData = [
            ['NaaS Pricing Quote Summary'],
            ['Generated:', new Date().toLocaleDateString()],
            [''],
            ['Component', 'One-time Cost', 'Monthly Cost', 'Annual Cost', '3-Year Total']
        ];

        Object.keys(currentData.components || {}).forEach(componentType => {
            const component = currentData.components[componentType];
            const name = componentManager?.components[componentType]?.name || componentType;
            summaryData.push([
                name,
                component.totals.oneTime,
                component.totals.monthly,
                component.totals.annual,
                component.totals.threeYear
            ]);
        });

        summaryData.push(['']);
        summaryData.push(['TOTALS', currentData.totals.oneTime, currentData.totals.monthly, currentData.totals.annual, currentData.totals.threeYear]);

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Quote Summary');

        // Individual component sheets
        Object.keys(currentData.components || {}).forEach(componentType => {
            const componentWs = this.createComponentSheet(componentType, currentData.components[componentType]);
            const sheetName = componentManager?.components[componentType]?.name || componentType;
            XLSX.utils.book_append_sheet(wb, componentWs, sheetName);
        });
    }

    createComponentSheet(componentType, componentData) {
        const data = [];
        
        // Component header
        const componentName = componentManager?.components[componentType]?.name || componentType;
        data.push([componentName + ' Configuration']);
        data.push(['']);

        // Parameters
        data.push(['Parameters']);
        const params = componentManager?.componentData[componentType] || {};
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (Array.isArray(value)) {
                data.push([key, JSON.stringify(value)]);
            } else {
                data.push([key, value]);
            }
        });

        data.push(['']);
        data.push(['Cost Breakdown']);
        
        // Breakdown
        if (componentData.breakdown) {
            Object.keys(componentData.breakdown).forEach(key => {
                data.push([key, componentData.breakdown[key]]);
            });
        }

        data.push(['']);
        data.push(['Totals']);
        data.push(['One-time Cost', componentData.totals.oneTime]);
        data.push(['Monthly Cost', componentData.totals.monthly]);
        data.push(['Annual Cost', componentData.totals.annual]);
        data.push(['3-Year Total', componentData.totals.threeYear]);

        return XLSX.utils.aoa_to_sheet(data);
    }

    addComponentDataToWorkbook(wb) {
        // Add equipment catalog
        const catalog = this.calculator.getEquipmentCatalog();
        const catalogData = [
            ['Equipment Catalog'],
            [''],
            ['Category', 'Item', 'Cost']
        ];

        Object.keys(catalog).forEach(category => {
            catalog[category].forEach(item => {
                catalogData.push([category, item.name, item.cost]);
            });
        });

        const catalogWs = XLSX.utils.aoa_to_sheet(catalogData);
        XLSX.utils.book_append_sheet(wb, catalogWs, 'Equipment Catalog');

        // Add pricing data
        const pricingData = [
            ['PRTG Pricing'],
            [''],
            ['Sensor Tier', 'License Cost', 'Standard Monthly', 'Enhanced Monthly']
        ];

        Object.keys(this.calculator.pricingData.prtg.baseLicense).forEach(tier => {
            pricingData.push([
                tier,
                this.calculator.pricingData.prtg.baseLicense[tier],
                this.calculator.pricingData.prtg.monthlyService.standard[tier] || 0,
                this.calculator.pricingData.prtg.monthlyService.enhanced[tier] || 0
            ]);
        });

        const pricingWs = XLSX.utils.aoa_to_sheet(pricingData);
        XLSX.utils.book_append_sheet(wb, pricingWs, 'Pricing Data');
    }

    addHistoryToWorkbook(wb) {
        const history = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
        const historyData = [
            ['Quote History'],
            [''],
            ['Timestamp', 'Component', 'Monthly Cost', '3-Year Total']
        ];

        Object.values(history).forEach(item => {
            historyData.push([
                item.timestamp,
                item.name,
                item.result.totals.monthly,
                item.result.totals.threeYear
            ]);
        });

        const historyWs = XLSX.utils.aoa_to_sheet(historyData);
        XLSX.utils.book_append_sheet(wb, historyWs, 'History');
    }

    exportCSV(includeCurrent, includeHistory, includeComponents) {
        let csvContent = '';

        if (includeCurrent) {
            csvContent += this.generateCurrentQuoteCSV();
        }

        if (includeComponents) {
            csvContent += '\n\n' + this.generateComponentDataCSV();
        }

        if (includeHistory) {
            csvContent += '\n\n' + this.generateHistoryCSV();
        }

        // Download CSV
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `NaaS_Quote_${timestamp}.csv`;
        this.downloadFile(csvContent, filename, 'text/csv');
    }

    generateCurrentQuoteCSV() {
        const currentData = this.getCurrentQuoteData();
        let csv = 'NaaS Pricing Quote Summary\n';
        csv += `Generated,${new Date().toLocaleDateString()}\n\n`;
        csv += 'Component,One-time Cost,Monthly Cost,Annual Cost,3-Year Total\n';

        Object.keys(currentData.components || {}).forEach(componentType => {
            const component = currentData.components[componentType];
            const name = componentManager?.components[componentType]?.name || componentType;
            csv += `${name},${component.totals.oneTime},${component.totals.monthly},${component.totals.annual},${component.totals.threeYear}\n`;
        });

        csv += `TOTALS,${currentData.totals.oneTime},${currentData.totals.monthly},${currentData.totals.annual},${currentData.totals.threeYear}\n`;

        return csv;
    }

    generateComponentDataCSV() {
        let csv = 'Equipment Catalog\n';
        csv += 'Category,Item,Cost\n';

        const catalog = this.calculator.getEquipmentCatalog();
        Object.keys(catalog).forEach(category => {
            catalog[category].forEach(item => {
                csv += `${category},${item.name},${item.cost}\n`;
            });
        });

        return csv;
    }

    generateHistoryCSV() {
        let csv = 'Quote History\n';
        csv += 'Timestamp,Component,Monthly Cost,3-Year Total\n';

        const history = JSON.parse(localStorage.getItem('naas_saved_components') || '{}');
        Object.values(history).forEach(item => {
            csv += `${item.timestamp},${item.name},${item.result.totals.monthly},${item.result.totals.threeYear}\n`;
        });

        return csv;
    }

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('NaaS Pricing Proposal', 20, 30);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
        
        // Quote summary
        const currentData = this.getCurrentQuoteData();
        let yPos = 70;
        
        doc.setFontSize(16);
        doc.text('Quote Summary', 20, yPos);
        yPos += 20;
        
        doc.setFontSize(12);
        Object.keys(currentData.components || {}).forEach(componentType => {
            const component = currentData.components[componentType];
            const name = componentManager?.components[componentType]?.name || componentType;
            
            doc.text(`${name}:`, 25, yPos);
            doc.text(`${this.calculator.formatCurrency(component.totals.monthly)}/month`, 120, yPos);
            doc.text(`${this.calculator.formatCurrency(component.totals.threeYear)} (3-year)`, 160, yPos);
            yPos += 15;
        });
        
        yPos += 10;
        doc.setFontSize(14);
        doc.text(`Total Monthly: ${this.calculator.formatCurrency(currentData.totals.monthly)}`, 25, yPos);
        yPos += 15;
        doc.text(`3-Year Total: ${this.calculator.formatCurrency(currentData.totals.threeYear)}`, 25, yPos);
        
        // Save PDF
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        doc.save(`NaaS_Proposal_${timestamp}.pdf`);
    }

    exportComponent(componentType, result, params) {
        // Export individual component
        const wb = XLSX.utils.book_new();
        
        const data = [
            [`${componentManager.components[componentType].name} Quote`],
            [`Generated: ${new Date().toLocaleDateString()}`],
            [''],
            ['Configuration Parameters:'],
        ];
        
        Object.keys(params).forEach(key => {
            const value = Array.isArray(params[key]) ? params[key].join(', ') : params[key];
            data.push([key, value]);
        });
        
        data.push(['']);
        data.push(['Cost Breakdown:']);
        
        if (result.breakdown) {
            Object.keys(result.breakdown).forEach(key => {
                data.push([key, this.calculator.formatCurrency(result.breakdown[key])]);
            });
        }
        
        data.push(['']);
        data.push(['Totals:']);
        data.push(['One-time Cost', this.calculator.formatCurrency(result.totals.oneTime)]);
        data.push(['Monthly Cost', this.calculator.formatCurrency(result.totals.monthly)]);
        data.push(['Annual Cost', this.calculator.formatCurrency(result.totals.annual)]);
        data.push(['3-Year Total', this.calculator.formatCurrency(result.totals.threeYear)]);
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, componentType);
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        XLSX.writeFile(wb, `${componentType}_quote_${timestamp}.xlsx`);
    }

    getCurrentQuoteData() {
        // Get current quote data from wizard or components
        if (quoteWizard && quoteWizard.wizardData) {
            return this.calculator.calculateCombinedQuote(quoteWizard.wizardData);
        } else if (componentManager && componentManager.componentData) {
            const components = {};
            Object.keys(componentManager.componentData).forEach(type => {
                if (componentManager.componentData[type] && Object.keys(componentManager.componentData[type]).length > 0) {
                    components[type] = {
                        enabled: true,
                        params: componentManager.componentData[type]
                    };
                }
            });
            return this.calculator.calculateCombinedQuote(components);
        }
        
        return { components: {}, totals: { oneTime: 0, monthly: 0, annual: 0, threeYear: 0 } };
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    refreshCurrentView() {
        // Refresh the current view to show imported data
        const activeView = document.querySelector('.view-content:not(.hidden)');
        if (activeView) {
            const viewId = activeView.id;
            if (viewId === 'componentsView' && componentManager.currentComponent) {
                componentManager.renderComponentConfig(componentManager.currentComponent);
            } else if (viewId === 'wizardView' && quoteWizard) {
                quoteWizard.renderStep(quoteWizard.currentStep);
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' :
            type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
        }`;

        // Sanitize message before inserting into DOM to prevent XSS attacks
        const sanitizedMessage = DOMPurify ? DOMPurify.sanitize(message, {
            ALLOWED_TAGS: [],  // Strip all HTML tags
            KEEP_CONTENT: true  // Keep text content
        }) : String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');

        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
                ${sanitizedMessage}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize import/export manager
let importExportManager;
document.addEventListener('DOMContentLoaded', () => {
    if (window.NaaSCalculator) {
        const calculator = new NaaSCalculator();
        importExportManager = new ImportExportManager(calculator);
    }
});